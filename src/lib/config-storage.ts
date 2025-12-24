import { ModelConfig } from '@/types';

const STORAGE_KEY = 'drawnano_generation_config';

export const DEFAULT_GENERATION_CONFIG: ModelConfig = {
  modeltype: 'image',
  modelselect: 'gemini-3-pro-image',
  aspectRatio: 'auto',
  resolution: '1k',
  modality: 'Image_Text',
};

/**
 * 从 localStorage 读取生成配置
 */
export function loadGenerationConfig(): ModelConfig {
  if (typeof window === 'undefined') return DEFAULT_GENERATION_CONFIG;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ModelConfig;
      return { ...DEFAULT_GENERATION_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load generation config:', error);
  }
  return DEFAULT_GENERATION_CONFIG;
}

/**
 * 保存生成配置到 localStorage
 */
export function saveGenerationConfig(config: ModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save generation config:', error);
  }
}
