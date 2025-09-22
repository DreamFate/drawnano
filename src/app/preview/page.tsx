"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getImage } from '@/lib/image-storage';

function PreviewImage() {
  const searchParams = useSearchParams();
  const imageId = searchParams.get('id');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageId) {
      setError('图片 ID 无效');
      setIsLoading(false);
      return;
    }

    async function loadImage() {
      try {
        const src = await getImage(imageId as string);
        if (src) {
          setImageUrl(src);
        } else {
          setError('在数据库中找不到图片');
        }
      } catch (err) {
        setError('加载图片时出错');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadImage();
  }, [imageId]);

  const containerStyle: React.CSSProperties = {
    margin: 0,
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: 'white',
    fontFamily: 'sans-serif'
  };

  if (isLoading) {
    return <div style={containerStyle}>加载中...</div>;
  }

  if (error) {
    return <div style={containerStyle}>{error}</div>;
  }

  return (
    <div style={containerStyle}>
      {imageUrl ? (
        <img
          src={imageUrl}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          alt="Image Preview"
        />
      ) : (
        <div style={containerStyle}>无法显示图片</div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{color: 'white', backgroundColor: '#111', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>正在准备预览...</div>}>
      <PreviewImage />
    </Suspense>
  );
}
