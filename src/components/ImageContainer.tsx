"use client";

import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface ImageContainerProps {
  id: string;
  src: string;
  alt: string;
  className?: string;
  onDelete: () => void;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  selectionIndex: number | null;
}

export function ImageContainer({
  id,
  src,
  alt,
  className,
  onDelete,
  isSelected,
  onSelectionChange,
  selectionIndex,
}: ImageContainerProps) {
  const router = useRouter();

  const handlePreview = () => {
    router.push(`/preview?id=${id}`);
  };

  return (
    <div
      className={`relative group bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
      />

      {/* 选中状态和编号 */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelectionChange}
        className="absolute top-2 left-2 z-10 bg-white data-[state=checked]:bg-blue-500"
      />
      {isSelected && selectionIndex !== null && (
        <Badge className="absolute top-2 right-2 z-10">{selectionIndex}</Badge>
      )}

      {/* 悬浮操作按钮 */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
        {/* 查看原图按钮 */}
        <Button variant="outline" size="icon" onClick={handlePreview}>
          <Eye className="h-4 w-4" />
        </Button>

        {/* 删除按钮 */}
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}