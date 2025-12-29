"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Hash,
    Download,
    Trash2,
    CheckSquare,
    Square,
    XSquare
} from 'lucide-react';
import { ImageMeta } from '@/types';

type ImageWithSrc = ImageMeta & {
    src?: string;
};

interface BatchOperationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    images: ImageWithSrc[];
    mode: 'generated' | 'material';
    onBatchReference?: (images: ImageWithSrc[]) => Promise<void>;
    onBatchDelete?: (imageIds: string[]) => Promise<void>;
    onBatchDownload?: (images: ImageWithSrc[]) => Promise<void>;
}

export function BatchOperationDialog({
    open,
    onOpenChange,
    images,
    mode,
    onBatchReference,
    onBatchDelete,
    onBatchDownload
}: BatchOperationDialogProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const referencePrefix = mode === 'material' ? '素材' : '生图';

    const selectedImages = useMemo(() => {
        return images
            .filter(img => selectedIds.has(img.id))
            .sort((a, b) => a.number - b.number);
    }, [images, selectedIds]);

    const toggleSelection = (imageId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(images.map(img => img.id)));
    };

    const invertSelection = () => {
        setSelectedIds(prev => {
            const newSet = new Set<string>();
            images.forEach(img => {
                if (!prev.has(img.id)) {
                    newSet.add(img.id);
                }
            });
            return newSet;
        });
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleBatchReference = async () => {
        if (selectedImages.length === 0 || !onBatchReference) return;

        setIsProcessing(true);
        try {
            await onBatchReference(selectedImages);
            onOpenChange(false);
            clearSelection();
        } catch (error) {
            console.error('批量引用失败:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchDownload = async () => {
        if (selectedImages.length === 0 || !onBatchDownload) return;

        setIsProcessing(true);
        try {
            await onBatchDownload(selectedImages);
            onOpenChange(false);
            clearSelection();
        } catch (error) {
            console.error('批量下载失败:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedImages.length === 0 || !onBatchDelete) return;

        setIsProcessing(true);
        try {
            const imageIds = selectedImages.map(img => img.id);
            await onBatchDelete(imageIds);
            setShowDeleteConfirm(false);
            onOpenChange(false);
            clearSelection();
        } catch (error) {
            console.error('批量删除失败:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (!isProcessing) {
            onOpenChange(false);
            clearSelection();
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-[95vw] sm:max-w-[90vw] h-[90vh] max-h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="p-3 pb-2 flex-shrink-0 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5" />
                            批量操作 - {mode === 'material' ? '素材库' : '生成的图片'}
                        </DialogTitle>
                        <DialogDescription>
                            选择图片进行批量引用、下载或删除操作
                        </DialogDescription>
                    </DialogHeader>

                    {/* 工具栏 */}
                    <div className="flex-shrink-0 px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={selectAll}
                                    disabled={isProcessing}
                                >
                                    <CheckSquare className="w-4 h-4 mr-1" />
                                    全选
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={invertSelection}
                                    disabled={isProcessing}
                                >
                                    <Square className="w-4 h-4 mr-1" />
                                    反选
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={clearSelection}
                                    disabled={isProcessing || selectedIds.size === 0}
                                >
                                    <XSquare className="w-4 h-4 mr-1" />
                                    清空
                                </Button>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                                已选择 {selectedIds.size} / {images.length} 张
                            </Badge>
                        </div>
                    </div>

                    {/* 图片网格 */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {images.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">暂无图片</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-3">
                                {images.map((image) => {
                                    const isSelected = selectedIds.has(image.id);
                                    return (
                                        <div
                                            key={image.id}
                                            className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                                                    : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                            onClick={() => !isProcessing && toggleSelection(image.id)}
                                        >
                                            {/* 复选框 */}
                                            <div className="absolute top-2 left-2 z-10">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => !isProcessing && toggleSelection(image.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                            </div>

                                            {/* 编号 */}
                                            <div className="absolute top-2 right-2 z-10">
                                                <Badge className="bg-blue-600 text-white">
                                                    {image.number}
                                                </Badge>
                                            </div>

                                            {/* 图片 */}
                                            <div className="aspect-square overflow-hidden rounded-lg">
                                                {image.src ? (
                                                    <img
                                                        src={image.src}
                                                        alt={`${referencePrefix} ${image.number}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        <div className="text-gray-400 text-sm">加载中...</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 选中遮罩 */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-blue-500/20 rounded-lg pointer-events-none" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 已选预览和操作区 */}
                    {selectedIds.size > 0 && (
                        <div className="flex-shrink-0 px-4 py-3 border-t bg-gray-50 dark:bg-gray-800">
                            {/* 已选预览 */}
                            <div className="mb-3">
                                <div className="text-xs text-gray-500 mb-1">已选择的图片:</div>
                                <div className="flex flex-wrap gap-1">
                                    {selectedImages.map(img => (
                                        <Badge key={img.id} variant="secondary" className="text-xs">
                                            [{referencePrefix}{img.number}]
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                                {onBatchReference && (
                                    <Button
                                        onClick={handleBatchReference}
                                        disabled={isProcessing}
                                        className="flex-1"
                                    >
                                        <Hash className="w-4 h-4 mr-2" />
                                        添加到引用列表
                                    </Button>
                                )}
                                {onBatchDownload && (
                                    <Button
                                        onClick={handleBatchDownload}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {isProcessing ? '打包中...' : '批量下载'}
                                    </Button>
                                )}
                                {onBatchDelete && (
                                    <Button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isProcessing}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        批量删除
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            你确定要删除选中的 {selectedIds.size} 张图片吗？此操作无法撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isProcessing ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
