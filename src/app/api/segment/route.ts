import { NextResponse } from 'next/server';
import { SegmentRequestSchema, type SegmentMask } from '@/types/api';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { imageData } = SegmentRequestSchema.parse(requestData);

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const API_URL = 'https://openai.weavex.tech/v1/chat/completions';

    // 构建分割请求
    const requestBody = {
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and return a JSON list of segmentation masks. Each entry should contain: "box_2d" (bounding box as [y0, x0, y1, x1] with coordinates 0-1000), "label" (object description), and "mask" (base64 PNG segmentation mask).'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      stream: true,
    };

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
      console.error('Segmentation API Error:', errorBody);
      throw new Error(`API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '' || !line.startsWith('data: ')) continue;

        const dataStr = line.substring(6).trim();
        if (dataStr === '[DONE]') break;

        try {
          const data = JSON.parse(dataStr);
          if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
            fullContent += data.choices[0].delta.content;
          }
        } catch (e) {
          console.error('Error parsing stream chunk:', dataStr, e);
        }
      }
    }

    // 解析JSON响应中的分割掩码
    const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', fullContent);
      throw new Error('Could not find segmentation masks in response');
    }

    const masks: SegmentMask[] = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ masks });

  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error
      }, { status: 400 });
    }

    console.error('Segmentation API Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to segment image'
    }, { status: 500 });
  }
}