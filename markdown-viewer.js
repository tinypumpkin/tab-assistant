const CSS_ASSETS = [
  "vendor/prism.min.css",
  "vendor/highlight-github.min.css",
  "vendor/katex.min.css",
  "vendor/markmap-toolbar.css"
];

const SCRIPT_ASSETS = [
  "vendor/d3.min.js",
  "vendor/katex.min.js",
  "vendor/katex-auto-render.min.js",
  "vendor/highlight.min.js",
  "vendor/markdown-it.min.js",
  "vendor/dompurify.min.js",
  "vendor/markmap-lib.min.js",
  "vendor/markmap-view.min.js",
  "vendor/mermaid.min.js",
  "vendor/prism.js",
  "vendor/prism-bash.min.js",
  "vendor/prism-c.min.js",
  "vendor/prism-cpp.min.js",
  "vendor/prism-java.min.js",
  "vendor/prism-javascript.min.js",
  "vendor/prism-json.min.js",
  "vendor/prism-markdown.min.js",
  "vendor/prism-python.min.js",
  "vendor/prism-typescript.min.js",
  "vendor/prism-yaml.min.js",
  "vendor/prism-powershell.min.js"
];

const loadedStyles = new Set();
const loadedScripts = new Map();
const inlineMindmapInstances = new WeakMap();
let depsPromise = null;
let resizeTimer = null;

const state = {
  container: null,
  backdrop: null,
  panel: null,
  titleEl: null,
  markdownPane: null,
  mindmapPane: null,
  markdownContent: null,
  mindmapSvg: null,
  tabButtons: [],
  sourceButtons: [],
  sourceSections: [],
  aiContent: null,
  viewSwitchEl: null,
  copyButton: null,
  copyLabel: null,
  closeBtn: null,
  md: null,
  transformer: null,
  mindmapInstance: null,
  mermaidInitialized: false,
  currentMarkdown: "",
  currentPlainMarkdown: "",
  currentTitle: "",
  activeTab: "markdown",
  activeSource: "reference",
  copyResetTimer: null,
  currentMindmapSource: "",
  aiMindmapSource: "",
  aiPlainMarkdown: ""
};

function loadCssOnce(href) {
  if (loadedStyles.has(href)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  loadedStyles.add(href);
}

function loadScriptOnce(src) {
  if (loadedScripts.has(src)) return loadedScripts.get(src);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
  loadedScripts.set(src, promise);
  return promise;
}

function waitForDependencies(timeout = 10000, interval = 40) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const ready =
        typeof window.markdownit === "function" &&
        typeof window.DOMPurify !== "undefined" &&
        window.markmap &&
        typeof window.markmap.Transformer === "function" &&
        typeof window.markmap.Markmap === "function" &&
        typeof window.renderMathInElement === "function" &&
        typeof window.Prism !== "undefined" &&
        typeof window.mermaid !== "undefined";
      if (ready) {
        resolve();
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error("Viewer dependencies did not load in time"));
        return;
      }
      window.setTimeout(check, interval);
    };
    check();
  });
}

function loadDependencies() {
  if (!depsPromise) {
    CSS_ASSETS.forEach(loadCssOnce);
    depsPromise = SCRIPT_ASSETS.reduce(
      (prev, src) => prev.then(() => loadScriptOnce(src)),
      Promise.resolve()
    )
      .then(() => waitForDependencies())
      .catch((error) => {
        depsPromise = null;
        throw error;
      });
  }
  return depsPromise;
}

