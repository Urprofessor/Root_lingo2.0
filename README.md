# ROOT LINGO

> Apple-style AI Multi-Model Translation Studio
>
> Browser-first · Local-first · Zero Server

ROOT LINGO 是一款部署在 Vercel 上的纯前端 AI 多模型翻译工作台。所有内容、API Key、翻译结果都只存在你当前的浏览器中,零服务器代码、零数据库、零账号系统。

## 核心特性

- 🟢 **零服务器**:Next.js 静态导出,可部署到任意静态托管(Vercel / Cloudflare Pages / GitHub Pages)
- 🔑 **自带 Key**:用户填写自己的 OpenAI / Anthropic / Google / DeepSeek / Qwen 的 API Key,只存浏览器
- 🤖 **14 个模型**:5 家厂商共 14 个模型,按家族分组选择
- 🎚 **三种工作流**:
  - **Quick** — 单模型直翻,最快
  - **Single** — 同一模型翻译→自审→优化
  - **Multi** — 两个翻译模型 + 一个裁判模型,融合最佳结果
- 🌍 **16 种目标语言**:中、英、德、法、意、西、葡、俄、日、阿、印尼、马来、越、泰、繁中、菲律宾,支持同时翻译多种语言
- 📂 **8 种输入格式**:txt / md / docx / pdf / pptx / xlsx / srt / 图片(OCR)
- 📥 **4 种导出格式**:txt / md / docx / pdf,多语言可一键 ZIP 打包
- 📖 **内置术语库**:Momcozy 全球品牌术语库 V1.0,共 704 条多语言术语
- 🎨 **风格化翻译**:专业度 / 温柔度双滑块参数化 prompt
- 🛡 **安全边界**:防止编造、保留数字与法律结构等

## 技术栈

- Next.js 14 (App Router, Static Export)
- React 18 + TypeScript
- Tailwind CSS
- Zustand(状态管理)
- 各类浏览器内解析器:mammoth / pdfjs-dist / xlsx / tesseract.js / jszip

## 开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 构建

```bash
npm run build
```

产物在 `out/` 目录,是一个纯静态站点。

## 部署到 Vercel

1. 把代码 push 到 GitHub
2. 在 Vercel 中导入仓库
3. Vercel 会自动识别 Next.js 项目并部署
4. 完成

## 隐私

- 所有翻译内容直接从你的浏览器调用各家 LLM API,不经过任何中间服务器
- API Key 仅保存在浏览器 localStorage(经简单 XOR 混淆)
- 草稿、术语库、提示词模板存在浏览器 IndexedDB
- 关闭页面或清除浏览器数据后,本地数据将丢失
- 本项目无任何服务端代码,代码完全开源可审计

## 项目结构

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── layout/             # Logo / 侧边栏 / Header / Footer
│   ├── input-panel/        # 1号面板:输入
│   ├── settings-panel/     # 2号面板:设置
│   ├── output-panel/       # 3号面板:输出
│   ├── pages/              # 术语库 / 模板 / Keys / 设置 页
│   └── ui/                 # 通用 UI 组件
├── lib/
│   ├── parsers/            # 输入解析(txt/md/docx/pdf/...)
│   ├── exporters/          # 输出导出(txt/md/docx/pdf/zip)
│   ├── llm/                # 模型调用统一层
│   ├── workflows/          # quick / single / multi 三种翻译流
│   ├── prompts/            # 系统 prompt / 风格 / 安全 / 术语
│   ├── storage/            # localStorage / IndexedDB 封装
│   ├── glossary/           # 术语库解析与注入
│   └── utils/              # 工具函数
├── store/                  # Zustand stores
├── types/                  # TypeScript 类型
└── data/
    ├── languages.json      # 16 种目标语言
    ├── models.json         # 14 个模型清单
    └── glossaries/
        └── momcozy.json    # 内置 Momcozy 术语库
```

## License

加新模板的工作流(以后你想加 prompt 时)

在你本地仓库的 src/data/prompts/ 文件夹下新建一个 .md 文件,比如 my-new-template.md
文件头部写 YAML frontmatter:

markdown   ---
   id: my-new-template
   name: 我的新模板
   description: 简短描述
   category: medical
   targetLangs: [en, ja]
   ---
   
   You are a... (实际 prompt 内容)

git add . && git commit && git push
Vercel 自动重新部署
网站上模板就出现了

注意:

id 必填,且唯一
name 必填,显示用
其他字段都可选
targetLangs 不填 = 所有语言都显示
category: writing 或 tags: [非翻译] 会触发橙色"非翻译"标签


Internal use only.
