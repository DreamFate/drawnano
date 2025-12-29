"use client";

import { useState, useEffect, useRef } from 'react';
import { ImageWithSrc } from '@/types';
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/ui/input-group"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Maximize2 } from "lucide-react"
import { useToastNotification } from '@/hooks';

const STYLE_SLOTS_KEY = 'drawnano_style_slots';

interface StyleSlot {
    id: number;
    content: string;
}

function loadStyleSlots(): StyleSlot[] {
    if (typeof window === 'undefined') return Array.from({ length: 5 }, (_, i) => ({ id: i + 1, content: '' }));
    try {
        const saved = localStorage.getItem(STYLE_SLOTS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load style slots:', e);
    }
    return Array.from({ length: 5 }, (_, i) => ({ id: i + 1, content: '' }));
}

function saveStyleSlots(slots: StyleSlot[]) {
    try {
        localStorage.setItem(STYLE_SLOTS_KEY, JSON.stringify(slots));
    } catch (e) {
        console.error('Failed to save style slots:', e);
    }
}

interface StyleInputProps {
    systemStyle: string;
    onSystemStyleChange: (value: string) => void;
    onGenerateStyle: () => void;
    isGeneratingStyle: boolean;
    isGenerating: boolean;
    apiKey: string;
    selectedImage: ImageWithSrc | null;
    useSystemStyle: boolean;
    onUseSystemStyleChange: (value: boolean) => void;
}

export function StyleInput({
    systemStyle,
    onSystemStyleChange,
    onGenerateStyle,
    isGeneratingStyle,
    isGenerating,
    apiKey,
    selectedImage,
    useSystemStyle,
    onUseSystemStyleChange
}: StyleInputProps) {
    // 使用固定默认值避免 SSR hydration 不匹配
    const [styleSlots, setStyleSlots] = useState<StyleSlot[]>(
        () => Array.from({ length: 5 }, (_, i) => ({ id: i + 1, content: '' }))
    );
    const [activeSlot, setActiveSlot] = useState<number>(1); // 默认选中槽位1
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState('');
    const { showInfo, showSuccess, showError } = useToastNotification();

    const prevIsGeneratingStyle = useRef(isGeneratingStyle);

    // 客户端挂载后从 localStorage 加载
    useEffect(() => {
        const saved = loadStyleSlots();
        setStyleSlots(saved);
        // 如果当前槽位有内容，加载到输入框
        const activeSlotData = saved.find(s => s.id === activeSlot);
        if (activeSlotData?.content) {
            onSystemStyleChange(activeSlotData.content);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 生成完成后自动保存到当前槽位
    useEffect(() => {
        // 从生成中变为生成完成，且有内容
        if (prevIsGeneratingStyle.current && !isGeneratingStyle && systemStyle.trim()) {
            const newSlots = styleSlots.map(s =>
                s.id === activeSlot ? { ...s, content: systemStyle } : s
            );
            setStyleSlots(newSlots);
            saveStyleSlots(newSlots);
        }
        prevIsGeneratingStyle.current = isGeneratingStyle;
    }, [isGeneratingStyle, systemStyle, activeSlot, styleSlots]);

    // 点击槽位：加载该槽位风格并设为当前槽位
    const handleSlotClick = (slotId: number) => {
        const slot = styleSlots.find(s => s.id === slotId);
        setActiveSlot(slotId);
        onSystemStyleChange(slot?.content||'');
        // 选择其他槽位时自动开启使用系统提示词
        if (slot?.content) {
            onUseSystemStyleChange(true);
        }
    };

    // 清空当前输入框
    const handleClear = () => {
        onSystemStyleChange('');
    };

    // 保存到当前槽位
    const handleSave = (content?: string) => {
        const contentToSave = content ?? systemStyle;
        const newSlots = styleSlots.map(s =>
            s.id === activeSlot ? { ...s, content: contentToSave } : s
        );
        setStyleSlots(newSlots);
        saveStyleSlots(newSlots);
        onUseSystemStyleChange(true);
        showSuccess('保存成功');
    };

    return (
        <div className={`h-full p-2 bg-white dark:bg-gray-900 ${(isGenerating || isGeneratingStyle) ? 'opacity-70 pointer-events-none' : ''}`}>
            <InputGroup className="min-w-[240px]">
                <InputGroupTextarea
                    value={systemStyle}
                    onChange={(e) => onSystemStyleChange(e.target.value)}
                    placeholder="描述整体画面风格或选择一张图片生成风格"
                    className="flex-1 h-[120px] min-h-[120px] max-h-[120px] resize-none text-sm overflow-y-auto"
                    disabled={isGenerating || isGeneratingStyle}
                />
                <InputGroupAddon align="block-start" >
                    <div className="flex gap-1 min-h-[32px] max-h-[32px] flex-shrink-0 items-center" >
                        {styleSlots.map((slot) => (
                            <Badge
                                key={slot.id}
                                variant={activeSlot === slot.id ? "default" : "outline"}
                                className={`w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${slot.content
                                        ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    } ${activeSlot === slot.id ? 'ring-2 ring-blue-300' : ''}`}
                                onClick={() => handleSlotClick(slot.id)}
                            >
                                {slot.id}
                            </Badge>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto min-h-[32px] flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Switch
                                checked={useSystemStyle}
                                onCheckedChange={onUseSystemStyleChange}
                                disabled={isGenerating || isGeneratingStyle}
                                className="scale-90"
                                title={useSystemStyle ? "关闭使用系统风格" : "开启使用系统风格"}
                            />
                        </div>
                        <InputGroupButton
                            variant="ghost"
                            size="sm"
                            onClick={onGenerateStyle}
                            disabled={!selectedImage || isGeneratingStyle || !apiKey.trim() || isGenerating}
                            className="h-6 px-2 text-xs"
                        >
                            {isGeneratingStyle ? (
                                <><Spinner />生成中...</>
                            ) : (
                                <>生成风格</>
                            )}
                        </InputGroupButton>
                    </div>
                </InputGroupAddon>
                <InputGroupAddon align="block-end">
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        if (open) {
                            setDialogContent(systemStyle);
                        }
                        setDialogOpen(open);
                    }}>
                        <DialogTrigger asChild>
                            <InputGroupButton
                                variant="ghost"
                                size="sm"
                                disabled={isGenerating||isGeneratingStyle}
                            >
                                <Maximize2 className="w-4 h-4" />
                            </InputGroupButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>编辑整体风格</DialogTitle>
                                <DialogDescription>
                                    在此编辑整体画面风格描述
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                value={dialogContent}
                                onChange={(e) => setDialogContent(e.target.value)}
                                placeholder="描述整体画面风格或选择一张图片生成风格"
                                className="flex-1 min-h-[200px] resize-none text-sm overflow-y-auto"
                            />
                            <DialogFooter>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-auto">
                                    {dialogContent.length} 字符
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={() => {
                                        onSystemStyleChange(dialogContent);
                                        handleSave(dialogContent);
                                        setDialogOpen(false);
                                    }}
                                >
                                    保存
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {systemStyle.length} 字符
                    </span>
                    <InputGroupButton
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={!systemStyle.trim()||isGenerating || isGeneratingStyle}

                    >
                        清空
                    </InputGroupButton>
                    <InputGroupButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleSave()}
                        disabled={isGenerating || isGeneratingStyle}
                    >
                        保存
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </div>
    );
}
