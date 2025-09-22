import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求模式
const ReplaceRequestSchema = z.object({
  baseImage: z.string().min(1, "基础图片不能为空"),
  replacementImage: z.string().min(1, "替换图片不能为空"),
  region: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    label: z.string().optional()
  }),
  prompt: z.string().optional().default("自然融合替换指定区域")
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ReplaceRequestSchema.parse(body);
    
    const { baseImage, replacementImage, region, prompt } = validatedData;
    
    // 检查API密钥
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY未配置' },
        { status: 500 }
      );
    }
    
    // 构建给Gemini的详细提示词
    const detailedPrompt = buildReplacementPrompt(prompt, region);
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: detailedPrompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: baseImage.split(',')[1] // 去掉data:image/jpeg;base64,前缀
              }
            },
            {
              inline_data: {
                mime_type: "image/jpeg", 
                data: replacementImage.split(',')[1]
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API错误: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // 提取生成的图片内容
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedContent) {
      throw new Error('Gemini未返回有效内容');
    }
    
    // 如果Gemini返回的是图片数据，直接返回
    if (generatedContent.includes('data:image')) {
      return NextResponse.json({
        success: true,
        resultImage: generatedContent,
        message: '区域替换完成'
      });
    }
    
    // 如果返回的是描述性文本，可能需要进一步处理
    // 这里暂时返回原图，实际使用中可能需要调用图片生成API
    return NextResponse.json({
      success: false,
      message: 'Gemini暂不支持直接的图片区域替换，返回了描述性内容',
      description: generatedContent
    });
    
  } catch (error) {
    console.error('区域替换API错误:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数格式错误', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '区域替换失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 构建区域替换的详细提示词
 */
function buildReplacementPrompt(basePrompt: string, region: { x: number; y: number; width: number; height: number; label?: string }): string {
  return `
请帮我进行智能图片区域替换：

任务描述：${basePrompt}

替换区域信息：
- 位置：从坐标(${region.x}, ${region.y})开始
- 尺寸：宽度${region.width}px，高度${region.height}px
- 区域标签：${region.label || '选中区域'}

替换要求：
1. 保持整体图片的光照和色调一致性
2. 新元素的大小要适配选中区域
3. 边缘要自然融合，避免生硬的拼接感
4. 保持透视关系和比例协调
5. 如果是替换物体，请考虑材质和质感的匹配

请基于第一张图片(基础图片)和第二张图片(素材图片)，将素材图片中的主要元素智能融合到基础图片的指定区域中。

如果你能直接进行图片编辑，请返回处理后的图片。如果不能，请详细描述如何进行这种替换。
`;
}

/**
 * 使用本地图片处理作为降级方案
 */
async function performLocalReplacement(
  baseImageData: string,
  replacementImageData: string, 
  region: { x: number; y: number; width: number; height: number }
): Promise<string> {
  // 这里可以实现基础的图片合成逻辑
  // 由于浏览器环境限制，这个功能需要在客户端实现或使用专门的图片处理库
  
  return baseImageData; // 暂时返回原图
}