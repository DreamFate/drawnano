import { MaterialItem, MaterialMetaSerializedSchema } from './schemas';
import { storeImage, getImage, deleteImage } from './image-storage';

const STORAGE_KEY = 'drawnano_materials';

/**
 * 素材元数据(不包含图片数据)
 */
interface MaterialMeta {
  id: string;
  srcId: string; // IndexedDB 中的图片ID
  number: number;
  name?: string;
  timestamp: Date;
}

/**
 * 获取所有素材的元数据
 */
export async function getAllMaterials(): Promise<MaterialItem[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown[];
    const metas = parsed.map((item) => MaterialMetaSerializedSchema.parse(item));

    // 加载图片数据
    const materials = await Promise.all(
      metas.map(async (meta) => {
        const src = await getImage(meta.id);
        return {
          ...meta,
          src: src || '', // 如果图片不存在,使用空字符串
        };
      })
    );

    return materials;
  } catch (error) {
    console.error('Failed to load materials:', error);
    return [];
  }
}

/**
 * 保存素材元数据到 localStorage
 */
async function saveMaterialsMeta(metas: MaterialMeta[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metas));
  } catch (error) {
    console.error('Failed to save materials meta:', error);
    throw error;
  }
}

/**
 * 添加素材(图片数据存入 IndexedDB,元数据存入 localStorage)
 */
export async function addMaterial(
  base64Src: string,
  name?: string
): Promise<MaterialItem> {
  try {
    // 1. 获取当前素材列表
    const materials = await getAllMaterials();

    // 2. 生成新素材
    const id = crypto.randomUUID();
    const newMaterial: MaterialItem = {
      id,
      src: base64Src,
      number: materials.length + 1,
      name,
      timestamp: new Date(),
    };

    // 3. 存储图片到 IndexedDB
    await storeImage(id, base64Src);

    // 4. 保存元数据到 localStorage
    const metas: MaterialMeta[] = materials.map(m => ({
      id: m.id,
      srcId: m.id,
      number: m.number,
      name: m.name,
      timestamp: m.timestamp,
    }));

    metas.push({
      id,
      srcId: id,
      number: newMaterial.number,
      name,
      timestamp: newMaterial.timestamp,
    });

    await saveMaterialsMeta(metas);

    return newMaterial;
  } catch (error) {
    console.error('Failed to add material:', error);
    throw error;
  }
}

/**
 * 删除素材(同时删除 IndexedDB 中的图片和 localStorage 中的元数据)
 */
export async function removeMaterial(id: string): Promise<void> {
  try {
    // 1. 删除 IndexedDB 中的图片
    await deleteImage(id);

    // 2. 获取当前素材列表
    const materials = await getAllMaterials();

    // 3. 过滤掉要删除的素材
    const filtered = materials.filter(m => m.id !== id);

    // 4. 重新编号
    const renumbered = filtered.map((material, index) => ({
      ...material,
      number: index + 1,
    }));

    // 5. 保存元数据
    const metas: MaterialMeta[] = renumbered.map(m => ({
      id: m.id,
      srcId: m.id,
      number: m.number,
      name: m.name,
      timestamp: m.timestamp,
    }));

    await saveMaterialsMeta(metas);
  } catch (error) {
    console.error('Failed to remove material:', error);
    throw error;
  }
}

/**
 * 获取单个素材
 */
export async function getMaterial(id: string): Promise<MaterialItem | null> {
  try {
    const materials = await getAllMaterials();
    return materials.find(m => m.id === id) || null;
  } catch (error) {
    console.error('Failed to get material:', error);
    return null;
  }
}

/**
 * 清空所有素材
 */
export async function clearAllMaterials(): Promise<void> {
  try {
    // 1. 获取所有素材
    const materials = await getAllMaterials();

    // 2. 删除所有图片
    await Promise.all(
      materials.map(m => deleteImage(m.id).catch(err => {
        console.warn(`Failed to delete material image ${m.id}:`, err);
      }))
    );

    // 3. 清空 localStorage
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear materials:', error);
    throw error;
  }
}