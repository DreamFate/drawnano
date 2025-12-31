"use client";

import { useState, useEffect } from 'react';
import { Settings, Key, Globe, Palette, Cpu, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ApiSetting } from '@/types';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, DEFAULT_STYLE_GENERATOR_PROMPT, DEFAULT_WORD_DEFAULT_PROMPT } from '@/lib/settings-storage';
import { cleanInvalidGeneratedImages, cleanInvalidMaterials } from '@/lib/generated-image-storage';
import { useToastNotification } from '@/hooks';


interface SettingsDialogProps {
  onSettingsChange: (settings: ApiSetting) => void;
  defaultOpen?: boolean;
  onDefaultOpenHandled?: () => void;
  initialSettings?: ApiSetting;
}

export function SettingsDialog({ onSettingsChange, defaultOpen = false, onDefaultOpenHandled, initialSettings }: SettingsDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [settings, setSettings] = useState<ApiSetting>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<ApiSetting>(DEFAULT_SETTINGS);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const { showInfo, showSuccess, showError } = useToastNotification();

  // 初始化加载设置
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setTempSettings(initialSettings);
      setHasApiKey(!!initialSettings.apiKey);
    }
  }, [initialSettings]);

  // 监听 defaultOpen 变化,首次打开时自动打开对话框
  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
      // 通知父组件已处理 defaultOpen,避免重复触发
      onDefaultOpenHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpen]);

  // 打开对话框时同步临时设置
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTempSettings(settings);
    }
    setOpen(isOpen);
  };

  // 保存设置
  const handleSave = () => {
    saveSettings(tempSettings);
    setSettings(tempSettings);
    setHasApiKey(!!tempSettings.apiKey);
    onSettingsChange(tempSettings);
    showSuccess('设置已保存');
    setOpen(false);
  };

  // 重置为默认值
  const handleReset = () => {
    setTempSettings({
      ...DEFAULT_SETTINGS,
      apiKey: tempSettings.apiKey,
      apiUrl: tempSettings.apiUrl,
    });
  };

  // 清理失效图片
  const handleCleanInvalidImages = async () => {
    setIsCleaning(true);
    try {
      const [cleanedImages, cleanedMaterials] = await Promise.all([
        cleanInvalidGeneratedImages(),
        cleanInvalidMaterials()
      ]);

      const total = cleanedImages + cleanedMaterials;
      if (total === 0) {
        showInfo('未发现失效图片');
      } else {
        showSuccess(`已清理 ${cleanedImages} 张失效生图,${cleanedMaterials} 张失效素材`);
      }
    } catch (error) {
      console.error('清理失效图片失败:', error);
      showError('清理失败,请查看控制台');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Avatar
          className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
        >
          <AvatarFallback className={`${hasApiKey ? 'bg-green-500' : 'bg-gray-400'} text-white text-xs`}>
            <Settings className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            配置 API 密钥、模型参数和生成风格提示词
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 px-1 overflow-y-auto flex-1">
          {/* API Key */}
          <div className="space-y-2 ">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Key
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={tempSettings.apiKey}
                onChange={(e) => setTempSettings({ ...tempSettings, apiKey: e.target.value })}
                placeholder="输入你的 API Key..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              API URL
            </Label>
            <Input
              id="apiUrl"
              type="text"
              value={tempSettings.apiUrl}
              onChange={(e) => setTempSettings({ ...tempSettings, apiUrl: e.target.value })}
              placeholder="https://generativelanguage.googleapis.com/v1beta"
            />
            <p className="text-xs text-muted-foreground">
              默认: {DEFAULT_SETTINGS.apiUrl}
            </p>
          </div>
          {/* 生图模型 */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              生图模型
            </Label>

            <div className="space-y-2 pl-2">
              <div className="space-y-1">
                <Label htmlFor="imageModelFlash" className="text-xs text-muted-foreground">
                  Gemini 2.5 Flash Image 模型
                </Label>
                <Input
                  id="imageModelFlash"
                  type="text"
                  value={tempSettings.modelList.find(m => m.modelselect === 'gemini-2.5-flah-image')?.model || 'gemini-2.5-flash'}
                  onChange={(e) => {
                    const newModelList = [...tempSettings.modelList];
                    const index = newModelList.findIndex(m => m.modelselect === 'gemini-2.5-flah-image');
                    if (index >= 0) {
                      newModelList[index] = { modelselect: 'gemini-2.5-flah-image', model: e.target.value };
                    } else {
                      newModelList.push({ modelselect: 'gemini-2.5-flah-image', model: e.target.value });
                    }
                    setTempSettings({ ...tempSettings, modelList: newModelList });
                  }}
                  placeholder="gemini-2.5-flash"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="imageModelPro" className="text-xs text-muted-foreground">
                  Gemini 3 Pro Image 模型
                </Label>
                <Input
                  id="imageModelPro"
                  type="text"
                  value={tempSettings.modelList.find(m => m.modelselect === 'gemini-3-pro-image')?.model || 'gemini-3-pro-image-preview'}
                  onChange={(e) => {
                    const newModelList = [...tempSettings.modelList];
                    const index = newModelList.findIndex(m => m.modelselect === 'gemini-3-pro-image');
                    if (index >= 0) {
                      newModelList[index] = { modelselect: 'gemini-3-pro-image', model: e.target.value };
                    } else {
                      newModelList.push({ modelselect: 'gemini-3-pro-image', model: e.target.value });
                    }
                    setTempSettings({ ...tempSettings, modelList: newModelList });
                  }}
                  placeholder="gemini-3-pro-image-preview"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 生成风格模型 */}
          <div className="space-y-3 ">
            <Label className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              文字模型
            </Label>

            <div className="space-y-2 pl-2">
              <div className="space-y-1">
                <Label htmlFor="wordModelFlash" className="text-xs text-muted-foreground">
                  Gemini 3 Flash 模型
                </Label>
                <Input
                  id="wordModelFlash"
                  type="text"
                  value={tempSettings.modelList.find(m => m.modelselect === 'gemini-3-flash')?.model || 'gemini-3-flash'}
                  onChange={(e) => {
                    const newModelList = [...tempSettings.modelList];
                    const index = newModelList.findIndex(m => m.modelselect === 'gemini-3-flash');
                    if (index >= 0) {
                      newModelList[index] = { modelselect: 'gemini-3-flash', model: e.target.value };
                    } else {
                      newModelList.push({ modelselect: 'gemini-3-flash', model: e.target.value });
                    }
                    setTempSettings({ ...tempSettings, modelList: newModelList });
                  }}
                  placeholder="gemini-3-flash"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="wordModelPro" className="text-xs text-muted-foreground">
                  Gemini 3 Pro 模型
                </Label>
                <Input
                  id="wordModelPro"
                  type="text"
                  value={tempSettings.modelList.find(m => m.modelselect === 'gemini-3-pro')?.model || 'gemini-3-pro'}
                  onChange={(e) => {
                    const newModelList = [...tempSettings.modelList];
                    const index = newModelList.findIndex(m => m.modelselect === 'gemini-3-pro');
                    if (index >= 0) {
                      newModelList[index] = { modelselect: 'gemini-3-pro', model: e.target.value };
                    } else {
                      newModelList.push({ modelselect: 'gemini-3-pro', model: e.target.value });
                    }
                    setTempSettings({ ...tempSettings, modelList: newModelList });
                  }}
                  placeholder="gemini-3-pro"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              "生成风格"使用Gemini 3 Pro
            </p>
          </div>

          {/* 生成风格提示词 */}
          <div className="space-y-2">
            <Label htmlFor="styleGeneratorPrompt" className="flex items-center gap-">
              <Palette className="w-4 h-4" />
              生成风格提示词
            </Label>
            <Textarea
              id="styleGeneratorPrompt"
              value={tempSettings.styleGeneratorPrompt}
              onChange={(e) => setTempSettings({ ...tempSettings, styleGeneratorPrompt: e.target.value })}
              placeholder="生成风格提示词"
              className="min-h-[100px] max-h-[150px] resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              点击"生成风格"按钮时使用的系统提示词
            </p>
          </div>

          {/* 文字模型默认提示词 */}
          <div className="space-y-2">
            <Label htmlFor="wordDefaultPrompt" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              文字模型默认提示词
            </Label>
            <Textarea
              id="wordDefaultPrompt"
              value={tempSettings.wordDefaultPrompt}
              onChange={(e) => setTempSettings({ ...tempSettings, wordDefaultPrompt: e.target.value })}
              placeholder="文字模型默认提示词,如Gemini 3 Pro没有其他用户提示词时使用的系统提示词"
              className="min-h-[100px] max-h-[150px] resize-none text-sm"
            />
          </div>

          {/* 清理失效图片 */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              数据清理
            </Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCleanInvalidImages}
                disabled={isCleaning}
                className="w-full"
              >
                {isCleaning ? '清理中...' : '清理失效图片'}
              </Button>
              <p className="text-xs text-muted-foreground">
                清理因浏览器清理导致数据丢失仍有索引的失效图片
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            重置默认
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
