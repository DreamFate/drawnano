"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { SegmentedObject } from '@/types/segmentation';
import { segmentImage, createSegmentedObject } from '@/lib/segmentation';

interface SegmentationPanelProps {
  images: Array<{ id: string; src: string; selected: boolean }>;
  segmentedObjects: SegmentedObject[];
  onSegmentedObjectsChange: (objects: SegmentedObject[]) => void;
}

export function SegmentationPanel({
  images,
  segmentedObjects,
  onSegmentedObjectsChange,
}: SegmentationPanelProps) {
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [segmentationProgress, setSegmentationProgress] = useState<string>('');

  const handleSegmentImage = async (imageId: string, imageSrc: string) => {
    setIsSegmenting(true);
    setSegmentationProgress(`正在分析图片 ${imageId}...`);

    try {
      const masks = await segmentImage(imageSrc);
      setSegmentationProgress(`找到 ${masks.length} 个对象，正在处理...`);

      // 创建分割对象
      const newObjects = masks.map(mask => createSegmentedObject(mask, imageId));
      
      // 更新分割对象列表
      const updatedObjects = [
        ...segmentedObjects.filter(obj => obj.imageId !== imageId),
        ...newObjects
      ];
      
      onSegmentedObjectsChange(updatedObjects);
      setSegmentationProgress(`完成！共分割出 ${masks.length} 个对象`);
      
      setTimeout(() => setSegmentationProgress(''), 2000);
    } catch (error) {
      console.error('Segmentation error:', error);
      setSegmentationProgress('分割失败，请重试');
      setTimeout(() => setSegmentationProgress(''), 3000);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleObjectToggle = (objectId: string) => {
    const updatedObjects = segmentedObjects.map(obj =>
      obj.id === objectId ? { ...obj, selected: !obj.selected } : obj
    );
    onSegmentedObjectsChange(updatedObjects);
  };

  const getObjectsByImage = (imageId: string) => {
    return segmentedObjects.filter(obj => obj.imageId === imageId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">图像分割</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {segmentationProgress && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{segmentationProgress}</p>
            </div>
          )}

          {images.map(image => (
            <div key={image.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={image.src}
                  alt={`Image ${image.id}`}
                  className="w-16 h-16 object-cover rounded border"
                />
                <div className="flex-1">
                  <p className="font-medium">图片 {image.id}</p>
                  <p className="text-sm text-gray-500">
                    {getObjectsByImage(image.id).length} 个分割对象
                  </p>
                </div>
                <Button
                  onClick={() => handleSegmentImage(image.id, image.src)}
                  disabled={isSegmenting}
                  size="sm"
                >
                  {isSegmenting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '分析'
                  )}
                </Button>
              </div>

              {/* 显示该图片的分割对象 */}
              {getObjectsByImage(image.id).length > 0 && (
                <div className="ml-4 space-y-2 pl-4 border-l-2 border-gray-200">
                  {getObjectsByImage(image.id).map(obj => (
                    <div
                      key={obj.id}
                      className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors ${
                        obj.selected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleObjectToggle(obj.id)}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{obj.mask.label}</p>
                        <p className="text-xs text-gray-500">
                          位置: ({Math.round(obj.position?.x || 0)}, {Math.round(obj.position?.y || 0)})
                        </p>
                      </div>
                      <Badge variant={obj.selected ? 'default' : 'secondary'}>
                        {obj.selected ? '已选中' : '未选中'}
                      </Badge>
                      {obj.selected ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {images.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>请先上传图片</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 选中对象统计 */}
      {segmentedObjects.filter(obj => obj.selected).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">选中的对象</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {segmentedObjects
                .filter(obj => obj.selected)
                .map((obj, index) => (
                  <div key={obj.id} className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="text-sm">{obj.mask.label}</span>
                  </div>
                ))}
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                可在构图画布中拖拽调整位置，或在提示词中使用 [1], [2] 等编号引用对象
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}