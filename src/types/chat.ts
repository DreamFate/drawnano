import { z } from 'zod';

// ==================== 聊天消息 ====================

export const roleSchema = z.enum(['user','model']);

export const apiErrorMessageSchema = z.object({
  code:z.string(),
  messages: z.string(),
  status: z.string(),
});

// 对话消息(存储)
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: roleSchema,
  text: z.string(),
  thought: z.string().optional(),
  isImage: z.boolean().optional(),
  timestamp: z.date(),
  error: apiErrorMessageSchema.optional(), // 错误信息（如大模型返回的错误）
});

export const ChatMessageSerializedSchema = ChatMessageSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
});

// 对话内容
export const contentsSchema = z.array(z.object({
  role: roleSchema.optional(),
  parts: z.array(z.object({
    text: z.string(),
  })),
}));

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ApiErrorMessage = z.infer<typeof apiErrorMessageSchema>;
export type Contents = z.infer<typeof contentsSchema>;
