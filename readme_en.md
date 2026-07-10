<p align="center">
  <img src="icons/icon128.png" width="128" alt="Tab Assistant logo">
</p>

<h1 align="center">Tab Assistant</h1>

<p align="center">
  <strong>Your browser tab manager — import, categorize, search, and AI-powered notes</strong>
</p>

<p align="center">
  <a href="README.md">中文</a> |
  <strong>English</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3">
  <img src="https://img.shields.io/badge/version-0.5.6-green" alt="v0.5.6">
  <img src="https://img.shields.io/badge/i18n-zh--CN%20%7C%20en--US-orange" alt="i18n">
</p>

---

> ⚠️ **Note**: This repository hosts an early development version, not the final release. Features such as cloud sync are not yet included, and the project is under active iteration. The repository will be updated when the official version is ready.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔖 Tab Import
- Import the current tab or all tabs with one click via the right-click menu or the popup panel
- Duplicates are skipped automatically
- Optionally close tabs after importing them

### 🤖 AI Classification & Summarization
- Works with any OpenAI-compatible API (DeepSeek, etc.)
- Auto-classifies tabs into Tech / News / Video / Academic / Social / Other
- Custom categories are fully supported

### 📝 AI Note Generation
- **8 note styles**: Minimal, Detailed, Tutorial, Academic, Paper Analysis, Social-Media Buzz, Meeting Minutes, First Principles
- Output language (Chinese or English) is independent of the UI locale
- Generates structured notes from the page's Markdown content

</td>
<td width="50%">

### 🔍 Search & Filter
- Full-text search across titles, summaries, and URLs
- Filter by category or starred tabs
- Results appear instantly as you type

### 📦 Hub — Import & Export
- Bulk export to JSON for backup and migration
- Two import strategies: append new tabs or overwrite everything
- Great for syncing across devices

### 📄 Markdown Viewer
- Syntax highlighting (Prism, 12+ languages)
- Math rendering (KaTeX, LaTeX)
- Mindmaps (Markmap)
- Diagrams (Mermaid — flowcharts, sequence diagrams)
- Switch between raw Markdown and AI-generated notes

</td>
</tr>
</table>

---

## 🎬 Preview

<!-- TODO: add screenshots or GIF demo -->

> Open the extension → browse the category card grid → click a category to see its tabs → configure API and preferences in the settings panel.

---

## 📥 Installation

### Chrome / Edge

1. Clone the repository:

   ```bash
   git clone https://github.com/<your-org>/tab-assistant.git
   ```

2. Open the extensions management page in your browser:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

3. Toggle **"Developer mode"** on (top-right corner)

4. Click **"Load unpacked"** and select the project root directory

5. The extension icon appears in the toolbar — click it to open the dashboard

### Dependencies

All third-party libraries are vendored in the `vendor/` directory. No `npm install` needed.

| Library | Purpose |
|---|---|
| [Readability](https://github.com/mozilla/readability) | Web page content extraction |
| [Turndown](https://github.com/mixmark-io/turndown) | HTML → Markdown conversion |
| [highlight.js](https://highlightjs.org/) | Code syntax highlighting |
| [KaTeX](https://katex.org/) | LaTeX math rendering |
| [markdown-it](https://github.com/markdown-it/markdown-it) | Markdown parsing |
| [Markmap](https://markmap.js.org/) | Mindmaps |
| [Mermaid](https://mermaid.js.org/) | Flowcharts & sequence diagrams |
| [Prism](https://prismjs.com/) | Code block highlighting |
| [D3](https://d3js.org/) | SVG visualization (Markmap dependency) |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitization |
| [Firecrawl SDK](https://firecrawl.dev/) | Cloud-based web scraping (optional) |

---

## ⚙️ Configuration

Click **"Settings"** in the extension panel:

### API

| Setting | Description |
|---|---|
| API Key | Your OpenAI-compatible key (`sk-...`) |
| API Base URL | API endpoint (default `https://api.openai.com/v1`) |
| Model ID | Model name (`gpt-4o-mini`, `deepseek-chat`, etc.) |

### Capture Mode

- **Local (default)**: Opens tabs in the background and extracts content using Readability + Turndown
- **Firecrawl**: Uses the Firecrawl cloud service for Markdown extraction

### Other Settings

- Import strategy (append / overwrite) and auto-close imported tabs
- Default note style, output language, and custom supplement text
- Batch task tuning: timeout, concurrency limit, retry limit, one-click AI toggle

---

## 🏗️ Project Structure

```
tab-assistant/
├── manifest.json              # Chrome Extension Manifest V3
├── background.js              # Service Worker — context menus, capture, orchestration
├── dashboard.html             # Main panel UI
├── popup.js                   # Main panel logic — state, rendering, events
├── api.js                     # OpenAI-compatible API client
├── markdown-viewer.js         # Markdown preview panel
├── capture-markdown.js        # Content extraction script (injected into pages)
├── note-templates.js          # 8 note style templates with bilingual prompts
├── prompt-builder.js          # AI prompt builder
├── prompt-language-vars.js    # AI output language variables (decoupled from UI locale)
├── i18n.js                    # Popup-side i18n — declarative binding & reactive switching
├── shared-i18n.js             # Pure-function i18n core (no DOM / Chrome dependencies)
├── styles.css                 # Global styles
├── locales/
│   ├── zh-CN.js               # Simplified Chinese UI strings
│   └── en-US.js               # English UI strings
├── scripts/
│   ├── check-locale-keys.js   # Locale key parity check
│   └── check-utf8.js          # UTF-8 encoding check
├── vendor/                    # Third-party libraries (see dependency table)
└── icons/                     # Extension icons
```

---

## 🔧 Development

### Locale Key Parity Check

```bash
node scripts/check-locale-keys.js
```

Ensures `zh-CN.js` and `en-US.js` share the exact same key set.

### Debugging

1. After editing code, click the refresh icon on the extension card at `chrome://extensions`
2. Service Worker logs → extension details page → click the **"Service Worker"** link
3. Popup UI logs → right-click the extension icon → **"Inspect popup"**

### Tech Stack

- **Manifest V3** — Latest Chrome extension standard
- **ES Modules** — Native ES modules throughout the project
- **chrome.storage.local** — Persistent storage
- **Zero build tools** — No webpack or vite needed; vanilla JS runs directly

---

## 📄 License

MIT

---

<p align="center">
  <sub>Made with ❤️ for tab hoarders everywhere.</sub>
</p>
