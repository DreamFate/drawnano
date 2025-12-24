import { useState, useCallback } from 'react';
import {
  ChatMessage,
  GeneratedImageMeta,
  ImageWithSrc,
  MaterialMeta,
  ImageReference,
  ModelConfig,
  ApiErrorMessage
} from '@/types';
import {
  getMessages,
  getImages,
  addMessage,
  addImage,
  getImageSrc,
  getNextImageNumber,
  deleteMessage,
  deleteImageById,
  deleteErrorMessages,
} from '@/lib/conversation-storage';
import { parseSSEStream } from '@/lib/sse-parser';
import { on } from 'events';

interface LastRequest {
  prompt: string;
  selectedImageId: string | null;
  selectedImageSrc: string | null;
  referencedItems: ImageReference[];
  referenceImages: string[];
  modelConfig: ModelConfig;
  conversationHistory: any[];
}

interface GenerateParams {
  prompt: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  messages: ChatMessage[];
  images: GeneratedImageMeta[];
  selectedImage: ImageWithSrc | null;
  referencedItems: ImageReference[];
  materials: MaterialMeta[];
  systemStyle: string;
  modelConfig: ModelConfig;
  onSuccess: (mainImageMeta: GeneratedImageMeta, mainImageSrc: string) => void;
  onError: (message: string) => void;
  onWarning: (message: string) => void;
}

/**
 * 图片生成 hook
 */
