import { useState, useCallback } from 'react';
import { GeneratedImageMeta, MaterialMeta, ImageReference } from '@/types';
import { getImageSrc } from '@/lib/conversation-storage';

/**
 * 引用列表管理 hook
 */
export function useReferences() {
  const [referencedItems, setReferencedItems] = useState<ImageReference[]>([]);
  const MAX_REFERENCES = 14;

  // 添加图片引用
  const addImageReference = useCallback(async (
    image: GeneratedImageMeta,
    selectedImageId: string | null,
    showWarning: (msg: string) => void,
    showError: (msg: string) => void
  ) => {
    // 检查引用数量上限
    if (referencedItems.length + (selectedImageId ? 1 : 0) >= MAX_REFERENCES) {
      showWarning(`引用列表已达上限(${MAX_REFERENCES}个)`);
      return false;
    }

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
    if (!src) {
      showError('无法加载生图图片');
      return false;
    }

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
    showWarning: (msg: string) => void,
    showError: (msg: string) => void
  ) => {
    // 检查引用数量上限
    if (referencedItems.length + (selectedImageId ? 1 : 0) >= MAX_REFERENCES) {
      showWarning(`引用列表已达上限(${MAX_REFERENCES}个)`);
      return false;
    }

    // 检查是否是当前选中修改的图片
    if (selectedImageId === material.id) {
      showWarning('该素材已被选中修改，无法同时引用');
      return false;
    }

    // 检查是否已经引用
    if (referencedItems.some(item => item.id === material.id)) {
      showWarning(`素材${material.number}已经在引用列表中`);
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

  // 批量添加图片引用
  const addBatchImageReferences = useCallback(async (
    images: GeneratedImageMeta[],
    selectedImageId: string | null,
    showWarning: (msg: string) => void
  ) => {
    const availableSlots = MAX_REFERENCES - referencedItems.length - (selectedImageId ? 1 : 0);

    if (availableSlots <= 0) {
      showWarning(`引用列表已达上限(${MAX_REFERENCES}个)`);
      return { success: 0, failed: images.length };
    }

    // 过滤掉已选中修改的图片和已引用的图片
    const validImages = images.filter(img =>
      img.id !== selectedImageId &&
      !referencedItems.some(item => item.id === img.id)
    );

    // 限制添加数量
    const imagesToAdd = validImages.slice(0, availableSlots);
    const newReferences: ImageReference[] = [];

    for (const image of imagesToAdd) {
      const src = await getImageSrc(image.srcId);
      if (src) {
        newReferences.push({
          type: 'generated',
          id: image.id,
          originalNumber: image.number,
          displayName: `生图${image.number}`,
          src
        });
      }
    }

    if (newReferences.length > 0) {
      setReferencedItems(prev => [...prev, ...newReferences]);
    }

    const failed = images.length - newReferences.length;
    if (failed > 0) {
      if (availableSlots < validImages.length) {
        showWarning(`已添加${newReferences.length}个引用，剩余${failed}个因超出上限(${MAX_REFERENCES}个)未添加`);
      } else {
        showWarning(`已添加${newReferences.length}个引用，${failed}个图片已引用或已选中修改`);
      }
    }

    return { success: newReferences.length, failed };
  }, [referencedItems]);

  // 批量添加素材引用
  const addBatchMaterialReferences = useCallback(async (
    materials: MaterialMeta[],
    selectedImageId: string | null,
    showWarning: (msg: string) => void
  ) => {
    const availableSlots = MAX_REFERENCES - referencedItems.length - (selectedImageId ? 1 : 0);

    if (availableSlots <= 0) {
      showWarning(`引用列表已达上限(${MAX_REFERENCES}个)`);
      return { success: 0, failed: materials.length };
    }

    // 过滤掉已选中修改的素材和已引用的素材
    const validMaterials = materials.filter(mat =>
      mat.id !== selectedImageId &&
      !referencedItems.some(item => item.id === mat.id)
    );

    // 限制添加数量
    const materialsToAdd = validMaterials.slice(0, availableSlots);
    const newReferences: ImageReference[] = [];

    for (const material of materialsToAdd) {
      const src = await getImageSrc(material.srcId);
      if (src) {
        newReferences.push({
          type: 'material',
          id: material.id,
          originalNumber: material.number,
          displayName: `素材${material.number}`,
          src
        });
      }
    }

    if (newReferences.length > 0) {
      setReferencedItems(prev => [...prev, ...newReferences]);
    }

    const failed = materials.length - newReferences.length;
    if (failed > 0) {
      if (availableSlots < validMaterials.length) {
        showWarning(`已添加${newReferences.length}个引用，剩余${failed}个因超出上限(${MAX_REFERENCES}个)未添加`);
      } else {
        showWarning(`已添加${newReferences.length}个引用，${failed}个素材已引用或已选中修改`);
      }
    }

    return { success: newReferences.length, failed };
  }, [referencedItems]);

  // 选择修改图片时检查并调整引用列表
  const removeFromReferences = useCallback((
    imageId: string,
    showWarning: (msg: string) => void
  ) => {
    setReferencedItems(prev => {
      // 先移除该图片(如果存在)
      const filtered = prev.filter(item => item.id !== imageId);

      // 检查选中该图片后,引用列表是否需要调整
      // 选中图片会占用1个位置,引用列表最多只能有13个
      if (filtered.length >= MAX_REFERENCES) {
        // 移除最后一个引用
        const lastItem = filtered[filtered.length - 1];
        showWarning(`引用列表已达上限,自动移除了最后一个引用: ${lastItem.displayName}`);
        return filtered.slice(0, -1);
      }

      return filtered;
    });
  }, []);

  return {
    referencedItems,
    addImageReference,
    addMaterialReference,
    addBatchImageReferences,
    addBatchMaterialReferences,
    removeReference,
    clearReferences,
    removeFromReferences,
  };
}
