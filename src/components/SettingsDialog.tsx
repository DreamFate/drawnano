"use client";

import { useState, useEffect } from 'react';
import { Settings, Key, Globe, Palette, Cpu, Eye, EyeOff } from 'lucide-react';
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
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppSettings, loadSettings, saveSettings, DEFAULT_SETTINGS, DEFAULT_STYLE_GENERATOR_PROMPT, DEFAULT_MODEL_MAPPING } from '@/lib/settings-storage';

interface SettingsDialogProps {
  onSettingsChange: (settings: AppSettings) => void;
  defaultOpen?: boolean;
}

export function SettingsDialog({ onSettingsChange, defaultOpen = false }: SettingsDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // 初始化加载设置
  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
    setTempSettings(saved);
    setHasApiKey(!!saved.apiKey);
    onSettingsChange(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 defaultOpen 变化
  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
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
    setOpen(false);
  };

  // 重置为默认值
  const handleReset = () => {
    setTempSettings({
      ...DEFAULT_SETTINGS,
      apiKey: tempSettings.apiKey, // 保留 API Key
      apiUrl: tempSettings.apiUrl, // 保留 API URL
    });
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
              placeholder="https://openai.weavex.tech/v1/chat/completions"
            />
            <p className="text-xs text-muted-foreground">
              默认: {DEFAULT_SETTINGS.apiUrl}
            </p>
          </div>

          {/* 模型映射 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              生图模型映射
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-28 flex-shrink-0">gemini-2.5-flash</span>
                <Input
                  type="text"
                  value={tempSettings.modelMapping['gemini-2.5-flash']}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    modelMapping: { ...tempSettings.modelMapping, 'gemini-2.5-flash': e.target.value }
                  })}
                  placeholder={DEFAULT_MODEL_MAPPING['gemini-2.5-flash']}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-28 flex-shrink-0">gemini-3-pro</span>
                <Input
                  type="text"
                  value={tempSettings.modelMapping['gemini-3-pro']}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    modelMapping: { ...tempSettings.modelMapping, 'gemini-3-pro': e.target.value }
                  })}
                  placeholder={DEFAULT_MODEL_MAPPING['gemini-3-pro']}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              将项目中的模型名映射到你的 API 实际模型名
            </p>
          </div>

          {/* 生成风格模型 */}
          <div className="space-y-2">
            <Label htmlFor="styleGeneratorModel" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              生成风格模型
            </Label>
            <Input
              id="styleGeneratorModel"
              type="text"
              value={tempSettings.styleGeneratorModel}
              onChange={(e) => setTempSettings({ ...tempSettings, styleGeneratorModel: e.target.value })}
              placeholder="gemini-2.5-flash"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              点击"生成风格"按钮时使用的模型，默认: gemini-2.5-flash
            </p>
          </div>

          {/* 生成风格提示词 */}
          <div className="space-y-2">
            <Label htmlFor="styleGeneratorPrompt" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              生成风格提示词
            </Label>
            <Textarea
              id="styleGeneratorPrompt"
              value={tempSettings.styleGeneratorPrompt}
              onChange={(e) => setTempSettings({ ...tempSettings, styleGeneratorPrompt: e.target.value })}
              placeholder={DEFAULT_STYLE_GENERATOR_PROMPT}
              className="min-h-[100px] max-h-[150px] resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              点击"生成风格"按钮时使用的系统提示词
            </p>
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
