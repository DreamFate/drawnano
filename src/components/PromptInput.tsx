"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithSrc,
    ImageReference,
    AspectRatio, Resolution, Modalities, ModelConfig, ModelSelect, ThinkLevel } from '@/types';
import {
    MODEL_CONFIG_MAP,
    ModelCapability,
    ASPECT_RATIO_OPTIONS,
    RESOLUTION_OPTIONS,
    MODALITIES_OPTIONS,
    THINK_LEVEL_OPTIONS,
    MODEL_SELECT_OPTIONS,
 } from '@/config/model-config';
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
import { ChevronDown, Lightbulb } from 'lucide-react';

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





// 获取模型信息
const getModelInfo = (modelSelect: ModelSelect) => {
    const config = MODEL_CONFIG_MAP[modelSelect];
    return { modeltype: config.modeltype, model: config.model };
};

// 检查模型是否支持某个能力
const hasCapability = (modelSelect: ModelSelect, capability: ModelCapability) => {
    return MODEL_CONFIG_MAP[modelSelect].capabilities.includes(capability);
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
    // 思考总结开关状态(基于 modelConfig.enableThinking)
    const thinkingEnabled = modelConfig.enableThinking === true;

    // 监听 Ctrl+Enter 快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                // 检查是否满足生成条件
                if (apiKey.trim() && prompt.trim() && !isGenerating) {
                    onGenerate();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [apiKey, prompt, isGenerating, onGenerate]);
    // 处理模型选择变化
    const handleModelSelectChange = (modelSelect: ModelSelect) => {
        const modelInfo = getModelInfo(modelSelect);
        const newConfig: ModelConfig = {
            ...modelConfig,
            modelselect: modelSelect,
            modeltype: modelInfo.modeltype
        };

        // 根据模型能力设置参数
        if (modelInfo.modeltype === 'word') {
            // 文字模型:清空图像参数,重置思考相关配置
            newConfig.aspectRatio = null;
            newConfig.resolution = null;
            newConfig.modality = null;
            newConfig.enableThinking = null;  // 默认关闭
            newConfig.thinkLevel = null;  // 默认值
        } else {
            // 图像模型:清空思考相关配置,设置图像参数
            newConfig.enableThinking = null;
            newConfig.thinkLevel = null;
            newConfig.aspectRatio = newConfig.aspectRatio || 'auto';
            newConfig.modality = newConfig.modality || 'Image_Text';
            // 只有支持分辨率的模型才设置分辨率
            if (hasCapability(modelSelect, 'resolution')) {
                newConfig.resolution = newConfig.resolution || '1k';
            } else {
                newConfig.resolution = null;
            }
        }

        onConfigChange(newConfig);
    };

    // 切换思考总结开关
    const toggleThinking = () => {
        const newEnabled = !thinkingEnabled;
        onConfigChange({
            ...modelConfig,
            enableThinking: newEnabled ? true : null,
            // 关闭时清空思考水平
            thinkLevel: newEnabled ? modelConfig.thinkLevel : null
        });
    };

    // 处理思考水平变化
    const handleThinkLevelChange = (value: string) => {
        // 选择默认时传 null
        onConfigChange({
            ...modelConfig,
            thinkLevel: value === 'default' ? null : value as ThinkLevel
        });
    };

    // 获取当前模型可用的思考水平选项(始终包含默认选项)
    const getAvailableThinkLevels = () => {
        const availableLevels = MODEL_CONFIG_MAP[currentModelSelect].availableThinkLevels;
        if (!availableLevels) return THINK_LEVEL_OPTIONS;
        // 过滤出可用选项,但始终保留默认选项
        return THINK_LEVEL_OPTIONS.filter(opt =>
            opt.value === 'default' || availableLevels.includes(opt.value as ThinkLevel)
        );
    };

    // 获取当前显示的思考水平值(用于显示)
    const getCurrentThinkLevelValue = () => {
        return modelConfig.thinkLevel || 'default';
    };

    const currentModelSelect = modelConfig.modelselect || 'gemini-3-pro-image';
    const showImageConfig = hasCapability(currentModelSelect, 'imageConfig');
    const showResolution = hasCapability(currentModelSelect, 'resolution');
    const showThinkLevel = hasCapability(currentModelSelect, 'thinkLevel');

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

                            {/* 思考总结 - 仅文字模型显示 */}
                            {showThinkLevel && (
                            <>
                                {/* 思考水平下拉菜单 - 始终显示 */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={isGenerating}>
                                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                            {THINK_LEVEL_OPTIONS.find(m => m.value === getCurrentThinkLevelValue())?.label || '默认'}
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel className="text-xs">思考水平</DropdownMenuLabel>
                                        <DropdownMenuRadioGroup
                                            value={getCurrentThinkLevelValue()}
                                            onValueChange={handleThinkLevelChange}
                                        >
                                            {getAvailableThinkLevels().map(opt => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {/* 灯泡开关按钮 - 控制是否启用思考总结 */}
                                <Button
                                    variant={thinkingEnabled ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={toggleThinking}
                                    disabled={isGenerating}
                                    title={thinkingEnabled ? "关闭思考总结" : "开启思考总结"}
                                >
                                    <Lightbulb className={`h-4 w-4 ${thinkingEnabled ? 'text-yellow-300' : ''}`} />
                                </Button>
                            </>
                            )}
                        </div>
                        <InputGroupText className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            {prompt.length} 字符
                        </InputGroupText>
                        <InputGroupButton
                            onClick={onGenerate}
                            disabled={!apiKey.trim() || !prompt.trim() || isGenerating}
                            size="sm"
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
