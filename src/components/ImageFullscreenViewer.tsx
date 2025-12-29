"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface ImageFullscreenViewerProps {
  image: {
    src: string;
    alt?: string;
  } | null;
  onClose: () => void;
}

export function ImageFullscreenViewer({
  image,
  onClose
}: ImageFullscreenViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  const handleClose = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.3, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.3, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (image) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (image && e.key === 'Escape') {
        handleClose();
      }
    };

    if (image) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [image]);

  if (!image?.src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center overflow-hidden"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 背景点击关闭（仅在未缩放时） */}
      <div
        className="absolute inset-0"
        onClick={() => scale === 1 && handleClose()}
      />

      {/* 图片容器 */}
      <div
        className={`relative flex items-center justify-center select-none ${
          scale > 1 ? 'cursor-grab' : 'cursor-default'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        onMouseDown={handleMouseDown}
      >
        <img
          src={image.src}
          alt={image.alt || '全屏查看'}
          className="max-w-[90vw] max-h-[90vh] object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* 顶部工具栏 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2 z-10">
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
          onClick={zoomOut}
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <span className="text-white text-sm min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
          onClick={zoomIn}
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20 h-8 w-8 p-0"
          onClick={resetZoom}
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* 右上角关闭按钮 */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-4 right-4 bg-white/90 hover:bg-white z-10"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </Button>

      {/* 底部提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs z-10">
        滚轮缩放 · 拖动平移 · ESC 关闭
      </div>
    </div>
  );
}
