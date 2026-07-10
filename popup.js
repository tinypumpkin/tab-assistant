import { openMarkdownViewer, renderMindmapFromTitles, destroyMindmapFromTitles, refreshViewerChrome } from "./markdown-viewer.js";
import { NOTE_STYLE_METADATA, DEFAULT_NOTE_STYLE, NOTE_STYLES } from "./note-templates.js";
import { initI18n, getLocale, setLocale, t as tr, subscribe, applyStaticI18n } from "./i18n.js";
const CATEGORY_COLORS=["#0f172a","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899"];
const GENERAL_CONFIG_DEFAULTS={ timeoutSeconds:120, captureLimit:5, aiLimit:5, retryLimit:3, aiAuto:false };
const CATEGORY_ICONS=[
  {id:"folder",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.75 6.75a2.25 2.25 0 0 1 2.25-2.25h3.879c.596 0 1.17.211 1.62.597l1.75 1.53h5.001a2.25 2.25 0 0 1 2.25 2.25v8.123a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"/></svg>'},
  {id:"coin",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v8m-3-4h6"/></svg>'},
  {id:"book",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 6.75A2.25 2.25 0 0 1 7.75 4.5h9.75v15H7.75A2.25 2.25 0 0 0 5.5 21.75V6.75Z"/><path d="M5.5 18.75A2.25 2.25 0 0 1 7.75 16.5h9.75"/></svg>'},
  {id:"graduation",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z"/><path d="M5.25 11v5.25A3.75 3.75 0 0 0 9 20h6a3.75 3.75 0 0 0 3.75-3.75V11"/><path d="m21 10.5-.75.375v3.375"/></svg>'},
  {id:"pencil",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16.44 4.44 19.56 7.56 8.75 18.37 5 19l.63-3.75L16.44 4.44Z"/><path d="M14.5 6.5l3 3"/></svg>'},
  {id:"pen",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m17 4.5 2.5 2.5-11 11L6 18l.5-2.5 11-11Z"/><path d="m16 5.5 2.5 2.5"/></svg>'},
  {id:"code",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 8-4 4 4 4"/><path d="m14.5 8 4 4-4 4"/></svg>'},
  {id:"braces",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 4.5H8a2.5 2.5 0 0 0-2.5 2.5v2a2 2 0 0 1-2 2h-.5"/><path d="M9.5 19.5H8a2.5 2.5 0 0 1-2.5-2.5v-2a2 2 0 0 0-2-2h-.5"/><path d="M14.5 4.5H16a2.5 2.5 0 0 1 2.5 2.5v2a2 2 0 0 0 2 2h.5"/><path d="M14.5 19.5H16a2.5 2.5 0 0 0 2.5-2.5v-2a2 2 0 0 1 2-2h.5"/></svg>'},
  {id:"music",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18.75a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Zm0 0V6.5l10-2v12.25"/><path d="M19 17a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0Z"/></svg>'},
  {id:"popcorn",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m7 9 1.2 11h7.6L17 9"/><path d="M4.5 9h15"/><path d="M8.5 9c-.5-.5-.75-1.2-.75-2a2.25 2.25 0 0 1 3.5-1.78A3 3 0 0 1 15 4.5a2.5 2.5 0 0 1 2.5 2.5c0 .68-.24 1.35-.71 1.85"/><path d="M9.5 9 10.5 20"/><path d="M14.5 9 13.5 20"/></svg>'},
  {id:"palette",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 1 8.7-6.68c-.25.93-1.18 1.43-2.12 1.43h-1.08a1.8 1.8 0 0 0-1.8 1.8c0 1-.8 1.8-1.8 1.8H12Z"/><path d="M8.25 9.75h0"/><path d="M10.5 6.75h0"/><path d="M14.25 6.75h0"/><path d="M16.5 9.75h0"/></svg>'},
  {id:"stethoscope",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v5.5a3.5 3.5 0 0 0 7 0V4"/><path d="M9.5 15a5.5 5.5 0 1 0 11 0v-2.25"/><circle cx="20.5" cy="10.5" r="1.75"/></svg>'},
  {id:"briefcase",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7.5h15a1.5 1.5 0 0 1 1.5 1.5v8.25a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25V9a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M9 7.5v-1a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 2.5 2.5v1"/><path d="M3 12h18"/><path d="M9.75 12v2.25h4.5V12"/></svg>'},
  {id:"chart",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5h16"/><path d="M7.5 16.5v-6"/><path d="M12 16.5V7.5"/><path d="M16.5 16.5V10"/></svg>'},
  {id:"dumbbell",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5h1.5v9H5zM3 9h2v6H3zM17.5 7.5H19v9h-1.5zM19 9h2v6h-2zM8 10h8v4H8z"/></svg>'},
  {id:"globe",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M12 3c-3 3-3 15 0 18"/><path d="M12 3c3 3 3 15 0 18"/></svg>'},
  {id:"airplane",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16.5 21 7.5l-7.5 12V21l-3-2.25V15L3 16.5Z"/></svg>'},
  {id:"heart",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.25s-7.5-4.5-7.5-9a4 4 0 0 1 7.02-2.4L12 9l.48-.15A4 4 0 0 1 19.5 11.25c0 4.5-7.5 9-7.5 9Z"/></svg>'},
  {id:"plant",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-6"/><path d="M9 21h6"/><path d="M12 15s0-6-5-7.5c0 4 3 5 3 5"/><path d="M12 15s0-6 5-7.5c0 4-3 5-3 5"/></svg>'},
  {id:"brain",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 7A2.5 2.5 0 1 0 6 2.5v17A2.5 2.5 0 1 0 8.5 17"/><path d="M15.5 7A2.5 2.5 0 1 1 18 2.5v17a2.5 2.5 0 1 1-2.5-2.5"/><path d="M8.5 7H12a2.5 2.5 0 1 1 0 5H9.5a2.5 2.5 0 1 0 0 5H12"/></svg>'},
  {id:"star",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4.5 2.07 4.19 4.63.68-3.35 3.27.79 4.61L12 15.9l-4.14 2.19.79-4.61-3.35-3.27 4.63-.68L12 4.5Z"/></svg>'},
  {id:"laptop",svg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="11" rx="1"/><path d="M3 19h18"/></svg>'}
];

const ICON_STAR_OUTLINE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 2.37 4.81 5.3.77-3.83 3.73.9 5.28L12 15.9l-4.74 2.49.9-5.28-3.83-3.73 5.3-.77L12 4Z"/></svg>';
const ICON_STAR_FILLED='<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.6" stroke-linejoin="round"><path d="m12 4 2.37 4.81 5.3.77-3.83 3.73.9 5.28L12 15.9l-4.74 2.49.9-5.28-3.83-3.73 5.3-.77L12 4Z"/></svg>';
const ICON_NOTE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M14 4v5h5"/><path d="M9.5 12.5h5"/><path d="M9.5 16h3.5"/><path d="m10 20 6.5-6.5 2 2L13 22h-3Z"/></svg>';
const ICON_TRASH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6.5 7 7 20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l.5-13"/></svg>';
const ICON_OPEN_WINDOW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M5 12v7a2 2 0 0 0 2 2h7"/></svg>';
const ICON_MINDMAP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="10" width="5" height="4" rx="1.2"/><path d="M8.5 12H12"/><path d="M12 12l0-5.5a2.5 2.5 0 0 1 2.5-2.5H17"/><path d="M12 12h4.5a2.5 2.5 0 0 1 2.5 2.5V18"/><circle cx="19" cy="5" r="1.8"/><circle cx="19" cy="12" r="1.8"/><circle cx="19" cy="19" r="1.8"/></svg>';

document.addEventListener("DOMContentLoaded", async()=>{
  const { tabsData=[], lastCategory=null, apiKey, customCategories=[], activeCategories=[], closeImportedTabs=false, hubImportMode, categoryMeta={}, captureMode, noteStyle, noteSupplement, generalConfig, locale, noteLanguage } =
    await chrome.storage.local.get(["tabsData","lastCategory","apiKey","customCategories","activeCategories","closeImportedTabs","hubImportMode","categoryMeta","captureMode","noteStyle","noteSupplement","generalConfig","locale","noteLanguage"]);
  await initI18n(locale);
  applyStaticI18n();
  state.tabsData=tabsData; state.lastCategory=lastCategory; state.apiConfigured=!!apiKey;
  state.customCategories=[...new Set(customCategories||[])];
  state.activeCategories=activeCategories&&activeCategories.length?activeCategories:[...state.defaultCategories];
  state.closeImportedTabs=Boolean(closeImportedTabs);
  state.hubImportMode=hubImportMode==="overwrite"?"overwrite":"append";
  state.categoryMeta=sanitizeCategoryMeta(categoryMeta);
  state.captureMode=captureMode==="firecrawl"?"firecrawl":"local";
  state.noteStyle=NOTE_STYLES[noteStyle]?noteStyle:DEFAULT_NOTE_STYLE;
  state.noteSupplement=typeof noteSupplement==="string"?noteSupplement:"";
  state.noteLanguage=noteLanguage==="en-US"?"en-US":"zh-CN";
  state.generalConfig=sanitizeGeneralConfig(generalConfig);
  updateTaskQueuesFromConfig();
  bindUI(); buildFilterOptions(); render(); toggleSpinner(false);
  chrome.runtime.sendMessage({type:"get_spinner"}, (res)=> toggleSpinner(Boolean(res&&res.on)));
  subscribe(()=>{
    applyStaticI18n();
    buildFilterOptions();
    renderNoteStyleMenu();
    syncNoteStyleUI();
    render();
    refreshSettingsI18n();
    refreshViewerChrome();
  });
});
function normalizeFirecrawlBase(base){
  const trimmed=(base||"").trim();
  if(!trimmed) return "";
  return trimmed.replace(/\/+$/,"");
}
const state={tabsData:[],lastCategory:null,query:"",filter:"all",apiConfigured:false,customCategories:[],activeCategories:[],defaultCategories:["技术","新闻","视频","学术","社交","其他"],apiSubTab:"llm",closeImportedTabs:false,settingsTab:"api",hubImportMode:"append",categoryMeta:{},captureMode:"local",noteStyle:DEFAULT_NOTE_STYLE,noteSupplement:"",noteLanguage:"zh-CN",generalConfig:{...GENERAL_CONFIG_DEFAULTS}};
let $categoryView,$tabView,$search,$filterDropdown,$filterToggle,$filterMenu,$filterLabel,$settingsBtn,$manageCatsBtn,$sideSpinner,$toast,$modal,$m_apiKey,$m_apiBase,$m_apiModel,$m_save,$m_test,$m_close,$m_status,$catsModal,$catsList,$newCatInput,$btnReAuto,$btnReAll,$btnCatsClose,$hubDropdown,$hubBtn,$hubMenu,$hubExport,$hubImport,$importFile,$settingsTabs,$settingsViewApi,$settingsViewGeneral,$settingsViewImport,$settingsViewCapture,$settingsViewHub,$importCloseToggle,$hubModeInputs,$catEditPopover,$apiSubTabs,$apiPanelLlm,$apiPanelFirecrawl,$apiSubTitle,$m_firecrawlKey,$m_firecrawlBase,$captureModeInputs,$settingsViewNote,$noteStyleDropdown,$noteStyleToggle,$noteStyleMenu,$noteStyleLabel,$noteSupplementInput,$generalTimeoutInput,$generalCaptureLimitInput,$generalAiLimitInput,$generalRetryLimitInput,$generalAiAutoToggle,$uiLangDropdown,$uiLangToggle,$uiLangMenu,$uiLangLabel,$noteLangDropdown,$noteLangToggle,$noteLangMenu,$noteLangLabel;
let activePicker=null;
let activeTrigger=null;
let activeCard=null;
const markdownBusy=new Set();
const noteBusy=new Set();
const captureSlots=new Set();
const aiSlots=new Set();
let activeCatEdit=null;
let filterMenuOpen=false;
let noteStyleMenuOpen=false;
let uiLangMenuOpen=false;
let noteLangMenuOpen=false;
let activeCategoryMindmap=null;

function sanitizeCategoryMeta(meta){
  const out={};
  if(!meta || typeof meta!=="object") return out;
  Object.entries(meta).forEach(([name,value])=>{
    if(!value || typeof value!=="object") return;
    const clean={...value};
    if(clean.icon && !getIconSvg(clean.icon)) delete clean.icon;
    Object.keys(clean).forEach(k=>{ if(clean[k]==null || clean[k]==="") delete clean[k]; });
    if(Object.keys(clean).length) out[name]=clean;
  });
  return out;
}
function getCategoryMeta(name){
  if(!name) return {};
  return (state.categoryMeta&&state.categoryMeta[name])||{};
}
// Map canonical (stored) built-in category values -> i18n key.
const DEFAULT_CATEGORY_KEYS={
  "技术":"category.tech","新闻":"category.news","视频":"category.video",
  "学术":"category.academic","社交":"category.social","其他":"category.other",
  "未分类":"category.uncategorized"
};
// Display name for a category. Built-in defaults translate with the UI locale;
// user-added (custom) categories are shown verbatim. Stored values are NOT
// changed (they remain the canonical key for grouping/filtering/migration).
function getCategoryDisplayName(cat){
  if(!cat) return tr("category.uncategorized");
  const key=DEFAULT_CATEGORY_KEYS[cat];
  return key ? tr(key) : cat;
}
// Reverse map: English default-category label (lowercased) -> Chinese canonical
// value. Used to normalize imported JSON so English labels don't get stored
// verbatim (which would stick as untranslated in both locales). Custom labels
// pass through unchanged.
const EN_CATEGORY_TO_CANONICAL={
  "tech":"技术","news":"新闻","video":"视频","academic":"学术",
  "social":"社交","other":"其他","uncategorized":"未分类"
};
function normalizeCategoryValue(raw){
  if(!raw) return raw;
  if(DEFAULT_CATEGORY_KEYS[raw]) return raw;            // already canonical (zh)
  const canon=EN_CATEGORY_TO_CANONICAL[String(raw).toLowerCase()];
  return canon || raw;                                   // custom -> as-is
}
function hexToRgb(hex){
  const value=(hex||"").replace("#","").trim();
  if(!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  const num=parseInt(value,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function deriveChipTokens(color){
  const rgb=hexToRgb(color);
  if(!rgb) return null;
  const {r,g,b}=rgb;
  return {
    bg:`rgba(${r},${g},${b},0.14)`,
    border:`rgba(${r},${g},${b},0.45)`,
    text:`rgb(${r},${g},${b})`,
    dot:`rgba(${r},${g},${b},0.8)`
  };
}

function formatTimestamp(ts){
  if(!ts) return "";
  try{
    const date=new Date(ts);
    if(Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  }catch(_){ return ""; }
}
function buildChipStyleAttr(meta){
  if(!meta||!meta.color) return "";
  const tokens=deriveChipTokens(meta.color);
  if(!tokens) return "";
  return ` style="--chip-bg:${tokens.bg};--chip-border:${tokens.border};--chip-text:${tokens.text};"`;
}
function getIconSvg(id){
  if(!id) return "";
  const entry=CATEGORY_ICONS.find(icon=>icon.id===id);
  return entry?.svg||"";
}
function getCaptureLimit(){
  return clampNumber(state.generalConfig?.captureLimit,1,10,GENERAL_CONFIG_DEFAULTS.captureLimit);
}
function getAiLimit(){
  return clampNumber(state.generalConfig?.aiLimit,1,10,GENERAL_CONFIG_DEFAULTS.aiLimit);
}
function clampNumber(value,min,max,fallback){
  const num=Number(value);
  if(Number.isFinite(num)){
    return Math.min(max,Math.max(min,num));
  }
  return fallback;
}
function sanitizeGeneralConfig(input){
  const base={...GENERAL_CONFIG_DEFAULTS};
  if(!input || typeof input!=="object") return base;
  return {
    timeoutSeconds:clampNumber(input.timeoutSeconds,1,200,base.timeoutSeconds),
    captureLimit:clampNumber(input.captureLimit,1,10,base.captureLimit),
    aiLimit:clampNumber(input.aiLimit,1,10,base.aiLimit),
    retryLimit:clampNumber(input.retryLimit,1,10,base.retryLimit),
    aiAuto:Boolean(input.aiAuto)
  };
}
function syncGeneralConfigInputs(){
  if(!$generalTimeoutInput) return;
  const cfg=state.generalConfig||GENERAL_CONFIG_DEFAULTS;
  $generalTimeoutInput.value=cfg.timeoutSeconds;
  $generalCaptureLimitInput.value=cfg.captureLimit;
  $generalAiLimitInput.value=cfg.aiLimit;
  if($generalRetryLimitInput) $generalRetryLimitInput.value=cfg.retryLimit;
  if($generalAiAutoToggle) $generalAiAutoToggle.checked=!!cfg.aiAuto;
}
function markGeneralSettingsDirty(){
  if(state.settingsTab==="general" && $m_status){
    $m_status.textContent=tr("common.save_to_apply");
  }
}
function getGeneralConfigFromInputs(){
  const timeout=clampNumber($generalTimeoutInput?.value,1,200,GENERAL_CONFIG_DEFAULTS.timeoutSeconds);
  const captureLimit=clampNumber($generalCaptureLimitInput?.value,1,10,GENERAL_CONFIG_DEFAULTS.captureLimit);
  const aiLimit=clampNumber($generalAiLimitInput?.value,1,10,GENERAL_CONFIG_DEFAULTS.aiLimit);
  const retryLimit=clampNumber($generalRetryLimitInput?.value,1,10,GENERAL_CONFIG_DEFAULTS.retryLimit);
  const aiAuto=!!($generalAiAutoToggle?.checked);
  return { timeoutSeconds:timeout, captureLimit, aiLimit, retryLimit, aiAuto };
}
const captureQueue=createTaskQueue("capture");
const aiQueue=createTaskQueue("ai");
function updateTaskQueuesFromConfig(){
  const cfg=state.generalConfig||GENERAL_CONFIG_DEFAULTS;
  updateTaskQueueConfig(captureQueue,{
    limit:cfg.captureLimit,
    timeoutMs:cfg.timeoutSeconds*1000,
    retry:cfg.retryLimit
  });
  updateTaskQueueConfig(aiQueue,{
    limit:cfg.aiLimit,
    timeoutMs:cfg.timeoutSeconds*1000,
    retry:cfg.retryLimit
  });
}
function buildChipIcon(meta){
  if(!meta||!meta.icon) return "";
  const svg=getIconSvg(meta.icon);
  if(!svg) return "";
  return `<span class="chip-icon">${svg}</span>`;
}
function positionCatEditPopover(anchor){
  if(!$catEditPopover || !anchor) return;
  const panel=$catsModal?.querySelector('.panel');
  if(!panel) return;
  const panelRect=panel.getBoundingClientRect();
  const anchorRect=anchor.getBoundingClientRect();
  const top=anchorRect.top-panelRect.top+anchor.offsetHeight+8;
  let left=anchorRect.left-panelRect.left;
  const popWidth=$catEditPopover.offsetWidth||240;
  const maxLeft=Math.max(0,panelRect.width-popWidth-12);
  if(left>maxLeft) left=maxLeft;
  if(left<0) left=0;
  $catEditPopover.style.top=`${top}px`;
  $catEditPopover.style.left=`${left}px`;
}
async function updateCategoryMetaEntry(category,updates){
  const next={...(state.categoryMeta||{})};
  if(!category){ return; }
  if(updates===null){
    delete next[category];
  }else{
    const current={...(next[category]||{})};
    const merged={...current,...updates};
    Object.keys(merged).forEach(key=>{ if(merged[key]===""||merged[key]==null) delete merged[key]; });
    if(Object.keys(merged).length) next[category]=merged; else delete next[category];
  }
  const sanitized=sanitizeCategoryMeta(next);
  state.categoryMeta=sanitized;
  await chrome.storage.local.set({categoryMeta:sanitized});
  renderCatsList();
  render();
}
async function applyCategoryColor(category,color){
  await updateCategoryMetaEntry(category,{color});
  if(activeCatEdit&&activeCatEdit.category===category) renderCatEditPopover(category);
}
async function applyCategoryIcon(category,icon){
  await updateCategoryMetaEntry(category,{icon});
  if(activeCatEdit&&activeCatEdit.category===category) renderCatEditPopover(category);
}
async function resetCategoryMeta(category){
  await updateCategoryMetaEntry(category,null);
  if(activeCatEdit&&activeCatEdit.category===category) renderCatEditPopover(category);
}
function renderCatEditPopover(category){
  if(!$catEditPopover) return;
  const meta=getCategoryMeta(category);
  const color=meta.color||"";
  const icon=meta.icon||"";
  const colorItems=CATEGORY_COLORS.map(value=>{
    const isSelected=value===color;
    const extra=isSelected?" selected":"";
    return `<button type="button" class="cat-edit-swatch${extra}" data-color="${value}" style="background:${value};"></button>`;
  }).join("");
  const iconItems=CATEGORY_ICONS.map(({id,svg})=>{
    const isSelected=id===icon;
    return `<button type="button" class="cat-edit-icon${isSelected?" selected":""}" data-icon="${id}">${svg}</button>`;
  }).join("");
  $catEditPopover.innerHTML=`
    <div class="cat-edit-header">
      <h4 class="cat-edit-title">${getCategoryDisplayName(category)}</h4>
    </div>
    <div class="cat-edit-swatch-grid">${colorItems}</div>
    <div class="cat-edit-divider"></div>
    <div class="cat-edit-icons">${iconItems}</div>
    <div class="cat-edit-actions">
      <button type="button" class="cat-edit-reset">${tr("common.reset_default")}</button>
      <span class="muted small">${tr("cats.edit_hint")}</span>
    </div>
  `;
  $catEditPopover.querySelectorAll(".cat-edit-swatch").forEach(btn=>{
    btn.addEventListener("click",()=> applyCategoryColor(category,btn.getAttribute("data-color")));
  });
  $catEditPopover.querySelectorAll(".cat-edit-icon").forEach(btn=>{
    btn.addEventListener("click",()=> applyCategoryIcon(category,btn.getAttribute("data-icon")));
  });
  const resetBtn=$catEditPopover.querySelector(".cat-edit-reset");
  if(resetBtn){
    resetBtn.addEventListener("click",()=> resetCategoryMeta(category));
  }
}
function openCatEditPopover(category,anchor){
  if(filterMenuOpen) closeFilterMenu();
  if(!$catEditPopover) return;
  if(activeCatEdit && activeCatEdit.category===category && !$catEditPopover.classList.contains("hidden")){
    closeCatEditPopover();
    return;
  }
  activeCatEdit={category,anchor};
  renderCatEditPopover(category);
  $catEditPopover.classList.remove("hidden");
  requestAnimationFrame(()=> positionCatEditPopover(anchor));
}
function closeCatEditPopover(){
  if(!$catEditPopover) return;
  $catEditPopover.classList.add("hidden");
  activeCatEdit=null;
}

function getCategoryTabsSnapshot(category){
  const target=(category||"").trim();
  const list=Array.isArray(state.tabsData)?state.tabsData:[];
  return list.filter(item=>(item?.category||"未分类")===target);
}

function closeCategoryMindmapPopover(){
  if(!activeCategoryMindmap) return;
  const { popover, svg, card, button }=activeCategoryMindmap;
  try{ destroyMindmapFromTitles(svg); }catch(err){ console.warn("destroy mindmap failed",err); }
  if(popover) popover.classList.add("hidden");
  if(card) card.classList.remove("mindmap-open");
  if(button){
    button.setAttribute("aria-expanded","false");
    button.classList.remove("loading");
    button.removeAttribute("data-busy");
  }
  activeCategoryMindmap=null;
}

function positionCategoryMindmapPopover(card, button, popover){
  if(!card||!button||!popover) return;
  const cardRect=card.getBoundingClientRect();
  const buttonRect=button.getBoundingClientRect();
  const popRect=popover.getBoundingClientRect();
  let left=buttonRect.right-cardRect.left+12;
  let top=buttonRect.top-cardRect.top-(popRect.height-buttonRect.height)/2;
  if(left+cardRect.left+popRect.width>window.innerWidth-20){
    left=buttonRect.left-cardRect.left-popRect.width-12;
  }
  if(top+cardRect.top+popRect.height>window.innerHeight-20){
    top=window.innerHeight-20-cardRect.top-popRect.height;
  }
  if(top<0) top=0;
  popover.style.left=`${Math.max(left,0)}px`;
  popover.style.top=`${top}px`;
}

async function openCategoryMindmapPopover(card, button, popover, svg, category){
  const current=category||"未分类";
  if(activeCategoryMindmap && activeCategoryMindmap.card===card){
    closeCategoryMindmapPopover();
    return;
  }
  closeCategoryMindmapPopover();
  button.classList.add("loading");
  button.setAttribute("data-busy","true");
  button.setAttribute("aria-expanded","true");
  card.classList.add("mindmap-open");
  popover.classList.remove("hidden");
  activeCategoryMindmap={ card, button, popover, svg, pending:true };
  const header=popover.querySelector(".cat-mindmap-popover-title");
  if(header) header.textContent=current;
  const meta=popover.querySelector(".cat-mindmap-popover-meta");
  const items=getCategoryTabsSnapshot(current);
  if(meta){
    meta.textContent=items.length?tr("empty.no_tabs_count",{count:items.length}):tr("empty.no_tabs");
  }
  const titles=items.map(item=>{
    const text=(item?.title||"").trim();
    if(text) return text;
    return (item?.url||"").trim()||tr("common.untitled");
  });
  try{
    await renderMindmapFromTitles(svg,{ title:current, nodes:titles });
  }catch(error){
    console.error("render mindmap failed",error);
  }
  if(button.getAttribute("data-busy")!=="true"){
    return;
  }
  positionCategoryMindmapPopover(card, button, popover);
  button.classList.remove("loading");
  button.removeAttribute("data-busy");
  activeCategoryMindmap={ card, button, popover, svg };
}
function bindUI(){
  $categoryView=document.getElementById("categoryView"); $tabView=document.getElementById("tabView");
  $search=document.getElementById("search");
  $filterDropdown=document.getElementById("filterDropdown");
  $filterToggle=document.getElementById("filterToggle");
  $filterMenu=document.getElementById("filterMenu");
  $filterLabel=document.getElementById("filterLabel");
  $settingsBtn=document.getElementById("settings"); $manageCatsBtn=document.getElementById("manageCats");
  $sideSpinner=document.getElementById("sideSpinner"); $toast=document.getElementById("toast");
  $hubDropdown=document.getElementById("hubDropdown"); $hubBtn=document.getElementById("hubBtn"); $hubMenu=document.getElementById("hubMenu"); $hubExport=document.getElementById("hubExport"); $hubImport=document.getElementById("hubImport"); $importFile=document.getElementById("importFile");
  if($hubBtn){ $hubBtn.addEventListener("click",e=>{ e.stopPropagation(); toggleHubMenu(); }); }
  if($hubMenu){ $hubMenu.addEventListener("click", e=> e.stopPropagation()); }
  if($hubExport){ $hubExport.addEventListener("click", ()=>{ closeHubMenu(); onExportTabs(); }); }
  if($hubImport){ $hubImport.addEventListener("click", ()=>{ closeHubMenu(); if($importFile){ $importFile.value=""; $importFile.click(); }}); }
  if($importFile){ $importFile.addEventListener("change", onImportFile); }
  $settingsTabs=Array.from(document.querySelectorAll(".settings-tab"));
  $settingsViewApi=document.getElementById("settingsViewApi"); $settingsViewGeneral=document.getElementById("settingsViewGeneral"); $settingsViewImport=document.getElementById("settingsViewImport");
  $settingsViewCapture=document.getElementById("settingsViewCapture");
  $settingsViewNote=document.getElementById("settingsViewNote");
  $settingsViewHub=document.getElementById("settingsViewHub");
  $apiSubTabs=Array.from(document.querySelectorAll(".api-subtab"));
  $apiPanelLlm=document.getElementById("apiPanelLlm");
  $apiPanelFirecrawl=document.getElementById("apiPanelFirecrawl");
  $apiSubTitle=document.getElementById("apiSubTitle");
  $m_firecrawlKey=document.getElementById("m_firecrawlKey");
  $m_firecrawlBase=document.getElementById("m_firecrawlBase");
  $importCloseToggle=document.getElementById("importCloseToggle");
  $hubModeInputs=Array.from(document.querySelectorAll('input[name="hubImportMode"]'));
  $captureModeInputs=Array.from(document.querySelectorAll('input[name="captureMode"]'));
  $noteStyleDropdown=document.getElementById("noteStyleDropdown");
  $noteStyleToggle=document.getElementById("noteStyleToggle");
  $noteStyleMenu=document.getElementById("noteStyleMenu");
  $noteStyleLabel=document.getElementById("noteStyleLabel");
  $noteSupplementInput=document.getElementById("noteSupplement");
  $generalTimeoutInput=document.getElementById("generalTimeout");
  $generalCaptureLimitInput=document.getElementById("generalCaptureLimit");
  $generalAiLimitInput=document.getElementById("generalAiLimit");
  $generalRetryLimitInput=document.getElementById("generalRetryLimit");
  $generalAiAutoToggle=document.getElementById("generalAiAutoToggle");
  $uiLangDropdown=document.getElementById("uiLangDropdown");
  $uiLangToggle=document.getElementById("uiLangToggle");
  $uiLangMenu=document.getElementById("uiLangMenu");
  $uiLangLabel=document.getElementById("uiLangLabel");
  $noteLangDropdown=document.getElementById("noteLangDropdown");
  $noteLangToggle=document.getElementById("noteLangToggle");
  $noteLangMenu=document.getElementById("noteLangMenu");
  $noteLangLabel=document.getElementById("noteLangLabel");
  renderLangDropdowns();
  if($settingsTabs.length){ $settingsTabs.forEach(btn=>{ btn.addEventListener("click",()=> switchSettingsTab(btn.getAttribute("data-settings-tab")||"api")); }); }
  if($apiSubTabs.length){ $apiSubTabs.forEach(btn=>{ btn.addEventListener("click",()=>{ const tab=btn.getAttribute("data-api-tab")||"llm"; switchApiSubTab(tab); }); }); }
  if($importCloseToggle){ syncImportToggle(); $importCloseToggle.addEventListener("change",()=>{ if(state.settingsTab==="import" && $m_status) $m_status.textContent=tr("common.save_to_apply"); }); }
  if($hubModeInputs.length){ syncHubModeRadios(); $hubModeInputs.forEach(input=>{ input.addEventListener("change",()=>{ if(state.settingsTab==="hub" && $m_status) $m_status.textContent=tr("common.save_to_apply"); }); }); }
  if($captureModeInputs.length){
    syncCaptureRadios();
    $captureModeInputs.forEach(input=>{
      input.addEventListener("change",()=>{
        state.captureMode=input.value==="firecrawl"?"firecrawl":"local";
        syncCaptureRadios();
        if(state.settingsTab==="capture" && $m_status) $m_status.textContent=tr("common.save_to_apply");
      });
    });
  }
  if($noteStyleToggle){
    $noteStyleToggle.addEventListener("click",e=>{
      e.stopPropagation();
      toggleNoteStyleMenu();
    });
  }
  if($noteStyleMenu){
    $noteStyleMenu.addEventListener("click",e=> e.stopPropagation());
  }
  if($noteSupplementInput){
    $noteSupplementInput.value=state.noteSupplement||"";
    $noteSupplementInput.addEventListener("input",()=>{
      state.noteSupplement=$noteSupplementInput.value;
      if(state.settingsTab==="note" && $m_status) $m_status.textContent=tr("common.save_to_apply");
    });
  }
  [$generalTimeoutInput,$generalCaptureLimitInput,$generalAiLimitInput,$generalRetryLimitInput].forEach(input=>{
    if(input){
      input.addEventListener("input",markGeneralSettingsDirty);
    }
  });
  if($generalAiAutoToggle){
    $generalAiAutoToggle.addEventListener("change",markGeneralSettingsDirty);
  }
  if($uiLangToggle){
    $uiLangToggle.addEventListener("click",e=>{
      e.stopPropagation();
      toggleUiLangMenu();
    });
  }
  if($uiLangMenu){
    $uiLangMenu.addEventListener("click",e=> e.stopPropagation());
  }
  if($noteLangToggle){
    $noteLangToggle.addEventListener("click",e=>{
      e.stopPropagation();
      toggleNoteLangMenu();
    });
  }
  if($noteLangMenu){
    $noteLangMenu.addEventListener("click",e=> e.stopPropagation());
  }
  document.addEventListener("click", onDocumentClickCloseHub);
  document.addEventListener("keydown", e=>{
    if(e.key==="Escape"){
      closeHubMenu();
      if(activePicker) closeCategoryPicker(activePicker);
      if(!$catEditPopover?.classList.contains("hidden")) closeCatEditPopover();
      if(filterMenuOpen) closeFilterMenu();
      if(noteStyleMenuOpen) closeNoteStyleMenu();
      if(uiLangMenuOpen) closeUiLangMenu();
      if(noteLangMenuOpen) closeNoteLangMenu();
      if(activeCategoryMindmap) closeCategoryMindmapPopover();
    }
  });
  window.addEventListener("resize", ()=>{
    if(activeCategoryMindmap){
      const { card, button, popover }=activeCategoryMindmap;
      positionCategoryMindmapPopover(card, button, popover);
    }
  });
  chrome.runtime.onMessage.addListener((msg)=>{
    if(!msg || typeof msg!=="object") return;
    if(msg.type==="spinner"){
      toggleSpinner(!!msg.on);
      return;
    }
    if(msg.type==="note_updated"){
      const url=typeof msg.url==="string"?msg.url:"";
      if(!url) return;
      const idx=state.tabsData.findIndex(tab=>tab.url===url);
      if(idx>=0){
        const existing=state.tabsData[idx]||{};
        const markdown=typeof msg.markdown==="string"?msg.markdown:existing.note_markd||"";
        state.tabsData[idx]={...existing,note_markd:markdown};
      }
      noteBusy.delete(url);
      render();
    }
  });
  $search.addEventListener("input",e=>{ state.query=(e.target.value||"").toLowerCase(); render(); });
  if($filterToggle){
    $filterToggle.addEventListener("click",e=>{ e.stopPropagation(); toggleFilterMenu(); });
  }
  if($filterMenu){
    $filterMenu.addEventListener("click",e=> e.stopPropagation());
    $filterMenu.addEventListener("keydown",onFilterMenuKeydown);
  }
  $modal=document.getElementById("settingsModal"); $m_apiKey=document.getElementById("m_apiKey"); $m_apiBase=document.getElementById("m_apiBase"); $m_apiModel=document.getElementById("m_apiModel"); $m_save=document.getElementById("m_save"); $m_test=document.getElementById("m_test"); $m_close=document.getElementById("m_close"); $m_status=document.getElementById("m_status");
  $settingsBtn.addEventListener("click", openSettingsModal); $m_save.addEventListener("click", onSaveMaybeClassify); $m_test.addEventListener("click", onTestConnection); $m_close.addEventListener("click", ()=> $modal.classList.add("hidden")); $modal.addEventListener("click", e=>{ if(e.target===$modal) $modal.classList.add("hidden"); });
  $catsModal=document.getElementById("catsModal"); $catsList=document.getElementById("catsList"); $newCatInput=document.getElementById("newCatInput"); $btnReAuto=document.getElementById("btnReclassAuto"); $btnReAll=document.getElementById("btnReclassAll"); $btnCatsClose=document.getElementById("closeCats");
  $catEditPopover=document.getElementById("catEditPopover");
  $manageCatsBtn.addEventListener("click", openCatsModal);
  document.getElementById("addCatBtn").addEventListener("click", addCat);
  $btnReAuto.addEventListener("click", async()=>{ const {apiKey}=await chrome.storage.local.get("apiKey"); if(!apiKey) return askApiFirst(); try{ await chrome.runtime.sendMessage({type:"reclassify_auto"});}catch{} });
  $btnReAll.addEventListener("click", async()=>{ const {apiKey}=await chrome.storage.local.get("apiKey"); if(!apiKey) return askApiFirst(); try{ await chrome.runtime.sendMessage({type:"reclassify_all"});}catch{} });
  $btnCatsClose.addEventListener("click", ()=>{ $catsModal.classList.add("hidden"); closeCatEditPopover(); }); $catsModal.addEventListener("click", e=>{ if(e.target===$catsModal){ $catsModal.classList.add("hidden"); closeCatEditPopover(); } });
  if($catEditPopover){ $catEditPopover.addEventListener("click", e=> e.stopPropagation()); }
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area!=="local") return;
    if(changes.tabsData){
      const oldArray=Array.isArray(changes.tabsData.oldValue)?changes.tabsData.oldValue:[];
      const newArray=Array.isArray(changes.tabsData.newValue)?changes.tabsData.newValue:[];
      const oldMap=new Map(oldArray.map(item=>[item?.url,item]));
      for(const item of newArray){
        const url=typeof item?.url==="string"?item.url:"";
        if(!url || !noteBusy.has(url)) continue;
        const previous=oldMap.get(url);
        const prevNote=typeof previous?.note_markd==="string"?previous.note_markd.trim():"";
        const nextNote=typeof item.note_markd==="string"?item.note_markd.trim():"";
        if(nextNote && nextNote!==prevNote){
          noteBusy.delete(url);
        }
      }
      state.tabsData=newArray;
      render();
    }
    if(changes.apiKey){
      state.apiConfigured=!!changes.apiKey.newValue;
    }
    if(changes.customCategories){
      state.customCategories=changes.customCategories.newValue||[];
    }
    if(changes.activeCategories){
      state.activeCategories=changes.activeCategories.newValue||[...state.defaultCategories];
      buildFilterOptions();
      render();
    }
    if(changes.closeImportedTabs){
      state.closeImportedTabs=!!changes.closeImportedTabs.newValue;
      syncImportToggle();
    }
    if(changes.hubImportMode){
      state.hubImportMode=changes.hubImportMode.newValue==="overwrite"?"overwrite":"append";
      syncHubModeRadios();
    }
    if(changes.captureMode){
      state.captureMode=changes.captureMode.newValue==="firecrawl"?"firecrawl":"local";
      syncCaptureRadios();
    }
    if(changes.categoryMeta){
      state.categoryMeta=sanitizeCategoryMeta(changes.categoryMeta.newValue);
      renderCatsList();
      render();
    }
    if(changes.firecrawlKey && $m_firecrawlKey){
      $m_firecrawlKey.value=changes.firecrawlKey.newValue||"";
    }
    if(changes.firecrawlBase && $m_firecrawlBase){
      $m_firecrawlBase.value=changes.firecrawlBase.newValue||"";
    }
    if(changes.noteStyle){
      state.noteStyle=NOTE_STYLES[changes.noteStyle.newValue]?changes.noteStyle.newValue:DEFAULT_NOTE_STYLE;
      syncNoteStyleUI();
    }
    if(changes.noteSupplement){
      state.noteSupplement=typeof changes.noteSupplement.newValue==="string"?changes.noteSupplement.newValue:"";
      syncNoteSupplementInput();
    }
    if(changes.generalConfig){
      state.generalConfig=sanitizeGeneralConfig(changes.generalConfig.newValue);
      updateTaskQueuesFromConfig();
      syncGeneralConfigInputs();
    }
  });
  syncNoteStyleUI();
  syncNoteSupplementInput();
  switchSettingsTab(state.settingsTab||"api");
}
function toast(msg,ms=1800){ $toast.textContent=msg; $toast.classList.add("show"); $toast.classList.remove("hidden"); setTimeout(()=> $toast.classList.remove("show"), ms); setTimeout(()=> $toast.classList.add("hidden"), ms+220); }
function askApiFirst(){ toast(tr("toast.need_api_classify")); $m_status.textContent=tr("toast.need_api_status"); }
function toggleSpinner(on){ if(on) $sideSpinner.classList.remove("hidden"); else $sideSpinner.classList.add("hidden"); }
function resolveMarkdownPayload(payload){
  if(!payload) return "";
  if(typeof payload==="string") return payload;
  if(Array.isArray(payload)){
    for(const item of payload){
      const value=resolveMarkdownPayload(item);
      if(value) return value;
    }
    return "";
  }
  if(typeof payload==="object"){
    if(typeof payload.markdown==="string" && payload.markdown) return payload.markdown;
    if(payload.data) return resolveMarkdownPayload(payload.data);
  }
  return "";
}
function showNoteOverlay(card,text=tr("common.ai_note_generating")){
  if(!card) return;
  card.classList.add("note-generating");
  let overlay=card.querySelector(".tab-note-overlay");
  if(!overlay){
    overlay=document.createElement("div");
    overlay.className="tab-note-overlay";
    overlay.innerHTML='<div class="overlay-spinner"></div><span></span>';
    card.appendChild(overlay);
  }
  const labelEl=overlay.querySelector("span");
  if(labelEl){
    labelEl.textContent=text;
  }
}
function hideNoteOverlay(card){
  if(!card) return;
  card.classList.remove("note-generating");
  const overlay=card.querySelector(".tab-note-overlay");
  if(overlay) overlay.remove();
}
async function fetchMarkdownForTab(url,button,{silent=false}={}){
  if(!url || markdownBusy.has(url)) return false;
  const index=state.tabsData.findIndex(tab=>tab.url===url);
  if(index<0){
    toast(tr("toast.tab_not_found"));
    return false;
  }
  markdownBusy.add(url);
  if(button){
    button.classList.add("loading");
    button.setAttribute("disabled","disabled");
  }
  let shouldRender=false;
  let success=false;
  try{
    // const FirecrawlCtor=await getFirecrawlCtor();
    // const options={ apiKey:firecrawlKey };
    // const base=normalizeFirecrawlBase(firecrawlBase||"");
    // if(base) options.apiUrl=base;
    // const firecrawl=new FirecrawlCtor(options);
    // const result=await firecrawl.scrape(url,{ formats:["markdown"] });
    // const markdown=resolveMarkdownPayload(result);
    const response=await chrome.runtime.sendMessage({type:"fetch_markdown",url});
    if(!response?.ok){
      throw new Error(response?.error||tr("error.capture_failed"));
    }
    const markdown=(response.markdown||"").trim();
    if(!markdown){
      throw new Error(tr("error.no_markdown"));
    }
    const current=state.tabsData[index]||{};
    state.tabsData[index]={...current, markd:markdown, note_markd:""};
    await saveTabs();
    shouldRender=true;
    if(!silent) toast(tr("toast.markdown_saved"));
    success=true;
  }catch(err){
    console.error("fetchMarkdownForTab error",err);
    const message=err && typeof err.message==="string"?err.message:String(err);
    toast(tr("toast.capture_failed",{detail:message}));
  }finally{
    markdownBusy.delete(url);
    if(button){
      button.classList.remove("loading");
      button.removeAttribute("disabled");
      const updated=state.tabsData.find(tab=>tab.url===url);
      const hasMarkdown=updated && typeof updated.markd==="string" && updated.markd.trim().length>0;
      button.classList.toggle("active",!!hasMarkdown);
    }
    if(shouldRender){
      render();
    }
  }
  return success;
}

async function generateNoteForTab(url,button,card,{silent=false}={}){
  if(!url || noteBusy.has(url)) return false;
  const index=state.tabsData.findIndex(tab=>tab.url===url);
  if(index<0){
    toast(tr("toast.tab_not_found"));
    return false;
  }
  const entry=state.tabsData[index];
  const hasMarkdown=typeof entry.markd==="string" && entry.markd.trim().length>0;
  if(!hasMarkdown){
    toast(tr("error.need_markdown"));
    return false;
  }
  noteBusy.add(url);
  let shouldRender=false;
  if(button){
    button.classList.add("loading");
    button.setAttribute("disabled","disabled");
  }
  if(card){
    showNoteOverlay(card,tr("common.ai_note_generating"));
  }
  let success=false;
  try{
    let response;
    try{
      response=await chrome.runtime.sendMessage({type:"generate_note",url});
    }catch(sendErr){
      console.error("[AI Note] generate_note message error", sendErr);
      toast(tr("toast.ai_failed_detail",{detail:sendErr?.message||sendErr||tr("common.unknown_error")}));
      return;
    }
    if(!response){
      console.error("[AI Note] generate_note no response");
      toast(tr("toast.ai_no_response"));
      return;
    }
    if(!response?.ok){
      if(response?.code==="NO_API_KEY"){
        toast(tr("error.no_api_key"));
        try{ askApiFirst(); }catch(_){}
      }else if(response?.code==="NO_MARKDOWN"){
        toast(tr("error.need_markdown"));
      }else{
        const detail=typeof response?.error==="string" && response.error.trim()
          ? response.error.trim()
          : (response?.code ? tr("common.error_code",{code:response.code}) : tr("common.unknown_error"));
        console.error("[AI Note] generate_note failed", response);
        toast(tr("toast.ai_failed_detail",{detail}));
      }
      return;
    }
    const markdown=(response.markdown||"").trim();
    if(!markdown){
      toast(tr("toast.ai_empty"));
      return;
    }
    state.tabsData[index]={...entry,note_markd:markdown};
    shouldRender=true;
    if(!silent) toast(tr("toast.ai_done"));
    success=true;
  }catch(error){
    const message=error?.message||String(error);
    console.error("[AI Note] generateNoteForTab error", error);
    toast(tr("toast.ai_failed_detail",{detail:message}));
  }finally{
    noteBusy.delete(url);
    if(button){
      button.classList.remove("loading");
      button.removeAttribute("disabled");
    }
    if(card){
      hideNoteOverlay(card);
    }
    if(shouldRender){
      render();
    }
  }
  return success;
}
function getTabEntryByUrl(url){
  if(!url) return null;
  return state.tabsData.find(tab=>tab.url===url)||null;
}
function tabHasMarkdown(entry){
  return !!(entry && typeof entry.markd==="string" && entry.markd.trim().length>0);
}
function tabHasAiNote(entry){
  return !!(entry && typeof entry.note_markd==="string" && entry.note_markd.trim().length>0);
}
function enqueueCaptureTask(url,{button=null,silent=false}={}){
  if(!url) return Promise.resolve(false);
  if(!reserveCaptureSlot(url)) return Promise.resolve(false);
  if(!ensureQueueCapacity(captureQueue,tr("label.capture"))){
    releaseCaptureSlot(url);
    return Promise.resolve(false);
  }
  return captureQueue.enqueue({
    work:async()=>{
      const ok=await fetchMarkdownForTab(url,button,{silent});
      if(!ok) throw new Error("CAPTURE_FAILED");
      return true;
    },
    onFailure:(error)=> handleQueueFailure(error,"capture"),
    onRetry:(attempt)=> handleQueueRetry(tr("label.capture"),attempt)
  }).finally(()=> releaseCaptureSlot(url));
}
function enqueueAiTask(url,{button=null,card=null,silent=false}={}){
  if(!url) return Promise.resolve(false);
  if(!reserveAiSlot(url)) return Promise.resolve(false);
  if(!ensureQueueCapacity(aiQueue,tr("label.ai"))){
    releaseAiSlot(url);
    return Promise.resolve(false);
  }
  return aiQueue.enqueue({
    work:async()=>{
      const ok=await generateNoteForTab(url,button,card,{silent});
      if(!ok) throw new Error("AI_FAILED");
      return true;
    },
    onFailure:(error)=> handleQueueFailure(error,"ai"),
    onRetry:(attempt)=> handleQueueRetry(tr("label.ai"),attempt)
  }).finally(()=> releaseAiSlot(url));
}
async function enqueueAutoAiFlow(entry,{button=null,card=null,forceCapture=false}={}){
  if(!entry || !entry.url) return false;
  const current=getTabEntryByUrl(entry.url)||entry;
  let needsCapture=forceCapture || !tabHasMarkdown(current);
  if(card && needsCapture){
    showNoteOverlay(card,tr("label.capture_md"));
  }
  if(needsCapture){
    try{
      const captured=await enqueueCaptureTask(entry.url,{button:button||null,silent:true});
      if(!captured){
        if(card) hideNoteOverlay(card);
        return false;
      }
    }catch(error){
      if(card) hideNoteOverlay(card);
      return false;
    }
  }
  if(card){
    showNoteOverlay(card,tr("common.ai_note_generating"));
  }
  try{
    const generated=await enqueueAiTask(entry.url,{button,card,silent:false});
    if(!generated && card) hideNoteOverlay(card);
    return !!generated;
  }catch(error){
    if(card) hideNoteOverlay(card);
    return false;
  }
}
function handleQueueFailure(error,type){
  if(error && error.message==="TASK_TIMEOUT"){
    const seconds=state.generalConfig?.timeoutSeconds||GENERAL_CONFIG_DEFAULTS.timeoutSeconds;
    const label=type==="capture"?tr("label.capture"):tr("label.ai");
    toast(tr("toast.task_timeout",{label,seconds}));
  }
}
function handleQueueRetry(label,attempt){
  if(attempt<=1) return;
  toast(tr("toast.task_retry",{label,attempt}));
}
function reserveCaptureSlot(url){
  const limit=getCaptureLimit();
  if(captureSlots.size>=limit && !captureSlots.has(url)){
    toast(tr("toast.capture_limit",{limit}));
    return false;
  }
  captureSlots.add(url);
  return true;
}
function releaseCaptureSlot(url){
  captureSlots.delete(url);
}
function reserveAiSlot(url){
  const limit=getAiLimit();
  if(aiSlots.size>=limit && !aiSlots.has(url)){
    toast(tr("toast.ai_limit",{limit}));
    return false;
  }
  aiSlots.add(url);
  return true;
}
function releaseAiSlot(url){
  aiSlots.delete(url);
}
const LANG_OPTIONS=[
  {value:"zh-CN",i18nKey:"lang.zh-CN"},
  {value:"en-US",i18nKey:"lang.en-US"}
];
function renderLangDropdowns(){
  renderUiLangMenu();
  renderNoteLangMenu();
}
function renderUiLangMenu(){
  syncUiLangLabel();
  if(!$uiLangMenu) return;
  $uiLangMenu.innerHTML=LANG_OPTIONS.map(({value,i18nKey})=>{
    const selected=value===getLocale();
    const activeClass=selected?" active":"";
    const check=selected?'<span class="filter-option-check">&#10003;</span>':"";
    return `<button type="button" class="filter-option${activeClass}" data-value="${value}" role="option" aria-selected="${selected}"><span class="filter-option-label">${tr(i18nKey)}</span>${check}</button>`;
  }).join("");
  $uiLangMenu.querySelectorAll(".filter-option").forEach(btn=>{
    btn.addEventListener("click",async ()=>{
      await setLocale(btn.getAttribute("data-value")||"zh-CN");
      closeUiLangMenu();
    });
  });
}
function syncUiLangLabel(){
  if(!$uiLangLabel) return;
  $uiLangLabel.textContent=tr("lang."+getLocale());
}
function renderNoteLangMenu(){
  syncNoteLangLabel();
  if(!$noteLangMenu) return;
  $noteLangMenu.innerHTML=LANG_OPTIONS.map(({value,i18nKey})=>{
    const selected=value===state.noteLanguage;
    const activeClass=selected?" active":"";
    const check=selected?'<span class="filter-option-check">&#10003;</span>':"";
    return `<button type="button" class="filter-option${activeClass}" data-value="${value}" role="option" aria-selected="${selected}"><span class="filter-option-label">${tr(i18nKey)}</span>${check}</button>`;
  }).join("");
  $noteLangMenu.querySelectorAll(".filter-option").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.noteLanguage=btn.getAttribute("data-value")==="en-US"?"en-US":"zh-CN";
      chrome.storage.local.set({noteLanguage:state.noteLanguage});
      syncNoteLangLabel();
      if(state.settingsTab==="note" && $m_status) $m_status.textContent=tr("common.save_to_apply");
      closeNoteLangMenu();
    });
  });
}
function syncNoteLangLabel(){
  if(!$noteLangLabel) return;
  $noteLangLabel.textContent=tr("lang."+state.noteLanguage);
}
function openUiLangMenu(){
  if(!$uiLangDropdown||!$uiLangMenu) return;
  if(uiLangMenuOpen) return;
  if(filterMenuOpen) closeFilterMenu();
  if(noteStyleMenuOpen) closeNoteStyleMenu();
  if(noteLangMenuOpen) closeNoteLangMenu();
  closeHubMenu();
  uiLangMenuOpen=true;
  $uiLangDropdown.classList.add("open");
  $uiLangMenu.classList.remove("hidden");
  if($uiLangToggle) $uiLangToggle.setAttribute("aria-expanded","true");
  renderUiLangMenu();
  requestAnimationFrame(()=> $uiLangMenu?.focus());
}
function closeUiLangMenu(){
  if(!$uiLangDropdown||!$uiLangMenu) return;
  if(!uiLangMenuOpen) return;
  uiLangMenuOpen=false;
  $uiLangDropdown.classList.remove("open");
  $uiLangMenu.classList.add("hidden");
  if($uiLangToggle) $uiLangToggle.setAttribute("aria-expanded","false");
}
function toggleUiLangMenu(){
  if(uiLangMenuOpen) closeUiLangMenu();
  else openUiLangMenu();
}
function openNoteLangMenu(){
  if(!$noteLangDropdown||!$noteLangMenu) return;
  if(noteLangMenuOpen) return;
  if(filterMenuOpen) closeFilterMenu();
  if(noteStyleMenuOpen) closeNoteStyleMenu();
  if(uiLangMenuOpen) closeUiLangMenu();
  closeHubMenu();
  noteLangMenuOpen=true;
  $noteLangDropdown.classList.add("open");
  $noteLangMenu.classList.remove("hidden");
  if($noteLangToggle) $noteLangToggle.setAttribute("aria-expanded","true");
  renderNoteLangMenu();
  requestAnimationFrame(()=> $noteLangMenu?.focus());
}
function closeNoteLangMenu(){
  if(!$noteLangDropdown||!$noteLangMenu) return;
  if(!noteLangMenuOpen) return;
  noteLangMenuOpen=false;
  $noteLangDropdown.classList.remove("open");
  $noteLangMenu.classList.add("hidden");
  if($noteLangToggle) $noteLangToggle.setAttribute("aria-expanded","false");
}
function toggleNoteLangMenu(){
  if(noteLangMenuOpen) closeNoteLangMenu();
  else openNoteLangMenu();
}
function refreshSettingsI18n(){
  renderLangDropdowns();
  if($apiSubTitle){
    $apiSubTitle.textContent = state.apiSubTab==="firecrawl" ? tr("settings.subtitle.firecrawl") : tr("settings.subtitle.llm");
  }
}
function syncImportToggle(){ if($importCloseToggle) $importCloseToggle.checked=!!state.closeImportedTabs; }
function syncHubModeRadios(){ if(!$hubModeInputs||!$hubModeInputs.length){ return; } const mode=state.hubImportMode==="overwrite"?"overwrite":"append"; $hubModeInputs.forEach(input=>{ input.checked=input.value===mode; }); }
function getSelectedHubMode(){ if(!$hubModeInputs||!$hubModeInputs.length) return state.hubImportMode||"append"; const current=$hubModeInputs.find(input=>input.checked); return current?(current.value==="overwrite"?"overwrite":"append"):state.hubImportMode||"append"; }
function syncCaptureRadios(){
  if(!$captureModeInputs||!$captureModeInputs.length){ return; }
  const mode=state.captureMode==="firecrawl"?"firecrawl":"local";
  $captureModeInputs.forEach(input=>{
    const checked=input.value===mode;
    input.checked=checked;
    const label=input.closest(".radio-row");
    if(label){ label.classList.toggle("selected", checked); }
  });
}
function getSelectedCaptureMode(){
  if(!$captureModeInputs||!$captureModeInputs.length) return state.captureMode||"local";
  const current=$captureModeInputs.find(input=>input.checked);
  return current?(current.value==="firecrawl"?"firecrawl":"local"):state.captureMode||"local";
}
  function switchSettingsTab(tab){
    const allowed=["api","import","capture","note","hub","general"];
    const target=allowed.includes(tab)?tab:"api";
    const previous=state.settingsTab;
    state.settingsTab=target;
    if($settingsTabs&&$settingsTabs.length){
      $settingsTabs.forEach(btn=>{
        const name=btn.getAttribute("data-settings-tab")||"api";
        btn.classList.toggle("active", name===target);
      });
    }
    if($settingsViewApi) $settingsViewApi.classList.toggle("hidden", target!=="api");
    if($settingsViewGeneral) $settingsViewGeneral.classList.toggle("hidden", target!=="general");
    if($settingsViewImport) $settingsViewImport.classList.toggle("hidden", target!=="import");
    if($settingsViewCapture) $settingsViewCapture.classList.toggle("hidden", target!=="capture");
    if($settingsViewNote) $settingsViewNote.classList.toggle("hidden", target!=="note");
    if($settingsViewHub) $settingsViewHub.classList.toggle("hidden", target!=="hub");
    if($m_test) $m_test.classList.toggle("hidden", target!=="api");
    if(target==="api") switchApiSubTab(state.apiSubTab||"llm");
    if(target==="import") syncImportToggle();
    if(target==="capture") syncCaptureRadios();
    if(target==="note"){
      syncNoteStyleUI();
      syncNoteSupplementInput();
    }else if(noteStyleMenuOpen){
      closeNoteStyleMenu();
    }
    if(target==="hub") syncHubModeRadios();
    if(target==="general") syncGeneralConfigInputs();
    if(previous!==target && $m_status) $m_status.textContent="";
  }
  function switchApiSubTab(tab){
    const allowed=["llm","firecrawl"];
    const target=allowed.includes(tab)?tab:"llm";
    state.apiSubTab=target;
    if($apiSubTabs&&$apiSubTabs.length){
      $apiSubTabs.forEach(btn=>{
        const name=btn.getAttribute("data-api-tab")||"llm";
        btn.classList.toggle("active", name===target);
      });
    }
    if($apiPanelLlm) $apiPanelLlm.classList.toggle("hidden", target!=="llm");
    if($apiPanelFirecrawl) $apiPanelFirecrawl.classList.toggle("hidden", target!=="firecrawl");
    if($apiSubTitle) $apiSubTitle.textContent=target==="llm"?tr("settings.subtitle.llm"):tr("settings.subtitle.firecrawl");
  }
function openHubMenu(){ if(filterMenuOpen) closeFilterMenu(); if($hubMenu) $hubMenu.classList.remove("hidden"); if($hubDropdown) $hubDropdown.classList.add("open"); }
function closeHubMenu(){ if($hubMenu) $hubMenu.classList.add("hidden"); if($hubDropdown) $hubDropdown.classList.remove("open"); }
function toggleHubMenu(){
  if(filterMenuOpen) closeFilterMenu();
  if(!$hubMenu) return;
  if($hubMenu.classList.contains("hidden")) openHubMenu();
  else closeHubMenu();
}
function onDocumentClickCloseHub(e){
  if(activePicker){
    const card=activePicker.closest('.tab-card');
    const trigger=card?card.querySelector('.chip-category'):null;
    if(!activePicker.contains(e.target) && !(trigger&&trigger.contains(e.target))){
      closeCategoryPicker(activePicker);
    }
  }
  if(activeCatEdit){
    const anchor=activeCatEdit.anchor;
    if(!($catEditPopover&&$catEditPopover.contains(e.target)) && !(anchor&&anchor.contains(e.target))){
      closeCatEditPopover();
    }
  }
  if(activeCategoryMindmap){
    const { card }=activeCategoryMindmap;
    if(!card || !card.contains(e.target)){
      closeCategoryMindmapPopover();
    }
  }
  if(filterMenuOpen){
    if(!($filterDropdown && $filterDropdown.contains(e.target))){
      closeFilterMenu();
    }
  }
  if(noteStyleMenuOpen){
    if(!($noteStyleDropdown && $noteStyleDropdown.contains(e.target))){
      closeNoteStyleMenu();
    }
  }
  if(uiLangMenuOpen){
    if(!($uiLangDropdown && $uiLangDropdown.contains(e.target))){
      closeUiLangMenu();
    }
  }
  if(noteLangMenuOpen){
    if(!($noteLangDropdown && $noteLangDropdown.contains(e.target))){
      closeNoteLangMenu();
    }
  }
  if(!$hubMenu || $hubMenu.classList.contains("hidden")) return;
  if(($hubBtn && $hubBtn.contains(e.target)) || ($hubMenu && $hubMenu.contains(e.target))) return;
  closeHubMenu();
}
function extractHost(url,fallback=""){ try{ return new URL(url).host||fallback; }catch(_){ return fallback; } }
function safeFileNamePart(name){ const cleaned=(name||"all").replace(/[\\/:*?"<>|]/g,"_").trim(); return cleaned||"all"; }
async function onExportTabs(){ const targetCategory=state.lastCategory; const data=Array.isArray(state.tabsData)?state.tabsData:[]; const exportList=targetCategory?data.filter(t=>(t.category||"未分类")===targetCategory):[...data]; if(!exportList.length){ toast(targetCategory?"当前分类暂无可导出的标签页":"暂无可导出的标签页"); return; } const payload=exportList.map(item=>({ title:item.title||item.url||"", url:item.url, summary:item.summary||"", category:item.category||"未分类", starred:Boolean(item.starred), ts:item.ts||Date.now(), host:item.host||extractHost(item.url), hintCategory:item.hintCategory||item.category||"未分类", markd:typeof item.markd==="string"?item.markd:"", note_markd:typeof item.note_markd==="string"?item.note_markd:"" })); const stamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]; const fileStub=safeFileNamePart(targetCategory||"all"); const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=`tab-assistant-${fileStub}-${stamp}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast(`已导出 ${payload.length} 个标签页`); }
async function onImportFile(event){
  const file=event?.target?.files?.[0];
  if(!file) return;
  try{
    const text=await file.text();
    let data;
    try{ data=JSON.parse(text); }catch(_){ throw new Error(tr("error.json_parse")); }
    if(!Array.isArray(data)) throw new Error(tr("error.json_not_array"));
    const mode=state.hubImportMode==="overwrite"?"overwrite":"append";
    const result=await mergeImportedTabs(data,mode);
    if(!result.changed){
      toast(mode==="overwrite"?tr("toast.import_empty_overwrite"):tr("toast.import_empty"));
      return;
    }
    const categoryLabel=result.category?`（${getCategoryDisplayName(result.category)}）`:"";
    let message;
    if(mode==="overwrite"){
      message=result.created?tr("toast.import_overwrote",{count:result.created}):tr("toast.overwrite_cleared");
    }else{
      const parts=[];
      if(result.created) parts.push(tr("toast.import_part_created",{count:result.created}));
      if(result.updated) parts.push(tr("toast.import_part_updated",{count:result.updated}));
      if(result.skipped) parts.push(tr("toast.import_part_skipped",{count:result.skipped}));
      if(!parts.length) parts.push(tr("empty.no_import_data"));
      message=tr("toast.import_appended",{detail:parts.join(", ")});
    }
    toast(`${message}${categoryLabel}`);
    render();
  }catch(err){
    toast(tr("toast.import_failed",{detail:err?.message||err}));
  }finally{
    if(event?.target) event.target.value="";
  }
}
async function mergeImportedTabs(items,mode){
  const importMode=mode==="overwrite"?"overwrite":"append";
  const targetCategory=state.lastCategory||"未分类";
  const existing=Array.isArray(state.tabsData)?[...state.tabsData]:[];
  const existingUrls=new Set(existing.map(item=>item.url));
  const map=importMode==="overwrite"?new Map():new Map(existing.map(item=>[item.url,item]));
  let created=0;
  let skipped=0;
  let updated=0;
  const now=Date.now();
  const defaultSet=new Set(state.defaultCategories||[]);
  const activeSet=new Set(state.activeCategories||[]);
  const customSet=new Set(state.customCategories||[]);
  let activeChanged=false;
  let customChanged=false;
  const finalCategorySet=new Set();

  for(const raw of items){
    if(!raw||typeof raw.url!=="string") continue;
    const url=raw.url.trim();
    if(!url) continue;
    const prev=map.get(url);
    const title=typeof raw.title==="string"&&raw.title.trim()?raw.title.trim():(prev?.title||url);
    const summaryRaw=typeof raw.summary==="string"?raw.summary.trim():"";
    const starredRaw=typeof raw.starred==="boolean"?raw.starred:null;
    const tsRaw=Number(raw.ts);
    const host=typeof raw.host==="string"&&raw.host.trim()?raw.host.trim():(prev?.host||extractHost(url));
    const rawCategory=typeof raw.category==="string"&&raw.category.trim()?raw.category.trim():null;
    const importedCategory=rawCategory?normalizeCategoryValue(rawCategory):null;
    const fallbackCategory=prev?.category||(importMode==="append"?targetCategory:(targetCategory||"未分类"));
    const importedHint=typeof raw.hintCategory==="string"&&raw.hintCategory.trim()?raw.hintCategory.trim():null;
    const markdRaw=typeof raw.markd==="string"?raw.markd:"";
    const noteMarkdRaw=typeof raw.note_markd==="string"?raw.note_markd:"";

    if(importMode==="append" && prev){
      let finalCategory=prev.category||"";
      let changed=false;
      if(importedCategory && importedCategory!==finalCategory){
        finalCategory=importedCategory;
        changed=true;
      }
      if(!finalCategory) finalCategory=fallbackCategory||importedCategory||"未分类";
      let nextSummary=typeof prev.summary==="string"?prev.summary:"";
      if((!nextSummary||!nextSummary.trim()) && summaryRaw){
        nextSummary=summaryRaw;
        changed=true;
      }
      let nextHint=prev.hintCategory||"";
      if(importedHint && importedHint!==nextHint){
        nextHint=importedHint;
        changed=true;
      }else if(importedCategory && !nextHint){
        nextHint=importedCategory;
        if(importedCategory!==prev.hintCategory) changed=true;
      }
      let nextHost=prev.host||"";
      if(!nextHost && host){
        nextHost=host;
        changed=true;
      }
      const tsNext=typeof prev.ts==="number"?prev.ts:(tsRaw||now);
      let nextMarkd=typeof prev.markd==="string"?prev.markd:"";
      if(markdRaw && markdRaw!==nextMarkd){
        nextMarkd=markdRaw;
        changed=true;
        if(!noteMarkdRaw) nextNoteMarkd="";
      }
      let nextNoteMarkd=typeof prev.note_markd==="string"?prev.note_markd:"";
      if(noteMarkdRaw && noteMarkdRaw!==nextNoteMarkd){
        nextNoteMarkd=noteMarkdRaw;
        changed=true;
      }
      const nextItem={
        ...prev,
        title,
        url,
        summary:nextSummary,
        category:finalCategory,
        starred:prev.starred,
        ts:tsNext,
        host:nextHost||prev.host||extractHost(url),
        hintCategory:nextHint||prev.hintCategory||finalCategory,
        markd:nextMarkd,
        note_markd:nextNoteMarkd
      };
      if(!changed){
        skipped++;
        continue;
      }
      map.set(url,nextItem);
      existingUrls.add(url);
      updated++;
      if(finalCategory){
        finalCategorySet.add(finalCategory);
        if(!activeSet.has(finalCategory)){
          activeSet.add(finalCategory);
          activeChanged=true;
        }
        if(!defaultSet.has(finalCategory) && !customSet.has(finalCategory)){
          customSet.add(finalCategory);
          customChanged=true;
        }
      }
      continue;
    }

    if(importMode==="append" && existingUrls.has(url)){
      skipped++;
      continue;
    }

    const finalCategory=importedCategory||fallbackCategory||"未分类";
    if(finalCategory){
      finalCategorySet.add(finalCategory);
      if(!activeSet.has(finalCategory)){
        activeSet.add(finalCategory);
        activeChanged=true;
      }
      if(!defaultSet.has(finalCategory) && !customSet.has(finalCategory)){
        customSet.add(finalCategory);
        customChanged=true;
      }
    }
    const hintCategory=importedHint||(prev?.hintCategory)||importedCategory||finalCategory||targetCategory;
    const starValue=prev?.starred ?? (starredRaw===null?false:starredRaw);
    const tsValue=(typeof prev?.ts==="number"?prev.ts:0)||tsRaw||now;
    const markdValue=markdRaw||(typeof prev?.markd==="string"?prev.markd:"");
    const previousNote=typeof prev?.note_markd==="string"?prev.note_markd:"";
    let noteMarkdValue=noteMarkdRaw||previousNote;
    if(markdRaw && (!prev || prev.markd!==markdRaw) && !noteMarkdRaw){
      noteMarkdValue="";
    }
    const item={...prev,title,url,summary:summaryRaw||prev?.summary||"",category:finalCategory,starred:starValue,ts:tsValue,host,hintCategory,markd:markdValue,note_markd:noteMarkdValue};
    if(importMode==="append"){ created++; existingUrls.add(url); }
    else { created++; }
    map.set(url,item);
  }

  if(activeChanged||customChanged){
    const updates={};
    if(activeChanged){
      const list=Array.from(activeSet);
      state.activeCategories=list;
      updates.activeCategories=list;
    }
    if(customChanged){
      const list=Array.from(customSet);
      state.customCategories=list;
      updates.customCategories=list;
    }
    await chrome.storage.local.set(updates);
    buildFilterOptions();
  }

  let changed=importMode==="overwrite";
  if(importMode==="append" && (created>0 || updated>0)) changed=true;

  const next=Array.from(map.values()).sort((a,b)=>(b.ts||0)-(a.ts||0));
  if(importMode==="append" && !changed) return {created:0,updated:0,skipped,category:targetCategory,changed:false,mode:importMode};

  if(importMode==="overwrite"){
    created=next.length;
    updated=0;
  }

  state.tabsData=next;
  await saveTabs();

  let lastCategoryCleared=false;
  if(state.lastCategory){
    const keep=next.some(t=>(t.category||"未分类")===state.lastCategory);
    if(!keep){
      state.lastCategory=null;
      await chrome.storage.local.remove("lastCategory");
      lastCategoryCleared=true;
    }
  }

  const categoryLabel=finalCategorySet.size===0
    ? (importMode==="overwrite"?tr("common.none"):"")
    : finalCategorySet.size===1?getCategoryDisplayName(Array.from(finalCategorySet)[0]):tr("common.multi_category");

  return {
    created,
    updated,
    skipped,
    category:categoryLabel,
    changed:true,
    mode:importMode,
    lastCategoryCleared
  };
}
function getFilterOptions(){
  const cats=[...new Set(state.activeCategories||[])];
  return [
    { value:"all", label:tr("filter.all") },
    { value:"starred", label:tr("filter.starred") },
    ...cats.map(c=>({ value:c, label:getCategoryDisplayName(c) }))
  ];
}
function updateFilterLabel(options){
  const opts=options||getFilterOptions();
  let current=opts.find(opt=>opt.value===state.filter);
  if(!current) current=opts[0];
  if(!current) return;
  if(state.filter!==current.value) state.filter=current.value;
  if($filterLabel) $filterLabel.textContent=current.label;
  if($filterToggle) $filterToggle.setAttribute("data-value",current.value);
}
function buildFilterOptions(){
  const options=getFilterOptions();
  updateFilterLabel(options);
  if(!$filterMenu) return;
  $filterMenu.innerHTML=options.map(opt=>{
    const isActive=opt.value===state.filter;
    const check=isActive?'<span class="filter-option-check">✓</span>':'';
    return `<button type="button" class="filter-option${isActive?' active':''}" data-value="${opt.value}" role="option" aria-selected="${isActive}"><span class="filter-option-label">${opt.label}</span>${check}</button>`;
  }).join("");
  $filterMenu.querySelectorAll("[data-value]").forEach(btn=>{
    btn.addEventListener("click",()=> applyFilter(btn.getAttribute("data-value")));
  });
}
async function openCategoryTabs(category){
  const target=category||"未分类";
  const source=Array.isArray(state.tabsData)?state.tabsData:[];
  const list=source.filter(tab=>(tab.category||"未分类")===target).filter(tab=>typeof tab?.url==="string"&&tab.url.trim());
  if(!list.length){
    toast(tr("toast.no_tabs_to_open"));
    return;
  }
  const urls=list.map(tab=>tab.url);
  try{
    await chrome.windows.create({url:urls});
    toast(tr("toast.opened_tabs",{count:urls.length}));
  }catch(err){
    console.error("openCategoryTabs error",err);
    toast(tr("toast.open_failed"));
  }
}
function openFilterMenu(){
  if(!$filterDropdown||!$filterMenu) return;
  filterMenuOpen=true;
  $filterDropdown.classList.add("open");
  $filterMenu.classList.remove("hidden");
  if($filterToggle) $filterToggle.setAttribute("aria-expanded","true");
  requestAnimationFrame(()=>{
    const activeBtn=$filterMenu.querySelector(".filter-option.active");
    const first=activeBtn||$filterMenu.querySelector(".filter-option");
    if(first) first.focus();
  });
}
function closeFilterMenu(){
  if(!$filterDropdown||!$filterMenu) return;
  filterMenuOpen=false;
  $filterDropdown.classList.remove("open");
  $filterMenu.classList.add("hidden");
  if($filterToggle) $filterToggle.setAttribute("aria-expanded","false");
}
function toggleFilterMenu(){
  if(filterMenuOpen){
    closeFilterMenu();
  }else{
    closeHubMenu();
    openFilterMenu();
  }
}
function getNoteStyleLabel(key){
  const meta=NOTE_STYLE_METADATA.find(item=>item.key===key);
  return meta ? tr('note_style.'+meta.key) : tr('note_style.'+DEFAULT_NOTE_STYLE);
}
function syncNoteStyleUI(){
  const key=NOTE_STYLES[state.noteStyle]?state.noteStyle:DEFAULT_NOTE_STYLE;
  state.noteStyle=key;
  if($noteStyleLabel) $noteStyleLabel.textContent=getNoteStyleLabel(key);
  if($noteStyleToggle) $noteStyleToggle.setAttribute("aria-expanded", noteStyleMenuOpen?"true":"false");
  renderNoteStyleMenu();
}
function syncNoteSupplementInput(){
  if(!$noteSupplementInput) return;
  if(document.activeElement===$noteSupplementInput) return;
  $noteSupplementInput.value=state.noteSupplement||"";
}
function renderNoteStyleMenu(){
  if(!$noteStyleMenu) return;
  const current=NOTE_STYLES[state.noteStyle]?state.noteStyle:DEFAULT_NOTE_STYLE;
  const items=NOTE_STYLE_METADATA.map(({key})=>{
    const selected=key===current;
    const activeClass=selected?" active":"";
    const check=selected?'<span class="filter-option-check">&#10003;</span>':"";
    return `<button type="button" class="filter-option${activeClass}" data-value="${key}" role="option" aria-selected="${selected}"><span class="filter-option-label">${getNoteStyleLabel(key)}</span>${check}</button>`;
  }).join("");
  if(items){
    $noteStyleMenu.innerHTML=items;
    $noteStyleMenu.querySelectorAll(".filter-option").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const value=btn.getAttribute("data-value")||DEFAULT_NOTE_STYLE;
        selectNoteStyle(value);
      });
    });
  }else{
    $noteStyleMenu.innerHTML='<div class="muted small" role="note">'+tr("empty.no_styles")+'</div>';
  }
}
function selectNoteStyle(key){
  const next=NOTE_STYLES[key]?key:DEFAULT_NOTE_STYLE;
  const changed=state.noteStyle!==next;
  state.noteStyle=next;
  syncNoteStyleUI();
  try{
    console.log("[NoteStyle]", next);
  }catch(_){}
  if(changed){
    if(state.settingsTab==="note" && $m_status) $m_status.textContent=tr("common.save_to_apply");
  }
  closeNoteStyleMenu();
}
function openNoteStyleMenu(){
  if(!$noteStyleDropdown||!$noteStyleMenu) return;
  if(noteStyleMenuOpen) return;
  if(filterMenuOpen) closeFilterMenu();
  closeHubMenu();
  noteStyleMenuOpen=true;
  $noteStyleDropdown.classList.add("open");
  $noteStyleMenu.classList.remove("hidden");
  if($noteStyleToggle) $noteStyleToggle.setAttribute("aria-expanded","true");
  renderNoteStyleMenu();
  requestAnimationFrame(()=> $noteStyleMenu?.focus());
}
function closeNoteStyleMenu(){
  if(!$noteStyleDropdown||!$noteStyleMenu) return;
  if(!noteStyleMenuOpen) return;
  noteStyleMenuOpen=false;
  $noteStyleDropdown.classList.remove("open");
  $noteStyleMenu.classList.add("hidden");
  if($noteStyleToggle) $noteStyleToggle.setAttribute("aria-expanded","false");
}
function toggleNoteStyleMenu(){
  if(noteStyleMenuOpen) closeNoteStyleMenu();
  else openNoteStyleMenu();
}
function applyFilter(value){
  state.filter=value||"all";
  buildFilterOptions();
  closeFilterMenu();
  render();
}
function onFilterMenuKeydown(e){
  if(!$filterMenu) return;
  const items=Array.from($filterMenu.querySelectorAll(".filter-option"));
  if(!items.length) return;
  const index=items.indexOf(document.activeElement);
  if(e.key==="ArrowDown"){
    e.preventDefault();
    const next=items[(index+1+items.length)%items.length];
    next.focus();
  }else if(e.key==="ArrowUp"){
    e.preventDefault();
    const prev=items[(index-1+items.length)%items.length];
    prev.focus();
  }else if(e.key==="Home"){
    e.preventDefault();
    items[0].focus();
  }else if(e.key==="End"){
    e.preventDefault();
    items[items.length-1].focus();
  }else if(e.key==="Enter"){
    e.preventDefault();
    if(document.activeElement && document.activeElement.matches(".filter-option")){
      document.activeElement.click();
    }
  }else if(e.key==="Escape"){
    e.preventDefault();
    closeFilterMenu();
    if($filterToggle) $filterToggle.focus();
  }
}
function buildPickerOptions(tab){
  const combo=[...(state.defaultCategories||[]),...(state.customCategories||[]),...(state.activeCategories||[])];
  const active=[...new Set(combo)];
  const ensure=tab.category&&active.indexOf(tab.category)===-1?[tab.category]:[];
  const list=[...new Set([...active,...ensure])];
  if(!list.length) list.push('未分类');
  const current=tab.category||'未分类';
  return list.map(cat=>{
    const isActive=cat===current;
    const meta=getCategoryMeta(cat);
    const tokens=meta.color?deriveChipTokens(meta.color):null;
    const dotStyle=tokens?` style="background:${tokens.dot};"`:"";
    const svg=meta.icon?getIconSvg(meta.icon):"";
    const icon=svg?`<span class="picker-icon">${svg}</span>`:"";
    const check=isActive?'<span class="picker-check">✓</span>':'';
    return `<button type="button" class="picker-item${isActive?' active':''}" data-cat="${cat}"><span class="picker-dot"${dotStyle}></span><div class="picker-info">${icon}<span class="picker-text">${getCategoryDisplayName(cat)}</span></div>${check}</button>`;
  }).join('');
}
function openCategoryPicker(card,picker,input,trigger){
  if(filterMenuOpen) closeFilterMenu();
  if(activePicker===picker){ closeCategoryPicker(picker); return; }
  if(activePicker) closeCategoryPicker(activePicker);
  picker.classList.remove('hidden');
  requestAnimationFrame(()=> picker.classList.add('open'));
  activePicker=picker;
  activeCard=card;
  if(activeCard) activeCard.classList.add('picker-open-card');
  activeTrigger=trigger||null;
  if(activeTrigger) activeTrigger.classList.add('chip-active');
  if(input){ input.value=''; filterPickerList(picker.querySelector('.picker-list'), ''); setTimeout(()=>input.focus(),50); }
}
function closeCategoryPicker(picker){
  if(!picker) return;
  picker.classList.remove('open');
  picker.classList.add('hidden');
  if(activePicker===picker) activePicker=null;
  const parent=picker.closest('.tab-card');
  if(parent) parent.classList.remove('picker-open-card');
  if(activeCard && activeCard!==parent) activeCard.classList.remove('picker-open-card');
  if(activeCard===parent) activeCard=null;
  if(activeTrigger){
    activeTrigger.classList.remove('chip-active');
    activeTrigger=null;
  }
}
function filterPickerList(list,keyword){
  if(!list) return;
  const term=(keyword||'').trim().toLowerCase();
  list.querySelectorAll('button[data-cat]').forEach(btn=>{
    const raw=(btn.getAttribute('data-cat')||'').toLowerCase();
    const disp=getCategoryDisplayName(btn.getAttribute('data-cat')||'').toLowerCase();
    btn.classList.toggle('hidden', term && !raw.includes(term) && !disp.includes(term));
  });
}
async function applyPickerCategory(card,url,category,picker){
  const idx=state.tabsData.findIndex(x=>x.url===url);
  if(idx<0) return;
  const current=state.tabsData[idx].category||'未分类';
  if(category===current){ closeCategoryPicker(picker); return; }
  state.tabsData[idx].category=category;
  await saveTabs();
  closeCategoryPicker(picker);
  toast(tr("toast.recategorized",{category:getCategoryDisplayName(category)}));
  render();
}
function onPickerKeydown(e,list,card,picker){
  if(!list) return;
  const items=Array.from(list.querySelectorAll('button[data-cat]:not(.hidden)'));
  if(!items.length) return;
  const focusItem=(index)=>{ const target=items[index]; if(target) target.focus(); };
  if(e.key==='ArrowDown'){
    e.preventDefault();
    const currentIndex=items.indexOf(document.activeElement);
    if(currentIndex===-1) focusItem(0); else focusItem((currentIndex+1)%items.length);
  }else if(e.key==='ArrowUp'){
    e.preventDefault();
    const currentIndex=items.indexOf(document.activeElement);
    if(currentIndex===-1) focusItem(items.length-1); else focusItem((currentIndex-1+items.length)%items.length);
  }else if(e.key==='Escape'){
    e.preventDefault();
    closeCategoryPicker(picker);
  }else if(e.key==='Enter' && document.activeElement && document.activeElement.hasAttribute('data-cat')){
    e.preventDefault();
    const cat=document.activeElement.getAttribute('data-cat');
    applyPickerCategory(card,card.getAttribute('data-url'),cat,picker);
  }
}
function applyFilters(data){ let list=[...data]; if(state.query){ const k=state.query; list=list.filter(t=>(t.title||"").toLowerCase().includes(k)||(t.summary||"").toLowerCase().includes(k)||(t.url||"").toLowerCase().includes(k)); } if(state.filter!=="all"){ if(state.filter==="starred") list=list.filter(t=>t.starred); else list=list.filter(t=>(t.category||"未分类")===state.filter); } return list; }
function groupByCategory(data){ return data.reduce((acc,t)=>{const k=t.category||"未分类";(acc[k] ||= []).push(t);return acc;},{}); }
function render(){ if(state.lastCategory){ const tabs=state.tabsData.filter(t=>(t.category||"未分类")===state.lastCategory); renderTabs(state.lastCategory,tabs); return;} renderCategories(state.tabsData); }
function renderCategories(data){
  closeCategoryMindmapPopover();
  $categoryView.classList.remove("hidden");
  $tabView.classList.add("hidden");
  $categoryView.innerHTML="";
  const list=applyFilters(data);
  const grouped=groupByCategory(list);
  const cats=Object.entries(grouped);
  if(!cats.length){
    $categoryView.innerHTML='<div class="muted">'+tr("empty.no_data_hint")+'</div>';
    return;
  }
  cats.forEach(([cat,tabs])=>{
    const card=document.createElement("div");
    card.className="cat-card";
    const preview=(tabs[0]?.title||"").slice(0,66);
    const meta=getCategoryMeta(cat);
    const badge=`<span class="chip gray"${buildChipStyleAttr(meta)}>${buildChipIcon(meta)}<span class="chip-label">${getCategoryDisplayName(cat)}</span></span>`;
    const countLabel=tr("empty.no_tabs_count",{count:tabs.length});
    card.innerHTML=`<div class="row" style="justify-content:space-between"><h3>${getCategoryDisplayName(cat)} <span class="muted">(${tabs.length})</span></h3>${badge}</div><p class="muted">${preview}</p><p class="cat-card-footer"><button type="button" class="cat-mindmap-btn" aria-label="${tr('tab.view_mindmap')}" title="${tr('tab.view_mindmap')}" aria-expanded="false">${ICON_MINDMAP}</button><span class="cat-card-count muted">${countLabel}</span></p>`;
    const mindmapBtn=card.querySelector(".cat-mindmap-btn");
    const mindmapPopover=document.createElement("div");
    mindmapPopover.className="cat-mindmap-popover hidden";
    mindmapPopover.innerHTML=`<div class="cat-mindmap-popover-header"><h4 class="cat-mindmap-popover-title">${getCategoryDisplayName(cat)}</h4><span class="cat-mindmap-popover-meta">${countLabel}</span></div><div class="cat-mindmap-popover-canvas"></div>`;
    const mindmapCanvas=mindmapPopover.querySelector(".cat-mindmap-popover-canvas");
    const mindmapSvg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    mindmapSvg.classList.add("cat-mindmap-popover-svg");
    mindmapCanvas.appendChild(mindmapSvg);
    mindmapPopover.addEventListener("click",e=> e.stopPropagation());
    if(mindmapBtn){
      mindmapBtn.addEventListener("click",(event)=>{
        event.stopPropagation();
        openCategoryMindmapPopover(card,mindmapBtn,mindmapPopover,mindmapSvg,cat);
      });
    }
    const openBtn=document.createElement("button");
    openBtn.type="button";
    openBtn.className="cat-open-btn";
    openBtn.title=tr("tab.open_all_new_window");
    openBtn.innerHTML=ICON_OPEN_WINDOW;
    openBtn.addEventListener("click",async(e)=>{
      e.stopPropagation();
      await openCategoryTabs(cat);
    });
    const proximity=70;
    card.addEventListener("mousemove",(e)=>{
      const rect=card.getBoundingClientRect();
      const offsetX=e.clientX-rect.left;
      const offsetY=e.clientY-rect.top;
      const nearRight=(rect.width-offsetX)<=proximity;
      const nearTop=offsetY<=proximity;
      if(nearRight && nearTop){
        card.classList.add("show-open-btn");
      }else if(document.activeElement!==openBtn){
        card.classList.remove("show-open-btn");
      }
    });
    card.addEventListener("mouseleave",()=>{
      if(document.activeElement!==openBtn){
        card.classList.remove("show-open-btn");
      }
    });
    openBtn.addEventListener("mouseenter",()=>{
      card.classList.add("show-open-btn");
    });
    openBtn.addEventListener("mouseleave",()=>{
      card.classList.remove("show-open-btn");
    });
    openBtn.addEventListener("focus",()=>{
      card.classList.add("show-open-btn");
    });
    openBtn.addEventListener("blur",()=>{
      card.classList.remove("show-open-btn");
    });
    card.appendChild(openBtn);
    card.appendChild(mindmapPopover);
    card.onclick=()=>{
      closeCategoryMindmapPopover();
      state.lastCategory=cat;
      chrome.storage.local.set({lastCategory:cat});
      render();
    };
    $categoryView.appendChild(card);
  });
}
// function renderTabs(category,tabs){ $tabView.classList.remove("hidden"); $categoryView.classList.add("hidden"); $tabView.innerHTML=`<button id="back" class="back btn">${tr("common.back")}</button><h2 style="margin:0 0 8px;font-size:18px">${getCategoryDisplayName(category)}</h2>`; const list=applyFilters(tabs); list.forEach(t=>{ const c=document.createElement("div"); c.className="tab-card"; const summaryHTML=t.summary?`<p class="muted line-2" style="margin:0 0 10px;">${t.summary}</p>`:""; const badge=`<span class="chip">${t.category||"未分类"}</span>`; const manualSelect=`<select class="cat-select hidden select" style="height:30px;">${state.activeCategories.map(x=>`<option value="${x}" ${x===(t.category||"未分类")?"selected":""}>${x}</option>`).join("")}</select>`; const adjustBtn=`<button class="btn btn-change" style="height:30px;">调整分类</button>`; c.innerHTML=`<a href="${t.url}" target="_blank" class="title line-2">${t.title||t.url}</a>${summaryHTML}<div class="row"><div class="cat-area">${badge}${manualSelect}${adjustBtn}</div><div class="row" style="margin-left:auto;"><button class="btn btn-star">${t.starred?"★ 已收藏":"☆ 收藏"}</button><button class="btn danger btn-delete">🗑 删除</button></div></div>`; const $sel=c.querySelector(".cat-select"); const $btn=c.querySelector(".btn-change"); $btn.addEventListener("click",()=>{ $sel.classList.toggle("hidden"); if(!$sel.classList.contains("hidden")) $sel.focus(); }); $sel.addEventListener("change",async e=>{ const val=e.target.value; const idx=state.tabsData.findIndex(x=>x.url===t.url); if(idx>=0){ state.tabsData[idx].category=val; await saveTabs(); $sel.classList.add("hidden"); render(); }}); $sel.addEventListener("blur",()=> $sel.classList.add("hidden")); c.querySelector(".btn-star").addEventListener("click",async()=>{ const idx=state.tabsData.findIndex(x=>x.url===t.url); if(idx>=0){ state.tabsData[idx].starred=!state.tabsData[idx].starred; await saveTabs(); render(); }}); c.querySelector(".btn-delete").addEventListener("click",async()=>{ state.tabsData=state.tabsData.filter(x=>x.url!==t.url); await saveTabs(); render(); }); $tabView.appendChild(c); }); document.getElementById("back").onclick=async()=>{ state.lastCategory=null; await chrome.storage.local.remove("lastCategory"); render(); }; }
function renderTabs(category,tabs){
  $tabView.classList.remove("hidden");
  $categoryView.classList.add("hidden");
  activePicker=null;
  activeTrigger=null;
  activeCard=null;
  $tabView.innerHTML=`<button id="back" class="back btn">${tr("common.back")}</button><h2 style="margin:0 0 8px;font-size:18px">${getCategoryDisplayName(category)}</h2>`;
  const list=applyFilters(tabs);
  list.forEach(t=>{
    const c=document.createElement("div");
    c.className="tab-card";
    c.setAttribute("data-url",t.url);
    const summaryText=(t.summary||"").trim();
    const summaryHTML=summaryText?`<p class="tab-summary line-2">${summaryText}</p>`:"";
    const catValue=t.category||"未分类";
    const catLabel=getCategoryDisplayName(catValue);
    const meta=getCategoryMeta(catValue);
    const badge=`<button class="chip chip-category" type="button"${buildChipStyleAttr(meta)}>${buildChipIcon(meta)}<span class="chip-label">${catLabel}</span></button>`;
    const pickerItems=buildPickerOptions(t);
    const categoryControl=`<span class="tab-meta-category cat-area">${badge}<div class="picker-panel hidden" data-picker tabindex="-1"><div class="picker-shell"><div class="picker-header"><div><span class="picker-label">${tr('tab.current_category')}</span><span class="picker-current">${getCategoryDisplayName(t.category||"未分类")}</span></div><button class="picker-close" type="button">×</button></div><div class="picker-body"><div class="picker-search"><input class="input picker-input" type="text" placeholder="${tr('tab.search_categories')}"></div><div class="picker-list">${pickerItems}</div></div><div class="picker-footer"><button class="btn-link" type="button" data-manage>${tr('tab.manage_categories')}</button></div></div></div></div></span>`;
    const hostLabel=t.host||extractHost(t.url||"","");
    const timeLabel=t.ts?formatTimestamp(t.ts):"";
    const metaPieces=[];
    if(hostLabel) metaPieces.push(`<span class="tab-meta-pill">${hostLabel}</span>`);
    if(timeLabel) metaPieces.push(`<span class="tab-meta-pill">${timeLabel}</span>`);
    metaPieces.push(categoryControl);
    const isStarred=!!t.starred;
    const favIcon=isStarred?ICON_STAR_FILLED:ICON_STAR_OUTLINE;
    const favLabel=isStarred?tr("fav.unstar"):tr("fav.star");
    const hasMarkdown=typeof t.markd==="string"&&t.markd.trim().length>0;
    const isCapturing=markdownBusy.has(t.url);
    const hasNote=typeof t.note_markd==="string"&&t.note_markd.trim().length>0;
    const noteClassList=["action-icon-btn","action-icon-btn-note"];
    if(hasNote){
      noteClassList.push("has-ainote");
    }else if(hasMarkdown){
      noteClassList.push("has-markd");
    }
    if(isCapturing) noteClassList.push("loading");
    const noteBtnClass=noteClassList.join(" ");
    const noteTitle=hasMarkdown?tr("tab.view_md_shift"):tr("tab.capture_md");
    const noteSr=hasMarkdown?tr("tab.view_md_preview"):tr("tab.capture_md");
    const isNoteGenerating=noteBusy.has(t.url);
    const aiClassList=["action-pill-btn","ai-note-btn"];
    if(hasNote) aiClassList.push("ai-note-btn--done");
    if(hasNote) aiClassList.push("active");
    if(isNoteGenerating) aiClassList.push("loading");
    const aiBtnClass=aiClassList.join(" ");
    const aiTitle=hasNote?tr("tab.view_ai_shift"):tr("tab.gen_ai_note");
    const aiLabel=hasNote?tr("tab.view_ai_note"):tr("viewer.tab_ai_note");
    const actionsHTML=`<div class="tab-actions">
      <button type="button" class="${aiBtnClass}" data-role="ai-note" title="${aiTitle}">
        <span>${aiLabel}</span>
      </button>
      <button type="button" class="${noteBtnClass}" data-role="markd" title="${noteTitle}">
        <span class="action-icon">${ICON_NOTE}</span>
        <span class="sr-only">${noteSr}</span>
      </button>
      <button type="button" class="action-icon-btn action-icon-btn-fav${isStarred?" active":""}" data-role="favorite" title="${tr("fav.star")}">
        <span class="action-icon">${favIcon}</span>
        <span class="sr-only">${favLabel}</span>
      </button>
      <button type="button" class="action-icon-btn action-icon-btn-danger" data-role="delete" title="${tr("tab.delete")}">
        <span class="action-icon">${ICON_TRASH}</span>
        <span class="sr-only">${tr("tab.delete")}</span>
      </button>
    </div>`;
    const metaItemsHTML=metaPieces.length?metaPieces.join('<span class="tab-meta-sep">·</span>'):"";
    const metaHTML=`<div class="tab-meta-row"><div class="tab-meta-info">${metaItemsHTML}</div>${actionsHTML}</div>`;
    c.innerHTML=`<div class="tab-top"><div class="tab-heading"><a href="${t.url}" target="_blank" class="title line-2">${t.title||t.url}</a></div></div>${summaryHTML}<div class="tab-bottom">${metaHTML}</div>`;
    const $picker=c.querySelector('[data-picker]');
    const $categoryBtn=c.querySelector('.chip-category');
    const $closeBtn=c.querySelector('.picker-close');
    const $search=c.querySelector('.picker-input');
    const $list=c.querySelector('.picker-list');
    $categoryBtn.addEventListener('click',()=> openCategoryPicker(c,$picker,$search,$categoryBtn));
    $closeBtn.addEventListener('click',()=> closeCategoryPicker($picker));
    $picker.addEventListener('keydown',e=>onPickerKeydown(e,$list,c,$picker));
    $search.addEventListener('input',()=> filterPickerList($list,$search.value));
    $list.querySelectorAll('button[data-cat]').forEach(btn=>{
      btn.addEventListener('click',()=> applyPickerCategory(c,t.url,btn.getAttribute('data-cat'),$picker));
    });
    const manageBtn=c.querySelector('button[data-manage]');
    manageBtn.addEventListener('click',()=>{ closeCategoryPicker($picker); openCatsModal(); });
    const favBtn=c.querySelector('[data-role="favorite"]');
    const delBtn=c.querySelector('[data-role="delete"]');
    const markdBtn=c.querySelector('[data-role="markd"]');
    const aiBtn=c.querySelector('[data-role="ai-note"]');
    if(isNoteGenerating){
      c.classList.add("note-generating");
      if(aiBtn) aiBtn.setAttribute("disabled","disabled");
      const overlay=document.createElement("div");
      overlay.className="tab-note-overlay";
      overlay.innerHTML=`<div class="overlay-spinner"></div><span>${tr("common.ai_note_generating")}</span>`;
      c.appendChild(overlay);
    }
    if(markdBtn){
      if(isCapturing){
        markdBtn.setAttribute("disabled","disabled");
      }
      markdBtn.addEventListener('click',(event)=>{
        const idx=state.tabsData.findIndex(x=>x.url===t.url);
        const entry=idx>=0?state.tabsData[idx]:null;
        const hasMark=tabHasMarkdown(entry);
        const requestRefresh=event.shiftKey||event.metaKey||event.ctrlKey||event.altKey;
        if(hasMark && !requestRefresh){
          const reference=typeof entry.markd==="string"?entry.markd:"";
          const aiNote=typeof entry.note_markd==="string"?entry.note_markd:"";
          openMarkdownViewer({
            title:entry.title||entry.url||"Markdown",
            markdown:reference,
            aiMarkdown:aiNote
          }).catch(err=>{
            if(err&&err.message!=="EMPTY_MARKDOWN") toast(tr("toast.preview_failed",{detail:err.message||err}));
          });
          return;
        }
        enqueueCaptureTask(t.url,{button:markdBtn}).catch(()=>{});
      });
    }
    if(aiBtn){
      if(!isNoteGenerating){
        aiBtn.removeAttribute("disabled");
      }
      aiBtn.addEventListener('click',(event)=>{
        const idx=state.tabsData.findIndex(x=>x.url===t.url);
        const entry=idx>=0?state.tabsData[idx]:null;
        const noteAvailable=tabHasAiNote(entry);
        const hasMarkdown=tabHasMarkdown(entry);
        const requestRefresh=event.shiftKey||event.metaKey||event.ctrlKey||event.altKey;
        if(noteAvailable && !requestRefresh){
          const reference=typeof entry.markd==="string"?entry.markd:"";
          const aiNote=typeof entry.note_markd==="string"?entry.note_markd:"";
          openMarkdownViewer({
            title:entry.title||entry.url||tr("viewer.tab_ai_note"),
            markdown:reference,
            aiMarkdown:aiNote,
            source:"ai"
          }).catch(err=>{
            if(err&&err.message!=="EMPTY_MARKDOWN") toast(tr("toast.preview_failed",{detail:err.message||err}));
          });
          return;
        }
        if(state.generalConfig?.aiAuto){
          enqueueAutoAiFlow(entry,{button:aiBtn,card:c,forceCapture:requestRefresh}).catch(()=>{});
          return;
        }
        if(!hasMarkdown){
          toast(tr("error.need_markdown"));
          return;
        }
        enqueueAiTask(t.url,{button:aiBtn,card:c}).catch(()=>{});
      });
    }
    favBtn.addEventListener('click',async()=>{
      const idx=state.tabsData.findIndex(x=>x.url===t.url);
      if(idx>=0){
        state.tabsData[idx].starred=!state.tabsData[idx].starred;
        await saveTabs();
        render();
      }
    });
    delBtn.addEventListener('click',async()=>{
      state.tabsData=state.tabsData.filter(x=>x.url!==t.url);
      await saveTabs();
      render();
    });
    $tabView.appendChild(c);
  });
  document.getElementById('back').onclick=async()=>{
    state.lastCategory=null;
    await chrome.storage.local.remove('lastCategory');
    render();
  };
}
async function openSettingsModal(){
  const {
    apiKey,
    apiBase,
    apiModel,
    firecrawlKey = "",
    firecrawlBase = "",
    closeImportedTabs = false,
    hubImportMode,
    captureMode,
    noteStyle,
    noteSupplement
  } = await chrome.storage.local.get([
    "apiKey",
    "apiBase",
    "apiModel",
    "firecrawlKey",
    "firecrawlBase",
    "closeImportedTabs",
    "hubImportMode",
    "captureMode",
    "noteStyle",
    "noteSupplement"
  ]);
  $m_apiKey.value=apiKey||"";
  $m_apiBase.value=apiBase||"";
  $m_apiModel.value=apiModel||"gpt-4o-mini";
  if($m_firecrawlKey) $m_firecrawlKey.value=firecrawlKey||"";
  if($m_firecrawlBase) $m_firecrawlBase.value=firecrawlBase||"";
  state.closeImportedTabs=Boolean(closeImportedTabs);
  state.hubImportMode=hubImportMode==="overwrite"?"overwrite":"append";
  state.captureMode=captureMode==="firecrawl"?"firecrawl":"local";
  state.noteStyle=NOTE_STYLES[noteStyle]?noteStyle:DEFAULT_NOTE_STYLE;
  state.noteSupplement=typeof noteSupplement==="string"?noteSupplement:"";
  syncImportToggle();
  syncHubModeRadios();
  syncCaptureRadios();
  syncNoteStyleUI();
  syncNoteSupplementInput();
  syncGeneralConfigInputs();
  state.settingsTab="api";
  state.apiSubTab="llm";
  switchSettingsTab(state.settingsTab);
  if(noteStyleMenuOpen) closeNoteStyleMenu();
  if($m_status) $m_status.textContent="";
  $modal.classList.remove("hidden");
}
async function onSaveMaybeClassify(){
  if(state.settingsTab==="capture"){
    const value=getSelectedCaptureMode();
    state.captureMode=value;
    await chrome.storage.local.set({captureMode:value});
    const label=value==="firecrawl"?tr("label.firecrawl_capture"):tr("label.local_capture");
    if($m_status) $m_status.textContent=tr("status.saved_strategy",{label});
    toast(tr("toast.capture_mode_set",{label}));
    return;
  }
  if(state.settingsTab==="note"){
    const style=NOTE_STYLES[state.noteStyle]?state.noteStyle:DEFAULT_NOTE_STYLE;
    const supplementInput=$noteSupplementInput?$noteSupplementInput.value:state.noteSupplement;
    const supplement=typeof supplementInput==="string"?supplementInput.trim():"";
    state.noteStyle=style;
    state.noteSupplement=supplement;
    await chrome.storage.local.set({noteStyle:style,noteSupplement:supplement});
    syncNoteStyleUI();
    syncNoteSupplementInput();
    if($m_status) $m_status.textContent=tr("toast.note_settings_saved");
    toast(tr("toast.note_settings_saved"));
    return;
  }
  if(state.settingsTab==="import"){
    const value=!!($importCloseToggle&&$importCloseToggle.checked);
    state.closeImportedTabs=value;
    await chrome.storage.local.set({closeImportedTabs:value});
    if($m_status) $m_status.textContent=tr("toast.import_settings_saved");
    toast(tr("toast.import_settings_saved"));
    return;
  }
  if(state.settingsTab==="hub"){
    const value=getSelectedHubMode();
    state.hubImportMode=value;
    await chrome.storage.local.set({hubImportMode:value});
    const label=value==="overwrite"?tr("label.overwrite"):tr("label.append");
    if($m_status) $m_status.textContent=tr("status.saved_hub_mode",{label});
    toast(tr("toast.hub_mode_set",{label}));
    return;
  }
  if(state.settingsTab==="general"){
    const config=getGeneralConfigFromInputs();
    state.generalConfig=config;
    await chrome.storage.local.set({generalConfig:config});
    updateTaskQueuesFromConfig();
    syncGeneralConfigInputs();
    if($m_status) $m_status.textContent=tr("toast.general_saved");
    toast(tr("toast.general_saved"));
    return;
  }
  if(state.apiSubTab==="firecrawl"){
    const fcKey=($m_firecrawlKey?.value||"").trim();
    const fcBase=normalizeFirecrawlBase($m_firecrawlBase?.value||"");
    await chrome.storage.local.set({firecrawlKey:fcKey,firecrawlBase:fcBase});
    if($m_status) $m_status.textContent=tr("toast.firecrawl_saved");
    toast(tr("toast.firecrawl_saved"));
    return;
  }
  const apiKey=($m_apiKey.value||"").trim();
  const apiBase=($m_apiBase.value||"").trim();
  const apiModel=($m_apiModel.value||"gpt-4o-mini").trim();
  await chrome.storage.local.set({apiKey,apiBase,apiModel});
  state.apiConfigured=!!apiKey;
  if($m_status) $m_status.textContent=tr("toast.api_saved");
  toast(tr("toast.api_saved"));
}
async function onTestConnection(){
  if(state.settingsTab!=="api"){
    if($m_status) $m_status.textContent=tr("status.switch_api_tab");
    return;
  }
  if(state.apiSubTab==="firecrawl"){
    const key=($m_firecrawlKey?.value||"").trim();
    const base=normalizeFirecrawlBase($m_firecrawlBase?.value||"");
    if(!key){
      if($m_status) $m_status.textContent=tr("status.need_firecrawl_key");
      toast(tr("toast.need_firecrawl_key"));
      return;
    }
    if($m_status) $m_status.textContent=tr("status.firecrawl_testing");
    try{
      const res=await chrome.runtime.sendMessage({type:"test_firecrawl", apiKey:key, apiBase:base});
      if(res?.ok){
        if($m_status) $m_status.textContent=tr("status.firecrawl_ok");
      }else{
        const errMsg=res?.error||tr("common.unknown_error");
        if($m_status) $m_status.textContent=tr("status.failed_detail",{detail:errMsg});
        toast(tr("toast.firecrawl_test_failed",{detail:errMsg}));
      }
    }catch(e){
      const err=e?.message||String(e);
      if($m_status) $m_status.textContent=tr("status.failed_detail",{detail:err});
      toast(tr("toast.firecrawl_test_failed",{detail:err}));
    }
    return;
  }
  if($m_status) $m_status.textContent=tr("status.testing");
  try{
    const base=($m_apiBase.value.trim()||"https://api.openai.com/v1").replace(/\/+$/,"");
    const key=$m_apiKey.value.trim();
    const ok1=await withTimeout(signal=>fetch(`${base}/models`,{headers:{Authorization:`Bearer ${key}`},signal}));
    if(ok1.ok){
      if($m_status) $m_status.textContent=tr("status.models_ok");
      return;
    }
  }catch(_){ /* ignore */ }
  try{
    const base=($m_apiBase.value.trim()||"https://api.openai.com/v1").replace(/\/+$/,"");
    const key=$m_apiKey.value.trim();
    const res=await withTimeout(signal=>fetch(`${base}/chat/completions`,{method:"POST",signal,headers:{"Content-Type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({model:($m_apiModel.value.trim()||"gpt-4o-mini"),messages:[{role:"user",content:"ping"}],max_tokens:1})}));
    if($m_status) $m_status.textContent=res.ok?tr("status.chat_ok"):tr("status.failed");
  }catch(e){
    if($m_status) $m_status.textContent=tr("status.failed_detail",{detail:e?.message||e});
  }
}
async function withTimeout(factory,ms=15000){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms); try{ const r=await factory(c.signal); clearTimeout(t); return r; }catch(e){ clearTimeout(t); throw e; } }
async function openCatsModal(){
  if(filterMenuOpen) closeFilterMenu();
  const {customCategories=[],activeCategories=[],categoryMeta={}}=await chrome.storage.local.get(["customCategories","activeCategories","categoryMeta"]);
  state.customCategories=[...new Set(customCategories||[])];
  state.activeCategories=activeCategories&&activeCategories.length?activeCategories:[...state.defaultCategories];
  state.categoryMeta=sanitizeCategoryMeta(categoryMeta);
  renderCatsList();
  $catsModal.classList.remove("hidden");
}
function renderCatsList(){
  const cats=[...new Set(state.activeCategories||[])];
  if(!cats.length){
    $catsList.innerHTML="<span class='muted'>"+tr("empty.no_active_cats")+"</span>";
    return;
  }
  $catsList.innerHTML=cats.map(c=>{
    const deletable=c!=="其他";
    const meta=getCategoryMeta(c);
    const styleAttr=buildChipStyleAttr(meta);
    const iconHtml=buildChipIcon(meta);
    const deleteButton=deletable?`<button data-del="${c}" class="xbtn">×</button>`:"";
    return `<span class="chip ghost cat-manage-chip" data-cat="${c}"${styleAttr}>${iconHtml}<span class="chip-label">${getCategoryDisplayName(c)}</span>${deleteButton}</span>`;
  }).join("");
  $catsList.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click",async(e)=>{
      e.stopPropagation();
      const name=e.currentTarget.getAttribute("data-del");
      const next=(state.activeCategories||[]).filter(x=>x!==name);
      const updates={};
      state.activeCategories=next;
      updates.activeCategories=next;
      if(Array.isArray(state.customCategories) && state.customCategories.includes(name)){
        const customNext=state.customCategories.filter(x=>x!==name);
        state.customCategories=customNext;
        updates.customCategories=customNext;
      }
      if(state.tabsData?.length){
        state.tabsData=state.tabsData.map(t=>t.category===name?{...t,category:"其他"}:t);
        updates.tabsData=state.tabsData;
      }
      if(state.categoryMeta && state.categoryMeta[name]){
        const metaCopy={...state.categoryMeta};
        delete metaCopy[name];
        state.categoryMeta=metaCopy;
        updates.categoryMeta=metaCopy;
      }
      await chrome.storage.local.set(updates);
      if(activeCatEdit && activeCatEdit.category===name) closeCatEditPopover();
      buildFilterOptions();
      renderCatsList();
      render();
    });
  });
  $catsList.querySelectorAll(".cat-manage-chip").forEach(chip=>{
    chip.addEventListener("click",e=>{
      if(e.target.closest("button[data-del]")) return;
      const name=chip.getAttribute("data-cat");
      openCatEditPopover(name,chip);
    });
  });
  if(activeCatEdit){
    const anchor=$catsList.querySelector(`.cat-manage-chip[data-cat="${activeCatEdit.category}"]`);
    if(anchor){
      activeCatEdit.anchor=anchor;
      if(!$catEditPopover.classList.contains("hidden")) positionCatEditPopover(anchor);
    }else{
      closeCatEditPopover();
    }
  }
}
async function addCat(){ const name=($newCatInput.value||"").trim(); if(!name) return; const cus=[...new Set([...(state.customCategories||[]),name])]; const act=[...new Set([...(state.activeCategories||[]),name])]; state.customCategories=cus; state.activeCategories=act; await chrome.storage.local.set({customCategories:cus,activeCategories:act}); $newCatInput.value=""; buildFilterOptions(); renderCatsList(); render(); }
async function saveTabs(){ await chrome.storage.local.set({tabsData:state.tabsData}); }
function createTaskQueue(kind){
  return {
    kind,
    limit:1,
    timeoutMs:GENERAL_CONFIG_DEFAULTS.timeoutSeconds*1000,
    retry:GENERAL_CONFIG_DEFAULTS.retryLimit,
    running:0,
    queue:[],
    enqueue(task){
      return new Promise((resolve,reject)=>{
        this.queue.push({task,resolve,reject,attempts:0});
        this.drain();
      });
    },
    drain(){
      while(this.running<this.limit && this.queue.length){
        const job=this.queue.shift();
        this.running++;
        runQueueJob(this,job);
      }
    }
  };
}
function runQueueJob(queue,job){
  const { task }=job;
  job.attempts++;
  task.onStart?.(job.attempts);
  const workPromise=Promise.resolve().then(()=>task.work(job.attempts));
  withTaskTimeout(workPromise,queue.timeoutMs)
    .then(result=>{
      task.onSuccess?.(result,job.attempts);
      job.resolve(result);
    })
    .catch(err=>{
      const shouldRetry=job.attempts<queue.retry;
      if(shouldRetry){
        task.onRetry?.(job.attempts,err);
        queue.queue.push(job);
      }else{
        task.onFailure?.(err,job.attempts);
        job.reject(err);
      }
    })
    .finally(()=>{
      queue.running--;
      queue.drain();
    });
}
function withTaskTimeout(promise,ms){
  const timeout=Math.max(ms||GENERAL_CONFIG_DEFAULTS.timeoutSeconds*1000,1000);
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error("TASK_TIMEOUT")),timeout);
    promise.then(value=>{
      clearTimeout(timer);
      resolve(value);
    }).catch(err=>{
      clearTimeout(timer);
      reject(err);
    });
  });
}
function updateTaskQueueConfig(queue,{limit,timeoutMs,retry}){
  if(typeof limit==="number" && limit>0) queue.limit=limit;
  if(typeof timeoutMs==="number" && timeoutMs>0) queue.timeoutMs=timeoutMs;
  if(typeof retry==="number" && retry>0) queue.retry=retry;
  queue.drain();
}
function ensureQueueCapacity(queue,label){
  const limit=queue.limit||1;
  const pending=queue.running+queue.queue.length;
  if(pending>=limit){
    toast(tr("toast.queue_full",{label}));
    return false;
  }
  return true;
}
