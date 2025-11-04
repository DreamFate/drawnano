"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Bot, Image as ImageIcon, Trash2, Eraser } from 'lucide-react';
import { ChatMessage } from '@/lib/schemas';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isGenerating?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onClearMessages?: () => void;
}

export function ChatMessages({ messages, isGenerating, onDeleteMessage, onClearMessages }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">开始新的对话</p>
          <p className="text-xs text-gray-400 mt-1">
            输入提示词来生成图片或开始聊天
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="text-sm font-medium">对话记录</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {messages.length} 条消息
          </Badge>
          {messages.length > 0 && onClearMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearMessages}
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Eraser className="w-3 h-3 mr-1" />
              清空
            </Button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="h-[calc(100%-60px)]" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* AI头像 */}
              {message.type === 'assistant' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              {/* 消息内容 */}
              <div
                className={`max-w-[80%] relative group ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                } rounded-lg px-4 py-2`}
              >
                {/* 消息文本 */}
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* 图片生成标识 */}
                {message.generatedImageId && (
                  <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                    <ImageIcon className="w-3 h-3" />
                    <span>已生成图片</span>
                  </div>
                )}

                {/* 时间戳 */}
                <div
                  className={`text-xs mt-1 ${
                    message.type === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>

                {/* 删除按钮 */}
                {onDeleteMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteMessage(message.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* 用户头像 */}
              {message.type === 'user' && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* 生成中指示器 */}
          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>正在生成图片...</span>
                </div>
              </div>
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
