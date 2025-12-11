"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Image as ImageIcon, Trash2, Eraser, RefreshCw, ChevronDown, Copy, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@/types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isGenerating?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onClearMessages?: () => void;
  onRetry?: () => void;
  hasLastRequest?: boolean;
}

// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

// 消息操作按钮组件
function MessageActions({
  message,
  isLastAssistant,
  onDelete,
  onRetry,
  onCopy
}: {
  message: ChatMessage;
  isLastAssistant: boolean;
  onDelete?: () => void;
  onRetry?: () => void;
  onCopy: () => void;
}) {
  const isUser = message.type === 'user';
  const isError = !!message.error;

  return (
    <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* 复制按钮 */}
      {!isError && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="复制"
        >
          <Copy className="w-3 h-3" />
        </Button>
      )}

      {/* 删除按钮 */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="删除"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}

      {/* 重试按钮 - 仅最后一条 assistant 消息显示 */}
      {!isUser && isLastAssistant && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          title="重试"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// 错误消息展示组件
function ErrorMessage({ error, timestamp, onDelete }: { error: string; timestamp: Date; onDelete?: () => void }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full relative group">
      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-red-700 dark:text-red-300 font-medium">生成失败</div>
          <div className="text-sm text-red-600 dark:text-red-400 mt-1 break-words">{error}</div>
          <div className="text-xs mt-1 text-red-400 dark:text-red-500">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
      {/* 删除按钮 */}
      <div className="flex justify-start mt-1">
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function ChatMessages({ messages, isGenerating, onDeleteMessage, onClearMessages, onRetry, hasLastRequest }: ChatMessagesProps) {
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
            const lastAssistantMessageId = messages
              .filter(m => m.type === 'assistant')
              .slice(-1)[0]?.id;

            return messages.map((message) => {
              const isLastAssistantMessage = message.type === 'assistant' && message.id === lastAssistantMessageId;

              // 解析思考内容
              const thinkMatch = message.content.match(/<think>([\s\S]*?)<\/think>/);
              const thinking = thinkMatch ? thinkMatch[1].trim() : null;
              const displayContent = message.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();

              // 错误消息单独处理
              if (message.error) {
                return (
                  <ErrorMessage
                    key={message.id}
                    error={message.error}
                    timestamp={message.timestamp}
                    onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                  />
                );
              }

              return message.type === 'user' ? (
                // 用户消息 - 浅灰色背景，右对齐
                <div key={message.id} className="flex flex-col items-end">
                  <div className="max-w-[80%] bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2">
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  <MessageActions
                    message={message}
                    isLastAssistant={false}
                    onDelete={onDeleteMessage ? () => onDeleteMessage(message.id) : undefined}
                    onCopy={() => copyToClipboard(message.content)}
                  />
                </div>
              ) : (
                // AI消息 - w-full 无包围
                <div key={message.id} className="w-full">
                  {/* 思考内容 */}
                  {thinking && (
                    <Collapsible className="mb-2">
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
                        <ChevronDown className="w-3 h-3 transition-transform data-[state=open]:rotate-180" />
                        <span>查看思考过程</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {thinking}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* 消息内容 */}
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {displayContent}
                  </div>

                  {/* 图片生成标识 */}
                  {message.generatedImageId && (
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
                    onRetry={hasLastRequest && onRetry ? onRetry : undefined}
                    onCopy={() => copyToClipboard(displayContent)}
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
                <span>正在生成图片...</span>
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
