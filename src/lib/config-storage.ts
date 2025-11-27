import { GenerationConfig } from '@/components/PromptInput';

const STORAGE_KEY = 'drawnano_generation_config';

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  model: 'gemini-2.5-flash',
  aspectRatio: '16:9',
  modality: 'Image_Text',
};

/**
 * 从 localStorage 读取生成配置
 */
export function loadGenerationConfig(): GenerationConfig {
  if (typeof window === 'undefined') return DEFAULT_GENERATION_CONFIG;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GenerationConfig;
    }
  } catch (error) {
    console.error('Failed to load generation config:', error);
  }
  return DEFAULT_GENERATION_CONFIG;
}

/**
 * 保存生成配置到 localStorage
 */
export function saveGenerationConfig(config: GenerationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save generation config:', error);
  }
}
