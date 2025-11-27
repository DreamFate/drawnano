import { ImageMeta } from './schemas';
import { createImageStore, getImageSrc } from './generated-image-storage';

// 使用工厂函数创建素材存储
const materialStore = createImageStore('drawnano_materials');

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
export async function addMaterial(base64Src: string, name?: string): Promise<ImageMeta> {
  const id = crypto.randomUUID();
  const number = await materialStore.getNextNumber();

  const newMaterial: ImageMeta = {
    id,
    srcId: id,
    prompt: name || '',  // 素材用 prompt 存名称
    timestamp: new Date(),
    messageId: '',       // 素材没有关联消息
    number,
  };

  await materialStore.add(newMaterial, base64Src);
  return newMaterial;
}

/**
 * 获取单个素材
 */
export async function getMaterial(id: string): Promise<ImageMeta | null> {
  const materials = await getAllMaterials();
  return materials.find(m => m.id === id) || null;
}

// 重导出 getImageSrc 供外部使用
export { getImageSrc };