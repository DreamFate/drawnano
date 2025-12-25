import { z } from 'zod';

// ==================== 思路签名元数据 ====================

// 基础元数据
export const ThoughtSignatureMetaSchema = z.object({
  id: z.string(),
  srcId: z.string(),        // IndexedDB 中的签名ID
  timestamp: z.date(),
  messageId: z.string(),    // 关联的消息ID
});

// 序列化版本（用于从 localStorage 解析）
export const ThoughtSignatureMetaSerializedSchema = ThoughtSignatureMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
}).omit({ timestamp: true }).extend({ timestamp: z.string().transform((str) => new Date(str)) });

// 带 src 的版本（用于显示）
export const ThoughtSignatureWithSrcSchema = ThoughtSignatureMetaSchema.extend({
  src: z.string(),          // base64 内容
});

// 类型导出
export type ThoughtSignatureMeta = z.infer<typeof ThoughtSignatureMetaSchema>;
export type ThoughtSignatureWithSrc = z.infer<typeof ThoughtSignatureWithSrcSchema>;
