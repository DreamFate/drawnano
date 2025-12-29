"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useImageDownload, useImageDialog } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageFullscreenViewer } from '@/components/ImageFullscreenViewer';
import { BatchOperationDialog } from '@/components/BatchOperationDialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Image as ImageIcon,
    Edit,
    ZoomIn,
    ZoomOut,
    Hash,
    Download,
    Maximize2,
    X,
    Trash2,
    RotateCcw,
    Upload,
    CheckSquare
} from 'lucide-react';
import { ImageMeta } from '@/types';
import { getImageSrc } from '@/lib/conversation-storage';
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"

// 统一的图片类型（使用 discriminated union）
export type GalleryImage = ImageMeta;

interface ImageGalleryProps {
    mode: 'generated' | 'material';
    images: GalleryImage[];
    onImageReference: (imageNumber: number) => void;
    onImageSelect: (image: GalleryImage) => void;
    selectedImageId?: string;
    referencedIds?: string[]; // 被引用的图片ID列表
    onDeleteImage?: (imageId: string) => void;
    onUpload?: (files: FileList) => void; // 仅素材库有
    title?: string;
    isGenerating?: boolean; // 是否正在生成中
    onBatchReference?: (images: ImageWithSrc[]) => Promise<void>; // 批量引用
    onBatchDelete?: (imageIds: string[]) => Promise<void>; // 批量删除
    onBatchDownload?: (images: ImageWithSrc[]) => Promise<void>; // 批量下载
}

// 扩展类型，包含加载的 src
type ImageWithSrc = GalleryImage & {
    src?: string;
};

