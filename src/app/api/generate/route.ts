import { NextResponse } from 'next/server';
import { GenerateRequestSchema,Contents,ApiErrorMessage} from '@/types';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    // 1. 验证请求数据
    const requestData = await request.json();
    const validatedData = GenerateRequestSchema.parse(requestData);

    const {
      prompt,
      referenceImages,
      model,
      conversationHistory,
      systemStyle,
      modelConfig,
      apiUrl,
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

    // 3. 构建Gemini格式的contents数组
    const contents: Contents = [];
    // 构建用户消息的parts数组
    const parts: any[] = [{ text: prompt }];

    // 添加参考图片
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((imageData: string) => {
        const match = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: `image/${match[1]}`,
              data: match[2]
            }
          });
        }
      });
    }

    // 处理对话历史
    if (conversationHistory && conversationHistory.length > 0) {
        contents.push(...conversationHistory);
    }
    contents.push({ role: 'user', parts });

    console.log('对话历史条数:', conversationHistory?.length || 0);
    console.log('总消息数:', contents.length);

    const actualModel = model || 'gemini-3-pro-image-preview';

    // 构建Gemini API URL
    const DEFAULT_API_URL = 'https://aiplatform.googleapis.com/v1/publishers/google';
    const baseUrl = apiUrl || DEFAULT_API_URL;
    const API_URL = `${baseUrl}/models/${actualModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // 构建Gemini请求体
    const requestBody: any = {
      contents,
    };

    // 构建 generationConfig (仅在有配置时添加)
    if (modelConfig?.modeltype === 'image') {
      const responseModalities = modelConfig?.modality === 'Image_Text'
        ? ['IMAGE', 'TEXT']
        : [modelConfig?.modality?.toUpperCase() || 'IMAGE'];

      const imageConfig: Record<string, string> = {
        ...(modelConfig?.aspectRatio && modelConfig.aspectRatio !== 'auto' && { aspectRatio: modelConfig.aspectRatio }),
        ...(modelConfig?.resolution && { imageSize: modelConfig.resolution })
      };

      const generationConfig: any = {
        responseModalities,
        ...(Object.keys(imageConfig).length > 0 && { imageConfig })
      };

      requestBody.generationConfig = generationConfig;

    } else if (modelConfig?.modeltype === 'word') {
      const thinkingConfig: Record<string, any> = {
        ...(modelConfig?.enableThinking === true && { includeThoughts: true }),
        ...(modelConfig?.thinkLevel && { thinkingLevel: modelConfig.thinkLevel })
      };

      if (Object.keys(thinkingConfig).length > 0) {
        requestBody.generationConfig = { thinkingConfig };
      }
    }

    // 添加系统指令
    if (systemStyle && systemStyle.trim()) {
      requestBody.systemInstruction = {
        parts: [{
          text: systemStyle.trim()
        }]
      };
    }


    console.log('使用模型:', actualModel, '宽高比:', modelConfig?.aspectRatio, '分辨率:', modelConfig?.resolution || '默认', '输出类型:', modelConfig?.modality);

    // 创建一个用于日志的副本,截断 base64 图片数据
    const logRequestBody = {
      ...requestBody,
      contents: requestBody.contents.map((content: any) => ({
        ...content,
        parts: content.parts.map((part: any) => {
          if (part.inlineData?.data) {
            return {
              ...part,
              inlineData: {
                ...part.inlineData,
                data: part.inlineData.data.substring(0, 50) + '...[truncated]'
              }
            };
          }
          if(part.thoughtSignature){
            return {
              ...part,
              thoughtSignature: part.thoughtSignature.substring(0, 50) + '...[truncated]'
            };
          }
          return part;
        })
      }))
    };

    console.log('API Request Body:', JSON.stringify(logRequestBody, null, 2));
    console.log('API URL:', API_URL.replace(apiKey, '***'));

    // 5. 发送请求到Gemini API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);

      // 构建符合 ApiErrorMessage 类型的错误信息
      const apiError: ApiErrorMessage = {
        code: '',
        messages: '',
        status: ''
      };

      try {
        const errorJson = JSON.parse(errorBody);
        apiError.code = errorJson.error?.code.toString() || 'UNKNOWN_ERROR';
        apiError.messages = errorJson.error?.message.toString() || 'API request failed';
        apiError.status = errorJson.error?.status.toString() || `HTTP ${response.status}`;
      } catch {
        // 如果解析失败，使用默认错误信息
        apiError.code = 'PARSE_ERROR';
        apiError.messages = errorBody ? errorBody.substring(0, 500) : 'Unknown error occurred';
        apiError.status = `HTTP ${response.status}`;
      }

      return NextResponse.json({
        error: apiError
      }, { status: 500 });
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
        let thoughtContent = '';
        let thoughtSignature = '';
        const imageUrls: string[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const rawText = decoder.decode(value, { stream: true });

            buffer += rawText;
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

                // 打印响应结构(不包含 parts 详细内容)
                const logData = {
                  ...data,
                  candidates: data.candidates?.map((c: any) => ({
                    ...c,
                    content: {
                      ...c.content,
                      parts: `[${c.content?.parts?.length || 0} parts]`
                    }
                  }))
                };
                console.log('📦 Gemini 响应结构:', JSON.stringify(logData, null, 2));

                // Gemini格式: candidates[0].content.parts
                const parts = data.candidates?.[0]?.content?.parts;

                if (parts && Array.isArray(parts)) {
                  for (const part of parts) {
                    if (part.thought && part.text) {
                      thoughtContent += part.text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'thought',
                        content: part.text
                      })}\n\n`));
                    }
                    // 处理文本
                    if (!part.thought && part.text) {
                      textContent += part.text;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'text',
                        content: part.text
                      })}\n\n`));
                    }
                    // 处理图片 (inlineData格式)
                    if (part.inlineData) {
                      const { mimeType, data: base64Data } = part.inlineData;
                      const imageUrl = `data:${mimeType};base64,${base64Data}`;
                      imageUrls.push(imageUrl);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'image',
                        content: imageUrl,
                        index: imageUrls.length - 1,
                        isLast: false
                      })}\n\n`));
                    }
                    if (part.thoughtSignature){
                      thoughtSignature += part.thoughtSignature
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'thoughtSignature',
                        content: part.thoughtSignature
                      })}\n\n`));
                    }

                  }

                  const usageMetadata = data.usageMetadata;
                  if (usageMetadata&& usageMetadata.totalTokenCount){
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'usageMetadata',
                      content: usageMetadata
                    })}\n\n`));
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
            思路总长度: thoughtContent.length,
            思路内容: thoughtContent || '(无思路)',
            思路签名大小: thoughtSignature ? `${(thoughtSignature.length / 1024).toFixed(2)} KB` : '(无签名)',
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
