import {
  Conversation,
  ChatMessage,
  ConversationImage,
  ConversationSerializedSchema,
  ChatMessageSerializedSchema,
  ConversationImageSerializedSchema
} from './schemas';

const STORAGE_KEYS = {
  CONVERSATIONS: 'drawnano_conversations',
  MESSAGES: 'drawnano_messages',
  CONVERSATION_IMAGES: 'drawnano_conversation_images',
  CURRENT_CONVERSATION: 'drawnano_current_conversation',
} as const;

// 对话管理
export async function getAllConversations(): Promise<Conversation[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ConversationSerializedSchema.parse(item));
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

export async function saveConversation(conversation: Conversation): Promise<void> {
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
    console.error('Failed to save conversation:', error);
    throw error;
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const conversations = await getAllConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));

    // 同时删除相关的消息和图片
    await deleteConversationMessages(conversationId);
    await deleteConversationImages(conversationId);
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
}

// 消息管理
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    const messages = parsed.map((item: any) => ChatMessageSerializedSchema.parse(item));
    return messages.filter(m => m.conversationId === conversationId);
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages = stored ? JSON.parse(stored) : [];
    messages.push(message);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save message:', error);
    throw error;
  }
}

export async function deleteConversationMessages(conversationId: string): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const messages = parsed.map((item: any) => ChatMessageSerializedSchema.parse(item));
    const filtered = messages.filter(m => m.conversationId !== conversationId);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete messages:', error);
    throw error;
  }
}

// 对话图片管理
export async function getConversationImages(conversationId: string): Promise<ConversationImage[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION_IMAGES);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    const images = parsed.map((item: any) => ConversationImageSerializedSchema.parse(item));
    return images.filter(img => img.conversationId === conversationId);
  } catch (error) {
    console.error('Failed to load conversation images:', error);
    return [];
  }
}

export async function saveConversationImage(image: ConversationImage): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION_IMAGES);
    const images = stored ? JSON.parse(stored) : [];
    images.push(image);
    localStorage.setItem(STORAGE_KEYS.CONVERSATION_IMAGES, JSON.stringify(images));
  } catch (error) {
    console.error('Failed to save conversation image:', error);
    throw error;
  }
}

export async function deleteConversationImages(conversationId: string): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION_IMAGES);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const images = parsed.map((item: any) => ConversationImageSerializedSchema.parse(item));
    const filtered = images.filter(img => img.conversationId !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CONVERSATION_IMAGES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete conversation images:', error);
    throw error;
  }
}

// 当前对话管理
export async function getCurrentConversationId(): Promise<string | null> {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONVERSATION);
  } catch (error) {
    console.error('Failed to get current conversation:', error);
    return null;
  }
}

export async function setCurrentConversationId(conversationId: string): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONVERSATION, conversationId);
  } catch (error) {
    console.error('Failed to set current conversation:', error);
    throw error;
  }
}

// 创建新对话
export async function createNewConversation(title?: string): Promise<Conversation> {
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: title || `对话 ${new Date().toLocaleString()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await saveConversation(conversation);
  await setCurrentConversationId(conversation.id);

  return conversation;
}
