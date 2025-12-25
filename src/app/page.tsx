"use client";

import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

// 组件导入
import { ImageGallery, GalleryImage } from '@/components/ImageGallery';
import { ChatMessages } from '@/components/ChatMessages';
import { SelectedImageDisplay } from '@/components/SelectedImageDisplay';
import { PromptInput } from '@/components/PromptInput';
import { StyleInput } from '@/components/StyleInput';
import { SettingsDialog } from '@/components/SettingsDialog';

// Hooks
import {
  useToastNotification,
  useConversation,
  useMaterials,
  useReferences,
  useImageGeneration,
  useStyleGeneration,
} from '@/hooks';

// Types
import { GeneratedImageMeta, ImageMeta, ModelConfig, ApiSetting } from '@/types';
import { getImageSrc } from '@/lib/conversation-storage';
import { loadGenerationConfig, saveGenerationConfig, DEFAULT_GENERATION_CONFIG } from '@/lib/config-storage';
import { loadSettings, DEFAULT_SETTINGS } from '@/lib/settings-storage';

// UI 组件
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from '@/components/ui/item';

// GitHub 图标 (lucide-react 已弃用品牌图标)
const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function Home() {
  // Hooks
  const { showError, showWarning } = useToastNotification();
  const {
    messages,
    images,
    selectedImage,
    setSelectedImage,
    initialize: initChat,
    refresh: refreshChat,
    selectImage,
    clearImageSelection,
    deleteMessage,
    clearMessages,
    deleteImage,
  } = useConversation();

  const {
    materials,
    loadMaterials,
    uploadMaterials,
    deleteMaterial,
  } = useMaterials();

  const {
    referencedItems,
    addImageReference,
    addMaterialReference,
    removeReference,
    clearReferences,
    removeFromReferences,
  } = useReferences();

  const {
    isGenerating,
    lastRequest,
    generateImage,
    retryGeneration,
  } = useImageGeneration();

  const {
    systemStyle,
    setSystemStyle,
    isGeneratingStyle,
    generateStyle,
  } = useStyleGeneration();

  // 本地状态
  const [settings, setSettings] = useState<ApiSetting>(DEFAULT_SETTINGS);
  const [prompt, setPrompt] = useState('');
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_GENERATION_CONFIG);
  const [showSettingsOnStart, setShowSettingsOnStart] = useState(false);
  const [useSystemStyle, setUseSystemStyle] = useState(false);

  // 客户端加载配置
  useEffect(() => {
    setModelConfig(loadGenerationConfig());
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    // 首次进入无 API Key 时自动打开设置弹窗
    if (!savedSettings.apiKey) {
      setShowSettingsOnStart(true);
    }
  }, []);

  // 配置变更时保存到 localStorage
  const handleConfigChange = (config: ModelConfig) => {
    setModelConfig(config);
    saveGenerationConfig(config);
  };

  // 初始化
  useEffect(() => {
    initChat();
    loadMaterials();
  }, [initChat, loadMaterials]);

  // 处理图片引用
  const handleImageReference = async (imageNumber: number) => {
    const image = images.find((img: GeneratedImageMeta) => img.number === imageNumber);
    if (!image) return;
    await addImageReference(image, selectedImage?.id || null, showWarning);
  };

  // 处理图片选择修改（统一处理生成图片和素材）
  const handleImageSelect = async (imageMeta: ImageMeta) => {
    removeFromReferences(imageMeta.id);
    await selectImage(imageMeta);
  };

  // 处理素材选择修改（复用 handleImageSelect）
  const handleMaterialSelect = async (material: ImageMeta) => {
    await handleImageSelect(material);
  };

  // 插入素材引用
  const insertMaterialReference = async (materialNumber: number) => {
    const material = materials.find(m => m.number === materialNumber);
    if (!material) return;
    await addMaterialReference(material, selectedImage?.id || null, showError);
  };

  // 删除消息
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch {
      showError('删除消息失败');
    }
  };

  // 清空对话
  const handleClearMessages = async () => {
    if (!confirm('确定要清空所有对话记录吗?图片不会被删除。')) return;
    try {
      await clearMessages();
    } catch {
      showError('清空对话失败');
    }
  };

  // 删除图片
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('确定要删除这张图片吗?')) return;
    try {
      await deleteImage(imageId);
    } catch {
      showError('删除图片失败');
    }
  };

  // 设置变更处理
  const handleSettingsChange = (newSettings: ApiSetting) => {
    setSettings(newSettings);
  };

  // 生成风格描述
  const handleGenerateStyle = async () => {
    if (!selectedImage || !settings.apiKey.trim()) {
      showError('请先选中图片并设置 API Key');
      return;
    }
    await generateStyle(selectedImage.src, settings.apiKey, settings.apiUrl, settings.modelList.find((model) => model.modelselect === 'gemini-3-pro')?.model || 'gemini-3-pro', settings.styleGeneratorPrompt, showError);
  };

  // 重试
  const handleRetry = async (messageId:string) => {
    if (!lastRequest || !settings.apiKey.trim()) {
      showError('无法重试');
      return;
    }

    await retryGeneration({
      apiKey:settings.apiKey,
      apiUrl:settings.apiUrl,
      model:settings.modelList.find((model) => model.modelselect == lastRequest?.modelConfig.modelselect)?.model || 'gemini-3-pro-image',
      messages,
      messageId,
      images,
      materials,
      systemStyle:useSystemStyle ? systemStyle : '',
      onSuccess: async (mainImageMeta, mainImageSrc) => {
        await refreshChat(false);
        setSelectedImage({ ...mainImageMeta, src: mainImageSrc });
      },
      onError:showError,
      onWarning:showWarning,
    });
    await refreshChat(false);
  };

  // 生成图片
  const handleGenerateImage = async () => {
    if (!settings.apiKey.trim()) {
      showError('请先在设置中输入 API Key');
      return;
    }
    if (!prompt.trim()) {
      showError('请输入提示词');
      return;
    }

    const success = await generateImage({
      prompt,
      apiKey: settings.apiKey,
      apiUrl: settings.apiUrl,
      model: settings.modelList.find((model) => model.modelselect == modelConfig.modelselect)?.model || 'gemini-3-pro-image',
      messages,
      images,
      selectedImage,
      referencedItems,
      materials,
      systemStyle: useSystemStyle ? systemStyle : '',
      modelConfig,
      onSuccess: async (mainImageMeta, mainImageSrc) => {
        setSelectedImage({ ...mainImageMeta, src: mainImageSrc });
      },
      onError: showError,
      onWarning: showWarning,
    });

    await refreshChat(false);
    setPrompt('');
    clearReferences();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-100 dark:bg-gray-900">


      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧：生成的图片列表 */}
          <ResizablePanel defaultSize={14} maxSize={26} minSize={14}>
            <div className="flex flex-col h-full">
              {/* 顶部 Logo 区域 */}
              <div className="border-b bg-white dark:bg-gray-800 px-3 py-1.5 flex-shrink-0">
                <Item size="sm" className="p-0 gap-2">
                  <ItemContent className="gap-0">
                    <ItemTitle className="text-base font-bold">DrawNano</ItemTitle>
                    <ItemDescription className="text-xs">nano banana 2 生图</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <SettingsDialog onSettingsChange={handleSettingsChange} defaultOpen={showSettingsOnStart} />
                    <a
                      href="https://github.com/DreamFate/drawnano"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <GithubIcon className="size-5" />
                    </a>
                  </ItemActions>
                </Item>
              </div>
              {/* 生图区域 */}
              <div className="flex-1 overflow-hidden">
                <ImageGallery
                  mode="generated"
                  images={images}
                  onImageReference={handleImageReference}
                  onImageSelect={handleImageSelect}
                  selectedImageId={selectedImage?.id}
                  referencedIds={referencedItems.filter(r => r.type === 'generated').map(r => r.id)}
                  onDeleteImage={handleDeleteImage}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 中间：图片显示 + 对话记录 */}
          <ResizablePanel defaultSize={72} minSize={40}>
            <div className="h-full">
              <ResizablePanelGroup direction="horizontal">
                {/* 左侧：选中图片显示 */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <SelectedImageDisplay
                    selectedImage={selectedImage}
                    onClearSelection={clearImageSelection}
                    isGenerating={isGenerating}
                  />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* 右侧：聊天记录 */}
                <ResizablePanel defaultSize={40} minSize={20}>
                  <ChatMessages
                    messages={messages}
                    isGenerating={isGenerating}
                    onDeleteMessage={handleDeleteMessage}
                    onClearMessages={handleClearMessages}
                    onRetry={handleRetry}
                    hasLastRequest={!!lastRequest}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 右侧：素材库 */}
          <ResizablePanel defaultSize={14} minSize={14} maxSize={26}>
            <ImageGallery
              mode="material"
              images={materials}
              onImageReference={insertMaterialReference}
              onImageSelect={handleMaterialSelect}
              selectedImageId={selectedImage?.id}
              referencedIds={referencedItems.filter(r => r.type === 'material').map(r => r.id)}
              onDeleteImage={deleteMaterial}
              onUpload={uploadMaterials}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 底部：输入区域 */}
      <div className="border-t bg-white dark:bg-gray-900 flex items-stretch">
        {/* 左侧：风格描述区 */}
        <div className="w-[25%] flex-shrink-0">
          <StyleInput
            systemStyle={systemStyle}
            onSystemStyleChange={setSystemStyle}
            onGenerateStyle={handleGenerateStyle}
            isGeneratingStyle={isGeneratingStyle}
            isGenerating={isGenerating}
            apiKey={settings.apiKey}
            selectedImage={selectedImage}
            useSystemStyle={useSystemStyle}
            onUseSystemStyleChange={setUseSystemStyle}
          />
        </div>

        {/* 中间：提示词输入区 */}
        <div className="w-[60%]">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerateImage}
            isGenerating={isGenerating}
            apiKey={settings.apiKey}
            selectedImage={selectedImage}
            referencedItems={referencedItems}
            onRemoveReference={removeReference}
            onClearReferences={clearReferences}
            hasImages={images.length > 0}
            hasMaterials={materials.length > 0}
            modelConfig={modelConfig}
            onConfigChange={handleConfigChange}
          />
        </div>
      </div>
    </div>
  );
}
