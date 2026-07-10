<p align="center">
  <img src="icons/icon128.png" width="128" alt="Tab Assistant logo">
</p>

<h1 align="center">Tab Assistant</h1>

<p align="center">
  <strong>浏览器标签页管家 —— 导入 · 分类 · 搜索 · AI 笔记</strong>
</p>

<p align="center">
  <strong>中文</strong> |
  <a href="readme_en.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3">
  <img src="https://img.shields.io/badge/version-0.5.6-green" alt="v0.5.6">
  <img src="https://img.shields.io/badge/i18n-zh--CN%20%7C%20en--US-orange" alt="i18n">
</p>

---

> ⚠️ **注意**：当前仓库为开发中的早期版本，并非最终正式版。云同步等功能尚未包含在内，项目仍在积极迭代中。正式版发布后仓库将适时更新。

---

## ✨ 功能 Features

<table>
<tr>
<td width="50%">

### 🔖 标签导入 Import
- 右键菜单 / 面板一键导入当前标签页或全部标签页
- 自动去重，避免重复导入
- 可选「导入后自动关闭」已导入标签

### 🤖 AI 分类与摘要 Classify
- 接入 OpenAI 兼容 API（支持 DeepSeek 等）
- 自动归类：技术 / 新闻 / 视频 / 学术 / 社交 / 其他
- 支持自定义分类，灵活扩展

### 📝 AI 笔记生成 Notes
- **8 种笔记风格**：精简、详细、教程、学术、论文解析、小红书、会议纪要、第一性原理
- 中英双语输出，语言独立于 UI 界面
- 基于网页 Markdown 内容生成结构化笔记

</td>
<td width="50%">

### 🔍 搜索与筛选 Search
- 按标题 / 摘要 / URL 全文搜索
- 按分类筛选，按收藏过滤
- 实时响应，无需等待

### 📦 导入导出 Hub
- JSON 批量导出，便于备份与迁移
- 追加 / 覆盖两种导入策略
- 跨设备同步工作流

### 📄 Markdown 查看器 Viewer
- 语法高亮（Prism，支持 12+ 语言）
- 数学公式渲染（KaTeX / LaTeX）
- 思维导图（Markmap）
- 流程图/时序图（Mermaid）
- 原始 Markdown / AI 笔记双源切换

</td>
</tr>
</table>

---

## 🎬 预览 Preview

<!-- TODO: 添加截图或 GIF 演示 -->

> 打开扩展后，主面板展示分类卡片网格；点击分类进入标签列表；设置面板配置 API 与偏好。

---

## 📥 安装 Installation

### Chrome / Edge

1. 下载或克隆本仓库：

   ```bash
   git clone https://github.com/<your-org>/tab-assistant.git
   ```

2. 打开浏览器扩展管理页：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

3. 开启 **「开发者模式」**（右上角开关）

4. 点击 **「加载已解压的扩展程序」**，选择项目根目录

5. 扩展图标会出现在浏览器工具栏，点击即可打开面板

### 依赖 Dependencies

所有第三方库已内置在 `vendor/` 目录中，无需额外安装：

| 库 | 用途 |
|---|---|
| [Readability](https://github.com/mozilla/readability) | 网页正文提取 |
| [Turndown](https://github.com/mixmark-io/turndown) | HTML → Markdown 转换 |
| [highlight.js](https://highlightjs.org/) | 代码语法高亮 |
| [KaTeX](https://katex.org/) | LaTeX 数学公式渲染 |
| [markdown-it](https://github.com/markdown-it/markdown-it) | Markdown 解析 |
| [Markmap](https://markmap.js.org/) | 思维导图 |
| [Mermaid](https://mermaid.js.org/) | 流程图/时序图 |
| [Prism](https://prismjs.com/) | 代码块高亮 |
| [D3](https://d3js.org/) | SVG 可视化（Markmap 依赖） |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML 安全过滤 |
| [Firecrawl SDK](https://firecrawl.dev/) | 云端网页抓取（可选） |

---

## ⚙️ 配置 Configuration

在扩展面板中点击 **「设置」**：

### API 设置
| 配置项 | 说明 |
|---|---|
| API Key | OpenAI 兼容密钥（如 `sk-...`） |
| API Base URL | 接口地址（默认 `https://api.openai.com/v1`，支持 DeepSeek 等） |
| 模型 ID | 模型名称（如 `gpt-4o-mini`、`deepseek-chat`） |

### 抓取设置 Capture Mode
- **本地抓取（默认）**：后台打开标签页，使用 Readability + Turndown 提取内容
- **Firecrawl 抓取**：调用 Firecrawl 云端服务获取 Markdown

### 其他
- 导入策略（追加 / 覆盖）、自动关闭已导入标签
- AI 笔记默认风格、输出语言、补充说明
- 批量任务参数（超时、并发数、重试次数、一键生成开关）

---

## 🏗️ 项目结构 Project Structure

```
tab-assistant/
├── manifest.json              # Chrome Extension Manifest V3
├── background.js              # Service Worker（右键菜单、抓取、编排）
├── dashboard.html             # 主面板 UI
├── popup.js                   # 主面板逻辑（状态、渲染、事件）
├── api.js                     # OpenAI 兼容 API 客户端
├── markdown-viewer.js         # Markdown 预览面板
├── capture-markdown.js        # 网页内容抓取脚本
├── note-templates.js          # 8 种笔记风格模板
├── prompt-builder.js          # AI Prompt 构建器
├── prompt-language-vars.js    # AI 输出语言变量
├── i18n.js                    # Popup 端 i18n 封装
├── shared-i18n.js             # 共享 i18n 核心（无 DOM 依赖）
├── styles.css                 # 全局样式
├── locales/
│   ├── zh-CN.js               # 简体中文 UI 字符串
│   └── en-US.js               # English UI strings
├── scripts/
│   ├── check-locale-keys.js   # 语言文件键位一致性检查
│   └── check-utf8.js          # UTF-8 编码检查
├── vendor/                    # 第三方库（见依赖表）
└── icons/                     # 扩展图标
```

---

## 🔧 开发 Development

### 检查语言文件一致性

```bash
node scripts/check-locale-keys.js
```

确保 `zh-CN.js` 和 `en-US.js` 拥有完全相同的键集合。

### 调试

1. 修改代码后，在 `chrome://extensions` 页面点击扩展卡片下的 **「刷新」**图标
2. Service Worker 日志在扩展详情页 → **「Service Worker」**链接打开 DevTools
3. 面板 UI 日志：右键点击扩展图标 → **「审查弹出内容」**

### 技术栈

- **Manifest V3** — 最新 Chrome 扩展标准
- **ES Modules** — 全项目使用原生 ES 模块
- **chrome.storage.local** — 持久化存储
- **零构建工具** — 无需 webpack/vite，原生 JS 直接运行

---

## 📄 许可 License

MIT

---

<p align="center">
  <sub>Made with ❤️ for tab hoarders everywhere.</sub>
</p>
