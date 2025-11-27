import { useState, useCallback } from 'react';
import { ReferenceItem, GenerationConfig } from '@/components/PromptInput';
import {
  ChatMessage,
  ConversationImageMeta,
  ImageWithSrc,
  MaterialItem,
} from '@/lib/schemas';
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

interface LastRequest {
  prompt: string;
  selectedImageId: string | null;
  selectedImageSrc: string | null;
  referencedItems: ReferenceItem[];
  referenceImages: string[];
  userMessageId: string;
  generationConfig: GenerationConfig;
}

interface GenerateParams {
  prompt: string;
  apiKey: string;
  apiUrl: string;
  modelMapping: {
    'gemini-2.5-flash': string;
    'gemini-3-pro': string;
  };
  messages: ChatMessage[];
  images: ConversationImageMeta[];
  selectedImage: ImageWithSrc | null;
  referencedItems: ReferenceItem[];
  materials: MaterialItem[];
  systemStyle: string;
  generationConfig: GenerationConfig;
  onSuccess: (mainImageMeta: ConversationImageMeta, mainImageSrc: string) => void;
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
    referencedItems: ReferenceItem[],
    images: ConversationImageMeta[],
    materials: MaterialItem[],
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

      if (item.type === 'image') {
        const image = images.find((img: ConversationImageMeta) => img.id === item.id);
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
    prompt: string,
    userMessageId: string
  ) => {
    const lastImageUrl = imageUrls[imageUrls.length - 1];
    const otherImages = imageUrls.slice(0, -1);

    // 保存其他图片
    for (let i = 0; i < otherImages.length; i++) {
      const imageNumber = await getNextImageNumber();
      const imageId = crypto.randomUUID();
      const imageMeta: ConversationImageMeta = {
        id: imageId,
        srcId: imageId,
        prompt: `${prompt} (图片${i + 1}/${imageUrls.length})`,
        timestamp: new Date(),
        messageId: userMessageId,
        number: imageNumber,
      };
      await addImage(imageMeta, otherImages[i]);
    }

    // 保存主图
    const mainImageNumber = await getNextImageNumber();
    const mainImageId = crypto.randomUUID();
    const mainImageMeta: ConversationImageMeta = {
      id: mainImageId,
      srcId: mainImageId,
      prompt: imageUrls.length > 1
        ? `${prompt} (主图 ${imageUrls.length}/${imageUrls.length})`
        : prompt,
      timestamp: new Date(),
      messageId: userMessageId,
      number: mainImageNumber,
    };
    await addImage(mainImageMeta, lastImageUrl);

    return { mainImageMeta, mainImageSrc: lastImageUrl };
  }, []);

  // 生成图片
  const generateImage = useCallback(async (params: GenerateParams) => {
    const {
      prompt,
      apiKey,
      apiUrl,
      modelMapping,
      messages,
      images,
      selectedImage,
      referencedItems,
      materials,
      systemStyle,
      generationConfig,
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
        type: 'user',
        content: prompt,
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

      // 保存请求参数用于重试
      setLastRequest({
        prompt,
        selectedImageId: selectedImage?.id || null,
        selectedImageSrc: selectedImage?.src || null,
        referencedItems: [...referencedItems],
        referenceImages,
        userMessageId: userMessage.id,
        generationConfig,
      });

      // 构建对话历史
      const conversationHistory = messages
        .slice(-10)
        .map((msg: ChatMessage) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 调用API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt: selectedImage ? `基于图1进行修改：${prompt}` : prompt,
          selectedImageId: selectedImage?.id,
          referenceImages,
          conversationHistory,
          systemStyle: systemStyle.trim() || undefined,
          model: generationConfig.model,
          aspectRatio: generationConfig.aspectRatio,
          resolution: generationConfig.resolution,
          apiUrl,
          modelMapping,
        }),
      });

      if (!response.ok) {
        let errorMsg = '生成失败,请检查API Key是否正确';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {
          // 忽略解析错误
        }
        // 保存错误消息到对话记录
        const errorAssistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: '',
          timestamp: new Date(),
          error: errorMsg,
        };
        await addMessage(errorAssistantMessage);
        onError(errorMsg);
        return false;
      }

      // 解析流式响应
      const { textContent, imageUrls } = await parseSSEStream(response);
      const description = textContent || '图片已生成';

      if (imageUrls.length === 0) {
        // 未生成图片
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: description || '抱歉,本次未能生成图片,请尝试调整提示词后重试',
          timestamp: new Date(),
        };
        await addMessage(assistantMessage);
        onError('本次未生成图片,已保存对话记录');
        return false;
      }

      // 保存图片
      const { mainImageMeta, mainImageSrc } = await saveGeneratedImages(
        imageUrls,
        prompt,
        userMessage.id
      );

      // 保存AI回复
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: imageUrls.length > 1
          ? `${description}\n\n生成了${imageUrls.length}张图片,已使用最后一张作为修改主图`
          : description,
        timestamp: new Date(),
        generatedImageId: mainImageMeta.id,
      };
      await addMessage(assistantMessage);

      onSuccess(mainImageMeta, mainImageSrc);
      return true;

    } catch (error) {
      console.error('生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : '生成失败，请重试';
      // 保存错误消息到对话记录
      const errorAssistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        error: errorMessage,
      };
      await addMessage(errorAssistantMessage);
      onError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [prepareReferenceImages, saveGeneratedImages]);

  // 重试
  const retryGeneration = useCallback(async (
    apiKey: string,
    apiUrl: string,
    modelMapping: { 'gemini-2.5-flash': string; 'gemini-3-pro': string },
    systemStyle: string,
    onSuccess: (mainImageMeta: ConversationImageMeta, mainImageSrc: string) => void,
    onError: (message: string) => void
  ) => {
    if (!lastRequest) {
      onError('无法重试');
      return false;
    }

    const { userMessageId, referenceImages, prompt, selectedImageId, generationConfig } = lastRequest;

    setIsGenerating(true);

    try {
      const [currentMessages, currentImages] = await Promise.all([getMessages(), getImages()]);

      const userMsgIndex = currentMessages.findIndex((m: ChatMessage) => m.id === userMessageId);
      if (userMsgIndex === -1) {
        throw new Error('找不到原始消息');
      }

      // 构建对话历史（不包含要重试的消息）
      const conversationHistory = currentMessages
        .slice(0, userMsgIndex)
        .slice(-10)
        .map((msg: ChatMessage) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt: selectedImageId ? `基于图1进行修改：${prompt}` : prompt,
          selectedImageId,
          referenceImages,
          conversationHistory,
          systemStyle: systemStyle.trim() || undefined,
          model: generationConfig.model,
          aspectRatio: generationConfig.aspectRatio,
          resolution: generationConfig.resolution,
          apiUrl,
          modelMapping,
        }),
      });

      if (!response.ok) {
        let errorMsg = '重试失败,请检查API Key是否正确';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMsg = errorData.error;
          }
        } catch {
          // 忽略解析错误
        }
        // 保存错误消息到对话记录
        const errorAssistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: '',
          timestamp: new Date(),
          error: errorMsg,
        };
        await addMessage(errorAssistantMessage);
        onError(errorMsg);
        return false;
      }

      const { textContent, imageUrls } = await parseSSEStream(response);
      const description = textContent || '图片已生成';

      // 查找旧的AI回复
      const existingAIReply = currentMessages.find(
        (m: ChatMessage, idx: number) => idx === userMsgIndex + 1 && m.type === 'assistant'
      );

      if (imageUrls.length === 0) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: description || '抱歉,本次未能生成图片,请尝试调整提示词后重试',
          timestamp: new Date(),
        };

        if (existingAIReply) {
          await deleteMessage(existingAIReply.id);
        }
        await addMessage(assistantMessage);
        onError('本次未生成图片,已保存对话记录');
        return false;
      }

      // 删除旧的AI回复和关联图片
      if (existingAIReply) {
        if (existingAIReply.generatedImageId) {
          const oldImage = currentImages.find((img: ConversationImageMeta) => img.id === existingAIReply.generatedImageId);
          if (oldImage) {
            await deleteImageById(oldImage.id);
          }
        }
        await deleteMessage(existingAIReply.id);
      }

      // 保存新图片
      const { mainImageMeta, mainImageSrc } = await saveGeneratedImages(
        imageUrls,
        prompt,
        userMessageId
      );

      // 保存新的AI回复
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: imageUrls.length > 1
          ? `${description}\n\n生成了${imageUrls.length}张图片,已使用最后一张作为修改主图`
          : description,
        timestamp: new Date(),
        generatedImageId: mainImageMeta.id,
      };
      await addMessage(assistantMessage);

      onSuccess(mainImageMeta, mainImageSrc);
      return true;

    } catch (error) {
      console.error('重试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '重试失败，请重试';
      // 保存错误消息到对话记录
      const errorAssistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        error: errorMessage,
      };
      await addMessage(errorAssistantMessage);
      onError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [lastRequest, saveGeneratedImages]);

  return {
    isGenerating,
    lastRequest,
    generateImage,
    retryGeneration,
  };
}
