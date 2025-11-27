/**
 * 应用设置存储模块
 */

const SETTINGS_KEY = 'drawnano_settings';

export interface AppSettings {
  apiKey: string;
  apiUrl: string;
  styleGeneratorPrompt: string; // 生成风格功能的系统提示词
  styleGeneratorModel: string; // 生成风格时使用的模型
  modelMapping: {
    'gemini-2.5-flash': string;
    'gemini-3-pro': string;
  };
}

export const DEFAULT_STYLE_GENERATOR_PROMPT = `你是一个专业的图像风格分析师。请分析用户提供的图片，提取其整体视觉风格特征，生成一段简洁的风格描述提示词。

要求：
1. 描述应该简洁有力，适合作为图像生成的风格指导
2. 包含：色调、光影、氛围、艺术风格、质感等关键特征
3. 使用中文描述
4. 长度控制在50-150字之间
5. 直接输出风格描述，不要有多余的解释`;

export const DEFAULT_MODEL_MAPPING = {
  'gemini-2.5-flash': 'gemini-2.5-flash-image-preview',
  'gemini-3-pro': 'gemini-3-pro-image-preview',
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiUrl: 'https://openai.weavex.tech/v1/chat/completions',
  styleGeneratorPrompt: DEFAULT_STYLE_GENERATOR_PROMPT,
  styleGeneratorModel: 'gemini-2.5-flash',
  modelMapping: DEFAULT_MODEL_MAPPING,
};

/**
 * 从 localStorage 读取设置
 */
export function loadSettings(): AppSettings {
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
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * 更新部分设置
 */
export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const updated = { ...current, ...partial };
  saveSettings(updated);
  return updated;
}
