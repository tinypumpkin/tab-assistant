import { BASE_PROMPT, NOTE_STYLES, DEFAULT_NOTE_STYLE, AI_SUM } from "./note-templates.js";

function applyTemplate(template, values) {
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return `${values[key] ?? ""}`;
    }
    return match;
  });
}

function sanitizeMultiline(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function buildNotePrompt({
  title = "",
  category = "",
  markd = "",
  styleKey = DEFAULT_NOTE_STYLE,
  supplement = ""
} = {}) {
  const key = NOTE_STYLES[styleKey] ? styleKey : DEFAULT_NOTE_STYLE;
  const base = applyTemplate(BASE_PROMPT, { title, category, markd });
  const stylePrompt = NOTE_STYLES[key] || "";
  const manual = typeof supplement === "string" ? supplement.trim() : "";
  const supplementBlock = manual ? `补充说明: ${manual}` : "";
  const parts = [base, stylePrompt, supplementBlock, AI_SUM].filter(Boolean);
  return sanitizeMultiline(parts.join("\n\n"));
}
