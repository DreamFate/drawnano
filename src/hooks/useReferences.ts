import { useState, useCallback } from 'react';
import { GeneratedImageMeta, MaterialMeta, ImageReference } from '@/types';
import { getImageSrc } from '@/lib/conversation-storage';

/**
 * 引用列表管理 hook
 */
export function useReferences() {
  const [referencedItems, setReferencedItems] = useState<ImageReference[]>([]);

  // 添加图片引用
  const addImageReference = useCallback(async (
    image: GeneratedImageMeta,
    selectedImageId: string | null,
    showWarning: (msg: string) => void
  ) => {
    // 检查是否是当前选中修改的图片
    if (selectedImageId === image.id) {
      showWarning('该图片已被选中修改，无法同时引用');
      return false;
    }

    // 检查是否已经引用
    if (referencedItems.some(item => item.id === image.id)) {
      showWarning(`图片${image.number}已经在引用列表中`);
      return false;
    }

    // 获取图片src
    const src = await getImageSrc(image.srcId);
    if (!src) return false;

    setReferencedItems(prev => [...prev, {
      type: 'generated',
      id: image.id,
      originalNumber: image.number,
      displayName: `生图${image.number}`,
      src
    }]);
    return true;
  }, [referencedItems]);

  // 添加素材引用
  const addMaterialReference = useCallback(async (
    material: MaterialMeta,
    selectedImageId: string | null,
    showError: (msg: string) => void
  ) => {
    // 检查是否是当前选中修改的图片
    if (selectedImageId === material.id) {
      showError('该素材已被选中修改，无法同时引用');
      return false;
    }

    // 检查是否已经引用
    if (referencedItems.some(item => item.id === material.id)) {
      showError(`素材${material.number}已经在引用列表中`);
      return false;
    }

    // 获取图片src
    const src = await getImageSrc(material.srcId);
    if (!src) {
      showError('无法加载素材图片');
      return false;
    }

    setReferencedItems(prev => [...prev, {
      type: 'material',
      id: material.id,
      originalNumber: material.number,
      displayName: `素材${material.number}`,
      src
    }]);
    return true;
  }, [referencedItems]);

  // 移除引用
  const removeReference = useCallback((id: string) => {
    setReferencedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // 清空引用
  const clearReferences = useCallback(() => {
    setReferencedItems([]);
  }, []);

  // 从引用列表中移除指定ID（用于选中图片时）
  const removeFromReferences = useCallback((id: string) => {
    setReferencedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    referencedItems,
    addImageReference,
    addMaterialReference,
    removeReference,
    clearReferences,
    removeFromReferences,
  };
}
