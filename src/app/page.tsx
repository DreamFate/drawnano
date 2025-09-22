"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Hash, Wand2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// 新的组件导入
import { ConversationList } from '@/components/ConversationList';
import { ConversationImageGallery } from '@/components/ConversationImageGallery';
import { ChatMessages } from '@/components/ChatMessages';
import { SelectedImageDisplay } from '@/components/SelectedImageDisplay';

// 新的数据类型和存储
import {
  Conversation,
  ChatMessage,
  ConversationImage,
  MaterialItem
} from '@/lib/schemas';
import {
  getAllConversations,
  getCurrentConversationId,
  createNewConversation,
  getConversationMessages,
  saveMessage,
  getConversationImages,
  saveConversationImage
} from '@/lib/conversation-storage';

// 保留原有的素材存储（暂时保持兼容）
interface LegacyMaterialItem {
  id: string;
  src: string;
  number: number;
  name?: string;
  timestamp: Date;
}

export default function Home() {
  // 对话相关状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationImages, setConversationImages] = useState<ConversationImage[]>([]);

  // 图片选择状态
  const [selectedImage, setSelectedImage] = useState<ConversationImage | null>(null);

  // 素材库状态（保持原有功能）
  const [materials, setMaterials] = useState<LegacyMaterialItem[]>([]);

  // UI状态
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materialInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载
  useEffect(() => {
    initializeApp();
  }, []);

  // 当对话切换时加载对话数据
  useEffect(() => {
    if (currentConversationId) {
      loadConversationData(currentConversationId);
    }
  }, [currentConversationId]);

  const initializeApp = async () => {
    try {
      // 加载对话列表
      const loadedConversations = await getAllConversations();
      setConversations(loadedConversations);

      // 获取当前对话ID
      let currentId = await getCurrentConversationId();

      // 如果没有当前对话或对话不存在，创建新对话
      if (!currentId || !loadedConversations.find(c => c.id === currentId)) {
        if (loadedConversations.length > 0) {
          currentId = loadedConversations[0].id;
        } else {
          const newConversation = await createNewConversation();
          setConversations([newConversation]);
          currentId = newConversation.id;
        }
      }

      setCurrentConversationId(currentId);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const loadConversationData = async (conversationId: string) => {
    try {
      // 加载消息
      const loadedMessages = await getConversationMessages(conversationId);
      setMessages(loadedMessages);

      // 加载图片
      const loadedImages = await getConversationImages(conversationId);
      setConversationImages(loadedImages);

      // 清除选中的图片（切换对话时）
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to load conversation data:', error);
    }
  };

  // 处理对话切换
  const handleConversationChange = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  // 处理图片引用（顶部图片区域）
  const handleImageReference = (imageNumber: number) => {
    const reference = `[图片${imageNumber}]`;
    setPrompt(prev => prev + ' ' + reference);
  };

  // 处理图片选择修改
  const handleImageSelect = (image: ConversationImage) => {
    setSelectedImage(image);
  };

  // 清除图片选择
  const handleClearImageSelection = () => {
    setSelectedImage(null);
  };

  // 素材相关功能（保持原有逻辑）
  const handleMaterialAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const newMaterial: LegacyMaterialItem = {
              id: uuidv4(),
              src: result,
              number: materials.length + 1,
              name: file.name,
              timestamp: new Date()
            };
            setMaterials(prev => [...prev, newMaterial]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  const handleMaterialRemove = (id: string) => {
    setMaterials(prev => {
      const filtered = prev.filter(m => m.id !== id);
      return filtered.map((material, index) => ({
        ...material,
        number: index + 1
      }));
    });
  };

  const insertMaterialReference = (materialNumber: number) => {
    const reference = `[素材${materialNumber}]`;
    setPrompt(prev => prev + ' ' + reference);
  };

  // 生成图片功能
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (!currentConversationId) {
      setError('请先选择或创建对话');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 保存用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: currentConversationId,
        type: 'user',
        content: prompt,
        timestamp: new Date(),
      };
      await saveMessage(userMessage);
      setMessages(prev => [...prev, userMessage]);

      // 准备引用的图片
      const referenceImages: string[] = [];

      // 如果有选中的图片，添加为引用
      if (selectedImage) {
        referenceImages.push(selectedImage.src);
      }

      // 添加素材库中的图片
      materials.forEach(material => {
        referenceImages.push(material.src);
      });

      // 调用生成API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: selectedImage
            ? `基于选中的图片进行修改：${prompt}`
            : prompt,
          conversationId: currentConversationId,
          selectedImageId: selectedImage?.id,
          referenceImages,
          color: '#ffffff',
          style: 'photographic',
          creativity: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();

      // 创建新的对话图片
      const newImage: ConversationImage = {
        id: uuidv4(),
        conversationId: currentConversationId,
        src: data.imageUrl,
        prompt: prompt,
        timestamp: new Date(),
        messageId: uuidv4(),
        number: conversationImages.length + 1,
      };

      // 保存图片
      await saveConversationImage(newImage);
      setConversationImages(prev => [...prev, newImage]);

      // 保存AI回复消息
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        conversationId: currentConversationId,
        type: 'assistant',
        content: '已为您生成图片',
        timestamp: new Date(),
        generatedImageId: newImage.id,
      };
      await saveMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      // 清空提示词
      setPrompt('');

      // 自动选择新生成的图片
      setSelectedImage(newImage);

    } catch (error) {
      console.error('生成失败:', error);
      setError('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-100 dark:bg-gray-900">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧：对话列表 */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <ConversationList
              currentConversationId={currentConversationId}
              onConversationChange={handleConversationChange}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 中间：主要内容区域 */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="h-full flex flex-col">
              {/* 顶部：对话图片展示区域 */}
              <div className="h-[30%] border-b">
                <ConversationImageGallery
                  images={conversationImages}
                  onImageReference={handleImageReference}
                  onImageSelect={handleImageSelect}
                  selectedImageId={selectedImage?.id}
                />
              </div>

              {/* 底部：左右分割 */}
              <div className="flex-1">
                <ResizablePanelGroup direction="horizontal">
                  {/* 左侧：选中图片显示 */}
                  <ResizablePanel defaultSize={40} minSize={30}>
                    <SelectedImageDisplay
                      selectedImage={selectedImage}
                      onClearSelection={handleClearImageSelection}
                    />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* 右侧：聊天记录 */}
                  <ResizablePanel defaultSize={60} minSize={40}>
                    <ChatMessages
                      messages={messages}
                      isGenerating={isGenerating}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 右侧：素材库（保持原有功能） */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-0 rounded-none bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Hash className="w-4 h-4" />
                  素材库
                </div>
                <Badge variant="secondary" className="text-xs">
                  {materials.length} 个
                </Badge>
              </div>

              <div className="flex-1 overflow-hidden px-4 pb-4">
                {/* 素材上传区域 */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 mb-3 text-center hover:border-gray-400 transition-colors mt-4">
                  <input
                    ref={materialInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMaterialAdd}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 mx-auto text-gray-400 mb-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => materialInputRef.current?.click()}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加素材
                  </Button>
                </div>

                {/* 素材网格 */}
                <div className="h-[calc(100%-120px)] overflow-auto">
                  {materials.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className="relative group cursor-pointer"
                          onClick={() => insertMaterialReference(material.number)}
                        >
                          <div className="absolute -top-1 -left-1 z-10">
                            <Badge
                              variant="default"
                              className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                            >
                              {material.number}
                            </Badge>
                          </div>

                          <div className="aspect-square rounded border-2 border-gray-200 group-hover:border-blue-300 transition-colors overflow-hidden">
                            <img
                              src={material.src}
                              alt={`素材${material.number}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-1 -right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaterialRemove(material.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-xs text-center font-medium">
                              <div>点击插入</div>
                              <div>[素材{material.number}]</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Hash className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">还没有素材</p>
                      <p className="text-xs text-gray-400 mt-1">
                        添加后可在提示词中引用
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 底部：输入区域 */}
      <div className="border-t p-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <Label className="text-sm font-medium mb-2 block">
            提示词
            {(materials.length > 0 || conversationImages.length > 0) && (
              <span className="text-xs text-gray-500 ml-2">
                点击素材或图片可插入引用
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedImage
                  ? "描述你想对选中图片做什么修改..."
                  : "描述你想生成什么样的图片，或引用素材和图片..."
              }
              className="flex-1 min-h-[80px] resize-none text-sm"
              disabled={isGenerating}
            />
            <Button
              onClick={handleGenerateImage}
              disabled={!prompt.trim() || isGenerating || !currentConversationId}
              size="lg"
              className="px-6"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating
                ? '生成中...'
                : selectedImage
                  ? '修改图片'
                  : '生成图片'
              }
            </Button>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2">
              {error}
            </div>
          )}

          {/* 使用说明 */}
          <div className="text-xs text-gray-600 mt-2">
            <span className="font-medium">提示：</span>
            {selectedImage
              ? `已选中图片${selectedImage.number}进行修改，描述你想要的变化`
              : '可以引用素材库和对话图片，支持纯文字生成或组合使用'
            }
          </div>
        </div>
      </div>
    </div>
  );
}