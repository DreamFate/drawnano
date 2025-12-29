import { useState } from 'react';

export function useImageDialog<T = any>() {
    const [dialogImage, setDialogImage] = useState<T | null>(null);

    const openDialog = (image: T) => {
        setDialogImage(image);
    };

    const closeDialog = () => {
        setDialogImage(null);
    };

    return {
        dialogImage,
        isOpen: !!dialogImage,
        openDialog,
        closeDialog
    };
}
