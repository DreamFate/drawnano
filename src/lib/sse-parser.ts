/**
 * SSE 流式响应解析结果
 */

import { UsageMetadata } from "@/types";
export interface SSEParseResult {
  textContent: string;
  thoughtContent: string;
  thoughtSignature: string;
  imageUrls: string[];
  usageMetadata: UsageMetadata;
}

/**
 * 解析 SSE 流式响应
 * @param response fetch 响应对象
 * @param onText 收到文本时的回调（可选，用于实时显示）
 * @param onThought 收到思考内容时的回调（可选，用于实时显示）
 * @param onImage 收到图片时的回调（可选）
 */
export async function parseSSEStream(
  response: Response,
  onText?: (text: string) => void,
  onThought?: (thought: string) => void,
  onImage?: (url: string) => void
): Promise<SSEParseResult> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  let textContent = '';
  let thoughtContent = '';
  let thoughtSignature = '';
  let usageMetadata: UsageMetadata = {};
  const imageUrls: string[] = [];
  let buffer = '';

  const chunkHandlers: Record<string, (chunk: any) => void> = {
    thought: (chunk) => {
      thoughtContent += chunk.content;
      onThought?.(chunk.content);
    },
    text: (chunk) => {
      textContent += chunk.content;
      onText?.(chunk.content);
    },
    thoughtSignature: (chunk) => {
      thoughtSignature += chunk.content;
    },
    image: (chunk) => {
      imageUrls.push(chunk.content);
      onImage?.(chunk.content);
    },
    error: (chunk) => {
      console.warn('大模型返回错误:', chunk.message);
    },
    usageMetadata: (chunk) => {
      usageMetadata = { ...usageMetadata, ...chunk.content };
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;

      const dataStr = line.substring(6).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const chunk = JSON.parse(dataStr);
        const handler = chunkHandlers[chunk.type];
        handler?.(chunk);
      } catch (e) {
        console.error('解析chunk失败:', e);
      }
    }
  }

  return { textContent, thoughtContent, imageUrls, thoughtSignature, usageMetadata };
}
