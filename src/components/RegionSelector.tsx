"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Move } from 'lucide-react';

interface SelectionRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface RegionSelectorProps {
  imageSrc: string;
  onRegionSelect: (region: SelectionRegion) => void;
  onRegionRemove: (regionId: string) => void;
  selectedRegions: SelectionRegion[];
  onMaterialDrop?: (regionId: string, materialId: string) => void;
  getMaterialNumber?: (materialId: string) => number;
  className?: string;
}

export function RegionSelector({
  imageSrc,
  onRegionSelect,
  onRegionRemove,
  selectedRegions,
  onMaterialDrop,
  getMaterialNumber,
  className = ""
}: RegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Omit<SelectionRegion, 'id'> | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [draggedMaterial, setDraggedMaterial] = useState<{ id: string; number: number } | null>(null);

  const getRelativeCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // 计算相对于图片的坐标
    const relativeX = clientX - imageRect.left;
    const relativeY = clientY - imageRect.top;
    
    // 转换为相对于图片原始尺寸的比例
    const scaleX = imageRef.current.naturalWidth / imageRect.width;
    const scaleY = imageRef.current.naturalHeight / imageRect.height;
    
    return {
      x: Math.max(0, Math.min(relativeX * scaleX, imageRef.current.naturalWidth)),
      y: Math.max(0, Math.min(relativeY * scaleY, imageRef.current.naturalHeight))
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键
    
    const coords = getRelativeCoordinates(e.clientX, e.clientY);
    setStartPoint(coords);
    setIsDrawing(true);
    setCurrentRegion({
      x: coords.x,
      y: coords.y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    
    const coords = getRelativeCoordinates(e.clientX, e.clientY);
    const width = coords.x - startPoint.x;
    const height = coords.y - startPoint.y;
    
    setCurrentRegion({
      x: width >= 0 ? startPoint.x : coords.x,
      y: height >= 0 ? startPoint.y : coords.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRegion) return;
    
    // 只有当区域足够大时才创建选区
    if (currentRegion.width > 10 && currentRegion.height > 10) {
      const newRegion: SelectionRegion = {
        ...currentRegion,
        id: `region-${Date.now()}`,
        label: `区域 ${selectedRegions.length + 1}`
      };
      onRegionSelect(newRegion);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRegion(null);
  };

  // 处理素材拖拽到区域的事件
  const handleRegionDragEnter = (regionId: string) => {
    setHoveredRegion(regionId);
  };

  const handleRegionDragLeave = () => {
    setHoveredRegion(null);
  };

  const handleRegionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleRegionDrop = (regionId: string, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredRegion(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'material' && data.materialId && onMaterialDrop) {
        onMaterialDrop(regionId, data.materialId);
        setDraggedMaterial(null);
      }
    } catch (error) {
      console.error('处理拖拽数据失败:', error);
    }
  };

  // 监听全局拖拽事件以跟踪拖拽的素材
  const handleGlobalDragStart = (e: DragEvent) => {
    try {
      const data = JSON.parse(e.dataTransfer?.getData('application/json') || '{}');
      if (data.type === 'material') {
        setDraggedMaterial({ id: data.materialId, number: data.materialNumber });
      }
    } catch (error) {
      // 忽略解析错误
    }
  };

  const handleGlobalDragEnd = () => {
    setDraggedMaterial(null);
    setHoveredRegion(null);
  };

  // 添加全局拖拽事件监听
  React.useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('dragstart', handleGlobalDragStart);
      container.addEventListener('dragend', handleGlobalDragEnd);
      return () => {
        container.removeEventListener('dragstart', handleGlobalDragStart);
        container.removeEventListener('dragend', handleGlobalDragEnd);
      };
    }
  }, []);

  const renderRegion = (region: SelectionRegion | Omit<SelectionRegion, 'id'>, isTemp = false) => {
    if (!imageRef.current) return null;
    
    const imageRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return null;
    
    // 将原始坐标转换为显示坐标
    const scaleX = imageRect.width / imageRef.current.naturalWidth;
    const scaleY = imageRect.height / imageRef.current.naturalHeight;
    
    const displayX = region.x * scaleX;
    const displayY = region.y * scaleY;
    const displayWidth = region.width * scaleX;
    const displayHeight = region.height * scaleY;
    
    const regionId = 'id' in region ? region.id : '';
    const isHovered = hoveredRegion === regionId;
    const assignedMaterial = regionId && getMaterialNumber ? getMaterialNumber(regionId) : null;
    
    return (
      <div
        key={isTemp ? 'temp' : regionId}
        className={`absolute border-2 transition-all ${
          isTemp 
            ? 'border-blue-500 bg-blue-500/20' 
            : isHovered 
              ? 'border-green-500 bg-green-500/30 shadow-lg' 
              : assignedMaterial
                ? 'border-purple-500 bg-purple-500/20'
                : 'border-red-500 bg-red-500/20'
        } ${isTemp ? 'pointer-events-none' : ''}`}
        style={{
          left: displayX,
          top: displayY,
          width: displayWidth,
          height: displayHeight,
        }}
        onDragEnter={() => !isTemp && regionId && handleRegionDragEnter(regionId)}
        onDragLeave={handleRegionDragLeave}
        onDragOver={handleRegionDragOver}
        onDrop={(e) => !isTemp && regionId && handleRegionDrop(regionId, e)}
      >
        {!isTemp && 'id' in region && (
          <>
            {/* 区域标签 */}
            <div className={`absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded text-center min-w-16 ${
              assignedMaterial ? 'bg-purple-500' : 'bg-red-500'
            }`}>
              <div>{region.label}</div>
              {assignedMaterial && (
                <div className="text-xs opacity-90">→ 素材{assignedMaterial}</div>
              )}
            </div>
            
            {/* 删除按钮 */}
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 pointer-events-auto z-10"
              onClick={() => onRegionRemove(region.id)}
            >
              <X className="w-3 h-3" />
            </Button>
            
            {/* 区域图标 */}
            <Move className={`absolute top-1 left-1 w-4 h-4 ${
              assignedMaterial ? 'text-purple-600' : 'text-red-500'
            }`} />
            
            {/* 拖拽悬停提示 */}
            {isHovered && draggedMaterial && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/40 border-2 border-green-500 rounded">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  放置素材#{draggedMaterial.number}
                </div>
              </div>
            )}
            
            {/* 已分配素材的显示 */}
            {assignedMaterial && !isHovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium shadow">
                  素材#{assignedMaterial}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDrawing(false);
        setCurrentRegion(null);
      }}
    >
      <img
        ref={imageRef}
        src={imageSrc}
        alt="可选择区域的图片"
        className="max-w-full max-h-full object-contain select-none"
        draggable={false}
      />
      
      {/* 渲染已选择的区域 */}
      {selectedRegions.map(region => renderRegion(region))}
      
      {/* 渲染当前正在绘制的区域 */}
      {currentRegion && renderRegion(currentRegion, true)}
      
      {/* 使用提示 */}
      {selectedRegions.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="text-center">
            <div className="font-medium mb-1">📍 框选要替换的区域</div>
            <div className="text-xs opacity-90">拖拽鼠标在图片上画框</div>
          </div>
        </div>
      ) : draggedMaterial ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm pointer-events-none">
          <div className="text-center bg-blue-600 px-4 py-2 rounded-lg shadow-lg">
            <div className="font-medium">🎯 拖拽素材#{draggedMaterial.number}到区域</div>
            <div className="text-xs opacity-90">建立替换映射关系</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}