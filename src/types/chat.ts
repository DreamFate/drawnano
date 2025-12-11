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

// 对话消息（用于 API）
export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

// 消息内容项
export const MessageContentItemSchema = z.object({
  type: z.enum(['text', 'image_url']),
  text: z.string().optional(),
  image_url: z.object({
    url: z.string()
  }).optional()
});

export type MessageContentItem = z.infer<typeof MessageContentItemSchema>;
