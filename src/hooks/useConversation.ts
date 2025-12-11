import { useState, useCallback } from 'react';
import {
  ChatMessage,
  GeneratedImageMeta,
  ImageMeta,
  ImageWithSrc,
} from '@/types';
import {
  getMessages,
  getImages,
  deleteMessage as deleteMsg,
  clearMessages as clearMsgs,
  deleteImageById,
  getImageSrc,
} from '@/lib/conversation-storage';

export interface ChatState {
  messages: ChatMessage[];
  images: GeneratedImageMeta[];
}

/**
 * 对话管理 hook
 */
export function useConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [images, setImages] = useState<GeneratedImageMeta[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageWithSrc | null>(null);

  // 初始化
  const initialize = useCallback(async () => {
    try {
      const [msgs, imgs] = await Promise.all([getMessages(), getImages()]);
      setMessages(msgs);
      setImages(imgs);
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }, []);

  // 刷新数据
  const refresh = useCallback(async (clearSelection: boolean = false) => {
    try {
      const [msgs, imgs] = await Promise.all([getMessages(), getImages()]);
      setMessages(msgs);
      setImages(imgs);
      if (clearSelection) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  }, []);

  // 选择图片（支持生成图片和素材）
  const selectImage = useCallback(async (imageMeta: ImageMeta) => {
    try {
      const src = await getImageSrc(imageMeta.srcId);
      if (src) {
        setSelectedImage({ ...imageMeta, src });
      }
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }, []);

  // 清除图片选择
  const clearImageSelection = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // 删除消息
  const deleteMessage = useCallback(async (messageId: string) => {
    await deleteMsg(messageId);
    await refresh(false);
  }, [refresh]);

  // 清空消息
  const clearMessages = useCallback(async () => {
    await clearMsgs();
    await refresh(false);
  }, [refresh]);

  // 删除图片
  const deleteImage = useCallback(async (imageId: string) => {
    await deleteImageById(imageId);
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
    await refresh(false);
  }, [selectedImage?.id, refresh]);

  return {
    messages,
    images,
    selectedImage,
    setSelectedImage,
    initialize,
    refresh,
    selectImage,
    clearImageSelection,
    deleteMessage,
    clearMessages,
    deleteImage,
  };
}
