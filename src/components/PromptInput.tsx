"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithSrc,
    ImageReference,
    AspectRatio, Resolution, Modalities, ModelConfig, ModelSelect } from '@/types';
import { MODEL_CONFIG_MAP } from '@/config/model-config';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

interface PromptInputProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    apiKey: string;
    selectedImage: ImageWithSrc | null;
    referencedItems: ImageReference[];
    onRemoveReference: (id: string) => void;
    onClearReferences: () => void;
    hasImages: boolean;
    hasMaterials: boolean;
    // 生成配置
    modelConfig: ModelConfig;
    onConfigChange: (config: ModelConfig) => void;
}

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
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

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
    { value: '1k', label: '1K' },
    { value: '2k', label: '2K' },
    { value: '4k', label: '4K' },
];

const MODALITIES_OPTIONS: { value: Modalities; label: string }[] = [
    { value: 'Image_Text', label: '图片+文本' },
    { value: 'Image', label: '图片' },
];

// 从配置映射表生成选项列表
const MODEL_SELECT_OPTIONS = Object.entries(MODEL_CONFIG_MAP).map(([value, config]) => ({
    value: value as ModelSelect,
    label: config.label,
}));

// 获取模型信息
const getModelInfo = (modelSelect: ModelSelect) => {
    const config = MODEL_CONFIG_MAP[modelSelect];
    return { modeltype: config.modeltype, model: config.model };
};

// 检查模型是否支持分辨率
const supportsResolution = (modelSelect: ModelSelect) => {
    return MODEL_CONFIG_MAP[modelSelect].supportsResolution;
};

// 检查模型是否支持图像配置
const supportsImageConfig = (modelSelect: ModelSelect) => {
    return MODEL_CONFIG_MAP[modelSelect].supportsImageConfig;
};

export function PromptInput({
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    apiKey,
    selectedImage,
    referencedItems,
    onRemoveReference,
    onClearReferences,
    hasImages,
    hasMaterials,
    modelConfig,
    onConfigChange,
}: PromptInputProps) {
    // 处理模型选择变化
    const handleModelSelectChange = (modelSelect: ModelSelect) => {
        const modelInfo = getModelInfo(modelSelect);
        const newConfig: ModelConfig = {
            ...modelConfig,
            modelselect: modelSelect,
            modeltype: modelInfo.modeltype
        };

        // 根据模型类型设置参数
        if (modelInfo.modeltype === 'word') {
            // 文字模型:所有图像参数设为 null
            newConfig.aspectRatio = null;
            newConfig.resolution = null;
            newConfig.modality = null;
        } else if (modelSelect === 'gemini-2.5-flah-image') {
            // Gemini 2.5 Flash: 不支持分辨率
            newConfig.resolution = null;
            newConfig.aspectRatio = newConfig.aspectRatio || 'auto';
            newConfig.modality = newConfig.modality || 'Image_Text';
        } else {
            // Gemini 3 Pro Image: 支持所有参数
            newConfig.aspectRatio = newConfig.aspectRatio || 'auto';
            newConfig.resolution = newConfig.resolution || '1k';
            newConfig.modality = newConfig.modality || 'Image_Text';
        }

        onConfigChange(newConfig);
    };

    const currentModelSelect = modelConfig.modelselect || 'gemini-3-pro-image';
    const showImageConfig = supportsImageConfig(currentModelSelect);
    const showResolution = supportsResolution(currentModelSelect);

    return (
        <div className="h-full p-2 bg-white dark:bg-gray-900">
            <div className="h-full">
                <InputGroup>
                    <InputGroupTextarea
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder={
                            selectedImage
                                ? "选中的图片标记为'图1',引用列表从'图2'开始,在提示词中使用这些编号来描述..."
                                : "描述你想生成什么样的图片,或引用素材和生图,引用列表中的图片按顺序对应'图1、图2...'，在提示词中使用这些编号来描述..."
                        }
                        className="flex-1 min-h-[120px] max-h-[120px] resize-none text-sm overflow-y-auto"
                        disabled={isGenerating}
                    />
                    <InputGroupAddon align="block-start">
                        <InputGroupText className='text-xs'>引用列表:</InputGroupText>
                        {referencedItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">

                                {referencedItems.map((item, index) => {
                                    const imageNumber = selectedImage ? index + 2 : index + 1;
                                    return (
                                        <Badge
                                            key={item.id}
                                            variant="secondary"
                                            className="pl-2 pr-1 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700"
                                        >
                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                图{imageNumber} - {item.displayName}
                                            </span>
                                            <InputGroupButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveReference(item.id)}
                                                className="ml-1 h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                                            >
                                                <span className="text-xs text-red-600 dark:text-red-400">×</span>
                                            </InputGroupButton>
                                        </Badge>
                                    );
                                })}
                                <InputGroupButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearReferences}
                                    className="h-6 text-xs "
                                >
                                    清空
                                </InputGroupButton>
                            </div>
                        ) : (
                            <InputGroupText className="text-xs min-h-[25px] flex items-center">无</InputGroupText>
                        )}
                    </InputGroupAddon>
                    <InputGroupAddon align="block-end">
                        <div className="flex items-center gap-2">
                            {/* 模型选择 */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={isGenerating}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                        {MODEL_SELECT_OPTIONS.find(m => m.value === currentModelSelect)?.label}
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">选择模型</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={currentModelSelect}
                                        onValueChange={(value) => handleModelSelectChange(value as ModelSelect)}
                                    >
                                        {MODEL_SELECT_OPTIONS.map(opt => (
                                            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* 输出类型 - 仅图像模型显示 */}
                            {showImageConfig && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={isGenerating}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                        {MODALITIES_OPTIONS.find(m => m.value === modelConfig.modality)?.label || '输出类型'}
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">输出类型</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={modelConfig.modality || undefined}
                                        onValueChange={(value) =>
                                            onConfigChange({ ...modelConfig, modality: value as Modalities })
                                        }
                                    >
                                        {MODALITIES_OPTIONS.map(opt => (
                                            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}

                            {/* 分辨率 - 仅 Gemini 3 Pro Image 显示 */}
                            {showResolution && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={isGenerating}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                        {RESOLUTION_OPTIONS.find(m => m.value === modelConfig.resolution)?.label || '分辨率'}
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">分辨率</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={modelConfig.resolution || undefined}
                                        onValueChange={(value) =>
                                            onConfigChange({ ...modelConfig, resolution: value as Resolution })
                                        }
                                    >
                                        {RESOLUTION_OPTIONS.map(opt => (
                                            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}

                            {/* 宽高比 - 仅图像模型显示 */}
                            {showImageConfig && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={isGenerating}>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                        {ASPECT_RATIO_OPTIONS.find(m => m.value === modelConfig.aspectRatio)?.label || '宽高比'}
                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="text-xs">宽高比</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup
                                        value={modelConfig.aspectRatio || undefined}
                                        onValueChange={(value) =>
                                            onConfigChange({ ...modelConfig, aspectRatio: value as AspectRatio })
                                        }
                                    >
                                        {ASPECT_RATIO_OPTIONS.map(opt => (
                                            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                        </div>
                        <InputGroupButton
                            onClick={onGenerate}
                            disabled={!apiKey.trim() || !prompt.trim() || isGenerating}
                            size="sm"
                            className="ml-auto"
                            variant="outline"
                        >
                            {isGenerating
                                ? '生成中...'
                                : selectedImage
                                    ? '修改图片'
                                    : '生成图片'
                            }
                            <kbd>⏎</kbd>
                        </InputGroupButton>

                    </InputGroupAddon>
                </InputGroup>

            </div>
        </div>
    );
}
