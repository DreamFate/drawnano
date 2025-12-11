import { useState, useCallback } from 'react';
import { MaterialMeta } from '@/types';
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
  const [materials, setMaterials] = useState<MaterialMeta[]>([]);

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

  // 读取文件为 base64
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // 上传素材
  const uploadMaterials = useCallback(async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    // 顺序处理每个文件，确保 number 正确递增
    for (const file of imageFiles) {
      try {
        const base64 = await readFileAsDataURL(file);
        const newMaterial = await addMaterial(base64, file.name);
        setMaterials(prev => [...prev, newMaterial]);
      } catch (error) {
        console.error('Failed to add material:', error);
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
