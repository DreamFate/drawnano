import { MaterialMeta } from '@/types';
import { createMaterialStore, getImageSrc } from './generated-image-storage';

// 使用工厂函数创建素材存储
const materialStore = createMaterialStore('drawnano_materials');

/**
 * 获取所有素材
 */
export const getAllMaterials = materialStore.getAll;

/**
 * 删除素材
 */
export const removeMaterial = materialStore.remove;

/**
 * 清空所有素材
 */
export const clearAllMaterials = materialStore.clearAll;

/**
 * 添加素材
 */
export async function addMaterial(base64Src: string, name?: string): Promise<MaterialMeta> {
  const id = crypto.randomUUID();
  const number = await materialStore.getNextNumber();

  const newMaterial: MaterialMeta = {
    id,
    srcId: id,
    prompt: name || '',  // 素材用 prompt 存名称
    timestamp: new Date(),
    number,
    type: 'material',    // discriminant
  };

  await materialStore.add(newMaterial, base64Src);
  return newMaterial;
}

/**
 * 获取单个素材
 */
export async function getMaterial(id: string): Promise<MaterialMeta | null> {
  const materials = await getAllMaterials();
  return materials.find(m => m.id === id) || null;
}

// 重导出 getImageSrc 供外部使用
export { getImageSrc };