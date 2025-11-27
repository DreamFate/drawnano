import { ChatMessage, ChatMessageSerializedSchema } from './schemas';
import {
  getGeneratedImages,
  addGeneratedImage,
  getImageSrc,
  getNextImageNumber,
  deleteGeneratedImage,
} from './generated-image-storage';

const STORAGE_KEY = 'drawnano_messages';

// ==================== 消息存储 ====================

export async function getMessages(): Promise<ChatMessage[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown[];
    return parsed.map(item => ChatMessageSerializedSchema.parse(item));
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

async function saveMessages(messages: ChatMessage[]): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export async function addMessage(message: ChatMessage): Promise<void> {
  const messages = await getMessages();
  messages.push(message);
  await saveMessages(messages);
}

export async function deleteMessage(messageId: string): Promise<void> {
  const messages = await getMessages();
  const filtered = messages.filter(msg => msg.id !== messageId);
  await saveMessages(filtered);
}

export async function clearMessages(): Promise<void> {
  await saveMessages([]);
}

// 删除所有带 error 的消息（新请求前调用）
export async function deleteErrorMessages(): Promise<void> {
  const messages = await getMessages();
  const filtered = messages.filter(msg => !msg.error);
  await saveMessages(filtered);
}

// ==================== 图片相关（从 generated-image-storage 重导出） ====================

export {
  getGeneratedImages as getImages,
  addGeneratedImage as addImage,
  getImageSrc,
  getNextImageNumber,
  deleteGeneratedImage as deleteImageById,
};
