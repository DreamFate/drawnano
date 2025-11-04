import { z } from 'zod';

// 对话会话Schema
export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 聊天消息Schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  type: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
  generatedImageId: z.string().optional(), // 如果是生成图片的消息，关联图片ID
});

// 对话中的图片元数据Schema（不包含实际图片数据）
export const ConversationImageMetaSchema = z.object({
  id: z.string(),
  srcId: z.string(), // IndexedDB 中的图片ID
  prompt: z.string(),
  timestamp: z.date(),
  messageId: z.string(), // 关联的消息ID
  number: z.number(), // 在对话中的编号，用于引用
});

// 对话中的图片Schema（兼容旧版，包含 src）
export const ConversationImageSchema = ConversationImageMetaSchema.extend({
  src: z.string(),
  conversationId: z.string(),
});

// 素材元数据Schema（不包含图片数据，用于 localStorage）
export const MaterialMetaSchema = z.object({
  id: z.string(),
  number: z.number(),
  name: z.string().optional(),
  timestamp: z.date(),
});

// 素材图片Schema（包含图片数据，用于应用状态）
export const MaterialItemSchema = MaterialMetaSchema.extend({
  src: z.string(),
});

// 图片引用Schema
export const ImageReferenceSchema = z.object({
  type: z.enum(['conversation', 'material']),
  id: z.string(),
  number: z.number(),
});

// 生成请求Schema
export const GenerateRequestSchema = z.object({
  prompt: z.string(),
  conversationId: z.string(),
  referenceImages: z.array(z.string()).optional(), // base64图片数据
  selectedImageId: z.string().optional(), // 选中要修改的图片ID
  color: z.string().default('#ffffff'),
  style: z.string().default('photographic'),
  creativity: z.number().min(0).max(1).default(0.5),
});

// 完整的会话数据Schema（包含消息和图片）
export const ConversationDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messages: z.array(ChatMessageSchema),
  images: z.array(ConversationImageMetaSchema),
});

// 导出类型
export type Conversation = z.infer<typeof ConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ConversationImageMeta = z.infer<typeof ConversationImageMetaSchema>;
export type ConversationImage = z.infer<typeof ConversationImageSchema>;
export type ConversationData = z.infer<typeof ConversationDataSchema>;
export type MaterialItem = z.infer<typeof MaterialItemSchema>;
export type ImageReference = z.infer<typeof ImageReferenceSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// 用于序列化的Schema（处理Date类型）
export const ConversationSerializedSchema = ConversationSchema.extend({
  createdAt: z.string().transform((str) => new Date(str)),
  updatedAt: z.string().transform((str) => new Date(str)),
});

export const ChatMessageSerializedSchema = ChatMessageSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export const ConversationImageMetaSerializedSchema = ConversationImageMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export const ConversationImageSerializedSchema = ConversationImageSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export const ConversationDataSerializedSchema = ConversationDataSchema.extend({
  createdAt: z.string().transform((str) => new Date(str)),
  updatedAt: z.string().transform((str) => new Date(str)),
  messages: z.array(ChatMessageSerializedSchema),
  images: z.array(ConversationImageMetaSerializedSchema),
});

export const MaterialMetaSerializedSchema = MaterialMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

export const MaterialItemSerializedSchema = MaterialItemSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});
