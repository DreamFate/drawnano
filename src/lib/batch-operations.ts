import JSZip from 'jszip';
import { ImageMeta } from '@/types';

type ImageWithSrc = ImageMeta & {
    src?: string;
};

export async function batchDownloadImages(
    images: ImageWithSrc[],
    mode: 'generated' | 'material'
): Promise<void> {
    if (images.length === 0) return;

    const zip = new JSZip();
    const prefix = mode === 'material' ? '素材' : '生图';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    for (const image of images) {
        if (!image.src) continue;

        try {
            const response = await fetch(image.src);
            const blob = await response.blob();
            const filename = `${prefix}${image.number}_${timestamp}.png`;
            zip.file(filename, blob);
        } catch (error) {
            console.error(`下载图片 ${image.number} 失败:`, error);
        }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_批量下载_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
