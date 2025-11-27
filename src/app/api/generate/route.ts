import { NextResponse } from 'next/server';
import { GenerateRequestSchema, type SegmentedObject, type MessageContentItem } from '@/types/api';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    // 1. 验证请求数据
    const requestData = await request.json();
    const validatedData = GenerateRequestSchema.parse(requestData);

    const {
      prompt,
      messageContent,
      referenceImages,
      segmentedObjects,
      conversationHistory,
      systemStyle,
      model = 'gemini-2.5-flash',
      aspectRatio = '16:9',
      resolution,
      modalities = 'Image_Text',
      apiUrl,
      modelMapping,
    } = validatedData;

    // 2. 验证必要参数
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 从请求头获取用户的API Key
    const apiKey = request.headers.get('X-API-Key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    // 3. 构建消息数组
    let messages: Array<{ role: string; content: string | MessageContentItem[] }> = [];

    // 添加 system prompt（整体风格描述）
    if (systemStyle && systemStyle.trim()) {
      messages.push({
        role: 'system',
        content: `你是一个专业的图像生成助手。请按照以下整体风格要求来生成图片：\n\n${systemStyle.trim()}\n\n请确保生成的图片符合上述风格描述。`
      });
    }

    // 方式1: 前端已组装好messageContent(修改模式)
    if (messageContent && messageContent.length > 0) {
      messages = [
        ...messages,
        ...(conversationHistory || []),
        {
          role: 'user',
          content: messageContent
        }
      ];
    }
    // 方式2: 传统方式(生成模式)
    else {
      let fullPrompt = prompt;

      if (segmentedObjects && segmentedObjects.length > 0) {
        // 视觉构图模式：添加精准位置和组合信息
        const objectDescriptions = segmentedObjects
          .filter((obj: SegmentedObject) => obj.selected)
          .map((obj: SegmentedObject) =>
            `将"${obj.mask.label}"精准放置在位置(${obj.position?.x || 0}, ${obj.position?.y || 0})处`
          )
          .join(', ');

        fullPrompt += `. 精准构图要求: ${objectDescriptions}`;
      }

      const content: MessageContentItem[] = [
        {
          type: 'text',
          text: fullPrompt
        }
      ];

      // 添加参考图片
      if (referenceImages && referenceImages.length > 0) {
        referenceImages.forEach((imageData: string) => {
          content.push({
            type: 'image_url',
            image_url: {
              url: imageData
            }
          });
        });
      }

      // 添加对话历史上下文（保留已有的 system message）
      messages = [
        ...messages,
        ...(conversationHistory || []),
        {
          role: 'user',
          content
        }
      ];
    }

    console.log('对话历史条数:', conversationHistory?.length || 0);
    console.log('总消息数:', messages.length);

    const DEFAULT_API_URL = 'https://openai.weavex.tech/v1/chat/completions';
    const API_URL = apiUrl || DEFAULT_API_URL;

    // 模型映射（使用用户自定义或默认值）
    const DEFAULT_MODEL_MAP: Record<string, string> = {
      'gemini-2.5-flash': 'gemini-2.5-flash-image-preview',
      'gemini-3-pro': 'gemini-3-pro-image-preview'
    };
    const MODEL_MAP = modelMapping || DEFAULT_MODEL_MAP;
    const actualModel = MODEL_MAP[model] ?? DEFAULT_MODEL_MAP['gemini-2.5-flash'];

    // 构建图片配置
    const imageConfig: Record<string, string> = {};
    if (aspectRatio !== 'auto') {
      imageConfig.aspectRatio = aspectRatio;
    }
    if (model === 'gemini-3-pro' && resolution) {
      imageConfig.imageSize = resolution;
    }

    // 输出模态
    const responseModalities = modalities === 'Image_Text'
      ? ['Image', 'Text']
      : [modalities];

    const requestBody = {
      model: actualModel,
      messages,
      stream: true,
      raw: true,
      generationConfig: {
        ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
        responseModalities
      }
    };



    console.log('使用模型:', actualModel, '宽高比:', aspectRatio, '分辨率:', resolution || '默认');

    // 创建一个用于日志的副本,截断 base64 图片数据
    const logRequestBody = {
      ...requestBody,
      messages: requestBody.messages.map(msg => {
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((item: any) => {
              if (item.type === 'image_url' && item.image_url?.url) {
                const url = item.image_url.url;
                const truncated = url.length > 100
                  ? url.substring(0, 50) + '...[truncated ' + (url.length - 50) + ' chars]...' + url.substring(url.length - 20)
                  : url;
                return {
                  ...item,
                  image_url: {
                    ...item.image_url,
                    url: truncated
                  }
                };
              }
              return item;
            })
          };
        }
        return msg;
      })
    };

    console.log('API Request Body:', JSON.stringify(logRequestBody, null, 2));

    // 5. 发送请求到模型 API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      throw new Error(`API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // 6. 创建流式响应,实时推送文字和图片
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let textContent = '';
        const imageUrls: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) {
                continue;
              }

              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                break;
              }

              try {
                const data = JSON.parse(dataStr);
                const content = data.choices?.[0]?.delta?.content;

                if (content) {
                  // 检查是否包含图片
                  const base64Regex = /(data:image\/[a-zA-Z]+;base64,[^)]+)/g;
                  let lastIndex = 0;
                  let match;

                  let hasImageMatch = false;
                  while ((match = base64Regex.exec(content)) !== null) {
                    hasImageMatch = true;

                    // 发送图片前的文字
                    if (match.index > lastIndex) {
                      const text = content.substring(lastIndex, match.index)
                        .replace(/!\[.*?\]\(/g, '')
                        .replace(/\)/g, '')
                        .trim();

                      if (text) {
                        textContent += text;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                          type: 'text',
                          content: text
                        })}\n\n`));
                      }
                    }

                    // 发送图片
                    const imageUrl = match[0];
                    imageUrls.push(imageUrl);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'image',
                      content: imageUrl,
                      index: imageUrls.length - 1,
                      isLast: false
                    })}\n\n`));

                    lastIndex = base64Regex.lastIndex;
                  }

                  // 处理剩余文字(如果有图片匹配)或整个content(如果没有图片)
                  if (hasImageMatch && lastIndex < content.length) {
                    // 有图片,处理图片后的剩余文字
                    const text = content.substring(lastIndex)
                      .replace(/!\[.*?\]\(/g, '')
                      .replace(/\)/g, '')
                      .trim();

                    if (text) {
                      textContent += text;
                      console.log('[流式输出] 发送图片后文字:', text);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'text',
                        content: text
                      })}\n\n`));
                    }
                  } else if (!hasImageMatch) {
                    // 没有图片,整个content都是文字
                    const text = content.replace(/!\[.*?\]\(/g, '').replace(/\)/g, '').trim();
                    if (text) {
                      textContent += text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'text',
                        content: text
                      })}\n\n`));
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }

          // 流结束,发送完成信号
          console.log('[流式完成] 汇总:', {
            文字总长度: textContent.length,
            文字内容: textContent || '(无文字)',
            图片数量: imageUrls.length,
            图片列表: imageUrls.map((url, i) =>
              `图片${i+1}: `
            )
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            textContent: textContent || '图片已生成',
            imageCount: imageUrls.length,
            hasImages: imageUrls.length > 0
          })}\n\n`));

        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Stream processing failed'
          })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    // 7. 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error
      }, { status: 400 });
    }

    console.error('API Route Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }, { status: 500 });
  }
}

// 注: extractImageAndText 函数已被移除,改为流式处理