export function ImageGallery({
    mode,
    images,
    onImageReference,
    onImageSelect,
    selectedImageId,
    referencedIds = [],
    onDeleteImage,
    onUpload,
    title,
    isGenerating = false,
    onBatchReference,
    onBatchDelete,
    onBatchDownload
}: ImageGalleryProps) {
    const [imagesWithSrc, setImagesWithSrc] = useState<ImageWithSrc[]>([]);
    const [fullscreenImage, setFullscreenImage] = useState<ImageWithSrc | null>(null);
    const [showBatchDialog, setShowBatchDialog] = useState(false);

    // 使用自定义 hooks
    const { dialogImage: enlargedImage, openDialog: openEnlargedDialog, closeDialog: closeEnlargedDialog } = useImageDialog<ImageWithSrc>();
    const { downloadImage, generateFilename } = useImageDownload();

    // 上传 input ref
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // 滚动容器 ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 拖拽上传状态
    const [isDragOver, setIsDragOver] = useState(false);

    // 使用 useMemo 稳定图片ID列表,避免无限重新渲染
    const imageIds = useMemo(() => {
        const ids = images.map(img => img.id).join(',');
        return ids;
    }, [images]);

    // 使用 useRef 保存最新的 images 引用,避免闭包问题
    const imagesRef = useRef(images);
    imagesRef.current = images;

    // 并行加载所有图片,一次性更新状态
    useEffect(() => {
        const currentImages = imagesRef.current;

        const loadImages = async () => {
            // 并行加载所有图片
            const loadedImages = await Promise.all(
                currentImages.map(async (image) => {
                    try {
                        const src = await getImageSrc(image.srcId);
                        return { ...image, src: src || undefined };
                    } catch {
                        return { ...image, src: undefined };
                    }
                })
            );

            // 一次性更新所有图片
            setImagesWithSrc(loadedImages);
        };

        if (currentImages.length > 0) {
            loadImages();
        } else {
            setImagesWithSrc([]);
        }
    }, [imageIds]);

    // 当图片数量增加时自动滚动到底部
    useEffect(() => {
        if (scrollContainerRef.current && imagesWithSrc.length > 0) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [imagesWithSrc.length]);

    // 处理图片引用
    const handleImageReference = (image: ImageWithSrc) => {
        onImageReference(image.number);
    };

    // 处理图片修改选择
    const handleImageEdit = (image: ImageWithSrc) => {
        // 只传递元数据部分
        const { src, ...imageMeta } = image;
        onImageSelect(imageMeta);
    };

    // 处理图片放大
    const handleImageEnlarge = (image: ImageWithSrc) => {
        openEnlargedDialog(image);
    };

    // 处理全屏显示
    const handleFullscreenShow = (image: ImageWithSrc) => {
        setFullscreenImage(image);
    };

    // 关闭全屏
    const handleCloseFullscreen = () => {
        setFullscreenImage(null);
    };

    // 处理图片下载
    const handleImageDownload = (image: ImageWithSrc) => {
        if (!image.src) return;
        const filename = generateFilename(mode, image.number, image.timestamp);
        downloadImage(image.src, filename);
    };

    // 处理上传
    const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && onUpload) {
            onUpload(e.target.files);
            e.target.value = '';
        }
    };

    // 拖拽上传处理
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUpload) {
            onUpload(e.dataTransfer.files);
        }
    };

    // 根据模式获取显示文本
    const isMaterial = mode === 'material';
    const displayTitle = title || (isMaterial ? '素材库' : '生成的图片');
    const emptyText = isMaterial ? '还没有素材' : '暂无图片';
    const emptySubText = isMaterial ? '添加后可在提示词中引用' : '';
    const referencePrefix = isMaterial ? '素材' : '生图';

    return (
        <>
            <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden min-w-[220px]">
                {/* 标题栏 */}
                <div className="flex-shrink-0 flex min-h-[40px] items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        {isMaterial ? <Hash className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{displayTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {imagesWithSrc.length > 0 && !isGenerating && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowBatchDialog(true)}
                                className="h-7 text-xs"
                                title='批量操作'
                            >
                                <CheckSquare className="w-3 h-3 mr-1" />

                            </Button>
                        )}
                        <Badge variant="secondary" className="text-xs">
                            {imagesWithSrc.length} 张
                        </Badge>
                    </div>
                </div>

                {/* 素材上传区域 - 仅素材库显示，支持拖拽 */}
                {isMaterial && onUpload && (
                    <div className="flex-shrink-0 px-2 pt-2">
                        <div
                            className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${isDragOver
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => uploadInputRef.current?.click()}
                        >
                            <input
                                ref={uploadInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleUploadChange}
                                className="hidden"
                            />
                            <Upload className={`w-5 h-5 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                            <div className="text-xs text-gray-500">
                                {isDragOver ? (
                                    <span className="text-blue-500 font-medium">松开以上传</span>
                                ) : (
                                    <>
                                        <span>拖放图片到此处或点击添加</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 图片网格 - 纵向滚动布局 */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
                    {imagesWithSrc.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                                {isMaterial ? <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" /> : <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />}
                                <p className="text-sm">{emptyText}</p>
                                {emptySubText && <p className="text-xs text-gray-400 mt-1">{emptySubText}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {imagesWithSrc.map((image) => (
                                <div
                                    key={image.id}
                                    className={`relative group flex-shrink-0 w-[calc(25vh)] h-[calc(25vh)] ${
                                        isGenerating ? 'cursor-default' : 'cursor-pointer'
                                    }`}
                                    onClick={() => !isGenerating && handleImageReference(image)}
                                >
                                    {/* 编号标识 */}
                                    <div className="absolute top-1 left-1 z-10">
                                        <Badge
                                            variant="default"
                                            className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-blue-600"
                                        >
                                            {image.number}
                                        </Badge>
                                    </div>

                                    {/* 图片容器 */}
                                    <div className={`w-full h-full rounded-lg border-2 transition-colors overflow-hidden ${image.id === selectedImageId
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : referencedIds.includes(image.id)
                                                ? 'border-purple-400 border-dashed'
                                                : 'border-gray-200 group-hover:border-blue-300'
                                        }`}>
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

                                    {/* 操作按钮 */}
                                    {!isGenerating && (
                                        <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-1">
                                            {/* 全屏按钮 */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-6 h-6 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFullscreenShow(image);
                                                }}
                                                title="全屏查看"
                                            >
                                                <Maximize2 className="w-3 h-3" />
                                            </Button>

                                            {/* 详情按钮 */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-6 h-6 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageEnlarge(image);
                                                }}
                                                title="查看详情"
                                            >
                                                <ZoomIn className="w-3 h-3" />
                                            </Button>

                                            {/* 修改按钮 */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="w-6 h-6 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageEdit(image);
                                                }}
                                                title="选择修改"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </Button>

                                            {/* 删除按钮 - 素材库在悬停时显示 */}
                                            {isMaterial && onDeleteImage && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="w-6 h-6 p-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteImage(image.id);
                                                    }}
                                                    title="删除"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 点击提示覆盖层 */}
                                    {!isGenerating && (
                                        <div className="absolute rounded-lg inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <div className="text-white text-xs text-center font-medium">
                                                <div className="flex items-center gap-1 justify-center mb-1">
                                                    <Hash className="w-3 h-3" />
                                                    <span>点击引用</span>
                                                </div>
                                                <div className="text-blue-200">[{referencePrefix}{image.number}]</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 选中状态指示器 */}
                                    {image.id === selectedImageId && (
                                        <div className="absolute bottom-1 left-1 right-1">
                                            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded text-center">
                                                已选中修改
                                            </div>
                                        </div>
                                    )}

                                    {/* 引用状态指示器 */}
                                    {referencedIds.includes(image.id) && image.id !== selectedImageId && (
                                        <div className="absolute bottom-1 right-1">
                                            <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0.5">
                                                已引用
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 图片详情Dialog */}
            <Dialog open={!!enlargedImage} onOpenChange={closeEnlargedDialog}>
                <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="p-4 pb-2 flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            {isMaterial ? <Hash className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                            {referencePrefix} {enlargedImage?.number} - 详细查看
                        </DialogTitle>
                        <DialogDescription>
                            查看图片详情并进行引用、修改或下载操作
                        </DialogDescription>
                    </DialogHeader>

                    {enlargedImage && enlargedImage.src && (
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* 图片展示区域 */}
                            <div className="relative flex-1 min-h-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1 overflow-hidden">
                                <img
                                    src={enlargedImage.src}
                                    alt={`${referencePrefix} ${enlargedImage.number}`}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            </div>
                            {/* 底部信息和操作区域 */}
                            <div className="flex-shrink-0 px-4 py-4">
                                {/* 操作按钮区域 */}
                                <ButtonGroup className="w-full">
                                    <Button
                                        onClick={() => {
                                            handleImageReference(enlargedImage);
                                            closeEnlargedDialog();
                                        }}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Hash className="w-4 h-4 mr-2" />
                                        引用
                                    </Button>
                                    <ButtonGroupSeparator />
                                    <Button
                                        onClick={() => {
                                            handleImageEdit(enlargedImage);
                                            closeEnlargedDialog();
                                        }}
                                        className="flex-1"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        修改
                                    </Button>
                                    <ButtonGroupSeparator />
                                    <Button
                                        onClick={() => handleImageDownload(enlargedImage)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        下载
                                    </Button>
                                    <ButtonGroupSeparator />
                                    {onDeleteImage && (
                                        <Button
                                            onClick={() => {
                                                onDeleteImage(enlargedImage.id);
                                                closeEnlargedDialog();
                                            }}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            删除
                                        </Button>
                                    )}
                                </ButtonGroup>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 全屏查看器 */}
            <ImageFullscreenViewer
                image={fullscreenImage ? {
                    src: fullscreenImage.src || '',
                    alt: `${referencePrefix} ${fullscreenImage.number}`
                } : null}
                onClose={handleCloseFullscreen}
            />

            {/* 批量操作弹窗 */}
            <BatchOperationDialog
                open={showBatchDialog}
                onOpenChange={setShowBatchDialog}
                images={imagesWithSrc}
                mode={mode}
                onBatchReference={onBatchReference}
                onBatchDelete={onBatchDelete}
                onBatchDownload={onBatchDownload}
            />
        </>
    );
}
