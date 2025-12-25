"use client";

import { Button } from '@/components/ui/button';
import { Copy, Trash2, RefreshCw } from 'lucide-react';
import { ChatMessage } from '@/types';

interface MessageActionsProps {
  message: ChatMessage;
  isLastAssistant: boolean;
  onDelete?: () => void;
  onRetry?: () => void;
  onCopy: () => void;
}

export function MessageActions({
  message,
  isLastAssistant,
  onDelete,
  onRetry,
  onCopy
}: MessageActionsProps) {
  const isUser = message.role === 'user';
  const isError = !!message.error;

  const usage = message.usageMetadata;
  const hasUsage = usage && (usage.totalTokenCount || usage.promptTokenCount || usage.candidatesTokenCount);

  return (
    <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-between'}`}>
      <div className="flex items-center gap-1">
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

      {!isUser && hasUsage && (
        <div className="text-xs text-gray-400 flex items-center gap-2">
          {usage.totalTokenCount && (
            <span title="总计 tokens">总:{usage.totalTokenCount}</span>
          )}
          {usage.promptTokenCount && (
            <span title="输入 tokens">入:{usage.promptTokenCount}</span>
          )}
          {usage.candidatesTokenCount && (
            <span title="输出 tokens">出:{usage.candidatesTokenCount}</span>
          )}
          {usage.thoughtsTokenCount && (
            <span title="思考 tokens">思:{usage.thoughtsTokenCount}</span>
          )}
        </div>
      )}
    </div>
  );
}
