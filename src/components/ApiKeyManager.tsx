"use client";

import { useState, useEffect } from 'react';
import { Key, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ApiKeyManagerProps {
  onApiKeyChange: (apiKey: string) => void;
}

export function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // 从localStorage加载API Key
  useEffect(() => {
    const savedKey = localStorage.getItem('apiKey');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange(savedKey);
    } else {
      // 如果没有保存的key,默认展开输入框
      setIsExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      localStorage.setItem('apiKey', tempKey.trim());
      onApiKeyChange(tempKey.trim());
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setTempKey(apiKey);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setTempKey(apiKey);
    setIsExpanded(true);
  };

  // 如果已有key且未展开,显示为avatar
  if (apiKey && !isExpanded) {
    return (
      <div className="relative">
        <Avatar
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
          onClick={handleExpand}
        >
          <AvatarFallback className="bg-green-500 text-white text-xs">
            <Key className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // 展开状态或无key时显示输入框
  return (
    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
      <Key className="w-4 h-4 text-gray-500" />
      <Input
        type="password"
        value={tempKey}
        onChange={(e) => setTempKey(e.target.value)}
        placeholder="输入API Key..."
        className="w-48 h-8 text-sm"
        autoFocus
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
        onClick={handleSave}
        disabled={!tempKey.trim()}
      >
        <Check className="w-4 h-4 text-green-600" />
      </Button>
      {apiKey && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
          onClick={handleCancel}
        >
          <X className="w-4 h-4 text-red-600" />
        </Button>
      )}
    </div>
  );
}
