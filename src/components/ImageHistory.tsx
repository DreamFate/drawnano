"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Image as ImageIcon, Trash2, Star } from 'lucide-react';

interface HistoryImage {
  id: string;
  src: string;
  type: 'uploaded' | 'generated';
  timestamp: Date;
  prompt?: string;
  isMain?: boolean;
}

interface ImageHistoryProps {
  images: HistoryImage[];
  selectedImageId: string | null;
  onImageSelect: (image: HistoryImage) => void;
  onImageDelete: (id: string) => void;
  className?: string;
}

export function ImageHistory({
  images,
  selectedImageId,
  onImageSelect,
  onImageDelete,
  className = ""
}: ImageHistoryProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  const getTypeIcon = (type: 'uploaded' | 'generated') => {
    return type === 'generated' ? (
      <Star className="w-3 h-3 text-yellow-500" />
    ) : (
      <ImageIcon className="w-3 h-3 text-blue-500" />
    );
  };

  const getTypeBadge = (type: 'uploaded' | 'generated') => {
    return (
      <Badge 
        variant={type === 'generated' ? 'default' : 'secondary'}
        className="text-xs"
      >
        {type === 'generated' ? '生成' : '上传'}
      </Badge>
    );
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            图片历史
          </CardTitle>
          <Badge variant="outline">
            {images.length} 张
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>还没有图片</p>
              <p className="text-xs mt-1">生成或上传图片后会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`group relative border rounded-lg p-2 cursor-pointer transition-all ${
                    selectedImageId === image.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => onImageSelect(image)}
                >
                  <div className="flex gap-3">
                    {/* 缩略图 */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded border overflow-hidden bg-gray-100">
                        <img
                          src={image.src}
                          alt={`图片 ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {image.isMain && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* 信息区域 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(image.type)}
                          {getTypeBadge(image.type)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(image.timestamp)}
                        </span>
                      </div>
                      
                      {image.prompt && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                          {image.prompt}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 truncate">
                        ID: {image.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  {/* 删除按钮 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageDelete(image.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  
                  {/* 选中状态指示器 */}
                  {selectedImageId === image.id && (
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}