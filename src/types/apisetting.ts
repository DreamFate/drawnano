import { z } from 'zod';
import { modelselectSchema } from '@/types';

export const ApiSettingSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string(),
  styleGeneratorPrompt: z.string(), // 生成风格功能的系统提示词
  wordDefaultPrompt: z.string(), // 文字模型默认提示词
  modelList: z.array(
    z.object({
      modelselect: modelselectSchema,
      model: z.string(),
    })
  ),
});

export type ApiSetting = z.infer<typeof ApiSettingSchema>;
