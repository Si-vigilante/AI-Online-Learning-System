# 知域 AI 智能教学系统（AI-Driven Online Learning System）

> 一个融合大语言模型的综合在线教学平台，覆盖“教—学—练—评”全流程，支持学生、教师与 AI 助教多角色协同。

---

## 一、项目简介

“知域 AI 智能教学系统”是一套 AI 驱动的线上课程系统，旨在通过引入大语言模型与智能化教学工具，提升在线教学的互动性、个性化水平与教学评估效率。系统覆盖从教材制作、课程学习、测验练习到学习评估与数据分析的完整教学流程，强调功能真实可用与教学场景的实际落地。

本项目为课程期末设计项目，**由本人独立完成系统整体架构设计、前后端功能实现及 AI 能力整合**，具备完整的演示与本地运行能力。

---

## 二、系统功能概述

### 1. 学生端功能
- 学生首页与学习概览
- 待办清单（新增 / 编辑 / 勾选 / 删除，本地持久化）
- 课程中心（选课 / 退课 / 标签筛选 / 搜索）
- 课程详情页（章节结构、学习路径、资料下载）
- 视频播放（倍速、字幕、静音、进度记录）
- 视频笔记与随堂小测联动
- AI 助教（翻译 / 整理 / 答疑 / 出题 / 评分，支持流式输出与语音输入）
- AI 测验（组卷、在线作答、计时、防作弊标记、结果解析）
- AI 报告（上传、解析、优秀范例对照、智能批改）
- 学习画像与数据可视化
- StudyHub 学习论坛与互助问答
- 冥想自习室（环境音、番茄钟）
- 个人资料与系统设置

### 2. 教师端功能
- 课程创建与管理
- 教材制作模块  
  - 文本转 PPT（基于 pptxgenjs）
  - PPT 转视频（PDF 渲染 + 视频上传）
- AI 出题与题库管理
- 报告任务布置与 AI 批改
- 教学过程数据查看

### 3. AI 能力支持
- 统一 AI 接口 `/api/ai`
- 对接 ModelScope DeepSeek-V3.2、豆包等国产大模型
- 支持任务：
  - 教学答疑
  - 自动出题
  - 智能评分
  - 报告解析与评估
- AI 输出结构化 JSON，便于前端解析与展示

---

## 三、系统架构设计

系统采用前后端分离架构设计：

- **前端**：React 18 + TypeScript + Vite  
- **后端**：Node.js + Express + Socket.IO  
- **数据存储**：lowdb（JSON 文件数据库）  
- **状态管理**：localStorage + 事件广播  
- **AI 服务**：ModelScope API（DeepSeek-V3.2）、豆包大模型  
- **多媒体处理**：
  - PPT 生成：pptxgenjs
  - PDF / PPT 渲染：pdfjs-dist + @napi-rs/canvas
  - 视频存储与转码：火山引擎 TOS / VOD

系统结构清晰、模块解耦，便于后续扩展与维护。

---

## 四、技术栈

### 前端技术
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- lucide-react
- embla-carousel
- recharts

### 后端技术
- Node.js
- Express
- Socket.IO
- lowdb
- multer

---

## 五、本地运行说明

### 1. 环境要求
- Node.js ≥ 18
- npm ≥ 9

### 2. 安装依赖
```bash
npm install


  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
