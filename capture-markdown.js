(() => {
  try {
    if (typeof Readability !== "function") {
      throw new Error("Readability 未加载");
    }
    if (typeof TurndownService !== "function") {
      throw new Error("Turndown 未加载");
    }
    const gfmPlugin =
      typeof turndownPluginGfm === "object" && turndownPluginGfm
        ? turndownPluginGfm
        : null;
    if (!gfmPlugin || typeof gfmPlugin.gfm !== "function") {
      throw new Error("turndown-plugin-gfm 未加载");
    }
    const LANGUAGE_ALIASES = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      html: "html",
      htm: "html",
      shell: "bash",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      ps1: "powershell",
      cmd: "bash",
      py: "python",
      py3: "python",
      python: "python",
      rb: "ruby",
      csharp: "csharp",
      "c#": "csharp",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      go: "go",
      golang: "go",
      java: "java",
      kotlin: "kotlin",
      kt: "kotlin",
      php: "php",
      rust: "rust",
      rs: "rust",
      swift: "swift",
      scala: "scala",
      dart: "dart",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      toml: "toml",
      xml: "xml",
      sql: "sql",
      powershell: "powershell"
    };
    const languageAttributeKeys = [
      "data-language",
      "data-lang",
      "data-code-language",
      "data-code",
      "data-code-type",
      "data-gramm",
      "data-original-language",
      "lang"
    ];
    const LANGUAGE_PATTERNS = [
      /^language-([a-z0-9#+.-]+)$/i,
      /^lang(?:uage)?-([a-z0-9#+.-]+)$/i,
      /^brush:([a-z0-9#+.-]+)/i,
      /^code-([a-z0-9#+.-]+)$/i,
      /^highlight(?:ed)?-([a-z0-9#+.-]+)$/i
    ];
    const normalizeLanguage = (value) => {
      if (!value || typeof value !== "string") return "";
      const raw = value.trim().toLowerCase();
      if (!raw) return "";
      const sanitized = raw.replace(/[^a-z0-9+#.-]+/g, "");
      if (!sanitized) return "";
      return LANGUAGE_ALIASES[sanitized] || sanitized;
    };
    const detectLanguageFromNode = (node) => {
      if (!node || typeof node.getAttribute !== "function") return "";
      for (const attr of languageAttributeKeys) {
        const attrValue = node.getAttribute(attr);
        if (attrValue) {
          const normalized = normalizeLanguage(attrValue);
          if (normalized) return normalized;
        }
      }
      const className = node.getAttribute("class") || "";
      if (className) {
        const parts = className.split(/\s+/).filter(Boolean);
        for (const part of parts) {
          for (const pattern of LANGUAGE_PATTERNS) {
            const match = part.match(pattern);
            if (match && match[1]) {
              const normalized = normalizeLanguage(match[1]);
              if (normalized) return normalized;
            }
          }
        }
      }
      return "";
    };
    const detectLanguage = (node) => {
      const candidates = [];
      if (node) candidates.push(node);
      if (node?.firstElementChild) candidates.push(node.firstElementChild);
      if (node?.querySelector) {
        const innerCode = node.querySelector("code");
        if (innerCode) candidates.push(innerCode);
      }
      if (node?.parentElement) candidates.push(node.parentElement);
      for (const candidate of candidates) {
        const lang = detectLanguageFromNode(candidate);
        if (lang) return lang;
      }
      return "";
    };
    const detectLanguageWithHighlight = (text, fallback = "") => {
      if (fallback) return fallback;
      if (
        !text ||
        typeof text !== "string" ||
        !window.hljs ||
        typeof window.hljs.highlightAuto !== "function"
      ) {
        return "";
      }
      try {
        const result = window.hljs.highlightAuto(text);
        const lang = normalizeLanguage(result?.language || "");
        if (!lang) return "";
        if (result?.relevance && result.relevance < 1) return "";
        try {
          console.debug("[TabAssistant] highlight.js detected language:", lang, {
            relevance: result?.relevance,
          });
        } catch (_logError) {}
        return lang;
      } catch (_error) {
        return "";
      }
    };
    const collapseBlankLines = (input) =>
      input.replace(/\n(?:[ \t]*\n){2,}/g, "\n\n");
    const trimBoundaryBlankLines = (input) =>
      input
        .replace(/^[\s\n]+/, (match) =>
          /\S/.test(match) ? match : match.includes("\n") ? "\n" : ""
        )
        .replace(/[\s\n]+$/, (match) =>
          /\S/.test(match) ? match : match.includes("\n") ? "\n" : ""
        );
    const sanitizeCodeContent = (input) => {
      if (typeof input !== "string") return "";
      const normalized = input.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
      return trimBoundaryBlankLines(collapseBlankLines(normalized));
    };
    const getRenderedText = (node) => {
      if (!node || typeof node.innerText !== "string") return "";
      const value = node.innerText;
      if (!value || !value.trim()) return "";
      return sanitizeCodeContent(value);
    };
    const preserveCodeBlocks = (doc) => {
      if (!doc || typeof doc.querySelectorAll !== "function") return [];
      const snapshots = [];
      let counter = 0;
      const nodeListToArray = (list) => Array.from(list || []);
      const shouldKeepNodeText = (node) => {
        if (!node) return false;
        if (node.nodeType === Node.COMMENT_NODE) {
          const value = String(node.data || "").trim();
          if (value) {
            return !/^!?-?-/.test(value);
          }
          return false;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const name = node.nodeName.toLowerCase();
          if (
            name === "script" ||
            name === "style" ||
            name === "noscript" ||
            name === "iframe"
          ) {
            return false;
          }
          const ariaHidden = node.getAttribute("aria-hidden");
          if (ariaHidden === "true") return false;
          if (node.hasAttribute("data-hidden")) return false;
          const role = node.getAttribute("role");
          if (role && /tooltip|presentation|note/i.test(role)) return false;
        }
        return true;
      };
      const getLineBreakWeight = (node) => {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return 0;
        const tag = node.nodeName.toLowerCase();
        if (tag === "br") return 1;
        if (tag === "div" || tag === "p" || tag === "li") return 1;
        return 0;
      };
      const collectLines = (root) => {
        if (!root) return [];
        const lines = [];
        let current = "";
        let pendingWhitespace = "";
        const flushWhitespaceIntoIndent = () => {
          if (!pendingWhitespace) return;
          if (!current.length) {
            current = pendingWhitespace;
          } else {
            current += pendingWhitespace;
          }
          pendingWhitespace = "";
        };
        const pushLine = (force = false) => {
          flushWhitespaceIntoIndent();
          const trimmedCurrent = current.replace(/\r\n?/g, "\n");
          if (force || trimmedCurrent.length) {
            lines.push(trimmedCurrent);
          } else if (!lines.length || lines[lines.length - 1] !== "") {
            lines.push("");
          }
          current = "";
          pendingWhitespace = "";
        };
        const walk = (node) => {
          if (!node) return;
          if (!shouldKeepNodeText(node)) return;
          if (node.nodeType === Node.TEXT_NODE) {
            const value = node.nodeValue || "";
            if (!value) return;
            const normalized = value.replace(/\r\n?/g, "\n");
            if (/^\s+$/.test(normalized)) {
              pendingWhitespace += normalized.replace(/\n/g, "");
            } else {
              flushWhitespaceIntoIndent();
              current += normalized;
            }
            return;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.nodeName.toLowerCase();
            const hasLineClass =
              /(^|\s)(line|line-number|code-line|hljs-ln-code)(\s|$)/i.test(
                node.className || ""
              );
            if (hasLineClass && (current.length || pendingWhitespace.length)) {
              pushLine(true);
            }
            const computedStyle =
              typeof window !== "undefined" &&
              window.getComputedStyle &&
              typeof window.getComputedStyle === "function"
                ? window.getComputedStyle(node)
                : null;
            const display =
              computedStyle && computedStyle.display
                ? computedStyle.display.toLowerCase()
                : "";
            const marginLeft =
              computedStyle && computedStyle.marginLeft
                ? computedStyle.marginLeft
                : "";
            const paddingLeft =
              computedStyle && computedStyle.paddingLeft
                ? computedStyle.paddingLeft
                : "";
            const textIndent =
              computedStyle && computedStyle.textIndent
                ? computedStyle.textIndent
                : "";
            const numericIndent = (value) => {
              if (!value) return 0;
              const parsed = parseFloat(value);
              return Number.isFinite(parsed) ? parsed : 0;
            };
            const indentSpaces = Math.round(
              (numericIndent(marginLeft) +
                numericIndent(paddingLeft) +
                numericIndent(textIndent)) /
                8
            );
            const indentPrefix = indentSpaces > 0 ? " ".repeat(indentSpaces) : "";
            if (indentPrefix && !current.length && !pendingWhitespace.length) {
              pendingWhitespace = indentPrefix;
            }
            if (tagName === "br") {
              pushLine(true);
              return;
            }
            const childNodes = node.childNodes ? node.childNodes : [];
            if (!childNodes.length && indentPrefix) {
              pendingWhitespace += indentPrefix;
            }
            childNodes.forEach((child) => {
              if (getLineBreakWeight(child)) {
                walk(child);
                pushLine(true);
              } else {
                walk(child);
              }
            });
            if (
              (display === "block" || display === "flex" || display === "grid") &&
              (current.length || pendingWhitespace.length)
            ) {
              pushLine(true);
            }
            return;
          }
        };
        walk(root);
        if (current.length || pendingWhitespace.length) {
          pushLine(true);
        }
        const normalizedLines = lines
          .map((line) =>
            line
              .replace(/\u00a0/g, " ")
              .replace(/\t/g, "    ")
              .replace(/[ ]+$/g, "")
          )
          .map((line) => (line === "\n" ? "" : line));
        let lastWasEmpty = false;
        const compacted = [];
        normalizedLines.forEach((line) => {
          const isEmpty = !line.trim();
          if (isEmpty) {
            if (!lastWasEmpty) {
              compacted.push("");
              lastWasEmpty = true;
            }
          } else {
            compacted.push(line);
            lastWasEmpty = false;
          }
        });
        while (compacted.length && !compacted[compacted.length - 1].trim()) {
          compacted.pop();
        }
        while (compacted.length && !compacted[0].trim()) {
          compacted.shift();
        }
        return compacted;
      };
      const buildCodeSnapshot = (node, languageHint = "") => {
        if (!node) return null;
        const rendered = getRenderedText(node);
        const fallbackLines = collectLines(node);
        const fallbackContent = fallbackLines.length
          ? sanitizeCodeContent(fallbackLines.join("\n"))
          : "";
        let content = "";
        if (rendered) {
          const renderedSanitized = sanitizeCodeContent(rendered);
          const renderedHasMultipleLines = renderedSanitized.includes("\n");
          const fallbackHasMoreLines = fallbackLines.length > 1;
          if (renderedHasMultipleLines || !fallbackHasMoreLines) {
            content = renderedSanitized;
          } else if (fallbackContent) {
            content = fallbackContent;
          } else {
            content = renderedSanitized;
          }
        } else if (fallbackContent) {
          content = fallbackContent;
        }
        if (!content.trim()) return null;
        const domLanguage = normalizeLanguage(languageHint || detectLanguage(node));
        const language = detectLanguageWithHighlight(content, domLanguage);
        const key = `code-block-${counter++}`;
        const placeholder =
          typeof doc.createElement === "function"
            ? doc.createElement("pre")
            : document.createElement("pre");
        placeholder.setAttribute("data-code-placeholder", key);
        placeholder.textContent = `[[CODE_BLOCK::${key}]]`;
        if (typeof node.replaceWith === "function") {
          node.replaceWith(placeholder);
        } else if (node.parentNode) {
          node.parentNode.replaceChild(placeholder, node);
        }
        return { key, language, content };
      };
      nodeListToArray(doc.querySelectorAll("pre")).forEach((preNode) => {
        const snapshot = buildCodeSnapshot(preNode);
        if (snapshot) snapshots.push(snapshot);
      });
      nodeListToArray(
        doc.querySelectorAll(
          [
            "div[class~='code']",
            "div[class*='code-block']",
            "div[class*='code_block']",
            "div[class*='codebox']",
            "div[class*='prettyprint']",
            "div[class*='highlight']",
            "section[class*='code-block']",
            "article[class*='code-block']"
          ].join(",")
        )
      ).forEach((container) => {
        if (!container) return;
        if (container.querySelector && container.querySelector("pre")) return;
        const snapshot = buildCodeSnapshot(container, detectLanguage(container));
        if (snapshot) snapshots.push(snapshot);
      });
      return snapshots;
    };
    const escapeForRegExp = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const restoreCodeBlocks = (markdown, snapshotMap) => {
      if (!snapshotMap || !snapshotMap.size || !markdown) return markdown || "";
      let output = typeof markdown === "string" ? markdown : "";
      snapshotMap.forEach((snapshot, key) => {
        if (!snapshot || !key) return;
        const marker = `[[CODE_BLOCK::${key}]]`;
        if (!output.includes(marker)) return;
        const languageSuffix = snapshot.language ? snapshot.language : "";
        let body = sanitizeCodeContent(snapshot.content || "");
        if (!body.endsWith("\n")) {
          body += "\n";
        }
        const fenceOpen = languageSuffix
          ? `\`\`\`${languageSuffix}\n`
          : "```\n";
        const replacement = `${fenceOpen}${body}\`\`\``;
        const pattern = new RegExp(escapeForRegExp(marker), "g");
        output = output.replace(pattern, replacement);
      });
      return output;
    };
    const toAbsoluteUrl = (value) => {
      if (!value || typeof value !== "string") return "";
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
      try {
        return new URL(trimmed, document.baseURI || location.href).href;
      } catch (_error) {
        return trimmed;
      }
    };
    const normalizeSrcset = (value) => {
      if (!value || typeof value !== "string") return "";
      const entries = value
        .split(",")
        .map((chunk) => {
          const trimmed = chunk.trim();
          if (!trimmed) return null;
          const parts = trimmed.split(/\s+/);
          const urlPart = parts.shift();
          if (!urlPart) return null;
          const absolute = toAbsoluteUrl(urlPart);
          return [absolute, ...parts].join(" ").trim();
        })
        .filter(Boolean);
      return entries.join(", ");
    };
    const lazySrcAttributes = [
      "data-src",
      "data-lazy-src",
      "data-lazyload",
      "data-original",
      "data-original-src",
      "data-src-original",
      "data-url",
      "data-href",
      "data-actualsrc",
      "data-img",
      "data-imgsrc",
      "data-image",
      "data-source",
      "data-download-url",
      "data-high-res-src",
      "data-src-hd",
      "data-backup",
      "data-fallback-src"
    ];
    const isPlaceholderSrc = (src) =>
      typeof src === "string" &&
      /^data:image\/(?:gif|png|svg\+xml|webp)/i.test(src.trim());
    const resolveLazyImages = (root) => {
      if (!root || typeof root.querySelectorAll !== "function") return;
      root.querySelectorAll("img").forEach((img) => {
        let candidate = "";
        for (const attr of lazySrcAttributes) {
          const value = img.getAttribute(attr);
          if (value && value.trim()) {
            candidate = value.trim();
            break;
          }
        }
        const currentSrc = img.getAttribute("src") || "";
        if (candidate) {
          const absoluteSrc = toAbsoluteUrl(candidate);
          if (absoluteSrc && (isPlaceholderSrc(currentSrc) || absoluteSrc !== currentSrc)) {
            img.setAttribute("src", absoluteSrc);
          }
        }
        const dataSrcset = img.getAttribute("data-srcset");
        const chosenSrcset = dataSrcset || "";
        if (chosenSrcset.trim()) {
          const normalized = normalizeSrcset(chosenSrcset);
          if (normalized) {
            img.setAttribute("srcset", normalized);
          }
        } else {
          const existingSrcset = img.getAttribute("srcset");
          const normalized = normalizeSrcset(existingSrcset || "");
          if (normalized && normalized !== existingSrcset) {
            img.setAttribute("srcset", normalized);
          }
        }
      });
    };
    const cloned = document.cloneNode(true);
    const codeSnapshots = preserveCodeBlocks(cloned);
    const codeSnapshotMap = new Map(
      codeSnapshots.map((item) => [item.key, item])
    );
    resolveLazyImages(cloned);
    const article = new Readability(cloned).parse();
    const turndown = new TurndownService({
      headingStyle: "atx",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      emDelimiter: "_",
    });
    turndown.use(gfmPlugin.gfm);
    if (codeSnapshots.length) {
      turndown.addRule("preservedCodeBlock", {
        filter: (node) =>
          node?.nodeName === "PRE" &&
          typeof node.getAttribute === "function" &&
          !!node.getAttribute("data-code-placeholder"),
        replacement: (_content, node) => {
          const key = node.getAttribute("data-code-placeholder");
          if (key && codeSnapshotMap.has(key)) {
            return `\n\n[[CODE_BLOCK::${key}]]\n\n`;
          }
          return "";
        },
      });
    }
    turndown.remove(["script", "style", "noscript", "iframe"]);
    const html =
      (article && article.content) ||
      cloned.body?.innerHTML ||
      cloned.documentElement?.innerHTML ||
      "";
    const markdown = html ? turndown.turndown(html) : "";
    const restoredMarkdown = restoreCodeBlocks(markdown, codeSnapshotMap);
    return {
      ok: true,
      markdown: restoredMarkdown,
      title: (article && article.title) || document.title || "",
    };
  } catch (error) {
    const message =
      (error && typeof error.message === "string"
        ? error.message
        : String(error || "未知错误")) || "未知错误";
    return { ok: false, error: message };
  }
})();
