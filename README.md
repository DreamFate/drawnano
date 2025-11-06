# DrawNano - AI 图片生成与编辑工具

一个基于 Gemini Nano Banana的强大,提供图片生成与编辑工具。

## ✨ 核心特性

### 1. 文本生成图片
通过简单的文字描述,即可生成高质量的图片。只需输入你的创意想法,AI 将为你创造出精美的视觉作品。

### 2. 图片智能修改
使用文本描述对现有图片进行修改和优化。告诉 AI 你想要改变的内容,它会精准地调整图片以符合你的需求。

### 3. 素材融合创作
支持引用素材图片与文本描述相结合,生成或修改图片。将你的参考图片与创意描述融合,创造出独特的作品。

### 4. 多轮对话优化
通过多轮对话与 AI 交互,逐步完善和优化你的图片。每一次对话都能让作品更接近你的理想效果。

## 🔧 技术架构

### AI 模型
- **API供应商**: [DeepClaude](https://erlich.fun/deepclaude-pricing) - 使用 OpenAI 兼容的 API 结构
- **图片生成模型**: Gemini Nano Banana - 提供高质量的图片生成能力

### 技术栈
- **框架**: Next.js 15.5.2
- **UI 库**: React 19.1.0
- **样式**: Tailwind CSS 4
- **UI 组件**: Shadcn UI
- **图标**: Lucide React
- **类型检查**: TypeScript 5

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

### 构建生产版本

```bash
npm run build
npm start
```

## 📝 使用说明

1. **文本生成图片**: 在输入框中描述你想要生成的图片内容,点击生成按钮
2. **修改图片**: 上传图片后,输入修改描述,AI 将根据你的要求调整图片
3. **素材融合**: 上传参考图片,结合文本描述生成新的创意作品
4. **对话优化**: 对生成的图片不满意?继续对话,告诉 AI 需要调整的地方

## 🔑 配置要求

使用本项目需要配置以下 API:
- DeepClaude API 密钥
- Gemini Nano Banana 访问权限

请参考 [DeepClaude 定价页面](https://erlich.fun/deepclaude-pricing) 获取 API 密钥。

## 📦 项目结构

```
drawnano/
├── app/              # Next.js 应用目录
├── components/       # React 组件
├── lib/             # 工具函数和配置
├── public/          # 静态资源
└── styles/          # 样式文件
```
