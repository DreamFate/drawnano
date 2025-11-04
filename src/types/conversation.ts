// 对话消息类型
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;  // 纯文字内容
  timestamp: number;
}

// 图片编辑会话
export interface ImageEditSession {
  currentImage: string;  // 当前正在修改的图片(base64 data URL)
  conversationHistory: ConversationMessage[];  // 对话历史
}

// 消息内容项
export interface MessageContentItem {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}
