/**
 * SSE 流式响应解析结果
 */
export interface SSEParseResult {
  textContent: string;
  thoughtContent: string;
  imageUrls: string[];
}

/**
 * 解析 SSE 流式响应
 * @param response fetch 响应对象
 * @param onText 收到文本时的回调（可选，用于实时显示）
 * @param onImage 收到图片时的回调（可选）
 */
export async function parseSSEStream(
  response: Response,
  onText?: (text: string) => void,
  onImage?: (url: string) => void
): Promise<SSEParseResult> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  let textContent = '';
  let thoughtContent = '';
  const imageUrls: string[] = [];
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
      if (dataStr === '[DONE]') continue;

      try {
        const chunk = JSON.parse(dataStr);
        if (chunk.type === 'thought') {
          thoughtContent += chunk.content;
        } else if (chunk.type === 'text') {
          textContent += chunk.content;
          onText?.(chunk.content);
        } else if (chunk.type === 'image') {
          imageUrls.push(chunk.content);
          onImage?.(chunk.content);
        } else if (chunk.type === 'error') {
          console.warn('大模型返回错误:', chunk.message);
        }
      } catch (e) {
        console.error('解析chunk失败:', e);
      }
    }
  }

  return { textContent, thoughtContent, imageUrls };
}
