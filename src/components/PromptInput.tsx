"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithSrc, ImageReference, ModelOption, AspectRatio, Resolution, Modalities, GenerationConfig } from '@/types';
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
    generationConfig: GenerationConfig;
    onConfigChange: (config: GenerationConfig) => void;
}

const MODEL_OPTIONS: { value: ModelOption; label: string }[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
];

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
    { value: 'Text', label: '文本' },
];

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
    generationConfig,
    onConfigChange,
}: PromptInputProps) {
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
                            ):(
                                <InputGroupText className="text-xs min-h-[25px] flex items-center">无</InputGroupText>
                            )}
                        </InputGroupAddon>
                        <InputGroupAddon align="block-end">
                            <div className="flex items-center gap-2">
                                {/* 配置下拉菜单 */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={isGenerating}>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                            {MODEL_OPTIONS.find(m => m.value === generationConfig.model)?.label}
                                            <span className="text-muted-foreground">|</span>
                                            {generationConfig.aspectRatio}
                                            {generationConfig.model === 'gemini-3-pro' && generationConfig.resolution && (
                                                <>
                                                    <span className="text-muted-foreground">|</span>
                                                    {generationConfig.resolution.toUpperCase()}
                                                </>
                                            )}
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {/* 模型选择 */}
                                        <DropdownMenuLabel className="text-xs">模型</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={generationConfig.model}
                                            onValueChange={(value) =>
                                                onConfigChange({
                                                    ...generationConfig,
                                                    model: value as ModelOption,
                                                    resolution: value === 'gemini-2.5-flash' ? undefined : (generationConfig.resolution || '1k')
                                                })
                                            }
                                        >
                                            {MODEL_OPTIONS.map(opt => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        {/* 宽高比选择 */}
                                        <DropdownMenuLabel className="text-xs">宽高比</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={generationConfig.aspectRatio}
                                            onValueChange={(value) =>
                                                onConfigChange({ ...generationConfig, aspectRatio: value as AspectRatio })
                                            }
                                        >
                                            {ASPECT_RATIO_OPTIONS.map(opt => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        {/* 分辨率选择 - 仅 gemini-3-pro 显示 */}
                                        {generationConfig.model === 'gemini-3-pro' && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="text-xs">分辨率</DropdownMenuLabel>
                                                <DropdownMenuRadioGroup
                                                    value={generationConfig.resolution || '1k'}
                                                    onValueChange={(value) =>
                                                        onConfigChange({ ...generationConfig, resolution: value as Resolution })
                                                    }
                                                >
                                                    {RESOLUTION_OPTIONS.map(opt => (
                                                        <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                            {opt.label}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={isGenerating}>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                            {MODALITIES_OPTIONS.find(m => m.value === generationConfig.modality)?.label}

                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">

                                        {/* 输出类型选择 */}
                                        <DropdownMenuLabel className="text-xs">输出类型</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={generationConfig.modality}
                                            onValueChange={(value) =>
                                                onConfigChange({ ...generationConfig, modality: value as Modalities })
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
