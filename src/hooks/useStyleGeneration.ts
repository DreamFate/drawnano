import { useState, useCallback } from 'react';
import { parseSSEStream } from '@/lib/sse-parser';

/**
 * 风格生成 hook
 */
export function useStyleGeneration() {
  const [systemStyle, setSystemStyle] = useState('');
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);

  const generateStyle = useCallback(async (
    imageData: string,
    apiKey: string,
    apiUrl: string,
    styleGeneratorModel: string,
    styleGeneratorPrompt: string,
    onError: (message: string) => void
  ) => {
    setIsGeneratingStyle(true);
    setSystemStyle('');

    try {
      const response = await fetch('/api/generate-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ imageData, apiUrl, styleGeneratorModel, styleGeneratorPrompt }),
      });

      if (!response.ok) {
        throw new Error('生成风格失败');
      }

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
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            if (data.content) {
              setSystemStyle(prev => prev + data.content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (error) {
      console.error('生成风格失败:', error);
      onError('生成风格失败，请重试');
    } finally {
      setIsGeneratingStyle(false);
    }
  }, []);

  return {
    systemStyle,
    setSystemStyle,
    isGeneratingStyle,
    generateStyle,
  };
}
