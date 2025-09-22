"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import {
  getAllConversations,
  createNewConversation,
  deleteConversation,
  getCurrentConversationId,
  setCurrentConversationId
} from '@/lib/conversation-storage';
import { Conversation } from '@/lib/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConversationListProps {
  currentConversationId: string | null;
  onConversationChange: (conversationId: string) => void;
}

export function ConversationList({
  currentConversationId,
  onConversationChange
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const loaded = await getAllConversations();
      setConversations(loaded);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新对话
  const handleCreateConversation = async () => {
    try {
      const newConversation = await createNewConversation();
      setConversations(prev => [newConversation, ...prev]);
      onConversationChange(newConversation.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // 删除对话
  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('确定要删除这个对话吗？')) {
      return;
    }

    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // 如果删除的是当前对话，切换到其他对话或创建新对话
      if (conversationId === currentConversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          onConversationChange(remaining[0].id);
        } else {
          // 没有其他对话，创建新对话
          handleCreateConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // 选择对话
  const handleSelectConversation = async (conversationId: string) => {
    try {
      await setCurrentConversationId(conversationId);
      onConversationChange(conversationId);
    } catch (error) {
      console.error('Failed to select conversation:', error);
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full border-0 rounded-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            对话列表
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-gray-500">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            对话列表
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {conversations.length} 个
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden px-4 pb-4">
        {/* 创建新对话按钮 */}
        <Button
          onClick={handleCreateConversation}
          className="w-full mb-3"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建对话
        </Button>

        {/* 对话列表 */}
        <ScrollArea className="h-full">
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                    conversation.id === currentConversationId
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : 'bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  {/* 对话标题 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(conversation.updatedAt)}
                      </p>
                    </div>

                    {/* 操作菜单 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          删除对话
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* 当前对话指示器 */}
                  {conversation.id === currentConversationId && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs">还没有对话</p>
              <p className="text-xs text-gray-400 mt-1">
                点击上方按钮创建新对话
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
