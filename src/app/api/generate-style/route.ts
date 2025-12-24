import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageData, apiUrl, styleGeneratorModel, styleGeneratorPrompt } = await request.json();

    if (!imageData) {
      return NextResponse.json({ error: '需要提供图片' }, { status: 400 });
    }

    const apiKey = request.headers.get('X-API-Key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    // 解析base64图片
    const match = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: '无效的图片格式' }, { status: 400 });
    }
    const mimeType = `image/${match[1]}`;
    const base64Data = match[2];

    // 构建Gemini API URL
    const actualModel = styleGeneratorModel || 'gemini-2.0-flash';
    const DEFAULT_API_URL = 'https://aiplatform.googleapis.com/v1/publishers/google';
    const baseUrl = apiUrl || DEFAULT_API_URL;
    const API_URL = `${baseUrl}/models/${actualModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // 构建Gemini请求体
    const requestBody: any = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: '请分析这张图片的整体视觉风格，生成风格描述提示词：' },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    // 添加系统指令
    if (styleGeneratorPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: styleGeneratorPrompt }]
      };
    }

    // 日志：完整请求数据（图片简略显示）
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
          return part;
        })
      }))
    };
    console.log('[generate-style] request body:', JSON.stringify(logRequestBody, null, 2));
    console.log('[generate-style] API URL:', API_URL.replace(apiKey, '***'));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', errorBody);
      return NextResponse.json({ error: '生成风格失败' }, { status: 500 });
    }

    if (!response.body) {
      return NextResponse.json({ error: '响应体为空' }, { status: 500 });
    }

    // 流式转发
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('[generate-style] stream done');
              break;
            }

            const rawText = decoder.decode(value, { stream: true });
            console.log('[generate-style] raw chunk:', rawText); // 日志：原始数据

            buffer += rawText;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;

              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                break;
              }

              try {
                const data = JSON.parse(dataStr);
                // Gemini格式: candidates[0].content.parts
                const parts = data.candidates?.[0]?.content?.parts;
                if (parts && Array.isArray(parts)) {
                  for (const part of parts) {
                    if (part.text) {
                      console.log('[generate-style] content:', part.text);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: part.text })}\n\n`));
                    }
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Generate style error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '生成风格失败'
    }, { status: 500 });
  }
}
