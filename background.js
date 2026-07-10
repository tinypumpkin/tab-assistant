
import FirecrawlModule, { Firecrawl as FirecrawlNamed, FirecrawlClient as FirecrawlClientNamed } from "./vendor/firecrawl.js";
import { classifyAndSummarize, generateAIMarkdownNote } from "./api.js";
import { translate, normalizeLocale, DEFAULT_LOCALE } from "./shared-i18n.js";

// Background-side locale: cached from storage and kept fresh via onChanged.
let bgLocale = DEFAULT_LOCALE;
async function refreshBgLocale(){
  try{ const { locale }=await chrome.storage.local.get("locale"); bgLocale=normalizeLocale(locale); }catch(_){}
}
function t(key, params){ return translate(bgLocale, key, params); }
refreshBgLocale();
let spinnerOn=false;
function setSpinner(on){
  spinnerOn=!!on;
  try{
    const ret=chrome.runtime.sendMessage({type:"spinner",on:spinnerOn});
    if(ret&&ret.catch) ret.catch(()=>{});
  }catch(_){ try{ chrome.runtime.sendMessage({type:"spinner",on:spinnerOn},()=>void chrome.runtime.lastError); }catch(_e){} }
}
chrome.runtime.onMessage.addListener((msg,_,sendResponse)=>{
  if(msg?.type==="get_spinner"){ sendResponse({on:spinnerOn}); return; }
  if(msg?.type==="reclassify_auto" || msg?.type==="reclassify_all"){
    (async()=>{
      try{
        const { tabsData=[] }=await chrome.storage.local.get("tabsData");
        const pick = msg.type==="reclassify_all" ? tabsData : tabsData.filter(t=>t.category==="未分类"||t.category==="其他");
        if(!pick.length) return sendResponse({ok:true,updated:0});
        const result=await withAIWait(async()=>{
          const out=await classifyAndSummarize(pick);
          const m=new Map(tabsData.map(x=>[x.url,x]));
          out.forEach(r=>{ const old=m.get(r.url)||{}; m.set(r.url,{...old,...r,starred:old.starred||false,ts:old.ts||Date.now()}); });
          await chrome.storage.local.set({tabsData:Array.from(m.values())});
          return out;
        });
        sendResponse({ok:true,updated:result.length});
      }catch(e){ sendResponse({ok:false,error:e?.message||String(e)}) }
    })();
    return true;
  }
  if(msg?.type==="fetch_markdown"){
    (async()=>{
      try{
        const { captureMode }=await chrome.storage.local.get("captureMode");
        const mode=captureMode==="firecrawl"?"firecrawl":"local";
        const data=mode==="firecrawl"
          ? await fetchMarkdownViaFirecrawl(msg.url)
          : await captureMarkdownInBackground(msg.url);
        sendResponse({ok:true,markdown:data.markdown||"",title:data.title||""});
      }catch(error){
        sendResponse({ok:false,error:error?.message||String(error)});
      }
    })();
    return true;
  }
  if(msg?.type==="generate_note"){
    (async()=>{
      try{
        const url=typeof msg.url==="string"?msg.url:"";
        if(!url) throw new Error(t("error.invalid_url"));
        console.log("[AI Note] generate_note received", url);
        const { tabsData=[] }=await chrome.storage.local.get("tabsData");
        const list=Array.isArray(tabsData)?tabsData:[];
        const entry=list.find(item=>item?.url===url);
        if(!entry) throw new Error(t("error.tab_not_found"));
        const note=await generateAIMarkdownNote(entry);
        const latestRaw=await chrome.storage.local.get("tabsData");
        const latestList=Array.isArray(latestRaw?.tabsData)?latestRaw.tabsData:[];
        const mergedMap=new Map(latestList.map(item=>[item.url,item]));
        const current=mergedMap.get(url)||{};
        const mergedEntry={...entry,...current,note_markd:note};
        mergedMap.set(url,mergedEntry);
        await chrome.storage.local.set({tabsData:Array.from(mergedMap.values())});
        try{ chrome.runtime.sendMessage({type:"note_updated",url,markdown:note}); }catch(_sendErr){}
        console.log("[AI Note] generate_note success", url);
        sendResponse({ok:true,markdown:note});
      }catch(error){
        const message=error?.message||String(error);
        const code=error?.code;
        console.error("[AI Note] generate_note failed", message, error);
        try{
          sendResponse({ok:false,error:message,code});
        }catch(sendErr){
          console.error("[AI Note] sendResponse failed", sendErr);
        }
      }
    })();
    return true;
  }
  if(msg?.type==="test_firecrawl"){
    (async()=>{
      try{
        let apiKey=typeof msg.apiKey==="string"?msg.apiKey:"";
        let apiBase=typeof msg.apiBase==="string"?msg.apiBase:"";
        if(!apiKey){
          const stored=await chrome.storage.local.get(["firecrawlKey","firecrawlBase"]);
          apiKey=stored.firecrawlKey||"";
          apiBase=stored.firecrawlBase||"";
        }
        const client=createFirecrawlClient(apiKey,apiBase);
        await client.scrape(msg.url||"https://www.firecrawl.dev",{ formats:["markdown"] });
        sendResponse({ok:true});
      }catch(error){
        sendResponse({ok:false,error:error?.message||String(error)});
      }
    })();
    return true;
  }
});
async function withAIWait(fn){
  const { apiKey } = await chrome.storage.local.get("apiKey");
  let timer=null;
  try{ if(apiKey) timer=setTimeout(()=>setSpinner(true),800); const res=await fn(); return res; }
  finally{ if(timer) clearTimeout(timer); setSpinner(false); }
}
function guessCategory(title,url){
  const s=(title||"").toLowerCase()+" "+(url||"").toLowerCase();
  if(/bilibili|youtube|video/.test(s)) return "视频";
  if(/arxiv|scholar|doi\.org/.test(s)) return "学术";
  if(/news|techcrunch|36kr|sspai/.test(s)) return "新闻";
  if(/github|developer|langchain|openai|python|java|react|docker/.test(s)) return "技术";
  if(/weibo|twitter|x\.com|weixin/.test(s)) return "社交";
  return "其他";
}
async function captureMarkdownInBackground(url){
  if(!url) throw new Error(t("error.invalid_url"));
  const tab=await chrome.tabs.create({url,active:false});
  const tabId=tab?.id;
  if(typeof tabId!=="number") throw new Error(t("error.no_bg_tab"));
  try{
    await waitForTabComplete(tabId,45000);
    try{
      await chrome.tabs.update(tabId,{muted:true});
    }catch(_){}
    const [result]=await chrome.scripting.executeScript({
      target:{tabId},
      world:"MAIN",
      files:["vendor/readability.js","vendor/turndown.umd.js","vendor/turndown-plugin-gfm.js","vendor/highlight.min.js","capture-markdown.js"]
    });
    const payload=result?.result;
    if(!payload || !payload.ok){
      throw new Error(payload?.error || t("error.convert_failed"));
    }
    return payload;
  }finally{
    try{ await chrome.tabs.remove(tabId); }catch(_){}
  }
}
function getFirecrawlCtor(){
  if(typeof FirecrawlModule==="function") return FirecrawlModule;
  if(typeof FirecrawlNamed==="function") return FirecrawlNamed;
  if(typeof FirecrawlClientNamed==="function") return FirecrawlClientNamed;
  return null;
}
function createFirecrawlClient(apiKey,apiBase){
  if(!apiKey) throw new Error(t("error.firecrawl_no_key"));
  const FirecrawlCtor=getFirecrawlCtor();
  if(typeof FirecrawlCtor!=="function") throw new Error(t("error.firecrawl_no_client"));
  const options={ apiKey };
  if(apiBase) options.apiUrl=apiBase;
  return new FirecrawlCtor(options);
}
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
    if(typeof payload.data!=="undefined") return resolveMarkdownPayload(payload.data);
    if(typeof payload.content==="string" && payload.content) return payload.content;
  }
  return "";
}
async function fetchMarkdownViaFirecrawl(url){
  if(!url) throw new Error(t("error.invalid_url"));
  const { firecrawlKey="", firecrawlBase="" }=await chrome.storage.local.get(["firecrawlKey","firecrawlBase"]);
  const client=createFirecrawlClient(firecrawlKey,firecrawlBase);
  const result=await client.scrape(url,{ formats:["markdown"] });
  if(result?.success===false) throw new Error(result?.error||t("error.firecrawl_failed"));
  const markdown=resolveMarkdownPayload(result);
  if(!markdown) throw new Error(t("error.no_markdown"));
  const title=(result?.title||result?.metadata?.title||result?.data?.metadata?.title||"").trim();
  return { markdown, title };
}
function waitForTabComplete(tabId,timeout=45000){
  return new Promise((resolve,reject)=>{
    let settled=false;
    const cleanup=()=>{
      if(settled) return;
      settled=true;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };
    const timer=setTimeout(()=>{
      cleanup();
      reject(new Error(t("error.load_timeout")));
    },timeout);
    const onUpdated=(updatedId,changeInfo)=>{
      if(updatedId===tabId && changeInfo.status==="complete"){
        cleanup();
        resolve();
      }
    };
    const onRemoved=(removedId)=>{
      if(removedId===tabId){
        cleanup();
        reject(new Error(t("error.tab_closed")));
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.get(tabId).then(tab=>{
      if(tab && tab.status==="complete"){
        cleanup();
        resolve();
      }
    }).catch(()=>{});
  });
}
async function createMenus(){ await refreshBgLocale(); chrome.contextMenus.removeAll(()=>{
  chrome.contextMenus.create({id:"root",title:t("ctxmenu.root"),contexts:["page"]});
  chrome.contextMenus.create({id:"show-cards",parentId:"root",title:t("ctxmenu.show_cards"),contexts:["page"]});
  chrome.contextMenus.create({id:"import-current",parentId:"root",title:t("ctxmenu.import_current"),contexts:["page"]});
  chrome.contextMenus.create({id:"import-all",parentId:"root",title:t("ctxmenu.import_all"),contexts:["page"]});
});}
chrome.runtime.onInstalled.addListener(async()=>{
  await createMenus();
  setSpinner(false);
  try{
    const { captureMode }=await chrome.storage.local.get("captureMode");
    if(captureMode!=="local" && captureMode!=="firecrawl"){
      await chrome.storage.local.set({captureMode:"local"});
    }
  }catch(_){}
});
chrome.runtime.onStartup.addListener(async()=>{
  await createMenus();
  setSpinner(false);
  try{
    const { captureMode }=await chrome.storage.local.get("captureMode");
    if(captureMode!=="local" && captureMode!=="firecrawl"){
      await chrome.storage.local.set({captureMode:"local"});
    }
  }catch(_){}
});
// Recreate context menus (localized) when the UI locale changes.
chrome.storage.onChanged.addListener((changes, area)=>{
  if(area==="local" && changes.locale){ bgLocale=normalizeLocale(changes.locale.newValue); createMenus(); }
});
chrome.contextMenus.onClicked.addListener(async(info,tab)=>{
  if(info.menuItemId==="show-cards") chrome.tabs.create({url:chrome.runtime.getURL("dashboard.html")});
  if(info.menuItemId==="import-current" && tab) await importTabs([tab]);
  if(info.menuItemId==="import-all"){ const tabs=await chrome.tabs.query({currentWindow:true}); await importTabs(tabs); }
});
async function importTabs(tabs){
  await refreshBgLocale();
  const now=Date.now();
  const { tabsData: existing=[], closeImportedTabs=false, apiKey }=await chrome.storage.local.get(["tabsData","closeImportedTabs","apiKey"]);
  const hasAPI=!!apiKey;
  const existSet=new Set((existing||[]).map(x=>x.url));
  const incoming=[];
  const toClose=[];
  for(const tab of tabs||[]){
    if(!tab||!tab.url) continue;
    if(existSet.has(tab.url)) continue;
    let host="";
    try{ host=new URL(tab.url).host; }catch(_){ host=""; }
    incoming.push({
      title:tab.title||tab.url,
      url:tab.url,
      host,
      ts:now,
      category:"未分类",
      hintCategory:guessCategory(tab.title||"",tab.url||""),
      summary:"",
      starred:false,
      markd:"",
      note_markd:""
    });
    if(typeof tab.id==="number" && !tab.pinned) toClose.push(tab.id);
  }
  if(!incoming.length){ notify(t("notify.imported_no_new")); return; }
  const initialMap=new Map((existing||[]).map(x=>[x.url,x]));
  incoming.forEach(item=>{ initialMap.set(item.url,item); });
  await chrome.storage.local.set({tabsData:Array.from(initialMap.values())});
  if(closeImportedTabs && toClose.length){ try{ await chrome.tabs.remove(toClose); }catch(_){ /* ignore */ } }
  if(!hasAPI){
    notify(t("notify.imported",{count:incoming.length}));
    return;
  }
  notify(t("notify.imported_classifying",{count:incoming.length}));
  try{
    const out=await withAIWait(()=>classifyAndSummarize(incoming));
    const { tabsData: currentTabs=[] }=await chrome.storage.local.get("tabsData");
    const m=new Map((currentTabs||[]).map(x=>[x.url,x]));
    out.forEach(item=>{
      const prev=m.get(item.url)||{};
      m.set(item.url,{...prev,...item,starred:prev.starred||false,ts:prev.ts||item.ts||now});
    });
    await chrome.storage.local.set({tabsData:Array.from(m.values())});
    notify(t("notify.imported_classified",{count:out.length}));
  }catch(err){
    notify(t("notify.imported_classify_failed",{count:incoming.length}));
  }
}
function notify(message){ try{ chrome.notifications.create({type:"basic",iconUrl:chrome.runtime.getURL("icons/icon128.png"),title:"Tab Assistant",message}); }catch(_){ } }
