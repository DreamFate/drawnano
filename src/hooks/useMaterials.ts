import { useState, useCallback } from 'react';
import { MaterialItem } from '@/lib/schemas';
import {
  getAllMaterials,
  addMaterial,
  removeMaterial,
} from '@/lib/material-storage';
import { getImageSrc } from '@/lib/conversation-storage';

/**
 * 素材库管理 hook
 */
export function useMaterials() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // 加载所有素材
  const loadMaterials = useCallback(async () => {
    try {
      const loadedMaterials = await getAllMaterials();
      setMaterials(loadedMaterials);
      return loadedMaterials;
    } catch (error) {
      console.error('Failed to load materials:', error);
      return [];
    }
  }, []);

  // 上传素材
  const uploadMaterials = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
              const newMaterial = await addMaterial(result, file.name);
              setMaterials(prev => [...prev, newMaterial]);
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Failed to add material:', error);
        }
      }
    }
  }, []);

  // 删除素材
  const deleteMaterial = useCallback(async (id: string) => {
    try {
      await removeMaterial(id);
      const updatedMaterials = await getAllMaterials();
      setMaterials(updatedMaterials);
    } catch (error) {
      console.error('Failed to remove material:', error);
    }
  }, []);

  // 获取素材图片 src
  const getMaterialSrc = useCallback(async (srcId: string) => {
    return await getImageSrc(srcId);
  }, []);

  return {
    materials,
    loadMaterials,
    uploadMaterials,
    deleteMaterial,
    getMaterialSrc,
  };
}
