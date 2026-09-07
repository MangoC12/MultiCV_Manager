# MultiCV Manager

简体中文 | [English](README.md)

MultiCV Manager 是一个本地优先的简历内容与版本管理工具。它把可复用的经历内容和具体简历配置分开管理，让同一段经历能够针对不同岗位维护多种表达，并快速组合成不同版本的简历。

## 核心能力

- 浏览器本地保存 Workspace
- 管理基础信息、教育背景、技能与经历内容库
- 为同一段经历维护多个岗位版本
- Bullet 与完整段落两种编辑形态
- 标签、搜索、拖拽排序、撤销与重做
- 自定义简历模块并保存组合配置
- A4 实时预览与浏览器 PDF 导出
- 导入 PDF、DOCX、Markdown 与纯文本
- 导入和导出带版本号的 Workspace JSON
- 内置 Cynthia Wang 演示数据及两份简历配置
- 两套可打印简历模板

此 OSS 版本不包含 AI 服务、API Key、账户系统、数据分析或云端存储。除非主动导出 Workspace 文件，简历数据仅保存在当前浏览器。

## 快速开始

需要 Node.js 20+ 与 pnpm。

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)，选择 Cynthia Demo 体验完整流程，或创建空白 Workspace。

## 使用流程

1. 在内容库中维护教育、技能和经历素材。
2. 为同一经历建立面向不同岗位的表达版本。
3. 在简历编辑页选择经历版本并组合模块。
4. 保存当前组合，供之后快速切换和继续编辑。
5. 实时预览并导出 PDF。

## Workspace 数据

顶栏的“工作区”菜单支持导出和导入 `.multicv.json` 文件。Workspace 包含基础信息、内容版本、简历配置、模板和排版设置。

个人 Workspace 文件默认不会被 Git 跟踪。建议把私人 Workspace 保存在项目目录之外，并定期导出备份。

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm build
```

## 技术栈

- Next.js 16、React 19、TypeScript
- Zustand
- dnd-kit
- PDF.js、Mammoth、Tesseract.js

## 隐私说明

MultiCV Manager 不包含后端数据库。导入文件在浏览器本地解析。浏览器或操作系统可能清除本地存储，因此请定期导出 Workspace 备份。

## 开源协议

[MIT](LICENSE)
