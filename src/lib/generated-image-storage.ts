import {
  GeneratedImageMeta,
  GeneratedImageMetaSerializedSchema,
  MaterialMeta,
  MaterialMetaSerializedSchema,
} from '@/types';
import { storeImage, getImage, deleteImage, getAllImageIds } from './image-storage';

/**
 * 创建生成图片存储
 */
export function createGeneratedImageStore(storageKey: string) {

  async function getAll(): Promise<GeneratedImageMeta[]> {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown[];
      return parsed.map(item => GeneratedImageMetaSerializedSchema.parse(item));
    } catch (error) {
      console.error(`Failed to load images from ${storageKey}:`, error);
      return [];
    }
  }

  async function saveAll(images: GeneratedImageMeta[]): Promise<void> {
    localStorage.setItem(storageKey, JSON.stringify(images));
  }

  async function add(imageMeta: GeneratedImageMeta, base64Src: string): Promise<void> {
    await storeImage(imageMeta.srcId, base64Src);
    const images = await getAll();
    images.push(imageMeta);
    await saveAll(images);
  }

  async function remove(imageId: string): Promise<void> {
    const images = await getAll();
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) throw new Error(`Image ${imageId} not found`);

    await deleteImage(imageToDelete.srcId);

    const filtered = images.filter(img => img.id !== imageId);
    const renumbered = filtered
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((img, index) => ({ ...img, number: index + 1 }));

    await saveAll(renumbered);
  }

  async function getNextNumber(): Promise<number> {
    const images = await getAll();
    if (images.length === 0) return 1;
    return Math.max(...images.map(img => img.number)) + 1;
  }

  async function clearAll(): Promise<void> {
    const images = await getAll();
    await Promise.all(
      images.map(img => deleteImage(img.srcId).catch(err => {
        console.warn(`Failed to delete image ${img.srcId}:`, err);
      }))
    );
    await saveAll([]);
  }

  return { getAll, add, remove, getNextNumber, clearAll };
}

/**
 * 创建素材存储
 */
export function createMaterialStore(storageKey: string) {

  async function getAll(): Promise<MaterialMeta[]> {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown[];
      return parsed.map(item => MaterialMetaSerializedSchema.parse(item));
    } catch (error) {
      console.error(`Failed to load materials from ${storageKey}:`, error);
      return [];
    }
  }

  async function saveAll(materials: MaterialMeta[]): Promise<void> {
    localStorage.setItem(storageKey, JSON.stringify(materials));
  }

  async function add(materialMeta: MaterialMeta, base64Src: string): Promise<void> {
    await storeImage(materialMeta.srcId, base64Src);
    const materials = await getAll();
    materials.push(materialMeta);
    await saveAll(materials);
  }

  async function remove(materialId: string): Promise<void> {
    const materials = await getAll();
    const materialToDelete = materials.find(m => m.id === materialId);
    if (!materialToDelete) throw new Error(`Material ${materialId} not found`);

    await deleteImage(materialToDelete.srcId);

    const filtered = materials.filter(m => m.id !== materialId);
    const renumbered = filtered
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((m, index) => ({ ...m, number: index + 1 }));

    await saveAll(renumbered);
  }

  async function getNextNumber(): Promise<number> {
    const materials = await getAll();
    if (materials.length === 0) return 1;
    return Math.max(...materials.map(m => m.number)) + 1;
  }

  async function clearAll(): Promise<void> {
    const materials = await getAll();
    await Promise.all(
      materials.map(m => deleteImage(m.srcId).catch(err => {
        console.warn(`Failed to delete material ${m.srcId}:`, err);
      }))
    );
    await saveAll([]);
  }

  return { getAll, add, remove, getNextNumber, clearAll };
}

// ==================== 生成图片存储 ====================

const generatedImageStore = createGeneratedImageStore('drawnano_images');

export const getGeneratedImages = generatedImageStore.getAll;
export const addGeneratedImage = generatedImageStore.add;
export const deleteGeneratedImage = generatedImageStore.remove;
export const getNextImageNumber = generatedImageStore.getNextNumber;
export const clearAllGeneratedImages = generatedImageStore.clearAll;

// 获取图片 base64（通用）
export async function getImageSrc(srcId: string): Promise<string | null> {
  try {
    return await getImage(srcId);
  } catch (error) {
    console.error('Failed to get image src:', error);
    return null;
  }
}

// 清理失效的生成图片
export async function cleanInvalidGeneratedImages(): Promise<number> {
  try {
    const allImageIds = await getAllImageIds();
    const imageIdSet = new Set(allImageIds);
    const images = await getGeneratedImages();

    const invalidImages = images.filter(img => !imageIdSet.has(img.srcId));

    if (invalidImages.length > 0) {
      const validImages = images.filter(img => imageIdSet.has(img.srcId));
      const renumbered = validImages
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((img, index) => ({ ...img, number: index + 1 }));

      localStorage.setItem('drawnano_images', JSON.stringify(renumbered));
    }

    return invalidImages.length;
  } catch (error) {
    console.error('Failed to clean invalid generated images:', error);
    throw error;
  }
}

// 清理失效的素材
export async function cleanInvalidMaterials(): Promise<number> {
  try {
    const allImageIds = await getAllImageIds();
    const imageIdSet = new Set(allImageIds);
    const stored = localStorage.getItem('drawnano_materials');
    if (!stored) return 0;

    const materials: MaterialMeta[] = JSON.parse(stored).map((item: unknown) =>
      MaterialMetaSerializedSchema.parse(item)
    );

    const invalidMaterials = materials.filter((m: MaterialMeta) => !imageIdSet.has(m.srcId));

    if (invalidMaterials.length > 0) {
      const validMaterials = materials.filter((m: MaterialMeta) => imageIdSet.has(m.srcId));
      const renumbered = validMaterials
        .sort((a: MaterialMeta, b: MaterialMeta) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((m: MaterialMeta, index: number) => ({ ...m, number: index + 1 }));

      localStorage.setItem('drawnano_materials', JSON.stringify(renumbered));
    }

    return invalidMaterials.length;
  } catch (error) {
    console.error('Failed to clean invalid materials:', error);
    throw error;
  }
}
