// Popup-side stateful i18n wrapper. Holds currentLocale, detects/persists the
// chosen UI language, exposes t(), and re-translates static DOM on change.
// Uses chrome.storage.local directly (this project has no storage-helper).
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  normalizeLocale,
  translate,
} from "./shared-i18n.js";

let currentLocale = DEFAULT_LOCALE;
const listeners = new Set();

// Priority: stored choice -> browser UI language -> navigator -> default.
export async function resolveInitialLocale() {
  try {
    const { locale } = await chrome.storage.local.get("locale");
    if (locale) return normalizeLocale(locale);
  } catch (_) {}
  if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage) {
    return normalizeLocale(chrome.i18n.getUILanguage());
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLocale(navigator.language);
  }
  return DEFAULT_LOCALE;
}

export async function initI18n(locale) {
  currentLocale = normalizeLocale(locale || (await resolveInitialLocale()));
  return currentLocale;
}

export function getLocale() {
  return currentLocale;
}

export function getSupportedLocales() {
  return Object.keys(SUPPORTED_LOCALES);
}

export function t(key, params = {}) {
  return translate(currentLocale, key, params);
}

export async function setLocale(locale, options = {}) {
  const nextLocale = normalizeLocale(locale);
  if (nextLocale === currentLocale) return currentLocale;
  currentLocale = nextLocale;
  if (options.persist !== false) {
    try {
      await chrome.storage.local.set({ locale: nextLocale });
    } catch (_) {}
  }
  listeners.forEach((listener) => {
    try {
      listener(currentLocale);
    } catch (_) {}
  });
  return currentLocale;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Scan the DOM for declarative i18n attributes and apply translations.
// Called once after init and again on every locale change (reactivity).
export function applyStaticI18n() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = getLocale();

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (!key) return;
    node.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    const key = node.getAttribute("data-i18n-title");
    if (!key) return;
    node.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    const key = node.getAttribute("data-i18n-aria-label");
    if (!key) return;
    node.setAttribute("aria-label", t(key));
  });

  document.title = t("app.name");
}
