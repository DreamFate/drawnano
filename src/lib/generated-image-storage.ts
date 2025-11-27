import { ImageMeta, ImageMetaSerializedSchema } from './schemas';
import { storeImage, getImage, deleteImage } from './image-storage';

/**
 * 创建图片存储（工厂函数）
 * 素材和生成图片共用同一套逻辑，只是存储 key 不同
 */
export function createImageStore(storageKey: string) {

  async function getAll(): Promise<ImageMeta[]> {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown[];
      return parsed.map(item => ImageMetaSerializedSchema.parse(item));
    } catch (error) {
      console.error(`Failed to load images from ${storageKey}:`, error);
      return [];
    }
  }

  async function saveAll(images: ImageMeta[]): Promise<void> {
    localStorage.setItem(storageKey, JSON.stringify(images));
  }

  async function add(imageMeta: ImageMeta, base64Src: string): Promise<void> {
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

// ==================== 生成图片存储 ====================

const generatedImageStore = createImageStore('drawnano_images');

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