function ensureViewerMounted() {
  if (state.container) return;
  const container = document.createElement("div");
  container.className = "markd-viewer markd-viewer--hidden";
  container.innerHTML = `
    <div class="markd-viewer__backdrop" role="presentation"></div>
    <div class="markd-viewer__panel" role="dialog" aria-modal="true" aria-labelledby="markd-viewer-title" tabindex="-1">
      <header class="markd-viewer__header">
        <div class="markd-viewer__title-group">
          <h2 id="markd-viewer-title" class="markd-viewer__title"></h2>
          <div class="markd-viewer__switch-row">
            <div class="markd-viewer__tabs markd-viewer__source-switch" role="tablist" aria-label="内容类型">
              <button type="button" class="markd-viewer__tab" data-role="source" data-source="ai" role="tab" aria-selected="false">AI 笔记</button>
              <button type="button" class="markd-viewer__tab markd-viewer__tab--active" data-role="source" data-source="reference" role="tab" aria-selected="true">原文参照</button>
            </div>
            <div class="markd-viewer__view-controls">
              <button type="button" class="markd-viewer__copy">
                <span class="markd-viewer__action-icon markd-viewer__action-icon--copy" aria-hidden="true">
                  <svg viewBox="0 0 20 20" focusable="false">
                    <path d="M6 4.5C6 3.12 7.12 2 8.5 2h5A2.5 2.5 0 0 1 16 4.5v7A2.5 2.5 0 0 1 13.5 14H13v1.5A2.5 2.5 0 0 1 10.5 18h-5A2.5 2.5 0 0 1 3 15.5v-7A2.5 2.5 0 0 1 5.5 6H6Zm0 2h-.5A1.5 1.5 0 0 0 4 8v7c0 .83.67 1.5 1.5 1.5h5c.83 0 1.5-.67 1.5-1.5V15H8.5A2.5 2.5 0 0 1 6 12.5v-6Z" />
                    <path d="M8 4.5A1.5 1.5 0 0 1 9.5 3h4A1.5 1.5 0 0 1 15 4.5v7A1.5 1.5 0 0 1 13.5 13H9.5A1.5 1.5 0 0 1 8 11.5v-7Z" />
                  </svg>
                </span>
                <span class="markd-viewer__action-label">复制</span>
              </button>
              <div class="markd-viewer__view-switch" role="tablist" aria-label="内容视图">
                <button type="button" class="markd-viewer__view-pill markd-viewer__view-pill--active" data-role="view" data-tab="markdown" role="tab" aria-selected="true">
                  <span class="markd-viewer__action-icon markd-viewer__action-icon--markdown" aria-hidden="true">
                    <svg viewBox="0 0 20 20" focusable="false">
                      <path d="M6 3h5.293c.199 0 .39.079.53.22l3.957 3.957A.75.75 0 0 1 16 7.707V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                      <path d="M12 3.5V6a1 1 0 0 0 1 1h2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                      <path d="M8 11h4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                      <path d="M8 13.5h2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="markd-viewer__view-label">Markdown</span>
                </button>
                <button type="button" class="markd-viewer__view-pill" data-role="view" data-tab="mindmap" role="tab" aria-selected="false">
                  <span class="markd-viewer__action-icon markd-viewer__action-icon--mindmap" aria-hidden="true">
                    <svg viewBox="0 0 20 20" focusable="false">
                      <circle cx="10" cy="4" r="2" fill="currentColor"></circle>
                      <circle cx="5" cy="14" r="2" fill="currentColor"></circle>
                      <circle cx="15" cy="14" r="2" fill="currentColor"></circle>
                      <path d="M10 6v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M9.2 11.6L6.9 13.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M10.8 11.6L13.1 13.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                  </span>
                  <span class="markd-viewer__view-label">思维导图</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button type="button" class="markd-viewer__close" aria-label="关闭预览">×</button>
      </header>
      <div class="markd-viewer__body">
        <section class="markd-viewer__pane markd-viewer__pane--active" data-pane="markdown" role="tabpanel">
          <section class="markd-viewer__source-pane markd-viewer__source-pane--active" data-source="reference" role="tabpanel" aria-label="原文参照">
            <div class="markd-viewer__scroll markd-viewer__scroll--markdown">
              <article class="markd-viewer__markdown"></article>
            </div>
          </section>
          <section class="markd-viewer__source-pane" data-source="ai" role="tabpanel" aria-label="AI 笔记">
            <div class="markd-viewer__scroll markd-viewer__scroll--markdown markd-viewer__scroll--ai">
              <div class="markd-viewer__ai markd-viewer__empty">尚未生成 AI 笔记</div>
            </div>
          </section>
        </section>
        <section class="markd-viewer__pane" data-pane="mindmap" role="tabpanel">
          <div class="markd-viewer__mindmap-shell">
            <svg class="markd-viewer__mindmap-svg"></svg>
          </div>
        </section>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  state.container = container;
  state.backdrop = container.querySelector(".markd-viewer__backdrop");
  state.panel = container.querySelector(".markd-viewer__panel");
  state.titleEl = container.querySelector(".markd-viewer__title");
  state.markdownPane = container.querySelector('[data-pane="markdown"]');
  state.mindmapPane = container.querySelector('[data-pane="mindmap"]');
  state.markdownContent = container.querySelector(".markd-viewer__markdown");
  state.mindmapSvg = container.querySelector(".markd-viewer__mindmap-svg");
  state.closeBtn = container.querySelector(".markd-viewer__close");
  state.tabButtons = Array.from(container.querySelectorAll('[data-role="view"]'));
  state.sourceButtons = Array.from(container.querySelectorAll('.markd-viewer__tab[data-role="source"]'));
  state.sourceSections = Array.from(container.querySelectorAll(".markd-viewer__source-pane"));
  state.aiContent = container.querySelector(".markd-viewer__ai");
  state.viewSwitchEl = container.querySelector(".markd-viewer__view-switch");
  state.copyButton = container.querySelector(".markd-viewer__copy");
  state.copyLabel = state.copyButton ? state.copyButton.querySelector(".markd-viewer__action-label") : null;

  state.backdrop.addEventListener("click", closeViewer);
  state.closeBtn.addEventListener("click", closeViewer);
  state.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  });
  state.sourceButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveSource(btn.dataset.source));
  });
  if (state.copyButton) {
    state.copyButton.addEventListener("click", handleCopyClick);
  }
  state.panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeViewer();
    }
  });
  setActiveSource(state.activeSource, { force: true });
  window.addEventListener("resize", () => {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (state.activeTab === "mindmap" && state.mindmapInstance) {
        queueMindmapFit();
      }
    }, 160);
  });
}

function ensureRendererReady() {
  if (state.md) return;

  const { Transformer, Markmap } = window.markmap;
  if (Markmap && !Markmap.__safeFitPatched) {
    const originalFit = Markmap.prototype.fit;
    Markmap.prototype.fit = function patchedFit(maxScale) {
      const svgNode = this.svg && typeof this.svg.node === "function" ? this.svg.node() : null;
      const viewport = svgNode ? svgNode.getBoundingClientRect() : null;
      const layout = this.state?.rect;
      const usable =
        viewport && viewport.width > 0 && viewport.height > 0 && hasUsableRect(layout);
      if (!usable) {
        return Promise.resolve();
      }
      return originalFit.call(this, maxScale);
    };
    Markmap.__safeFitPatched = true;
  }

  const prism = window.Prism;
  const highlightCode = (codeValue, language) => {
    if (!language || !prism?.languages?.[language]) {
      return escapeHtmlFallback(codeValue);
    }
    try {
      return prism.highlight(codeValue, prism.languages[language], language);
    } catch (error) {
      console.warn("Prism highlight failed", error);
      return escapeHtmlFallback(codeValue);
    }
  };

  state.md = window.markdownit({
    html: true,
    linkify: true,
    typographer: true,
    highlight: highlightCode
  });

  state.transformer = new Transformer();
}

function escapeHtmlFallback(input) {
  return String(input || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] || char);
}

function preprocessMathBlocks(input) {
  const blocks = [];
  const codeBlocks = [];
  const inlineCodes = [];

  const maskSegments = (value, label, store, regex) =>
    value.replace(regex, (match) => {
      const placeholder = `${label}${store.length}::`;
      store.push(match);
      return placeholder;
    });

  let maskedInput = input;
  maskedInput = maskSegments(maskedInput, "::CODE_BLOCK_", codeBlocks, /```[\s\S]*?```/g);
  maskedInput = maskedInput.replace(
    /(^|\n)(?: {4}|\t).*(?:\n(?: {4}|\t).*)*/g,
    (segment) => {
      const prefix = segment.startsWith("\n") ? "\n" : "";
      const content = prefix ? segment.slice(1) : segment;
      const placeholder = `::CODE_BLOCK_${codeBlocks.length}::`;
      codeBlocks.push(content);
      return `${prefix}${placeholder}`;
    }
  );
  maskedInput = maskSegments(maskedInput, "::INLINE_CODE_", inlineCodes, /`[^`]*`/g);

  let processed = maskedInput.replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
    const index = blocks.length;
    const key = `::MATH_BLOCK_${index}::`;
    blocks.push(expr.trim());
    return `\n\n${key}\n\n`;
  });

  const restorePlaceholders = (value) => {
    let output = value;
    codeBlocks.forEach((segment, index) => {
      const placeholder = `::CODE_BLOCK_${index}::`;
      output = output.split(placeholder).join(segment);
    });
    inlineCodes.forEach((segment, index) => {
      const placeholder = `::INLINE_CODE_${index}::`;
      output = output.split(placeholder).join(segment);
    });
    return output;
  };

  const plainMasked = blocks.reduce(
    (acc, expr, index) =>
      acc.replace(new RegExp(`::MATH_BLOCK_${index}::`, "g"), `$$\n${expr}\n$$`),
    processed
  );

  processed = restorePlaceholders(processed);
  const plain = restorePlaceholders(plainMasked);
  return { processed, plain, blocks };
}

