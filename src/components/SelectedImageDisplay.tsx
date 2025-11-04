"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  X,
  ZoomIn,
  Edit,
  Loader2
} from 'lucide-react';
import { ConversationImageMeta } from '@/lib/schemas';

interface SelectedImageDisplayProps {
  selectedImage: (ConversationImageMeta & { src: string }) | null;
  onClearSelection: () => void;
  onImageEnlarge?: (image: ConversationImageMeta & { src: string }) => void;
  isGenerating?: boolean;
}

export function SelectedImageDisplay({
  selectedImage,
  onClearSelection,
  onImageEnlarge,
  isGenerating = false
}: SelectedImageDisplayProps) {
  if (!selectedImage) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center text-gray-500">
          <Edit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">选择要修改的图片</p>
          <p className="text-xs text-gray-400 mt-1">
            从上方图片区域选择一张图片进行修改
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">选中的图片</span>
          <Badge variant="default" className="text-xs">
            图片{selectedImage.number}
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
      <div className="h-[calc(100%-60px)] p-4">
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

            {/* 放大按钮 */}
            {onImageEnlarge && !isGenerating && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onImageEnlarge(selectedImage)}
              >
                <ZoomIn className="w-4 h-4 mr-1" />
                放大查看
              </Button>
            )}
          </div>

          {/* 操作提示 */}
          <div className="mt-2 text-xs text-center text-gray-500">
            <p>💡 在下方输入框中描述你想要的修改</p>
          </div>
        </div>
      </div>
    </div>
  );
}
