"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Image as ImageIcon, Eraser, ChevronDown, AlertCircleIcon } from 'lucide-react';
import { ChatMessage,ApiErrorMessage } from '@/types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { MessageActions } from '@/components/MessageActions';
import { useToastNotification } from '@/hooks';

interface ChatMessagesProps {
  messages: ChatMessage[];
  streamingMessage?: ChatMessage | null;
  isGenerating?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onClearMessages?: () => void;
  onRetry?: (messageId: string) => void;
  hasLastRequest?: boolean;
}


export function ChatMessages({ messages, streamingMessage, isGenerating, onDeleteMessage, onClearMessages, onRetry, hasLastRequest }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { showSuccess, showError } = useToastNotification();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isGenerating]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('复制成功');
    } catch (err) {
      console.error('复制失败:', err);
      showError('复制失败');
    }
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
      <div className="flex min-h-[40px] items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-800">
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
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
          {/* 找到最后一条 assistant 消息 */}
          {(() => {
            // 合并持久化消息和流式消息
            const displayMessages = [
              ...messages,
              ...(streamingMessage ? [streamingMessage] : [])
            ];

            const lastAssistantMessageId = displayMessages
              .filter(m => m.role === 'model')
              .slice(-1)[0]?.id;

            return displayMessages.map((message) => {
              const isLastAssistantMessage = message.role === 'model' && message.id === lastAssistantMessageId;

              // 错误消息单独处理
              if (message.error) {
                return (
                  <div key={message.id} className="w-full relative group">
                    <div className="flex items-start bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>生成失败</AlertTitle>
                        <AlertDescription>
                          <p>code: {message.error.code}</p>
                          <p>messages: {message.error.messages}</p>
                          <p>status: {message.error.status}</p>
                        </AlertDescription>
                      </Alert>
                    </div>
                    {/* 删除按钮 */}
                    <MessageActions
                      message={message}
                      isLastAssistant={isLastAssistantMessage}
                      onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                      onRetry={hasLastRequest && onRetry ? () => onRetry(message.id) : undefined}
                      onCopy={() => copyToClipboard(message.text)}
                      isGenerating={isGenerating}
                    />
                  </div>
                );
              }

              return message.role === 'user' ? (
                // 用户消息 - 浅灰色背景，右对齐
                <div key={message.id} className="flex flex-col items-end">
                  <div className="max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2">
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  <MessageActions
                    message={message}
                    isLastAssistant={false}
                    onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                    onCopy={() => copyToClipboard(message.text)}
                    isGenerating={isGenerating}
                  />
                </div>
              ) : (
                // AI消息 - w-full 无包围
                <div key={message.id} className="w-full">
                  {/* 思考内容 */}
                  {message.thought && (
                    <Collapsible className="mb-2">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                        <ChevronDown className="w-3 h-3 transition-transform data-[state=open]:rotate-180" />
                        <span>思考过程</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {message.thought}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* 消息内容 */}
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {message.text}
                  </div>

                  {/* 图片生成标识 */}
                  {message.isImage && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <ImageIcon className="w-3 h-3" />
                      <span>已生成图片</span>
                    </div>
                  )}

                  {/* 时间戳 */}
                  <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    {formatTime(message.timestamp)}
                  </div>

                  {/* 操作按钮 */}
                  <MessageActions
                    message={message}
                    isLastAssistant={isLastAssistantMessage}
                    onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                    onRetry={hasLastRequest && onRetry ? () => onRetry(message.id) : undefined}
                    onCopy={() => copyToClipboard(message.text)}
                    isGenerating={isGenerating}
                  />
                </div>
              );
            });
          })()}

          {/* 生成中指示器 */}
          {isGenerating && (
            <div className="w-full">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>正在生成...</span>
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