function applyBlockMath(container, blocks) {
  if (!blocks.length) return;
  blocks.forEach((expr, index) => {
    const placeholder = `::MATH_BLOCK_${index}::`;
    container.querySelectorAll("p").forEach((paragraph) => {
      if (paragraph.textContent.trim() === placeholder) {
        const wrapper = document.createElement("div");
        wrapper.className = "katex-display";
        try {
          if (window.katex && typeof window.katex.renderToString === "function") {
            wrapper.innerHTML = window.katex.renderToString(expr, {
              displayMode: true,
              throwOnError: false
            });
          } else {
            wrapper.textContent = expr;
          }
        } catch (error) {
          console.warn("Failed to render KaTeX block", error);
          wrapper.textContent = expr;
          wrapper.classList.add("katex-error");
        }
        paragraph.replaceWith(wrapper);
      }
    });
  });
}

function renderMathBlock(root) {
  const autoRender = window.renderMathInElement;
  if (!autoRender || !root) return;
  autoRender(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true }
    ],
    throwOnError: false
  });
}

function renderInlineMath(root = state.markdownContent) {
  renderMathBlock(root);
}

function renderMindmapMath() {
  if (!window.renderMathInElement) return;
  const apply = () => {
    state.mindmapSvg
      .querySelectorAll("foreignObject")
      .forEach((foreignObject) => {
        const scope = foreignObject.querySelector("body, div");
        if (scope instanceof HTMLElement) {
          renderMathBlock(scope);
        }
      });
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(apply);
  } else {
    apply();
  }
}

