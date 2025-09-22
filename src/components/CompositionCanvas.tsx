"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SegmentedObject } from '@/types/segmentation';
import { normalizedToPixelCoords, decodeMaskToImageData, drawMaskOutline } from '@/lib/segmentation';

interface CompositionCanvasProps {
  objects: SegmentedObject[];
  onObjectMove: (objectId: string, position: { x: number; y: number }) => void;
  onObjectSelect: (objectId: string) => void;
  selectedObjectId?: string;
  canvasSize?: { width: number; height: number };
}

export function CompositionCanvas({
  objects,
  onObjectMove,
  onObjectSelect,
  selectedObjectId,
  canvasSize = { width: 800, height: 600 }
}: CompositionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());

  // 加载图片到缓存
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setImageCache(prev => new Map(prev.set(src, img)));
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [imageCache]);

  // 绘制画布内容
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 绘制每个分割对象
    for (const obj of objects) {
      try {
        // 获取原始图片
        const originalImage = await loadImage(obj.imageId);
        
        // 计算边界框的像素坐标
        const [y0, x0, y1, x1] = normalizedToPixelCoords(
          obj.mask.box_2d,
          originalImage.width,
          originalImage.height
        );

        const boxWidth = x1 - x0;
        const boxHeight = y1 - y0;

        // 绘制裁剪的图片区域
        ctx.save();
        ctx.translate(obj.position?.x || 0, obj.position?.y || 0);
        ctx.scale(obj.scale || 1, obj.scale || 1);

        // 绘制边界框区域的图片
        ctx.drawImage(
          originalImage,
          x0, y0, boxWidth, boxHeight,
          0, 0, boxWidth, boxHeight
        );

        // 如果有遮罩，应用遮罩效果
        if (obj.mask.mask) {
          try {
            const maskImageData = await decodeMaskToImageData(
              obj.mask.mask,
              boxWidth,
              boxHeight
            );

            // 创建遮罩画布
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = boxWidth;
            maskCanvas.height = boxHeight;
            const maskCtx = maskCanvas.getContext('2d')!;
            maskCtx.putImageData(maskImageData, 0, 0);

            // 应用遮罩合成模式
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(maskCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';

            // 绘制轮廓
            if (obj.id === selectedObjectId) {
              drawMaskOutline(ctx, maskImageData, 0, 0, '#ff4444', 3);
            } else {
              drawMaskOutline(ctx, maskImageData, 0, 0, '#4444ff', 2);
            }
          } catch (error) {
            console.error('Error applying mask:', error);
            // 如果遮罩失败，至少绘制边界框
            ctx.strokeStyle = obj.id === selectedObjectId ? '#ff4444' : '#4444ff';
            ctx.lineWidth = obj.id === selectedObjectId ? 3 : 2;
            ctx.strokeRect(0, 0, boxWidth, boxHeight);
          }
        } else {
          // 没有遮罩时绘制边界框
          ctx.strokeStyle = obj.id === selectedObjectId ? '#ff4444' : '#4444ff';
          ctx.lineWidth = obj.id === selectedObjectId ? 3 : 2;
          ctx.strokeRect(0, 0, boxWidth, boxHeight);
        }

        // 绘制标签
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, -25, Math.max(100, ctx.measureText(obj.mask.label).width + 10), 25);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(obj.mask.label, 5, -8);

        ctx.restore();
      } catch (error) {
        console.error('Error drawing object:', obj.id, error);
      }
    }
  }, [objects, selectedObjectId, loadImage]);

  // 查找指定位置的对象
  const findObjectAtPosition = useCallback((x: number, y: number): SegmentedObject | null => {
    // 从上到下检查对象
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const pos = obj.position || { x: 0, y: 0 };
      const scale = obj.scale || 1;

      // 计算边界框
      const [y0, x0, y1, x1] = obj.mask.box_2d;
      const boxWidth = ((x1 - x0) / 1000) * 300; // 假设标准化尺寸
      const boxHeight = ((y1 - y0) / 1000) * 300;

      if (x >= pos.x && x <= pos.x + boxWidth * scale &&
          y >= pos.y && y <= pos.y + boxHeight * scale) {
        return obj;
      }
    }
    return null;
  }, [objects]);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedObject = findObjectAtPosition(x, y);
    if (clickedObject) {
      onObjectSelect(clickedObject.id);
      setIsDragging(true);
      const pos = clickedObject.position || { x: 0, y: 0 };
      setDragOffset({ x: x - pos.x, y: y - pos.y });
    }
  }, [findObjectAtPosition, onObjectSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedObjectId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPosition = {
      x: x - dragOffset.x,
      y: y - dragOffset.y
    };

    onObjectMove(selectedObjectId, newPosition);
  }, [isDragging, selectedObjectId, dragOffset, onObjectMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}