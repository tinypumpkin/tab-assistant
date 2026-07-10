// Pure i18n core — no chrome/DOM dependencies.
// Safe to import from BOTH the popup (dashboard.html + popup.js) and the
// background service worker (background.js). Mirrors the design of the
// sibling tab-assistant-1.5.1 project's utils/shared-i18n.js.
import { zhCN } from "./locales/zh-CN.js";
import { enUS } from "./locales/en-US.js";

export const DEFAULT_LOCALE = "zh-CN";

export const SUPPORTED_LOCALES = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

// Map any locale string (e.g. "zh-TW", "en-GB", "zh") onto a supported locale,
// falling back to the default. Resilient to language variants.
export function normalizeLocale(locale) {
  if (!locale || typeof locale !== "string") return DEFAULT_LOCALE;
  if (SUPPORTED_LOCALES[locale]) return locale;
  const lowered = locale.toLowerCase();
  if (lowered.startsWith("zh")) return "zh-CN";
  if (lowered.startsWith("en")) return "en-US";
  return DEFAULT_LOCALE;
}

export function getMessages(locale = DEFAULT_LOCALE) {
  const normalized = normalizeLocale(locale);
  return SUPPORTED_LOCALES[normalized] || SUPPORTED_LOCALES[DEFAULT_LOCALE];
}

// Replace {name} placeholders with params (missing => "").
export function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value == null ? "" : String(value);
  });
}

// 3-level fallback: current locale -> DEFAULT_LOCALE -> raw key.
// Never throws; a missing key simply renders as its own name.
export function translate(locale, key, params = {}) {
  const currentMessages = getMessages(locale);
  const fallbackMessages = getMessages(DEFAULT_LOCALE);
  const template = currentMessages[key] ?? fallbackMessages[key] ?? key;
  return interpolate(template, params);
}