function ensureMermaidReady() {
  const mermaidLib = window.mermaid;
  if (!mermaidLib || typeof mermaidLib.initialize !== "function") return null;
  if (!state.mermaidInitialized) {
    try {
      mermaidLib.initialize({ startOnLoad: false, securityLevel: "strict" });
    } catch (error) {
      console.warn("Mermaid initialization failed", error);
      return null;
    }
    state.mermaidInitialized = true;
  }
  return mermaidLib;
}

function prepareMermaidContainers(root) {
  if (!root) return [];
  const containers = [];
  const seen = new WeakSet();
  const register = (container, explicitSource) => {
    if (!container || seen.has(container)) return;
    const code =
      explicitSource ||
      container.textContent ||
      container.getAttribute("data-source") ||
      "";
    container.innerHTML = "";
    container.removeAttribute("data-processed");
    container.removeAttribute("data-mermaid-id");
    containers.push({ element: container, source: code });
    seen.add(container);
  };

  root.querySelectorAll("code.language-mermaid").forEach((code) => {
    const pre = code.closest("pre");
    if (pre) {
      register(pre, code.textContent || "");
    }
  });

  root.querySelectorAll("[data-mermaid]").forEach((node) => {
    register(node);
  });

  return containers;
}

function renderMermaidDiagrams(attempt = 0, root = state.markdownContent) {
  const normalizedAttempt = typeof attempt === "number" ? attempt : 0;
  const maxAttempts = 5;
  const target = root || state.markdownContent;
  if (!target) return;
  const run = () => {
    const mermaidLib = ensureMermaidReady();
    if (!mermaidLib) return;
    const containers = prepareMermaidContainers(target);
    if (!containers.length) return;
    let viewport = { width: 0, height: 0 };
    try {
      viewport = target.getBoundingClientRect();
    } catch (_error) {
      viewport = { width: 0, height: 0 };
    }
    const hasViewport = viewport.width > 0 && viewport.height > 0;
    if (!hasViewport) {
      if (normalizedAttempt < maxAttempts) {
        window.setTimeout(() => renderMermaidDiagrams(normalizedAttempt + 1, target), 120);
      }
      return;
    }
    try {
      mermaidLib.run({ nodes: containers });
    } catch (error) {
      console.error("Mermaid rendering failed", error);
    }
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(run);
  } else {
    run();
  }
}

