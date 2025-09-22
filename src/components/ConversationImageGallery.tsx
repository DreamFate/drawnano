"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Hash
} from 'lucide-react';
import { ConversationImage } from '@/lib/schemas';

interface ConversationImageGalleryProps {
  images: ConversationImage[];
  onImageReference: (imageNumber: number) => void;
  onImageSelect: (image: ConversationImage) => void;
  selectedImageId?: string;
}

export function ConversationImageGallery({
  images,
  onImageReference,
  onImageSelect,
  selectedImageId
}: ConversationImageGalleryProps) {
  const [enlargedImage, setEnlargedImage] = useState<ConversationImage | null>(null);

  // 处理图片引用
  const handleImageReference = (image: ConversationImage) => {
    onImageReference(image.number);
  };

  // 处理图片修改选择
  const handleImageEdit = (image: ConversationImage) => {
    onImageSelect(image);
  };

  // 处理图片放大
  const handleImageEnlarge = (image: ConversationImage) => {
    setEnlargedImage(image);
  };

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">当前对话还没有生成图片</p>
          <p className="text-xs text-gray-400 mt-1">
            生成图片后将在这里显示
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full bg-white dark:bg-gray-900 border-b">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm font-medium">生成的图片</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {images.length} 张
          </Badge>
        </div>

        {/* 图片网格 */}
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="p-3">
            <div className="grid grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`group relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                    image.id === selectedImageId
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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

                  {/* 图片 */}
                  <img
                    src={image.src}
                    alt={`生成图片 ${image.number}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageReference(image)}
                  />

                  {/* 操作按钮 */}
                  <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {/* 放大按钮 */}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-6 h-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageEnlarge(image);
                        }}
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
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* 点击提示覆盖层 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
          </div>
        </ScrollArea>
      </div>

      {/* 图片放大模态框 */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              图片 {enlargedImage?.number} - 详细查看
            </DialogTitle>
          </DialogHeader>

          {enlargedImage && (
            <div className="px-4 pb-4">
              {/* 图片信息 */}
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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

              {/* 放大图片 */}
              <div className="flex justify-center">
                <img
                  src={enlargedImage.src}
                  alt={`生成图片 ${enlargedImage.number}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  onClick={() => {
                    handleImageReference(enlargedImage);
                    setEnlargedImage(null);
                  }}
                  variant="outline"
                >
                  <Hash className="w-4 h-4 mr-2" />
                  引用到提示词
                </Button>
                <Button
                  onClick={() => {
                    handleImageEdit(enlargedImage);
                    setEnlargedImage(null);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  选择修改
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
