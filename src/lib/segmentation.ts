import { SegmentMask, SegmentedObject } from '@/types/segmentation';

/**
 * 将归一化坐标(0-1000)转换为实际像素坐标
 */
export function normalizedToPixelCoords(
  box_2d: [number, number, number, number],
  imageWidth: number,
  imageHeight: number
): [number, number, number, number] {
  const [y0, x0, y1, x1] = box_2d;
  return [
    (y0 / 1000) * imageHeight,
    (x0 / 1000) * imageWidth,
    (y1 / 1000) * imageHeight,
    (x1 / 1000) * imageWidth
  ];
}

/**
 * 解码base64遮罩并转换为Canvas ImageData
 */
export async function decodeMaskToImageData(
  base64Mask: string,
  width: number,
  height: number
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      
      // 在127阈值处二值化
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]; // PNG的alpha通道
        const binary = alpha > 127 ? 255 : 0;
        data[i] = binary;     // R
        data[i + 1] = binary; // G  
        data[i + 2] = binary; // B
        data[i + 3] = binary; // A
      }
      
      resolve(imageData);
    };
    img.onerror = reject;
    img.src = base64Mask;
  });
}

/**
 * 调用分割API
 */
export async function segmentImage(imageData: string): Promise<SegmentMask[]> {
  const response = await fetch('/api/segment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to segment image');
  }

  const { masks } = await response.json();
  return masks;
}

/**
 * 创建分割对象
 */
export function createSegmentedObject(
  mask: SegmentMask,
  imageId: string
): SegmentedObject {
  return {
    id: `${imageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    mask,
    imageId,
    selected: false,
    position: { x: 0, y: 0 },
    scale: 1
  };
}

/**
 * 在画布上绘制分割遮罩轮廓
 */
export function drawMaskOutline(
  ctx: CanvasRenderingContext2D,
  maskImageData: ImageData,
  x: number,
  y: number,
  color = '#ff0000',
  lineWidth = 2
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  
  const { data, width, height } = maskImageData;
  
  // 查找轮廓点
  const contourPoints: Array<{ x: number; y: number }> = [];
  
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4;
      if (data[idx] > 127) { // 是前景像素
        // 检查是否是边界像素
        const isEdge = px === 0 || px === width - 1 || py === 0 || py === height - 1 ||
          data[((py - 1) * width + px) * 4] <= 127 ||
          data[((py + 1) * width + px) * 4] <= 127 ||
          data[(py * width + px - 1) * 4] <= 127 ||
          data[(py * width + px + 1) * 4] <= 127;
          
        if (isEdge) {
          contourPoints.push({ x: px + x, y: py + y });
        }
      }
    }
  }
  
  // 绘制轮廓点
  if (contourPoints.length > 0) {
    ctx.beginPath();
    contourPoints.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }
}