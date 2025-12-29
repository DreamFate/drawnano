export function useImageDownload() {
    const downloadImage = (src: string, filename: string) => {
        if (!src) return;
        const link = document.createElement('a');
        link.href = src;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateFilename = (
        mode: 'generated' | 'material',
        number: number,
        timestamp: Date
    ): string => {
        const prefix = mode === 'material' ? '素材' : '生图';
        const date = timestamp.toISOString().split('T')[0];
        return `${prefix}${number}_${date}.jpg`;
    };

    return {
        downloadImage,
        generateFilename
    };
}
