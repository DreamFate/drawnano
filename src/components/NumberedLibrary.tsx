"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, Hash, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

interface LibraryItem {
  id: string;
  src: string;
  number: number;
  name?: string;
  timestamp: Date;
}

interface NumberedLibraryProps {
  materials: LibraryItem[];
  onMaterialAdd: (file: File) => void;
  onMaterialRemove: (id: string) => void;
  className?: string;
}

export function NumberedLibrary({
  materials,
  onMaterialAdd,
  onMaterialRemove,
  className = ""
}: NumberedLibraryProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        onMaterialAdd(file);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        onMaterialAdd(file);
      }
    });
    e.target.value = '';
  };

  // 开始拖拽素材到区域的操作
  const handleMaterialDragStart = (material: LibraryItem, e: React.DragEvent) => {
    // 设置拖拽数据，包含素材ID
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'material',
      materialId: material.id,
      materialNumber: material.number
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    // 创建拖拽预览
    const dragPreview = document.createElement('div');
    dragPreview.className = 'flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium';
    dragPreview.innerHTML = `<span>#${material.number}</span><span>素材</span>`;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 50, 25);
    
    // 清理拖拽预览
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            编号素材库
          </CardTitle>
          <Badge variant="secondary">
            {materials.length} 个素材
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {/* 上传区域 */}
          <div 
            className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-2">
              <Upload className="w-6 h-6 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">添加素材图片</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  选择文件
                </Button>
              </div>
            </div>
          </div>
          
          {/* 素材网格 */}
          {materials.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className={`relative group cursor-move transition-transform hover:scale-105 ${
                    selectedMaterial === material.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleMaterialDragStart(material, e)}
                  onClick={() => setSelectedMaterial(
                    selectedMaterial === material.id ? null : material.id
                  )}
                >
                  {/* 编号标识 */}
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge 
                      variant="default" 
                      className="w-8 h-8 rounded-full p-0 flex items-center justify-center font-bold text-lg"
                    >
                      {material.number}
                    </Badge>
                  </div>
                  
                  {/* 图片容器 */}
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors">
                    <img
                      src={material.src}
                      alt={`素材${material.number}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                  
                  {/* 删除按钮 */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMaterialRemove(material.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  
                  {/* 拖拽提示遮罩 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <div className="text-white text-xs text-center font-medium">
                      <div className="flex items-center justify-center mb-1">
                        <Hash className="w-4 h-4 mr-1" />
                        {material.number}
                      </div>
                      <div>拖拽到区域</div>
                      <div>建立映射</div>
                    </div>
                  </div>
                  
                  {/* 素材名称 */}
                  {material.name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate rounded-b-lg">
                      {material.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium mb-1">还没有素材</p>
              <p className="text-xs">上传图片后会自动编号</p>
              <p className="text-xs text-gray-400 mt-2">
                拖拽编号素材到主图片区域<br/>
                建立&quot;区域 → 素材&quot;的替换关系
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* 使用说明 */}
        {materials.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs">
                  1
                </Badge>
                <span>每个素材都有唯一编号</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-3 h-3 text-gray-400" />
                <span>拖拽到主图片区域建立映射关系</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}