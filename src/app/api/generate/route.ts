import { NextResponse } from 'next/server';
import { GenerateRequestSchema, type SegmentedObject } from '@/types/api';
import { ZodError } from 'zod';

// 导入 Google AI SDK。注意：这可能需要根据我们最终使用的服务进行更改。
// import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    // 1. 验证请求数据
    const requestData = await request.json();
    const validatedData = GenerateRequestSchema.parse(requestData);

    const {
      prompt,
      color,
      style,
      creativity,
      referenceImages,
      segmentedObjects
    } = validatedData;

    // 2. 验证必要参数
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    // 3. 构建精准构图提示词
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

    // 添加风格和颜色信息
    fullPrompt += `, in the style of ${style}, with a dominant color of ${color}`;

    // 4. 准备调用模型 API
    // 4. 构建消息内容
    const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: fullPrompt
      }
    ];

    // 添加参考图片
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((imageData: string) => {
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: imageData
          }
        });
      });
    }

    const API_URL = 'https://openai.weavex.tech/v1/chat/completions';

    const requestBody = {
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      stream: true,
      temperature: creativity,
    };

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

    // 6. 在后端收集流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // 将新接收的数据块附加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按换行符分割缓冲区，处理所有完整的行
      const lines = buffer.split('\n');

      // 最后一个元素可能是不完整的行，所以我们保留它在缓冲区中
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
          if (data.choices && data.choices[0]?.delta && data.choices[0]?.delta?.content) {
            fullContent += data.choices[0].delta.content;
          }
        } catch (e) {
          console.error('Error parsing stream chunk:', dataStr, e);
        }
      }
    }

    // 7. 从收集到的内容中提取 Base64 图片数据
    // 假设图片数据格式为 Markdown: ![...](data:image/png;base64,...)
    const base64Regex = /(data:image\/[a-zA-Z]+;base64,[^)]+)/;
    const match = fullContent.match(base64Regex);

    if (!match || !match[0]) {
      console.error('Could not find base64 image in the response:', fullContent);
      throw new Error('Could not find base64 image in the API response');
    }

    const imageUrl = match[0];

    // 8. 返回生成结果和相关信息
    return NextResponse.json({
      imageUrl,
      compositionUsed: segmentedObjects && segmentedObjects.length > 0,
      objectsCount: segmentedObjects ? segmentedObjects.filter((obj: SegmentedObject) => obj.selected).length : 0
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
