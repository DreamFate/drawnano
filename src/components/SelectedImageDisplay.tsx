"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  X,
  ZoomIn,
  Edit,
  Loader2,
  Maximize2,
  Download,
  Trash2
} from 'lucide-react';
import { ImageWithSrc } from '@/types';
import { useImageDownload } from '@/hooks';
import { ImageFullscreenViewer } from '@/components/ImageFullscreenViewer';

interface SelectedImageDisplayProps {
  selectedImage: ImageWithSrc | null;
  onClearSelection: () => void;
  isGenerating?: boolean;
}

export function SelectedImageDisplay({
  selectedImage,
  onClearSelection,
  isGenerating = false
}: SelectedImageDisplayProps) {
  const [fullscreenImage, setFullscreenImage] = useState<ImageWithSrc | null>(null);
  const { downloadImage, generateFilename } = useImageDownload();

  const handleDownload = () => {
    if (!selectedImage?.src) return;
    const filename = generateFilename(
      selectedImage.type === 'generated' ? 'generated' : 'material',
      selectedImage.number,
      selectedImage.timestamp
    );
    downloadImage(selectedImage.src, filename);
  };
  if (!selectedImage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center text-gray-500">
          <Edit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">选择要修改的图片</p>
          <p className="text-xs text-gray-400 mt-1">
            从生成的图片或素材库中选择一张图片进行修改
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 min-w-[200px]">
      {/* 标题栏 */}
      <div className="flex min-h-[40px] items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">选中的图片</span>
          <Badge variant="default" className="text-xs">
            {selectedImage.type === 'generated' ? '生图' : '素材'}
            {selectedImage.number}
          </Badge>
        </div>

        {/* 清除选择按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* 图片显示区域 */}
      <div className="h-[calc(100%-70px)] p-4">
        <div className="h-full flex flex-col">
          {/* 图片容器 */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden relative group">
            <img
              src={selectedImage.src}
              alt={`选中图片 ${selectedImage.number}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* 加载动画覆盖层 */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">正在生成图片...</p>
                </div>
              </div>
            )}
          </div>


        </div>
                  {/* 操作按钮 */}
          <div className="flex-1 mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreenImage(selectedImage)}
              className="flex-1"
              disabled={isGenerating}
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              查看
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
              disabled={isGenerating}
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
          </div>
      </div>

      {/* 全屏查看器 */}
      <ImageFullscreenViewer
        image={fullscreenImage ? {
          src: fullscreenImage.src || '',
          alt: `选中图片 ${fullscreenImage.number}`
        } : null}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  );
}
