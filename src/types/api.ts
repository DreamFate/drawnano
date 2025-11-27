import { z } from 'zod';

// 分割遮罩数据结构
export const SegmentMaskSchema = z.object({
  box_2d: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  label: z.string(),
  mask: z.string()
});

// 分割对象数据结构
export const SegmentedObjectSchema = z.object({
  id: z.string(),
  mask: SegmentMaskSchema,
  imageId: z.string(),
  selected: z.boolean(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  scale: z.number().optional()
});

// 构图数据结构
export const CompositionDataSchema = z.object({
  mode: z.enum(['basic', 'composition']),
  canvasSize: z.object({
    width: z.number(),
    height: z.number()
  })
});

// 消息内容项
export const MessageContentItemSchema = z.object({
  type: z.enum(['text', 'image_url']),
  text: z.string().optional(),
  image_url: z.object({
    url: z.string()
  }).optional()
});

// 对话消息
export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

// 模型选项
export const ModelOptionSchema = z.enum(['gemini-2.5-flash', 'gemini-3-pro']);

// 宽高比选项
export const AspectRatioSchema = z.enum(['auto','1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);

// 分辨率选项 (仅 gemini-3-pro 支持)
export const ResolutionSchema = z.enum(['1k', '2k', '4k']);

// 模态选项
export const modalitiesSchema = z.enum(['Image', 'Text', 'Image_Text']);

// 图像生成请求
export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, "提示词不能为空"),

  // 方式1: 前端组装好的完整content(用于修改模式)
  messageContent: z.array(MessageContentItemSchema).optional(),

  // 方式2: 传统参数(用于生成模式)
  referenceImages: z.array(z.string()).optional(),
  segmentedObjects: z.array(SegmentedObjectSchema).optional(),
  compositionData: CompositionDataSchema.optional(),

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

// 分割请求
export const SegmentRequestSchema = z.object({
  imageData: z.string().min(1, "图像数据不能为空")
});

// 智能构图分析数据结构
export const CompositionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['portrait', 'landscape', 'abstract', 'symmetrical', 'asymmetrical']),
  positions: z.array(z.object({
    x: z.number().min(0).max(1), // 相对位置 0-1
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
    label: z.string()
  })),
  thumbnail: z.string().optional()
});

export const CompositionSuggestionSchema = z.object({
  id: z.string(),
  confidence: z.number().min(0).max(1),
  template: CompositionTemplateSchema,
  reasoning: z.string(),
  objectPlacements: z.array(z.object({
    objectId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    scale: z.number().optional(),
    reasoning: z.string()
  }))
});

export const ImageAnalysisSchema = z.object({
  imageId: z.string(),
  dominantColors: z.array(z.string()),
  composition: z.object({
    mainSubjects: z.array(z.string()),
    focalPoints: z.array(z.object({
      x: z.number(),
      y: z.number(),
      strength: z.number()
    })),
    visualWeight: z.enum(['light', 'balanced', 'heavy']),
    style: z.enum(['realistic', 'artistic', 'abstract', 'graphic'])
  }),
  compatibilityScore: z.number().min(0).max(1).optional()
});

export const SmartLibraryAnalysisSchema = z.object({
  images: z.array(ImageAnalysisSchema),
  suggestions: z.array(CompositionSuggestionSchema),
  recommendedTemplates: z.array(CompositionTemplateSchema),
  overallCompatibility: z.number().min(0).max(1)
});

// 类型导出
export type SegmentMask = z.infer<typeof SegmentMaskSchema>;
export type SegmentedObject = z.infer<typeof SegmentedObjectSchema>;
export type CompositionData = z.infer<typeof CompositionDataSchema>;
export type MessageContentItem = z.infer<typeof MessageContentItemSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type ModelOption = z.infer<typeof ModelOptionSchema>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export type Resolution = z.infer<typeof ResolutionSchema>;
export type Modalities = z.infer<typeof modalitiesSchema>;
export type SegmentRequest = z.infer<typeof SegmentRequestSchema>;
export type CompositionTemplate = z.infer<typeof CompositionTemplateSchema>;
export type CompositionSuggestion = z.infer<typeof CompositionSuggestionSchema>;
export type ImageAnalysis = z.infer<typeof ImageAnalysisSchema>;
export type SmartLibraryAnalysis = z.infer<typeof SmartLibraryAnalysisSchema>;