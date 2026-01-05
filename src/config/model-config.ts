import { ModelSelect, ModelType, ThinkLevel, AspectRatio,Resolution,Modalities} from '@/types';

// 模型能力类型
export type ModelCapability = 'resolution' | 'imageConfig' | 'thinkLevel';

type ModelConfigItem = {
    modeltype: ModelType;
    model: string;
    label: string;
    capabilities: ModelCapability[];  // 使用能力数组替代多个布尔字段
    availableThinkLevels?: ThinkLevel[];  // 可用的思考水平选项
};

export const MODEL_CONFIG_MAP: Record<ModelSelect, ModelConfigItem> = {
    'gemini-3-pro-image': {
        modeltype: 'image',
        model: 'gemini-3-pro-image-preview',
        label: 'Gemini 3 Pro Image',
        capabilities: ['resolution', 'imageConfig'],
    },
    'gemini-2.5-flah-image': {
        modeltype: 'image',
        model: 'gemini-2.5-flash-image',
        label: 'Gemini 2.5 Flash Image',
        capabilities: ['imageConfig'],
    },
    'gemini-3-pro': {
        modeltype: 'word',
        model: 'gemini-3-pro',
        label: 'Gemini 3 Pro',
        capabilities: ['thinkLevel'],
        availableThinkLevels: ['high', 'low'],  // 目前只支持高和低
    },
    'gemini-3-flash': {
        modeltype: 'word',
        model: 'gemini-3-flash',
        label: 'Gemini 3 Flash',
        capabilities: ['thinkLevel'],
        availableThinkLevels: ['high', 'medium', 'low', 'minimal'],  // 支持所有选项
    },
};
export type ModelConfigKey = keyof typeof MODEL_CONFIG_MAP;

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
    { value: 'auto', label: 'auto' },
    { value: '1:1', label: '1:1' },
    { value: '2:3', label: '2:3' },
    { value: '3:2', label: '3:2' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' },
    { value: '4:5', label: '4:5' },
    { value: '5:4', label: '5:4' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' },
    { value: '21:9', label: '21:9' },
];

export const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
];

export const MODALITIES_OPTIONS: { value: Modalities; label: string }[] = [
    { value: 'Image_Text', label: '图片+文本' },
    { value: 'Image', label: '图片' },
];

export const THINK_LEVEL_OPTIONS: { value: ThinkLevel | 'default'; label: string }[] = [
    { value: 'default', label: '默认' },
    { value: 'high', label: '高(high)' },
    { value: 'medium', label: '中(medium)' },
    { value: 'low', label: '低(low)' },
    { value: 'minimal', label: '最小(minimal)' },
];

// 从配置映射表生成选项列表
export const MODEL_SELECT_OPTIONS = Object.entries(MODEL_CONFIG_MAP).map(([value, config]) => ({
    value: value as ModelSelect,
    label: config.label,
}));