function renderMindmapMermaid(attempt = 0) {
  const normalizedAttempt = typeof attempt === "number" ? attempt : 0;
  const maxAttempts = 5;
  const run = () => {
    const mermaidLib = ensureMermaidReady();
    if (!mermaidLib) return;
    const viewport = state.mindmapSvg.getBoundingClientRect();
    const hasViewport = viewport.width > 0 && viewport.height > 0;
    const isActive = state.mindmapPane.classList.contains("markd-viewer__pane--active");
    if (!hasViewport) {
      if (isActive && normalizedAttempt < maxAttempts) {
        window.setTimeout(() => renderMindmapMermaid(normalizedAttempt + 1), 120);
      }
      return;
    }
    const containers = prepareMermaidContainers(state.mindmapSvg);
    if (!containers.length) return;
    try {
      mermaidLib.run({ nodes: containers });
    } catch (error) {
      console.error("Mermaid rendering failed in mind map", error);
    }
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(run);
  } else {
    run();
  }
}

function highlightBlocks(container = state.markdownContent) {
  const prism = window.Prism;
  if (!prism || !container) return;
  container.querySelectorAll("pre code").forEach((block) => {
    if (block.classList.contains("language-mermaid")) return;
    prism.highlightElement(block);
  });
}

function hasFiniteRect(rect) {
  return (
    rect &&
    Number.isFinite(rect.x1) &&
    Number.isFinite(rect.y1) &&
    Number.isFinite(rect.x2) &&
    Number.isFinite(rect.y2)
  );
}

function hasUsableRect(rect) {
  return hasFiniteRect(rect) && rect.x2 > rect.x1 && rect.y2 > rect.y1;
}

function queueMindmapFit(attempt = 0) {
  const normalizedAttempt = typeof attempt === "number" ? attempt : 0;
  if (!state.mindmapInstance || state.activeTab !== "mindmap") return;
  const maxAttempts = 5;
  const scheduleRetry = () => {
    if (normalizedAttempt < maxAttempts) {
      window.setTimeout(() => queueMindmapFit(normalizedAttempt + 1), 120);
    }
  };
  const performFit = () => {
    if (!state.mindmapInstance || state.activeTab !== "mindmap") return;
    const viewport = state.mindmapSvg.getBoundingClientRect();
    const layout = state.mindmapInstance.state?.rect;
    if (!viewport.width || !viewport.height || !hasUsableRect(layout)) {
      scheduleRetry();
      return;
    }
    state.mindmapInstance.fit();
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(performFit);
  } else {
    performFit();
  }
}

function toLineKey(lines) {
  if (Array.isArray(lines)) return lines.join(",");
  if (typeof lines === "number") return String(lines);
  if (typeof lines === "string" && lines.trim()) return lines;
  return null;
}

