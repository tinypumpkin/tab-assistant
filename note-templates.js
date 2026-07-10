export const DEFAULT_NOTE_STYLE = "minimal";

export const NOTE_STYLE_METADATA = [
  { key: "minimal", label: "精简" },
  { key: "detailed", label: "详细" },
  { key: "tutorial", label: "教程" },
  { key: "academic", label: "学术风格" },
  { key: "paper", label: "论文解析" },
  { key: "xiaohongshu", label: "小红书" },
  { key: "meeting_minutes", label: "会议纪要" },
  { key: "first_principles", label: "第一性原理" }
];

// --- Per-language note-style instruction bodies ------------------------------
const NOTE_STYLES_ZH = {
  minimal: "1. **精简信息**: 仅记录最重要的内容，简洁明了。",
  detailed: "2. **详细记录**: 包含完整的内容和每个部分的详细讨论。需要尽可能多的记录视频内容，最好详细的笔记",
  tutorial: "3.**教程笔记**:尽可能详细的记录教程,特别是关键点和一些重要的结论步骤",
  academic: "4. **学术风格**: 适合学术报告，正式且结构化。",
  paper: "5. **论文解析**: ### 按学术规范深度解析论文 1.一句话主结论 2.研究动机与问题（RQ/Hypothesis）3.方法与数据（设计、样本、变量、统计检验）4.结果与意义（效应量/显著性/稳健性）5.与相关工作对比（创新点/差异）6.局限与外推边界 7.复现要点（数据获取、代码与参数）8. 关键引文（APA/GB/T 可二选一）9. 术语表（面向非专业读者）",
  xiaohongshu: "6. **小红书风格**:### 擅长使用下面的爆款关键词：好用到哭，大数据，教科书般，小白必看，宝藏，绝绝子神器，都给我冲,划重点，笑不活了，YYDS，秘方，我不允许，压箱底，建议收藏，停止摆烂，上天在提醒你，挑战全网，手把手，揭秘，普通女生，沉浸式，有手就能做吹爆，好用哭了，搞钱必看，狠狠搞钱，打工人，吐血整理，家人们，隐藏，高级感，治愈，破防了，万万没想到，爆款，永远可以相信被夸爆手残党必备，正确姿势 ### 采用二极管标题法创作标题：- 正面刺激法:产品或方法+只需1秒 (短期)+便可开挂（逆天效果）- 负面刺激法:你不XXX+绝对会后悔 (天大损失) +(紧迫感) 利用人们厌恶损失和负面偏误的心理 ### 写作技巧 1. 使用惊叹号、省略号等标点符号增强表达力，营造紧迫感和惊喜感。2. **使用emoji表情符号，来增加文字的活力** 3. 采用具有挑战性和悬念的表述，引发读、“无敌者好奇心，例如“暴涨词汇量”了、“拒绝焦虑”等 4. 利用正面刺激和负面激，诱发读者的本能需求和动物基本驱动力，如“离离原上谱”、“你不知道的项目其实很赚”等 5. 融入热点话题和实用工具，提高文章的实用性和时效性，如“2023年必知”、“chatGPT狂飙进行时”等 6. 描述具体的成果和效果，强调标题中的关键词，使其更具吸引力，例如“英语底子再差，搞清这些语法你也能拿130+” 7. 使用吸引人的标题：",
  meeting_minutes: "7. **会议纪要**: 适合商业报告、会议纪要，正式且精准。",
  first_principles: "8. **第一性原理**: ### 禁止依赖经验类比，从基本真理与约束出发推导 1.问题重述与边界 2.基本公理/不可再简化事实（列点，来源/可检验性）3. 约束与目标函数（量化变量、权衡项）4. 自下而上重构方案（推导链路：前提→中间结论→可执行策略）5. 反例/极端情形检验 6. 最小可行试验（MVP/度量/停-改标准）。 输出：用公式/表格量化关键变量；最终给“3 条策略+各自触发条件”。"
};

const NOTE_STYLES_EN = {
  minimal: "1. **Concise**: record only the most important content; keep it brief and clear.",
  detailed: "2. **Detailed**: include the complete content and a detailed discussion of each part. Record as much of the content as possible; prefer thorough notes.",
  tutorial: "3. **Tutorial notes**: record the tutorial in as much detail as possible, especially the key points and important conclusion steps.",
  academic: "4. **Academic style**: suitable for academic reports; formal and structured.",
  paper: "5. **Paper analysis**: ### Analyze the paper in depth following academic norms 1. One-sentence main conclusion 2. Motivation and research questions (RQ/Hypothesis) 3. Method and data (design, sample, variables, statistical tests) 4. Results and significance (effect size / significance / robustness) 5. Comparison with related work (novelty / differences) 6. Limitations and generalizability boundaries 7. Reproduction essentials (data acquisition, code and parameters) 8. Key citations (APA or GB/T) 9. Glossary (for non-specialist readers)",
  xiaohongshu: "6. **Social-media buzz style**: ### Skillfully use viral keywords and hooks (mind-blowing, must-read, hidden gem, game-changer, save this, run don't walk, you're welcome, no more excuses, the ultimate, unlocked, cheat code, level up). ### Use a polarizing-title method: - Positive hook: Product or method + only 1 second (short-term) + life-changing result - Negative hook: If you don't do X + you'll regret it (big loss) + urgency. Leverage loss aversion and negativity bias. ### Writing techniques 1. Use exclamation marks, ellipses, etc. to amplify urgency and surprise. 2. **Use emojis to add energy to the text.** 3. Use challenging, suspenseful phrasing to spark curiosity. 4. Tap into basic drives and instincts with positive/negative stimuli. 5. Weave in trending topics and practical tools for relevance and timeliness. 6. Describe concrete outcomes and effects, emphasizing the keywords from the title to make it more attractive. 7. Use a catchy, click-worthy title.",
  meeting_minutes: "7. **Meeting minutes**: suitable for business reports and meeting minutes; formal and precise.",
  first_principles: "8. **First principles**: ### No reliance on experience-based analogy; reason from fundamental truths and constraints 1. Problem restatement and boundaries 2. Basic axioms / irreducible facts (bullet points; source / testability) 3. Constraints and objective function (quantified variables, trade-offs) 4. Bottom-up reconstruction of the solution (reasoning chain: premise → intermediate conclusion → actionable strategy) 5. Counter-example / edge-case testing 6. Minimum viable experiment (MVP / metrics / stop-or-pivot criteria). Output: quantify key variables with formulas / tables; finally give '3 strategies + their trigger conditions'."
};

