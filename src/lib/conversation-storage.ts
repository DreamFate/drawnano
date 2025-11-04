import {
  Conversation,
  ChatMessage,
  ConversationImageMeta,
  ConversationData,
  ConversationSerializedSchema,
  ConversationDataSerializedSchema,
} from './schemas';
import { storeImage, getImage, deleteImage } from './image-storage';

const STORAGE_KEYS = {
  CONVERSATIONS: 'drawnano_conversations',
  CONVERSATION_PREFIX: 'drawnano_conversation_',
} as const;

// ==================== 会话索引管理 ====================

/**
 * 获取所有会话的索引列表
 */
export async function getAllConversations(): Promise<Conversation[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown[];
    return parsed.map((item) => ConversationSerializedSchema.parse(item));
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

/**
 * 保存会话索引（不包含完整数据）
 */
async function saveConversationIndex(conversation: Conversation): Promise<void> {
  try {
    const conversations = await getAllConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversation index:', error);
    throw error;
  }
}

/**
 * 从索引中删除会话
 */
async function removeConversationIndex(conversationId: string): Promise<void> {
  try {
    const conversations = await getAllConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove conversation index:', error);
    throw error;
  }
}

// ==================== 会话完整数据管理 ====================

/**
 * 获取会话的完整数据（包含消息和图片元数据）
 */
export async function getConversationData(conversationId: string): Promise<ConversationData | null> {
  try {
    const key = `${STORAGE_KEYS.CONVERSATION_PREFIX}${conversationId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return ConversationDataSerializedSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to load conversation data:', error);
    return null;
  }
}

/**
 * 保存会话的完整数据
 */
export async function saveConversationData(data: ConversationData): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.CONVERSATION_PREFIX}${data.id}`;
    localStorage.setItem(key, JSON.stringify(data));

    // 同时更新索引
    await saveConversationIndex({
      id: data.id,
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  } catch (error) {
    console.error('Failed to save conversation data:', error);
    throw error;
  }
}

/**
 * 删除会话（包括索引、完整数据和所有图片）
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // 1. 获取会话数据以找到所有图片
    const data = await getConversationData(conversationId);

    // 2. 删除 IndexedDB 中的所有图片
    if (data && data.images.length > 0) {
      await Promise.all(
        data.images.map(img => deleteImage(img.srcId).catch(err => {
          console.warn(`Failed to delete image ${img.srcId}:`, err);
        }))
      );
    }

    // 3. 删除 localStorage 中的会话数据
    const key = `${STORAGE_KEYS.CONVERSATION_PREFIX}${conversationId}`;
    localStorage.removeItem(key);

    // 4. 删除索引
    await removeConversationIndex(conversationId);
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
}

/**
 * 创建新会话
 */
export async function createNewConversation(title?: string): Promise<ConversationData> {
  const now = new Date();
  const conversation: ConversationData = {
    id: crypto.randomUUID(),
    title: title || `对话 ${now.toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    messages: [],
    images: [],
  };

  await saveConversationData(conversation);
  return conversation;
}

// ==================== 消息管理 ====================

/**
 * 添加消息到会话
 */
export async function addMessageToConversation(
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  try {
    const data = await getConversationData(conversationId);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    data.messages.push(message);
    data.updatedAt = new Date();
    await saveConversationData(data);
  } catch (error) {
    console.error('Failed to add message:', error);
    throw error;
  }
}

/**
 * 删除单条消息
 */
export async function deleteMessageFromConversation(
  conversationId: string,
  messageId: string
): Promise<void> {
  try {
    const data = await getConversationData(conversationId);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    data.messages = data.messages.filter(msg => msg.id !== messageId);
    data.updatedAt = new Date();
    await saveConversationData(data);
  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
}

/**
 * 清空会话的所有消息(保留图片)
 */
export async function clearConversationMessages(
  conversationId: string
): Promise<void> {
  try {
    const data = await getConversationData(conversationId);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    data.messages = [];
    data.updatedAt = new Date();
    await saveConversationData(data);
  } catch (error) {
    console.error('Failed to clear messages:', error);
    throw error;
  }
}

// ==================== 图片管理 ====================

/**
 * 添加图片到会话（图片数据存入 IndexedDB，元数据存入 localStorage）
 */
export async function addImageToConversation(
  conversationId: string,
  imageMeta: ConversationImageMeta,
  base64Src: string
): Promise<void> {
  try {
    // 1. 存储图片到 IndexedDB
    await storeImage(imageMeta.srcId, base64Src);

    // 2. 添加图片元数据到会话
    const data = await getConversationData(conversationId);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    data.images.push(imageMeta);
    data.updatedAt = new Date();
    await saveConversationData(data);
  } catch (error) {
    console.error('Failed to add image:', error);
    throw error;
  }
}

/**
 * 获取图片的 base64 数据
 */
export async function getImageSrc(srcId: string): Promise<string | null> {
  try {
    return await getImage(srcId);
  } catch (error) {
    console.error('Failed to get image src:', error);
    return null;
  }
}

/**
 * 获取会话的下一个图片编号
 */
export async function getNextImageNumber(conversationId: string): Promise<number> {
  const data = await getConversationData(conversationId);
  if (!data || data.images.length === 0) return 1;

  const maxNumber = Math.max(...data.images.map(img => img.number));
  return maxNumber + 1;
}

/**
 * 从会话中删除图片
 */
export async function deleteImageFromConversation(
  conversationId: string,
  imageId: string
): Promise<void> {
  try {
    const data = await getConversationData(conversationId);
    if (!data) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // 找到要删除的图片
    const imageToDelete = data.images.find(img => img.id === imageId);
    if (!imageToDelete) {
      throw new Error(`Image ${imageId} not found`);
    }

    // 从 IndexedDB 删除图片数据
    await deleteImage(imageToDelete.srcId);

    // 从会话中移除图片元数据
    data.images = data.images.filter(img => img.id !== imageId);
    data.updatedAt = new Date();
    await saveConversationData(data);
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
}

