import { buildNotePrompt } from "./prompt-builder.js";
import { NOTE_STYLES, DEFAULT_NOTE_STYLE } from "./note-templates.js";

export async function classifyAndSummarize(pages) {
  if (!pages || !pages.length) return [];
  const { apiKey, apiBase, apiModel, activeCategories = [] } =
    await chrome.storage.local.get(["apiKey", "apiBase", "apiModel", "activeCategories"]);
  if (!apiKey) {
    return pages.map((p) => ({
      ...p,
      category: "未分类",
      summary: p.summary || ""
    }));
  }
  const base = (apiBase || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = apiModel || "gpt-4o-mini";
  const cats = activeCategories.length
    ? activeCategories
    : ["技术", "新闻", "视频", "学术", "社交", "其他"];
  const sys = `你是一个浏览器标签助手。请将网页归类到以下类别之一：${cats.join(
    " / "
  )}。输出 JSON 数组，每个元素形如：{"url":"...","category":"类别","summary":"一句中文摘要（20~60字）"}`;
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
  } catch (_error) {
    return pages.map((p) => ({
      ...p,
      category: "未分类",
      summary: ""
    }));
  }
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
  if (!tab || typeof tab.url !== "string") {
    throw new Error("无效的标签页记录");
  }
  const markd = typeof tab.markd === "string" ? tab.markd.trim() : "";
  if (!markd) {
    const err = new Error("请先抓取 Markdown 内容");
    err.code = "NO_MARKDOWN";
    throw err;
  }
  const {
    apiKey,
    apiBase,
    apiModel,
    noteStyle,
    noteSupplement
  } = await chrome.storage.local.get([
    "apiKey",
    "apiBase",
    "apiModel",
    "noteStyle",
    "noteSupplement"
  ]);
  if (!apiKey) {
    const err = new Error("请先在设置中配置 LLM API");
    err.code = "NO_API_KEY";
    throw err;
  }
  const base = (apiBase || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = (apiModel || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const styleKey = NOTE_STYLES[noteStyle] ? noteStyle : DEFAULT_NOTE_STYLE;
  const prompt = buildNotePrompt({
    title: tab.title || tab.url || "",
    category: tab.category || "",
    markd,
    styleKey,
    supplement: typeof noteSupplement === "string" ? noteSupplement : ""
  });
  const messages = [
    {
      role: "system",
      content:
        "你是一名专业的中文笔记助手，会根据提供的网页 Markdown 内容生成结构化的高质量中文 Markdown 笔记。"
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
    throw new Error(error?.message || "AI 笔记生成失败");
  }
  const output = (data?.choices?.[0]?.message?.content || "").trim();
  if (!output) {
    throw new Error("模型未返回内容");
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
