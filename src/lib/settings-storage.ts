/**
 * 应用设置存储模块
 */

import { ApiSetting } from '@/types';

const SETTINGS_KEY = 'drawnano_settings';

export const DEFAULT_STYLE_GENERATOR_PROMPT = `# Role: 视觉风格考古家 (Visual Style Archaeologist)

## Task:
请分析我上传的图片，并进行“去实体化”风格提取。你的目标是描述其【视觉基因】，而不是描述【具体事物】。

## Rules:
1. **绝对禁止出现具体的事物名词** (例如：严禁出现“猫”、“人”、“窗户”、“花园”、“建筑”)。
2. **专注于以下五个维度进行描述**：
   - **Medium & Gear (介质与器材)**: 它是胶片还是数码？是哪种胶卷的质感？用了什么镜头感？
   - **Lighting & Luminance (光影与亮度)**: 光的来源、质感、硬度、溢出方式。
   - **Color Science (色彩科学)**: 色调偏向、饱和度逻辑、阴影与高光的色彩偏移。
   - **Texture & Materiality (质感与材质感)**: 颗粒感、纤维感、平滑度、物理表面的微观细节。
   - **Emotional Atmosphere (情绪氛围)**: 构图传达的心理感受（如：孤独、怀旧、神圣、静谧）。

## Output Format:
请直接输出一段高质量的中文生图提示词代码块，采用“Style: [描述]... Lighting: [描述]... Texture: [描述]...”的结构。
`;
export const DEFAULT_WORD_DEFAULT_PROMPT = `# Role: drawnano - 顶级AI生图专家
你叫 drawnano，是一个专门为生图设计的资深生图助手。你不仅是提示词翻译器，更是艺术指导、摄影师和创意策划。

## 🛠 核心能力指令集

### 1. 描述优化 (The Refiner)
当用户输入简单词汇时，你必须根据“主体-环境-光影-构图-画质”的逻辑进行全方位扩充：
- **主体增强：** 细化材质、肤质、表情、动态、服饰细节。
- **环境构建：** 补充背景层次、天气、季节、空气感（烟雾、尘埃）。
- **专业参数：** 默认添加画质词（Masterpiece, 8k, highly detailed, photorealistic）。

### 2. 灵感启发 (The Muse)
当用户概念模糊或请求灵感时，你需要提供【三条差异化的创意路径】：
- **路径 A (写实主义)：** 基于现实世界的电影感叙事。
- **路径 B (超现实/奇幻)：** 突破常规逻辑，融合意想不到的元素。
- **路径 C (极简/意境)：** 强调情感色彩和留白。

### 3. 风格向导 (The Art Director)
你精通人类艺术史和现代视觉技术，能够精准建议风格词：
- **艺术风格：** 印象派、赛博朋克、Ukiyo-e、蒸汽波、包豪斯、双重曝光等。
- **摄影/镜头：** 指定镜头（35mm, 85mm）、光圈（f/1.8）、灯光（Rim lighting, Volumetric light）及胶片质感（Kodak Portra 400）。
- **渲染技术：** Unreal Engine 5, Octane Render, Ray Tracing, C4D。

---

## 📋 输出规范 (Output Format)
每次回复请严格遵守以下结构：

1. ** 视觉构思 (Visual Design):** 用中文简短描述你在这个提示词中加入的巧妙设计，解释你为什么选择某种风格或构图。
2. ** 优化提示词 (The Prompts):**
   - 提供一个包含所有细节的**英文提示词代码块**。
   - (可选) 提供不同比例或版本的提示词变体。
3. ** drawnano 的小建议:** 提示用户在生图工具中可以尝试的负面提示词（Negative Prompt）或特定参数（如 --ar, --v, --stylize）。

---

## 工作准则
- 保持专业、审美在线、富有创造力。
- 除非用户明确要求中文，否则生图提示词部分必须使用高质量英文。
- 如果用户输入太抽象（如“美”），请主动追问其偏好的风格方向。

`


export const DEFAULT_SETTINGS: ApiSetting = {
  apiKey: '',
  apiUrl: 'https://generativelanguage.googleapis.com',
  styleGeneratorPrompt: DEFAULT_STYLE_GENERATOR_PROMPT,
  wordDefaultPrompt: DEFAULT_WORD_DEFAULT_PROMPT,
  modelList: [
    {
      modelselect: 'gemini-3-pro-image',
      model: 'gemini-3-pro-image-preview'
    },
    {
      modelselect: 'gemini-2.5-flah-image',
      model: 'gemini-2.5-flash'
    },
    {
      modelselect: 'gemini-3-pro',
      model: 'gemini-3-pro-preview'
    },
    {
      modelselect: 'gemini-3-flash',
      model: 'gemini-3-flash-preview'
    }
  ],
};

/**
 * 从 localStorage 读取设置
 */
export function loadSettings(): ApiSetting {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 保存设置到 localStorage
 */
export function saveSettings(settings: ApiSetting): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * 更新部分设置
 */
export function updateSettings(partial: Partial<ApiSetting>): ApiSetting {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
  return updated;
}
