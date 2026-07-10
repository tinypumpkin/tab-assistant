// AI output-language axis — a locale axis SEPARATE from the UI locale.
// Controls the language the LLM writes notes/summaries in, decoupled from the
// interface language. Mirrors tab-assistant-1.5.1/services/prompt-language-vars.js.
export const DEFAULT_PROMPT_LANGUAGE = "zh-CN";

const PROMPT_LANGUAGE_VARS = {
  "zh-CN": {
    output_language_name: "简体中文",
    preserved_language_name: "原始语言",
    ai_summary_title: "AI 摘要",
    style_language_register: "正式、清晰的中文表达",
    supplement_label: "补充说明",
    output_language_label: "Simplified Chinese",
    note_system_role:
      "你是一名专业的笔记助手，会根据提供的网页 Markdown 内容生成结构化的高质量 Markdown 笔记。",
    summary_instruction: "一句中文摘要（20~60字）",
    output_language_instruction: "笔记必须使用 {output_language_name} 撰写。",
    preserve_terms_instruction:
      "专有名词、技术术语、品牌名称和人名可适当保留英文。",
  },
  "en-US": {
    output_language_name: "English",
    preserved_language_name: "the source language",
    ai_summary_title: "AI Summary",
    style_language_register: "clear, professional English",
    supplement_label: "Supplement",
    output_language_label: "English",
    note_system_role:
      "You are a professional note-taking assistant that turns the provided web page Markdown into well-structured, high-quality Markdown notes.",
    summary_instruction: "a one-sentence summary in English (roughly 20-60 words)",
    output_language_instruction: "The notes must be written in {output_language_name}.",
    preserve_terms_instruction:
      "Keep proper nouns, technical terms, brand names, and people names in their original form when that is more accurate.",
  },
};

export function normalizePromptLanguage(outputLanguage = DEFAULT_PROMPT_LANGUAGE) {
  return PROMPT_LANGUAGE_VARS[outputLanguage]
    ? outputLanguage
    : DEFAULT_PROMPT_LANGUAGE;
}

export function getPromptLanguageVars(outputLanguage = DEFAULT_PROMPT_LANGUAGE) {
  return PROMPT_LANGUAGE_VARS[normalizePromptLanguage(outputLanguage)];
}

export function getOutputLanguageLabel(outputLanguage = DEFAULT_PROMPT_LANGUAGE) {
  return getPromptLanguageVars(outputLanguage).output_language_label;
}