function augmentMindmapTree(root, markdownSource) {
  if (!root) return root;
  const lineNodeMap = new Map();
  const collectNodes = (node) => {
    const key = toLineKey(node.payload?.lines);
    if (key && !lineNodeMap.has(key)) {
      lineNodeMap.set(key, node);
    }
    node.children?.forEach(collectNodes);
  };
  collectNodes(root);
  if (!lineNodeMap.size) return root;

  const tokens = state.md.parse(markdownSource, {});
  const headingStack = [];
  let listDepth = 0;

  const ensureChildren = (node) => {
    if (!node.children) node.children = [];
    return node.children;
  };

  tokens.forEach((token, index) => {
    if (token.type === "heading_open") {
      const level = Number(token.tag.slice(1));
      while (headingStack.length && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      const key = toLineKey(token.map);
      const node = (key && lineNodeMap.get(key)) || root;
      headingStack.push({ level, node });
    } else if (token.type === "bullet_list_open" || token.type === "ordered_list_open") {
      listDepth += 1;
    } else if (token.type === "bullet_list_close" || token.type === "ordered_list_close") {
      listDepth = Math.max(0, listDepth - 1);
    } else if (token.type === "paragraph_open") {
      if (listDepth > 0) return;
      const inlineToken = tokens[index + 1];
      if (!inlineToken || inlineToken.type !== "inline") return;
      const raw = inlineToken.content.trim();
      if (!raw) return;
      const html = state.md.renderer.render(inlineToken.children || [], state.md.options, {})?.trim();
      if (!html) return;
      const target = headingStack.length ? headingStack[headingStack.length - 1].node : root;
      ensureChildren(target).push({
        content: `<p>${html}</p>`,
        children: []
      });
    }
  });

  return root;
}

function updateMindmap(markdown, title) {
  const content = markdown.trim();
  if (!content) {
    if (state.mindmapInstance) {
      state.mindmapInstance.destroy();
      state.mindmapInstance = null;
    }
    state.mindmapSvg.innerHTML = "";
    return;
  }
  try {
    const { root } = state.transformer.transform(markdown);
    if (root) {
      root.content = escapeHtmlFallback(title || "Markdown");
      augmentMindmapTree(root, markdown);
    }
    if (!state.mindmapInstance) {
      state.mindmapSvg.innerHTML = "";
      state.mindmapInstance = window.markmap.Markmap.create(state.mindmapSvg, {}, root);
    } else {
      state.mindmapInstance.setData(root);
    }
    renderMindmapMath();
    renderMindmapMermaid();
    queueMindmapFit();
  } catch (error) {
    console.error("Mind map rendering failed", error);
  }
}

function renderMarkdownToContainer(container, markdown, options = {}) {
  const { emptyText = "" } = options;
  if (!container) return { plain: "", hasContent: false };
  const source = typeof markdown === "string" ? markdown : "";
  if (!source.trim()) {
    if (emptyText) {
      container.innerHTML = `<p class="markd-viewer__empty">${emptyText}</p>`;
    } else {
      container.innerHTML = "";
    }
    container.classList.add("markd-viewer__empty");
    return { plain: "", hasContent: false };
  }
  container.classList.remove("markd-viewer__empty");
  const { processed, plain, blocks } = preprocessMathBlocks(source);
  const html = state.md.render(processed);
  const clean = window.DOMPurify.sanitize(html, { ADD_ATTR: ["target", "rel"] });
  container.innerHTML = clean;
  applyBlockMath(container, blocks);
  renderInlineMath(container);
  highlightBlocks(container);
  renderMermaidDiagrams(0, container);
  return { plain, hasContent: true };
}

function renderMarkdownContent(markdown, title) {
  const source = typeof markdown === "string" ? markdown : "";
  state.currentMarkdown = source;
  state.currentTitle = title || "";
  const { plain, hasContent } = renderMarkdownToContainer(state.markdownContent, source, {
    emptyText: "暂无 Markdown 内容"
  });
  state.currentPlainMarkdown = plain;
  state.currentMindmapSource = hasContent ? plain : "";
  if (state.activeSource === "reference") {
    updateMindmap(state.currentMindmapSource || "", state.currentTitle || "");
  }
}

function renderAIContent(markdown, title = "") {
  const target = state.aiContent;
  if (!target) return;
  const { plain, hasContent } = renderMarkdownToContainer(target, typeof markdown === "string" ? markdown : "", {
    emptyText: "暂无 AI 笔记"
  });
  state.aiPlainMarkdown = plain;
  state.aiMindmapSource = hasContent ? plain : "";
  if (state.activeSource === "ai") {
    const targetTitle =
      typeof title === "string" && title.trim().length ? title : state.currentTitle || "";
    updateMindmap(state.aiMindmapSource || "", targetTitle);
  }
}

function setActiveTab(tab) {
  const normalized = tab === "mindmap" ? "mindmap" : "markdown";
  if (state.activeTab === normalized) return;
  state.activeTab = normalized;
  if (normalized === "mindmap") {
    const markdown =
      state.activeSource === "ai" ? state.aiMindmapSource || "" : state.currentMindmapSource || "";
    updateMindmap(markdown, state.currentTitle || "");
  }
  state.tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === normalized;
    btn.classList.toggle("markd-viewer__view-pill--active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  [state.markdownPane, state.mindmapPane].forEach((pane) => {
    const isActive = pane.dataset.pane === normalized;
    pane.classList.toggle("markd-viewer__pane--active", isActive);
  });
  if (normalized === "mindmap") {
    queueMindmapFit();
    renderMindmapMermaid();
  } else {
    renderMermaidDiagrams(0, state.markdownContent);
  }
}

