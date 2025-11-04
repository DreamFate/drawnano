"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Hash, Wand2, Loader2, X } from 'lucide-react';

// 新的组件导入
import { ConversationList } from '@/components/ConversationList';
import { ConversationImageGallery } from '@/components/ConversationImageGallery';
import { ChatMessages } from '@/components/ChatMessages';
import { SelectedImageDisplay } from '@/components/SelectedImageDisplay';
import { ApiKeyManager } from '@/components/ApiKeyManager';

// 新的数据类型和存储
import {
  Conversation,
  ChatMessage,
  ConversationImage,
  ConversationImageMeta,
  ConversationData,
  MaterialItem
} from '@/lib/schemas';
import {
  getAllConversations,
  getConversationData,
  createNewConversation,
  addMessageToConversation,
  addImageToConversation,
  getImageSrc,
  getNextImageNumber,
  deleteMessageFromConversation,
  clearConversationMessages,
  deleteImageFromConversation
} from '@/lib/conversation-storage';
import {
  getAllMaterials,
  addMaterial,
  removeMaterial
} from '@/lib/material-storage';

export default function Home() {
  // 对话相关状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationData | null>(null);

  // 图片选择状态（包含 src，用于显示）
  const [selectedImage, setSelectedImage] = useState<(ConversationImageMeta & { src: string }) | null>(null);

  // 素材库状态（使用新的存储系统）
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // UI状态
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');


  // 引用列表状态
  type ReferenceItem = {
    type: 'image' | 'material';
    id: string;
    originalNumber: number; // 原始编号(素材3、图片5)
    displayName: string; // 显示名称
    src: string;
  };
  const [referencedItems, setReferencedItems] = useState<ReferenceItem[]>([]);

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

      // 加载素材库
      const loadedMaterials = await getAllMaterials();
      setMaterials(loadedMaterials);

      // 选择最新的对话
      if (loadedConversations.length > 0) {
        const latest = loadedConversations.sort((a, b) =>
          b.updatedAt.getTime() - a.updatedAt.getTime()
        )[0];
        setCurrentConversationId(latest.id);
      } else {
        // 没有对话，创建新对话
        const newConversation = await createNewConversation();
        setConversations([newConversation]);
        setCurrentConversationId(newConversation.id);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const loadConversationData = async (conversationId: string, clearSelection: boolean = true) => {
    try {
      const data = await getConversationData(conversationId);
      if (data) {
        setCurrentConversation(data);
        // 只在需要时清除选中的图片（例如切换对话时）
        if (clearSelection) {
          setSelectedImage(null);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation data:', error);
    }
  };

  // 处理对话切换
  const handleConversationChange = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  // 处理图片引用（顶部图片区域）
  const handleImageReference = async (imageNumber: number) => {
    if (!currentConversation) return;

    const image = currentConversation.images.find(img => img.number === imageNumber);
    if (!image) return;

    // 检查是否已经引用
    if (referencedItems.some(item => item.id === image.id)) {
      setError(`图片${imageNumber}已经在引用列表中`);
      setTimeout(() => setError(null), 2000);
      return;
    }

    // 获取图片src
    const src = await getImageSrc(image.srcId);
    if (!src) return;

    // 添加到引用列表
    setReferencedItems(prev => [...prev, {
      type: 'image',
      id: image.id,
      originalNumber: imageNumber,
      displayName: `图片${imageNumber}`,
      src
    }]);
  };

  // 处理图片选择修改
  const handleImageSelect = async (imageMeta: ConversationImageMeta) => {
    try {
      const src = await getImageSrc(imageMeta.srcId);
      if (src) {
        setSelectedImage({ ...imageMeta, src });
      }
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  // 清除图片选择
  const handleClearImageSelection = () => {
    setSelectedImage(null);
  };

  // 素材相关功能（使用新的存储系统）
  const handleMaterialAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
              // 添加到 IndexedDB
              const newMaterial = await addMaterial(result, file.name);
              // 更新状态
              setMaterials(prev => [...prev, newMaterial]);
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Failed to add material:', error);
        }
      }
    }

    e.target.value = '';
  };

  const handleMaterialRemove = async (id: string) => {
    try {
      // 从 IndexedDB 删除
      await removeMaterial(id);
      // 重新加载素材列表（已经重新编号）
      const updatedMaterials = await getAllMaterials();
      setMaterials(updatedMaterials);
    } catch (error) {
      console.error('Failed to remove material:', error);
    }
  };

  const insertMaterialReference = (materialNumber: number) => {
    const material = materials.find(m => m.number === materialNumber);
    if (!material) return;

    // 检查是否已经引用
    if (referencedItems.some(item => item.id === material.id)) {
      setError(`素材${materialNumber}已经在引用列表中`);
      setTimeout(() => setError(null), 2000);
      return;
    }

    // 添加到引用列表
    setReferencedItems(prev => [...prev, {
      type: 'material',
      id: material.id,
      originalNumber: materialNumber,
      displayName: `素材${materialNumber}`,
      src: material.src
    }]);
  };

  // 从引用列表中移除
  const removeReference = (id: string) => {
    setReferencedItems(prev => prev.filter(item => item.id !== id));
  };

  // 清空引用列表
  const clearReferences = () => {
    setReferencedItems([]);
  };

  // 删除单条消息
  const handleDeleteMessage = async (messageId: string) => {
    if (!currentConversationId) return;

    try {
      await deleteMessageFromConversation(currentConversationId, messageId);
      await loadConversationData(currentConversationId, false); // 保持选中的图片
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError('删除消息失败');
      setTimeout(() => setError(null), 2000);
    }
  };

  // 清空对话
  const handleClearMessages = async () => {
    if (!currentConversationId) return;

    if (!confirm('确定要清空所有对话记录吗?图片不会被删除。')) {
      return;
    }

    try {
      await clearConversationMessages(currentConversationId);
      await loadConversationData(currentConversationId, false); // 保持选中的图片
    } catch (error) {
      console.error('Failed to clear messages:', error);
      setError('清空对话失败');
      setTimeout(() => setError(null), 2000);
    }
  };

  // 删除图片
  const handleDeleteImage = async (imageId: string) => {
    if (!currentConversationId) return;

    if (!confirm('确定要删除这张图片吗?')) {
      return;
    }

    try {
      await deleteImageFromConversation(currentConversationId, imageId);

      // 如果删除的是当前选中的图片,清除选中状态
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }

      // 重新加载会话数据
      await loadConversationData(currentConversationId, false);
    } catch (error) {
      console.error('Failed to delete image:', error);
      setError('删除图片失败');
      setTimeout(() => setError(null), 2000);
    }
  };

  // 生成图片功能 - 流式处理
  const handleGenerateImage = async () => {
    if (!apiKey.trim()) {
      setError('请先输入API Key');
      return;
    }

    if (!prompt.trim()) {
      setError('请输入提示词');
      return;
    }

    if (!currentConversationId || !currentConversation) {
      setError('请先选择或创建对话');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // 流式数据收集
    let textContent = '';
    const imageUrls: string[] = [];

    try {
      // 保存用户消息
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        type: 'user',
        content: prompt,
        timestamp: new Date(),
      };
      await addMessageToConversation(currentConversationId, userMessage);

      // 准备引用的图片 - 主图(左侧选中)作为图片1,引用列表按顺序排列
      const referenceImages: string[] = [];
      const validReferences: string[] = [];
      const skippedReferences: string[] = [];

      // 主图(左侧选中的图片)作为图片1
      if (selectedImage) {
        referenceImages.push(selectedImage.src);
        validReferences.push('图片1(主图)');
      }

      // 引用列表的图片按顺序排列
      // 如果有主图,从图片2开始;如果没有主图,从图片1开始
      for (const item of referencedItems) {
        let isValid = false;

        if (item.type === 'image') {
          const image = currentConversation?.images.find(img => img.id === item.id);
          if (image) {
            try {
              const src = await getImageSrc(image.srcId);
              if (src) {
                referenceImages.push(src);
                const imageIndex = referenceImages.length;
                validReferences.push(`图片${imageIndex}(${item.displayName})`);
                isValid = true;
              }
            } catch (error) {
              console.warn(`无法加载图片: ${item.displayName}`, error);
            }
          }
        } else if (item.type === 'material') {
          const material = materials.find(m => m.id === item.id);
          if (material && material.src) {
            referenceImages.push(material.src);
            const imageIndex = referenceImages.length;
            validReferences.push(`图片${imageIndex}(${item.displayName})`);
            isValid = true;
          }
        }

        if (!isValid) {
          skippedReferences.push(item.displayName);
        }
      }

      if (skippedReferences.length > 0) {
        console.warn('以下引用不存在,已跳过:', skippedReferences);
        setError(`部分引用不存在已跳过: ${skippedReferences.join(', ')}`);
        setTimeout(() => setError(null), 3000);
      }

      console.log('有效引用:', validReferences.map((name, idx) => `${idx + 1}. ${name}`));

      // 构建对话历史上下文
      const conversationHistory = currentConversation.messages
        .slice(-10) // 只取最近10条消息作为上下文
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 调用生成API - 流式响应
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          prompt: selectedImage
            ? `基于图片1进行修改：${prompt}`
            : prompt,
          conversationId: currentConversationId,
          selectedImageId: selectedImage?.id,
          referenceImages,
          conversationHistory
        }),
      });

      if (!response.ok) {
        setError('生成失败,请检查API Key是否正确');
        setPrompt('');
        clearReferences();
        // 刷新对话数据状态
        await loadConversationData(currentConversationId, false);
        return;
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const dataStr = line.substring(6).trim();
          try {
            const chunk = JSON.parse(dataStr);

            if (chunk.type === 'text') {
              // 实时显示文字 - 更新临时AI消息
              textContent += chunk.content;
              //console.log('收到文字:', chunk.content);

            } else if (chunk.type === 'image') {
              // 收集图片
              imageUrls.push(chunk.content);
              //console.log(`收到图片 ${imageUrls.length}:`, chunk.content.substring(0, 50) + '...');

            } else if (chunk.type === 'done') {
              //console.log('流式响应完成:', {
              //  textContent: chunk.textContent,
              //  imageCount: chunk.imageCount
              //});

            } else if (chunk.type === 'error') {
              //console.warn('大模型返回错误:', chunk.message);
            }
          } catch (e) {
            console.error('解析chunk失败:', e);
          }
        }
      }

      // 流式响应完成后处理
      const description = textContent || '图片已生成';

      if (imageUrls.length === 0) {
        // 未生成图片,保存AI的文字回复并提示用户
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          conversationId: currentConversationId,
          type: 'assistant',
          content: description || '抱歉,本次未能生成图片,请尝试调整提示词后重试',
          timestamp: new Date(),
        };
        await addMessageToConversation(currentConversationId, assistantMessage);
        await loadConversationData(currentConversationId, false); // 不清除选中的图片

        setError('本次未生成图片,已保存对话记录');
        setPrompt('');
        clearReferences();
        // 保持选中的图片不变
        return;
      }

      // 多图片处理: 最后一张作为修改主图,其他保存到顶部展示栏
      const lastImageUrl = imageUrls[imageUrls.length - 1];
      const otherImages = imageUrls.slice(0, -1);

      // 保存其他图片到对话中
      for (let i = 0; i < otherImages.length; i++) {
        const imageNumber = await getNextImageNumber(currentConversationId);
        const imageId = crypto.randomUUID();
        const imageMeta: ConversationImageMeta = {
          id: imageId,
          srcId: imageId,
          prompt: `${prompt} (图片${i + 1}/${imageUrls.length})`,
          timestamp: new Date(),
          messageId: userMessage.id,
          number: imageNumber,
        };
        await addImageToConversation(currentConversationId, imageMeta, otherImages[i]);
      }

      // 保存最后一张图片(修改主图)
      const mainImageNumber = await getNextImageNumber(currentConversationId);
      const mainImageId = crypto.randomUUID();
      const mainImageMeta: ConversationImageMeta = {
        id: mainImageId,
        srcId: mainImageId,
        prompt: imageUrls.length > 1
          ? `${prompt} (主图 ${imageUrls.length}/${imageUrls.length})`
          : prompt,
        timestamp: new Date(),
        messageId: userMessage.id,
        number: mainImageNumber,
      };
      await addImageToConversation(currentConversationId, mainImageMeta, lastImageUrl);

      // 保存AI回复消息
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        type: 'assistant',
        content: imageUrls.length > 1
          ? `${description}\n\n生成了${imageUrls.length}张图片,已使用最后一张作为修改主图`
          : description,
        timestamp: new Date(),
        generatedImageId: mainImageId,
      };
      await addMessageToConversation(currentConversationId, assistantMessage);

      // 重新加载会话数据(不清除选中状态,因为下面会设置新图片)
      await loadConversationData(currentConversationId, false);

      // 清空提示词和引用列表
      setPrompt('');
      clearReferences();

      // 自动选择新生成的主图
      setSelectedImage({ ...mainImageMeta, src: lastImageUrl });

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
          <ResizablePanel defaultSize={12} maxSize={20} minSize={10} >
            <ConversationList
              currentConversationId={currentConversationId}
              onConversationChange={handleConversationChange}
              disabled={isGenerating}
            />
          </ResizablePanel>

          <ResizableHandle/>

          {/* 中间：主要内容区域 */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="h-full" style={{position: 'relative'}}>
              {/* 顶部：对话图片展示区域 */}
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '240px', borderBottom: '1px solid #e5e7eb'}}>
                <ConversationImageGallery
                  images={currentConversation?.images || []}
                  onImageReference={handleImageReference}
                  onImageSelect={handleImageSelect}
                  selectedImageId={selectedImage?.id}
                  onDeleteImage={handleDeleteImage}
                />
              </div>

              {/* 底部：左右分割 */}
              <div style={{position: 'absolute', top: '240px', left: 0, right: 0, bottom: 0}}>
                <ResizablePanelGroup direction="horizontal">
                  {/* 左侧：选中图片显示 */}
                  <ResizablePanel defaultSize={40} minSize={30}>
                    <SelectedImageDisplay
                      selectedImage={selectedImage}
                      onClearSelection={handleClearImageSelection}
                      isGenerating={isGenerating}
                    />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* 右侧：聊天记录 */}
                  <ResizablePanel defaultSize={60} minSize={40}>
                    <ChatMessages
                      messages={currentConversation?.messages || []}
                      isGenerating={isGenerating}
                      onDeleteMessage={handleDeleteMessage}
                      onClearMessages={handleClearMessages}
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

              <div className="flex flex-col h-full">
                {/* 素材上传区域 */}
                <div className="flex-shrink-0 px-4 pt-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
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
                </div>

                {/* 素材列表 - 纵向滚动 */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
                  {materials.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {materials.map((material) => (
                        <div
                          key={material.id}
                          className="relative group cursor-pointer flex-shrink-0 w-[calc(20vh-58px)] h-[calc(20vh-58px)]"
                          onClick={() => insertMaterialReference(material.number)}
                        >
                          {/* 编号标识 */}
                          <div className="absolute top-1 left-1 z-10">
                            <Badge
                              variant="default"
                              className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-blue-600"
                            >
                              {material.number}
                            </Badge>
                          </div>

                          {/* 图片容器 - 固定高度与生成栏一致 */}
                          <div className="w-full h-full rounded-lg border-2 border-gray-200 group-hover:border-blue-300 transition-colors overflow-hidden">
                            <img
                              src={material.src}
                              alt={`素材${material.number}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* 删除按钮 */}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaterialRemove(material.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>

                          {/* 悬停提示 */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <div className="text-white text-xs text-center font-medium">
                              <div className="flex items-center gap-1 justify-center mb-1">
                                <Hash className="w-3 h-3" />
                                <span>点击插入</span>
                              </div>
                              <div className="text-blue-200">[素材{material.number}]</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
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
            {(materials.length > 0 || (currentConversation?.images.length || 0) > 0) && (
              <span className="text-xs text-gray-500 ml-2">
                点击素材或图片可插入引用
              </span>
            )}
          </Label>

          {/* 引用列表 */}
          {referencedItems.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  引用列表 {selectedImage ? '(从图片2开始)' : '(在提示词中使用 图片1、图片2...)'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearReferences}
                  className="h-6 text-xs text-blue-600 hover:text-blue-800"
                >
                  清空全部
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {referencedItems.map((item, index) => {
                  // 如果有选中的主图,引用列表从图片2开始;否则从图片1开始
                  const imageNumber = selectedImage ? index + 2 : index + 1;
                  return (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700"
                    >
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        图片{imageNumber} - {item.displayName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReference(item.id)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                      >
                        <span className="text-xs text-red-600 dark:text-red-400">×</span>
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 relative">
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
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGenerateImage}
                disabled={!apiKey.trim() || !prompt.trim() || isGenerating || !currentConversationId}
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
              <div className="flex justify-end">
                <ApiKeyManager onApiKeyChange={setApiKey} />
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded mt-2">
              {error}
            </div>
          )}

          {/* 使用说明 */}
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            <span className="font-medium">提示：</span>
            {selectedImage && referencedItems.length > 0 ? (
              <>
                左侧选中的图片是"图片1"，引用列表从"图片2"开始，在提示词中使用这些编号来引用
              </>
            ) : referencedItems.length > 0 ? (
              <>
                引用列表中的图片按顺序对应"图片1、图片2..."，在提示词中使用这些编号来引用
              </>
            ) : selectedImage ? (
              `已选中图片${selectedImage.number}作为主图(图片1)进行修改，描述你想要的变化`
            ) : (
              '点击素材或对话图片添加到引用列表，然后在提示词中使用"图片1、图片2..."来引用'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}