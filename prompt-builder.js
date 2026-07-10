import { DEFAULT_NOTE_STYLE, getBasePrompt, getNoteStyles, getAiSum, isValidNoteStyle } from "./note-templates.js";
import { getPromptLanguageVars, DEFAULT_PROMPT_LANGUAGE } from "./prompt-language-vars.js";

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
  supplement = "",
  noteLanguage = DEFAULT_PROMPT_LANGUAGE
} = {}) {
  const key = isValidNoteStyle(styleKey) ? styleKey : DEFAULT_NOTE_STYLE;
  const lv = getPromptLanguageVars(noteLanguage);
  const base = applyTemplate(getBasePrompt(noteLanguage), {
    title,
    category,
    markd,
    output_language_name: lv.output_language_name,
    preserve_terms_instruction: lv.preserve_terms_instruction
  });
  const stylePrompt = getNoteStyles(noteLanguage)[key] || "";
  const manual = typeof supplement === "string" ? supplement.trim() : "";
  const supplementBlock = manual ? `${lv.supplement_label}: ${manual}` : "";
  const summary = applyTemplate(getAiSum(noteLanguage), {
    output_language_name: lv.output_language_name,
    ai_summary_title: lv.ai_summary_title
  });
  const parts = [base, stylePrompt, supplementBlock, summary].filter(Boolean);
  return sanitizeMultiline(parts.join("\n\n"));
}
