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

    const DEFAULT_API_URL = 'https://openai.weavex.tech/v1/chat/completions';
    const API_URL = apiUrl || DEFAULT_API_URL;

    const requestBody = {
      model: styleGeneratorModel || 'gemini-2.5-flash',
      stream: true,
      messages: [
        {
          role: 'system',
          content: styleGeneratorPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这张图片的整体视觉风格，生成风格描述提示词：'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ]
    };

    // 日志：完整请求数据（图片简略显示）
    const logRequestBody = {
      ...requestBody,
      messages: requestBody.messages.map(msg => {
        if (Array.isArray(msg.content)) {
          return {
            ...msg,
            content: msg.content.map((item: any) => {
              if (item.type === 'image_url' && item.image_url?.url) {
                return {
                  ...item,
                  image_url: { url: `${item.image_url.url.substring(0, 50)}...(length: ${item.image_url.url.length})` }
                };
              }
              return item;
            })
          };
        }
        return msg;
      })
    };
    console.log('[generate-style] request body:', JSON.stringify(logRequestBody, null, 2));

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
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  console.log('[generate-style] content:', content); // 日志：提取的内容
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
