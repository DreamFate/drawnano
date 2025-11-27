import { z } from 'zod';

// ==================== 聊天消息 ====================

export const ChatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
  generatedImageId: z.string().optional(),
  error: z.string().optional(), // 错误信息（如大模型返回的错误）
});

export const ChatMessageSerializedSchema = ChatMessageSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ==================== 图片元数据（通用） ====================

export const ImageMetaSchema = z.object({
  id: z.string(),
  srcId: z.string(),        // IndexedDB 中的图片ID
  prompt: z.string(),       // 生成图片的提示词 / 素材名称
  timestamp: z.date(),
  messageId: z.string(),    // 关联的消息ID（素材为空字符串）
  number: z.number(),       // 编号，用于引用
});

export const ImageMetaSerializedSchema = ImageMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export const ImageWithSrcSchema = ImageMetaSchema.extend({
  src: z.string(),
});

export type ImageMeta = z.infer<typeof ImageMetaSchema>;
export type ImageWithSrc = z.infer<typeof ImageWithSrcSchema>;

// 兼容旧代码的别名
export const ConversationImageMetaSchema = ImageMetaSchema;
export const ConversationImageMetaSerializedSchema = ImageMetaSerializedSchema;
export const MaterialMetaSchema = ImageMetaSchema;
export const MaterialMetaSerializedSchema = ImageMetaSerializedSchema;
export const MaterialItemSchema = ImageMetaSchema;
export const MaterialItemSerializedSchema = ImageMetaSerializedSchema;

export type ConversationImageMeta = ImageMeta;
export type MaterialItem = ImageMeta;

// ==================== 图片引用 ====================

export const ImageReferenceSchema = z.object({
  type: z.enum(['image', 'material']),
  id: z.string(),
  number: z.number(),
});

export type ImageReference = z.infer<typeof ImageReferenceSchema>;