function setActiveSource(source, options = {}) {
  const { force = false } = options;
  const normalized = source === "ai" ? "ai" : "reference";
  if (!force && state.activeSource === normalized) return;
  state.activeSource = normalized;
  state.sourceButtons.forEach((btn) => {
    const isActive = btn.dataset.source === normalized;
    btn.classList.toggle("markd-viewer__tab--active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  state.sourceSections.forEach((section) => {
    const isActive = section.dataset.source === normalized;
    section.classList.toggle("markd-viewer__source-pane--active", isActive);
    section.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
  if (state.viewSwitchEl) {
    const hasReference = (state.currentMindmapSource || "").trim().length > 0;
    const hasAi = (state.aiMindmapSource || "").trim().length > 0;
    const mindmapAvailable = normalized === "ai" ? hasAi : hasReference;
    state.viewSwitchEl.classList.remove("markd-viewer__view-switch--hidden");
    state.viewSwitchEl.setAttribute("aria-hidden", "false");
    state.tabButtons.forEach((btn) => {
      const isMindmap = btn.dataset.tab === "mindmap";
      const shouldDisable = isMindmap && !mindmapAvailable;
      btn.disabled = shouldDisable;
      btn.setAttribute("tabindex", shouldDisable ? "-1" : "0");
    });
  }
  if (normalized === "ai") {
    renderMermaidDiagrams(0, state.aiContent);
    highlightBlocks(state.aiContent);
  } else {
    renderMermaidDiagrams(0, state.markdownContent);
    highlightBlocks(state.markdownContent);
  }
  if (state.activeTab === "mindmap") {
    const markdown = normalized === "ai" ? state.aiMindmapSource || "" : state.currentMindmapSource || "";
    updateMindmap(markdown, state.currentTitle || "");
  }
  resetCopyButton();
}

function getCurrentCopyText() {
  if (state.activeSource === "ai") {
    const markdown = typeof state.aiPlainMarkdown === "string" ? state.aiPlainMarkdown : "";
    if (markdown.trim().length) return markdown.trim();
    const text = state.aiContent ? state.aiContent.textContent || "" : "";
    return text.trim();
  }
  return (state.currentPlainMarkdown || "").trim();
}

function copyTextToClipboard(text) {
  if (!text) return Promise.resolve();
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    textarea.style.zIndex = "-1";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(textarea);
    }
    if (copied) {
      resolve();
    } else {
      reject(new Error("COPY_COMMAND_FAILED"));
    }
  });
}

function resetCopyButton() {
  if (!state.copyButton) return;
  if (state.copyResetTimer) {
    window.clearTimeout(state.copyResetTimer);
    state.copyResetTimer = null;
  }
  state.copyButton.classList.remove("markd-viewer__copy--success");
  if (state.copyLabel) {
    state.copyLabel.textContent = "复制";
  } else {
    state.copyButton.textContent = "复制";
  }
}

async function handleCopyClick() {
  if (!state.copyButton) return;
  const text = getCurrentCopyText();
  if (!text) return;
  try {
    await copyTextToClipboard(text);
    state.copyButton.classList.add("markd-viewer__copy--success");
    if (state.copyLabel) {
      state.copyLabel.textContent = "已复制";
    } else {
      state.copyButton.textContent = "已复制";
    }
    if (state.copyResetTimer) {
      window.clearTimeout(state.copyResetTimer);
    }
    state.copyResetTimer = window.setTimeout(() => {
      if (!state.copyButton) return;
      state.copyButton.classList.remove("markd-viewer__copy--success");
      if (state.copyLabel) {
        state.copyLabel.textContent = "复制";
      } else {
        state.copyButton.textContent = "复制";
      }
      state.copyResetTimer = null;
    }, 3000);
  } catch (error) {
    console.warn("Copy to clipboard failed", error);
  }
}