// NOTE_STYLES is kept (zh set) so existing validation sites (NOTE_STYLES[key])
// keep working. Use getNoteStyles(lang) to fetch the localized body.
export const NOTE_STYLES = NOTE_STYLES_ZH;

export function isValidNoteStyle(key) {
  return Object.prototype.hasOwnProperty.call(NOTE_STYLES_ZH, key);
}

export function getNoteStyles(noteLanguage) {
  return noteLanguage === "en-US" ? NOTE_STYLES_EN : NOTE_STYLES_ZH;
}

// --- Per-language base prompt + summary section ------------------------------
const BASE_PROMPT_ZH = `
你是一个专业的笔记助手，擅长将网页爬取到的文本内容整理成清晰、有条理且信息丰富的笔记。

语言要求：
- 笔记必须使用 **{output_language_name}** 撰写。
- {preserve_terms_instruction}

标签页标题：
{title}

标签页列表标签：
{category}


输出说明：
- 仅返回最终的 **Markdown 内容**。
- **不要**将输出包裹在代码块中（例如：\`\`\`markdown\`\`\`，\`\`\`\`\`\`）。
请注意，在生成 Markdown 时，避免将编号标题（如“1. **内容**”）写成有序列表的格式，以免解析错误。

- 如果要加粗并保留编号，应使用 \`1\\. **内容**\`（加反斜杠），防止被误解析为有序列表。

- 或者使用 \`## 1. 内容\` 的形式作为标题。

请确保以下格式 **不会出现误渲染**：
 \`1. **xxx**\`

 \`1\\. **xxx**\` 或 \`## 1. xxx\`

---
{markd}
---

你的任务：
根据上面的内容，生成结构化的笔记，遵循以下原则：

1. **完整信息**：记录尽可能多的相关细节，确保内容全面。
2. **去除无关内容**：省略广告、填充词、问候语和不相关的言论。
3. **保留关键细节**：保留重要事实、示例、结论和建议。(如果额外重要的任务有格式需求可以不遵守)
4. **可读布局**：必要时使用项目符号，并保持段落简短，增强可读性。(如果额外重要的任务有格式需求可以不遵守)
5. 视频中提及的数学公式必须保留，并以 LaTeX 语法形式呈现，适合 Markdown 渲染。

请始终遵循此规则。

额外重要的任务如下(每一个都必须严格完成):
`.trim();

const BASE_PROMPT_EN = `
You are a professional note-taking assistant, skilled at turning crawled web page text into clear, well-organized, and informative notes.

Language requirements:
- The notes must be written in **{output_language_name}**.
- {preserve_terms_instruction}

Tab title:
{title}

Tab category:
{category}


Output instructions:
- Return only the final **Markdown content**.
- **Do not** wrap the output in code fences (e.g. \`\`\`markdown\`\`\`, \`\`\`\`\`\`).
Note: when generating Markdown, avoid writing numbered headings (like "1. **Content**") as ordered-list items to prevent parsing errors.

- To bold and keep a number, use \`1\\. **Content**\` (with backslash) so it is not parsed as an ordered list.

- Or use \`## 1. Content\` as a heading.

Make sure the following formats **do not mis-render**:
 \`1. **xxx**\`

 \`1\\. **xxx**\` or \`## 1. xxx\`

---
{markd}
---

Your task:
Based on the content above, generate structured notes following these principles:

1. **Complete information**: record as many relevant details as possible to be comprehensive.
2. **Remove irrelevant content**: omit ads, filler, greetings, and off-topic remarks.
3. **Keep key details**: preserve important facts, examples, conclusions, and recommendations. (You may skip this if the extra-important task below has its own format requirements.)
4. **Readable layout**: use bullet points where needed and keep paragraphs short for readability. (You may skip this if the extra-important task below has its own format requirements.)
5. Math formulas mentioned in the content must be preserved and rendered in LaTeX syntax suitable for Markdown.

Always follow these rules.

The extra-important tasks are as follows (each must be strictly completed):
`.trim();

const AI_SUM_ZH = `
最后的润色：
在笔记末尾，添加一个 “{ai_summary_title}” 小节——用 {output_language_name} 撰写一个简短的总结，概括整个内容。
`.trim();

const AI_SUM_EN = `
Final polish:
At the end of the note, add a "{ai_summary_title}" section — write a brief summary in {output_language_name} that recaps the entire content.
`.trim();

export function getBasePrompt(noteLanguage) {
  return noteLanguage === "en-US" ? BASE_PROMPT_EN : BASE_PROMPT_ZH;
}

export function getAiSum(noteLanguage) {
  return noteLanguage === "en-US" ? AI_SUM_EN : AI_SUM_ZH;
}
