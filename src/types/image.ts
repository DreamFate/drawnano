import { z } from 'zod';

// ==================== 图片元数据（通用） ====================

// 图片类型：生成图片 或 素材
export const ImageTypeEnum = z.enum(['generated', 'material']);
export type ImageType = z.infer<typeof ImageTypeEnum>;

// 基础元数据（带 discriminant）
export const ImageMetaBaseSchema = z.object({
  id: z.string(),
  srcId: z.string(),        // IndexedDB 中的图片ID
  prompt: z.string(),       // 生成图片的提示词 / 素材名称
  timestamp: z.date(),
  number: z.number(),       // 编号，用于引用
  type: ImageTypeEnum,      // discriminant: 区分来源
});

// 生成图片元数据
export const GeneratedImageMetaSchema = ImageMetaBaseSchema.extend({
  type: z.literal('generated'),
});

// 素材元数据
export const MaterialMetaSchema = ImageMetaBaseSchema.extend({
  type: z.literal('material'),
  // 将来可扩展：category, tags 等
});

// 联合类型：任意图片元数据
export const ImageMetaSchema = z.discriminatedUnion('type', [
  GeneratedImageMetaSchema,
  MaterialMetaSchema,
]);

// 序列化版本（用于从 localStorage 解析）
export const GeneratedImageMetaSerializedSchema = GeneratedImageMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
}).omit({ timestamp: true }).extend({ timestamp: z.string().transform((str) => new Date(str)) });

export const MaterialMetaSerializedSchema = MaterialMetaSchema.extend({
  timestamp: z.string().transform((str) => new Date(str)),
}).omit({ timestamp: true }).extend({ timestamp: z.string().transform((str) => new Date(str)) });

// 带 src 的版本（用于显示）
export const GeneratedImageWithSrcSchema = GeneratedImageMetaSchema.extend({
  src: z.string(),
});

export const MaterialWithSrcSchema = MaterialMetaSchema.extend({
  src: z.string(),
});

// 类型导出
export type ImageMetaBase = z.infer<typeof ImageMetaBaseSchema>;
export type GeneratedImageMeta = z.infer<typeof GeneratedImageMetaSchema>;
export type MaterialMeta = z.infer<typeof MaterialMetaSchema>;
export type ImageMeta = z.infer<typeof ImageMetaSchema>;
export type GeneratedImageWithSrc = z.infer<typeof GeneratedImageWithSrcSchema>;
export type MaterialWithSrc = z.infer<typeof MaterialWithSrcSchema>;
export type ImageWithSrc = GeneratedImageWithSrc | MaterialWithSrc;

// ==================== 图片引用 ====================

export const ImageReferenceSchema = z.object({
  type: ImageTypeEnum,
  id: z.string(),
  originalNumber: z.number(),
  displayName: z.string(),
  src: z.string(),
});

export type ImageReference = z.infer<typeof ImageReferenceSchema>;
