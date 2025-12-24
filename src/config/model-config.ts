import { ModelSelect, ModelType } from '@/types';

type ModelConfigItem = {
    modeltype: ModelType;
    model: string;
    label: string;
    supportsResolution: boolean;
    supportsImageConfig: boolean;
};

export const MODEL_CONFIG_MAP: Record<ModelSelect, ModelConfigItem> = {
    'gemini-3-pro-image': {
        modeltype: 'image',
        model: 'gemini-3-pro-image-preview',
        label: 'Gemini 3 Pro Image',
        supportsResolution: true,
        supportsImageConfig: true,
    },
    'gemini-2.5-flah-image': {
        modeltype: 'image',
        model: 'gemini-2.5-flash',
        label: 'Gemini 2.5 Flash Image',
        supportsResolution: false,
        supportsImageConfig: true,
    },
    'gemini-3-pro': {
        modeltype: 'word',
        model: 'gemini-3-pro',
        label: 'Gemini 3 Pro',
        supportsResolution: false,
        supportsImageConfig: false,
    },
};

export type ModelConfigKey = keyof typeof MODEL_CONFIG_MAP;
