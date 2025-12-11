import { z } from 'zod';
import { MessageContentItemSchema, ConversationMessageSchema } from './chat';

// ==================== 生成配置选项 ====================

// 模型选项
export const ModelOptionSchema = z.enum(['gemini-2.5-flash', 'gemini-3-pro']);

// 宽高比选项
export const AspectRatioSchema = z.enum(['auto','1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);

// 分辨率选项 (仅 gemini-3-pro 支持)
export const ResolutionSchema = z.enum(['1k', '2k', '4k']);

// 模态选项
export const modalitiesSchema = z.enum(['Image', 'Text', 'Image_Text']);

// ==================== API 请求 ====================

// 图像生成请求
export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, "提示词不能为空"),

  // 方式1: 前端组装好的完整content(用于修改模式)
  messageContent: z.array(MessageContentItemSchema).optional(),

  // 方式2: 传统参数(用于生成模式)
  referenceImages: z.array(z.string()).optional(),

  // 对话历史(用于修改模式)
  conversationHistory: z.array(ConversationMessageSchema).optional(),

  // 整体风格描述(作为 system prompt)
  systemStyle: z.string().optional(),

  // 生成配置
  model: ModelOptionSchema.optional().default('gemini-2.5-flash'),
  aspectRatio: AspectRatioSchema.optional().default('16:9'),
  resolution: ResolutionSchema.optional(), // 仅 gemini-3-pro 支持
  modalities: modalitiesSchema.optional().default('Image_Text'),

  // 自定义 API URL
  apiUrl: z.string().optional(),

  // 模型映射
  modelMapping: z.object({
    'gemini-2.5-flash': z.string(),
    'gemini-3-pro': z.string(),
  }).optional(),
});

// 生成配置类型
export const GenerationConfigSchema = z.object({
  model: ModelOptionSchema,
  aspectRatio: AspectRatioSchema,
  resolution: ResolutionSchema.optional(),
  modality: modalitiesSchema,
});

// 类型导出
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type ModelOption = z.infer<typeof ModelOptionSchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type Resolution = z.infer<typeof ResolutionSchema>;
export type Modalities = z.infer<typeof modalitiesSchema>;
export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;
