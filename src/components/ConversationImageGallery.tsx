"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Image as ImageIcon,
  Edit,
  ZoomIn,
  Hash,
  Download,
  Maximize2,
  X,
  Trash2
} from 'lucide-react';
import { ConversationImageMeta } from '@/lib/schemas';
import { getImageSrc } from '@/lib/conversation-storage';

interface ConversationImageGalleryProps {
  images: ConversationImageMeta[];
  onImageReference: (imageNumber: number) => void;
  onImageSelect: (image: ConversationImageMeta) => void;
  selectedImageId?: string;
  onDeleteImage?: (imageId: string) => void;
}

// 扩展类型，包含加载的 src
interface ImageWithSrc extends ConversationImageMeta {
  src?: string;
}

export function ConversationImageGallery({
  images,
  onImageReference,
  onImageSelect,
  selectedImageId,
  onDeleteImage
}: ConversationImageGalleryProps) {
  const [imagesWithSrc, setImagesWithSrc] = useState<ImageWithSrc[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<ImageWithSrc | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<ImageWithSrc | null>(null);

  // 使用 useMemo 稳定图片ID列表,避免无限重新渲染
  const imageIds = useMemo(() => {
    const ids = images.map(img => img.id).join(',');
    return ids;
  }, [images])
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
          } catch (error) {
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
  }, [imageIds]); // 只依赖imageIds,通过ref获取最新images

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
    setEnlargedImage(image);
  };

  // 处理全屏显示
  const handleFullscreenShow = (image: ImageWithSrc) => {
    setFullscreenImage(image);
  };

  // 处理图片下载
  const handleImageDownload = (image: ImageWithSrc) => {
    if (!image.src) return;
    const link = document.createElement('a');
    link.href = image.src;
    link.download = `图片${image.number}_${image.timestamp.toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 关闭Dialog
  const handleCloseDialog = () => {
    setEnlargedImage(null);
  };

  // 关闭全屏
  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
  };

  // 阻止全屏模式下的滚动
  useEffect(() => {
    if (fullscreenImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenImage]);

  // 全屏模式下的键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenImage && e.key === 'Escape') {
        handleCloseFullscreen();
      }
    };

    if (fullscreenImage) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreenImage]);

  return (
    <>
      <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
        {/* 标题栏 */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-medium">生成的图片</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {imagesWithSrc.length} 张
          </Badge>
        </div>

        {/* 图片网格 - 使用 flex-1 自动占据剩余空间 */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-3">
          {imagesWithSrc.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无图片</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-start h-full" >
              {imagesWithSrc.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer flex-shrink-0 h-full"
                  style={{ aspectRatio: '1/1' }}
                  onClick={() => handleImageReference(image)}
                >
                {/* 编号标识 */}
                <div className="absolute top-1 left-1 z-10">
                  <Badge
                    variant="default"
                    className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-blue-600"
                  >
                    {image.number}
                  </Badge>
                </div>

                {/* 图片容器 */}
                <div className={`w-full h-full rounded-lg border-2 transition-colors overflow-hidden ${
                  image.id === selectedImageId
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 group-hover:border-blue-300'
                }`}>
                  {image.src ? (
                    <img
                      src={image.src}
                      alt={`生成图片 ${image.number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-gray-400 text-sm">加载中...</div>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
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

                    {/* 放大按钮 */}
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
                  </div>
                </div>

                {/* 点击提示覆盖层 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="text-white text-xs text-center font-medium">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Hash className="w-3 h-3" />
                      <span>点击引用</span>
                    </div>
                    <div className="text-blue-200">[图片{image.number}]</div>
                  </div>
                </div>

                {/* 选中状态指示器 */}
                {image.id === selectedImageId && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded text-center">
                      已选中修改
                    </div>
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图片详情Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              图片 {enlargedImage?.number} - 详细查看
            </DialogTitle>
          </DialogHeader>

          {enlargedImage && enlargedImage.src && (
            <div className="flex flex-col">
              {/* 图片展示区域 */}
              <div className="relative flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={enlargedImage.src}
                    alt={`生成图片 ${enlargedImage.number}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
              </div>

              {/* 底部信息和操作区域 */}
              <div className="px-4 pb-4">
                {/* 图片信息 */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium mb-1">生成提示词：</div>
                    <div className="text-gray-600 dark:text-gray-300">
                      {enlargedImage.prompt}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    生成时间：{enlargedImage.timestamp.toLocaleString()}
                  </div>
                </div>

                {/* 操作按钮区域 */}
                <div className="space-y-3">
                  {/* 主要操作按钮 */}
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => {
                        handleImageReference(enlargedImage);
                        handleCloseDialog();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Hash className="w-4 h-4 mr-2" />
                      引用到提示词
                    </Button>
                    <Button
                      onClick={() => {
                        handleImageEdit(enlargedImage);
                        handleCloseDialog();
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      选择修改
                    </Button>
                  </div>

                  {/* 下载和删除按钮 */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleImageDownload(enlargedImage)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载图像
                    </Button>
                    {onDeleteImage && (
                      <Button
                        onClick={() => {
                          onDeleteImage(enlargedImage.id);
                          handleCloseDialog();
                        }}
                        variant="destructive"
                        size="lg"
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除图片
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 真正的全屏浮窗 */}
      {fullscreenImage && fullscreenImage.src && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
          {/* 背景点击关闭 */}
          <div
            className="absolute inset-0"
            onClick={handleCloseFullscreen}
          />

          {/* 图片容器 */}
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <img
              src={fullscreenImage.src}
              alt={`生成图片 ${fullscreenImage.number}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* 右上角关闭按钮 */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-4 right-4 bg-white/90 hover:bg-white z-10"
            onClick={handleCloseFullscreen}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}
