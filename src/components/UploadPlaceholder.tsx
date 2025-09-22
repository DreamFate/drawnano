"use client";

import { UploadCloud } from 'lucide-react';

interface UploadPlaceholderProps {
  onClick: () => void;
  isDragOver: boolean;
}

export function UploadPlaceholder({ onClick, isDragOver }: UploadPlaceholderProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        h-40 w-full cursor-pointer rounded-lg
        border-2 border-dashed
        transition-colors duration-300
        ${isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}
      `}
    >
      <UploadCloud className={`h-8 w-8 mb-2 ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`} />
      <p className={`text-sm text-center ${isDragOver ? 'text-blue-600' : 'text-gray-500'}`}>
        {isDragOver ? '松开以上传' : '点击或拖拽上传'}
      </p>
    </div>
  );
}
