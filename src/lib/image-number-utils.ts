import { ImageReference } from '@/types';

/**
 * 计算图片在引用列表中的编号
 * @param imageId 图片ID
 * @param selectedImageId 当前选中的图片ID（用于修改）
 * @param referencedItems 引用列表
 * @returns 图片编号，如果未被引用则返回 null
 */
export function getImageReferenceNumber(
    imageId: string,
    selectedImageId: string | null,
    referencedIds: string[]
): number | null {
    // 如果是选中的图片，编号为 1
    if (selectedImageId && imageId === selectedImageId) {
        return 1;
    }

    // 在引用列表中查找
    const index = referencedIds.findIndex(id => id === imageId);
    if (index === -1) {
        return null;
    }

    // 如果有选中图片，引用列表从 2 开始，否则从 1 开始
    return selectedImageId ? index + 2 : index + 1;
}

/**
 * 计算引用列表中某个位置的图片编号
 * @param index 在引用列表中的索引
 * @param hasSelectedImage 是否有选中的图片
 * @returns 图片编号
 */
export function getReferenceListNumber(
    index: number,
    hasSelectedImage: boolean
): number {
    return hasSelectedImage ? index + 2 : index + 1;
}
