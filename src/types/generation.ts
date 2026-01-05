import { z } from 'zod';
import { contentsSchema } from './chat';

// ==================== 生成配置选项 ====================

// 宽高比选项
export const AspectRatioSchema = z.enum(['auto','1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);

// 分辨率选项 (仅 gemini-3-pro 支持)
export const ResolutionSchema = z.enum(['1K', '2K', '4K']);

// 模态选项
export const modalitiesSchema = z.enum(['Image', 'Image_Text']);

// 模型类型
export const modeltypeSchema = z.enum(['image', 'word']);

// 模型类型
export const modelselectSchema = z.enum(['gemini-3-pro-image', 'gemini-2.5-flah-image', 'gemini-3-pro','gemini-3-flash']);

// 思考水平
export const thinkLevelSchema = z.enum(['high','low','minimal','medium'])



// 生成配置类型
export const modelConfigSchema = z.object({
  modeltype: modeltypeSchema.optional().default('image'),
  modelselect: modelselectSchema.optional().default('gemini-3-pro-image'),
  aspectRatio: AspectRatioSchema.nullable().optional(),
  resolution: ResolutionSchema.nullable().optional(),
  modality: modalitiesSchema.nullable().optional(),
  enableThinking: z.boolean().nullable().optional(),  // 是否启用思考总结
  thinkLevel: thinkLevelSchema.nullable().optional(),
});

// ==================== API 请求 ====================

// 图像生成请求
export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, "提示词不能为空"),
  model: z.string().optional().default('gemini-3-pro-image-preview'),
  referenceImages: z.array(z.string()).optional(),
  conversationHistory: contentsSchema.optional(),
  systemStyle: z.string().optional(),
  modelConfig: modelConfigSchema.optional(),
  apiUrl: z.string().optional(),
});

// 类型导出
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type Resolution = z.infer<typeof ResolutionSchema>;
export type Modalities = z.infer<typeof modalitiesSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type ModelType = z.infer<typeof modeltypeSchema>;
export type ModelSelect = z.infer<typeof modelselectSchema>;
export type ThinkLevel = z.infer<typeof thinkLevelSchema>;
