import { buildNotePrompt } from "./prompt-builder.js";
import { NOTE_STYLES, DEFAULT_NOTE_STYLE } from "./note-templates.js";
import { translate, normalizeLocale, DEFAULT_LOCALE } from "./shared-i18n.js";
import { getPromptLanguageVars } from "./prompt-language-vars.js";

// Locale for error messages thrown here (refreshed per call below).
let apiLocale = DEFAULT_LOCALE;
function t(key, params) {
  return translate(apiLocale, key, params);
}

export async function classifyAndSummarize(pages) {
  if (!pages || !pages.length) return [];
  const { apiKey, apiBase, apiModel, activeCategories = [], noteLanguage, locale } =
    await chrome.storage.local.get(["apiKey", "apiBase", "apiModel", "activeCategories", "noteLanguage", "locale"]);
  apiLocale = normalizeLocale(locale);
  if (!apiKey) {
    return pages.map((p) => ({
      ...p,
      category: "未分类",
      summary: p.summary || ""
    }));
  }
  const base = (apiBase || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = apiModel || "gpt-5.4-mini";
  const cats = activeCategories.length
    ? activeCategories
    : ["技术", "新闻", "视频", "学术", "社交", "其他"];
  const lv = getPromptLanguageVars(noteLanguage);
  const sys = `你是一个浏览器标签助手。请将网页归类到以下类别之一：${cats.join(
    " / "
  )}。输出 JSON 数组，每个元素形如：{"url":"...","category":"类别","summary":${JSON.stringify(lv.summary_instruction)}}`;
  const user = pages
    .map((p) => `标题: ${p.title}\nURL: ${p.url}`)
    .join("\n---\n");
  const body = {
    model,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ],
    temperature: 0.2
  };
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw await buildApiError(res);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const m = text.match(/\[[\s\S]*\]/);
  let arr = [];
  try {
    arr = m ? JSON.parse(m[0]) : [];
  } catch (_parseError) {
    arr = [];
  }
  const map = new Map(arr.map((it) => [it.url, it]));
  return pages.map((p) => {
    const it = map.get(p.url) || {};
    return {
      ...p,
      category: it.category && cats.includes(it.category) ? it.category : "未分类",
      summary: it.summary || ""
    };
  });
}

export async function generateAIMarkdownNote(tab) {
  const { locale } = await chrome.storage.local.get("locale");
  apiLocale = normalizeLocale(locale);
  if (!tab || typeof tab.url !== "string") {
    throw new Error(t("error.invalid_tab"));
  }
  const markd = typeof tab.markd === "string" ? tab.markd.trim() : "";
  if (!markd) {
    const err = new Error(t("error.need_markdown"));
    err.code = "NO_MARKDOWN";
    throw err;
  }
  const {
    apiKey,
    apiBase,
    apiModel,
    noteStyle,
    noteSupplement,
    noteLanguage
  } = await chrome.storage.local.get([
    "apiKey",
    "apiBase",
    "apiModel",
    "noteStyle",
    "noteSupplement",
    "noteLanguage"
  ]);
  if (!apiKey) {
    const err = new Error(t("error.no_api_key"));
    err.code = "NO_API_KEY";
    throw err;
  }
  const base = (apiBase || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = (apiModel || "gpt-5.4-mini").trim() || "gpt-5.4-mini";
  const styleKey = NOTE_STYLES[noteStyle] ? noteStyle : DEFAULT_NOTE_STYLE;
  const lv = getPromptLanguageVars(noteLanguage);
  const prompt = buildNotePrompt({
    title: tab.title || tab.url || "",
    category: tab.category || "",
    markd,
    styleKey,
    supplement: typeof noteSupplement === "string" ? noteSupplement : "",
    noteLanguage
  });
  const messages = [
    {
      role: "system",
      content: lv.note_system_role
    },
    { role: "user", content: prompt }
  ];
  const body = { model, messages, temperature: 0.3 };
  let data;
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw await buildApiError(res);
    }
    data = await res.json();
  } catch (error) {
    if (error?.code === "NO_API_KEY" || error?.code === "NO_MARKDOWN") {
      throw error;
    }
    throw new Error(error?.message || t("error.ai_note_failed"));
  }
  const output = (data?.choices?.[0]?.message?.content || "").trim();
  if (!output) {
    throw new Error(t("error.model_empty"));
  }
  return output;
}

async function buildApiError(response) {
  const status = response?.status || 0;
  const statusText = response?.statusText || "";
  let detail = "";
  try {
    const raw = await response.text();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        detail =
          parsed?.error?.message ||
          parsed?.message ||
          parsed?.error_description ||
          JSON.stringify(parsed);
      } catch (_jsonErr) {
        detail = raw;
      }
    }
  } catch (_readErr) {
    detail = "";
  }
  const parts = [`HTTP ${status}`];
  if (statusText) parts.push(statusText);
  if (detail) parts.push(detail.trim());
  return new Error(parts.join(" | "));
}