function showViewer() {
  if (!state.container) return;
  document.body.classList.add("markd-viewer-open");
  state.container.classList.remove("markd-viewer--hidden");
  state.panel.focus({ preventScroll: true });
}

function closeViewer() {
  if (!state.container) return;
  state.container.classList.add("markd-viewer--hidden");
  document.body.classList.remove("markd-viewer-open");
}

function escapeMindmapText(value) {
  return String(value || "").replace(/[\\`*_{}\[\]()#+\-!>]/g, "\\$&");
}

function buildMindmapMarkdownFromTitles(title, nodes) {
  const safeTitle = escapeMindmapText(title || "Mindmap");
  const items = Array.isArray(nodes) ? nodes : [];
  const lines = items
    .map((item) => {
      if (!item) return null;
      const text = typeof item === "string" ? item : item?.title;
      if (!text) return null;
      return `- ${escapeMindmapText(text)}`;
    })
    .filter(Boolean);
  return lines.length ? `# ${safeTitle}\n\n${lines.join("\n")}` : `# ${safeTitle}`;
}

async function ensureStandaloneMindmapReady() {
  await loadDependencies();
  ensureRendererReady();
}

function fitStandaloneMindmap(instance) {
  if (!instance || typeof instance.fit !== "function") return;
  const attemptFit = () => {
    try {
      instance.fit();
    } catch (error) {
      console.warn("Mindmap fit failed", error);
    }
  };
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(attemptFit);
  } else {
    attemptFit();
  }
}

export async function renderMindmapFromTitles(targetSvg, options = {}) {
  const svg = targetSvg instanceof SVGElement ? targetSvg : null;
  if (!svg) throw new Error("INVALID_MINDMAP_TARGET");
  const { title = "", nodes = [] } = options;
  await ensureStandaloneMindmapReady();
  const markdown = buildMindmapMarkdownFromTitles(title, nodes);
  const { root } = state.transformer.transform(markdown);
  if (root) {
    root.content = escapeHtmlFallback(title || "Mindmap");
    augmentMindmapTree(root, markdown);
  }
  const { Markmap } = window.markmap;
  let instance = inlineMindmapInstances.get(svg);
  if (!instance) {
    svg.innerHTML = "";
    instance = Markmap.create(svg, {}, root);
    inlineMindmapInstances.set(svg, instance);
  } else {
    instance.setData(root);
  }
  fitStandaloneMindmap(instance);
  return instance;
}

export function destroyMindmapFromTitles(targetSvg) {
  const svg = targetSvg instanceof SVGElement ? targetSvg : null;
  if (!svg) return;
  const instance = inlineMindmapInstances.get(svg);
  if (instance) {
    try {
      instance.destroy();
    } catch (error) {
      console.warn("Mindmap destroy failed", error);
    }
    inlineMindmapInstances.delete(svg);
  }
  svg.innerHTML = "";
}

export async function openMarkdownViewer(options) {
  const {
    title,
    markdown,
    aiMarkdown,
    source
  } = options || {};
  const referenceContent = typeof markdown === "string" ? markdown : "";
  const aiContent = typeof aiMarkdown === "string" ? aiMarkdown : "";
  const hasReference = !!referenceContent.trim();
  const hasAi = !!aiContent.trim();
  if (!hasReference && !hasAi) {
    throw new Error("EMPTY_MARKDOWN");
  }
  await loadDependencies();
  ensureViewerMounted();
  ensureRendererReady();
  const resolvedTitle = title || "Markdown 预览";
  state.titleEl.textContent = resolvedTitle;
  renderMarkdownContent(referenceContent, resolvedTitle);
  renderAIContent(aiContent);
  let initialSource = source === "ai" && hasAi ? "ai" : "reference";
  if (initialSource === "reference" && !hasReference && hasAi) {
    initialSource = "ai";
  }
  setActiveSource(initialSource, { force: true });
  setActiveTab("markdown");
  showViewer();
}

export { closeViewer as closeMarkdownViewer };