export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);

  // 准备引用图片列表
  const prepareReferenceImages = useCallback(async (
    selectedImage: ImageWithSrc | null,
    referencedItems: ImageReference[],
    images: GeneratedImageMeta[],
    materials: MaterialMeta[],
    onWarning: (msg: string) => void
  ) => {
    const referenceImages: string[] = [];
    const validReferences: string[] = [];
    const skippedReferences: string[] = [];

    // 主图作为图片1
    if (selectedImage) {
      referenceImages.push(selectedImage.src);
      validReferences.push('图片1(主图)');
    }

    // 引用列表的图片
    for (const item of referencedItems) {
      let isValid = false;

      if (item.type === 'generated') {
        const image = images.find((img: GeneratedImageMeta) => img.id === item.id);
        if (image) {
          try {
            const src = await getImageSrc(image.srcId);
            if (src) {
              referenceImages.push(src);
              validReferences.push(`图片${referenceImages.length}(${item.displayName})`);
              isValid = true;
            }
          } catch (error) {
            console.warn(`无法加载图片: ${item.displayName}`, error);
          }
        }
      } else if (item.type === 'material') {
        const material = materials.find(m => m.id === item.id);
        if (material) {
          try {
            const src = await getImageSrc(material.srcId);
            if (src) {
              referenceImages.push(src);
              validReferences.push(`图片${referenceImages.length}(${item.displayName})`);
              isValid = true;
            }
          } catch (error) {
            console.warn(`无法加载素材: ${item.displayName}`, error);
          }
        }
      }

      if (!isValid) {
        skippedReferences.push(item.displayName);
      }
    }

    if (skippedReferences.length > 0) {
      console.warn('以下引用不存在,已跳过:', skippedReferences);
      onWarning(`部分引用不存在已跳过: ${skippedReferences.join(', ')}`);
    }

    console.log('有效引用:', validReferences.map((name, idx) => `${idx + 1}. ${name}`));

    return referenceImages;
  }, []);

  // 保存生成的图片
  const saveGeneratedImages = useCallback(async (
    imageUrls: string[],
    prompt: string
  ) => {
    const lastImageUrl = imageUrls[imageUrls.length - 1];
    const otherImages = imageUrls.slice(0, -1);

    // 保存其他图片
    for (let i = 0; i < otherImages.length; i++) {
      const imageNumber = await getNextImageNumber();
      const imageId = crypto.randomUUID();
      const imageMeta: GeneratedImageMeta = {
        id: imageId,
        srcId: imageId,
        prompt: `${prompt} (图片${i + 1}/${imageUrls.length})`,
        timestamp: new Date(),
        number: imageNumber,
        type: 'generated',
      };
      await addImage(imageMeta, otherImages[i]);
    }

    // 保存主图
    const mainImageNumber = await getNextImageNumber();
    const mainImageId = crypto.randomUUID();
    const mainImageMeta: GeneratedImageMeta = {
      id: mainImageId,
      srcId: mainImageId,
      prompt: imageUrls.length > 1
        ? `${prompt} (主图 ${imageUrls.length}/${imageUrls.length})`
        : prompt,
      timestamp: new Date(),
      number: mainImageNumber,
      type: 'generated',
    };
    await addImage(mainImageMeta, lastImageUrl);

    return { mainImageMeta, mainImageSrc: lastImageUrl };
  }, []);

  // 执行生成请求(共享逻辑)
  const performGeneration = useCallback(async ({
    prompt,
    apiKey,
    apiUrl,
    model,
    selectedImageId,
    referenceImages,
    conversationHistory,
    systemStyle,
    modelConfig,
    onSuccess,
    onError,
    onWarning,
  }: {
    prompt: string;
    apiKey: string;
    apiUrl: string;
    model: string;
    selectedImageId?: string | null;
    referenceImages: string[];
    conversationHistory: any[];
    systemStyle: string;
    modelConfig: ModelConfig;
    onSuccess: (mainImageMeta: GeneratedImageMeta, mainImageSrc: string) => void;
    onError?: (message: string) => void;
    onWarning?: (message: string) => void;
  }) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        prompt,
        selectedImageId,
        referenceImages,
        model,
        conversationHistory,
        systemStyle: systemStyle?.trim() || undefined,
        modelConfig,
        apiUrl,
      }),
    });

    if (!response.ok) {
      let apiError: ApiErrorMessage = {
        code: 'GENERATION_FAILED',
        messages: '生成失败,请检查API Key是否正确',
        status: `HTTP ${response.status}`
      };

      try {
        const errorData = await response.json();
        if (errorData.error) {
          if (typeof errorData.error === 'object' && errorData.error.code) {
            apiError = errorData.error;
          } else if (typeof errorData.error === 'string') {
            apiError.messages = errorData.error;
          }
        }
      } catch {
        // 忽略解析错误,使用默认错误信息
      }

      // 保存错误消息到对话记录
      const errorAssistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: '',
        timestamp: new Date(),
        error: apiError,
      };
      await addMessage(errorAssistantMessage);
      return false;
    }

    // 解析流式响应
    const { textContent , thoughtContent, imageUrls } = await parseSSEStream(response);

    // 保存AI回复
    let assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      thought: thoughtContent,
      text: textContent,
      timestamp: new Date()
    };

    // 文字模型直接返回
    if (modelConfig.modeltype === 'word' && imageUrls.length === 0) {
      if (textContent) {
        await addMessage(assistantMessage);
        return true;
      }else {
        assistantMessage.text = '本次未返回内容,请尝试重试'
        await addMessage(assistantMessage);
        return false;
      }
    }

    if (imageUrls.length === 0) {
      assistantMessage.text = '本次未生成图片,请尝试重试'
      await addMessage(assistantMessage);
      return false;
    }


    // 保存图片
    const { mainImageMeta, mainImageSrc } = await saveGeneratedImages(
      imageUrls,
      prompt
    );

    assistantMessage.isImage = true;
    await addMessage(assistantMessage);

    onSuccess(mainImageMeta, mainImageSrc);
    return true;
  }, [saveGeneratedImages]);

  // 生成图片
  const generateImage = useCallback(async (params: GenerateParams) => {
    const {
      prompt,
      apiKey,
      apiUrl,
      model,
      messages,
      images,
      selectedImage,
      referencedItems,
      materials,
      systemStyle,
      modelConfig,
      onSuccess,
      onError,
      onWarning,
    } = params;

    setIsGenerating(true);

    try {
      // 新请求前删除所有带 error 的消息
      await deleteErrorMessages();

      // 保存用户消息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: prompt,
        timestamp: new Date(),
      };
      await addMessage(userMessage);

      // 准备引用图片
      const referenceImages = await prepareReferenceImages(
        selectedImage,
        referencedItems,
        images,
        materials,
        onWarning
      );

      // 构建对话历史
      const conversationHistory = messages
        .map((msg: ChatMessage) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));

      // 保存请求参数用于重试
      setLastRequest({
        prompt,
        selectedImageId: selectedImage?.id || null,
        selectedImageSrc: selectedImage?.src || null,
        referencedItems: [...referencedItems],
        referenceImages,
        modelConfig,
        conversationHistory,
      });

      // 执行生成请求
      return await performGeneration({
        prompt,
        apiKey,
        apiUrl,
        model,
        selectedImageId: selectedImage?.id,
        referenceImages,
        conversationHistory,
        systemStyle,
        modelConfig,
        onSuccess,
        onError,
        onWarning,
      });
    } catch (error) {
      console.error('生成失败:', error);
      onError?.('生成失败，请联系管理员');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [prepareReferenceImages, performGeneration]);

  // 重试
  const retryGeneration = useCallback(async (
    apiKey: string,
    apiUrl: string,
    model: string,
    systemStyle: string,
    messageId: string,
    onSuccess: (mainImageMeta: GeneratedImageMeta, mainImageSrc: string) => void,
    onError: (message: string) => void
  ) => {
    if (!lastRequest) {
      onError('无法重试');
      return false;
    }

    const { referenceImages, prompt, selectedImageId, modelConfig , conversationHistory } = lastRequest;

    setIsGenerating(true);

    try {
      await deleteMessage(messageId);

      // 执行生成请求
      return await performGeneration({
        prompt,
        apiKey,
        apiUrl,
        model,
        selectedImageId,
        referenceImages,
        conversationHistory,
        systemStyle,
        modelConfig,
        onSuccess,
        onError,
      });
    } catch (error) {
      console.error('重试失败:', error);
      onError?.('重试失败，请联系管理员');
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [lastRequest, performGeneration]);

  return {
    isGenerating,
    lastRequest,
    generateImage,
    retryGeneration,
  };
}
