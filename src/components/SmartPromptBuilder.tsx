"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RegionSelector } from './RegionSelector';
import { NumberedLibrary } from './NumberedLibrary';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Copy, Eye, Trash2 } from 'lucide-react';

interface SelectionRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  number: number;
}

interface LibraryItem {
  id: string;
  src: string;
  number: number;
  name?: string;
}

interface RegionMapping {
  regionId: string;
  regionNumber: number;
  materialId: string;
  materialNumber: number;
  description?: string;
}

interface SmartPromptBuilderProps {
  mainImage: string;
  materials: LibraryItem[];
  onMaterialAdd: (file: File) => void;
  onMaterialRemove: (id: string) => void;
  onPromptGenerate: (prompt: string) => void;
  className?: string;
}

export function SmartPromptBuilder({
  mainImage,
  materials,
  onMaterialAdd,
  onMaterialRemove,
  onPromptGenerate,
  className = ""
}: SmartPromptBuilderProps) {
  const [regions, setRegions] = useState<SelectionRegion[]>([]);
  const [mappings, setMappings] = useState<RegionMapping[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  // 添加新区域
  const handleRegionSelect = useCallback((region: Omit<SelectionRegion, 'number'>) => {
    const newRegion: SelectionRegion = {
      ...region,
      number: regions.length + 1,
      label: `区域${regions.length + 1}`
    };
    setRegions(prev => [...prev, newRegion]);
  }, [regions.length]);

  // 删除区域
  const handleRegionRemove = useCallback((regionId: string) => {
    setRegions(prev => prev.filter(r => r.id !== regionId));
    setMappings(prev => prev.filter(m => m.regionId !== regionId));
  }, []);

  // 建立区域与素材的映射关系
  const handleMaterialDrop = useCallback((regionId: string, materialId: string) => {
    const region = regions.find(r => r.id === regionId);
    const material = materials.find(m => m.id === materialId);
    
    if (!region || !material) return;

    const newMapping: RegionMapping = {
      regionId,
      regionNumber: region.number,
      materialId,
      materialNumber: material.number,
      description: `将${region.label}替换为素材${material.number}`
    };

    setMappings(prev => {
      // 如果已存在该区域的映射，替换之
      const filtered = prev.filter(m => m.regionId !== regionId);
      return [...filtered, newMapping];
    });
  }, [regions, materials]);

  // 移除映射关系
  const handleMappingRemove = useCallback((regionId: string) => {
    setMappings(prev => prev.filter(m => m.regionId !== regionId));
  }, []);

  // 生成智能prompt
  const generateSmartPrompt = useCallback(() => {
    if (mappings.length === 0) {
      setGeneratedPrompt('请先框选区域并指定要替换的素材');
      return;
    }

    const basePrompt = `请帮我对这张图片进行精确的区域替换：

替换指令：`;

    const replacementInstructions = mappings.map((mapping, index) => {
      const region = regions.find(r => r.id === mapping.regionId);
      const material = materials.find(m => m.id === mapping.materialId);
      
      if (!region || !material) return '';

      return `
${index + 1}. 替换区域${mapping.regionNumber}：
   - 位置：从坐标(${Math.round(region.x)}, ${Math.round(region.y)})开始
   - 尺寸：宽${Math.round(region.width)}px × 高${Math.round(region.height)}px
   - 替换内容：参考素材图片${mapping.materialNumber}的主要元素
   - 要求：保持原图的光照、透视和色调，自然融合`;
    }).filter(Boolean).join('\n');

    const qualityRequirements = `

质量要求：
1. 保持整体图片的视觉连贯性
2. 新元素的大小要适配选中区域
3. 边缘要自然融合，避免生硬拼接
4. 保持光照方向和强度一致
5. 维护正确的透视关系和比例

素材说明：
${materials.map(m => `素材${m.number}：${m.name || '素材图片'}`).join('\n')}

请基于以上指令生成一张替换后的图片。`;

    const fullPrompt = basePrompt + replacementInstructions + qualityRequirements;
    setGeneratedPrompt(fullPrompt);
    setShowPrompt(true);
  }, [mappings, regions, materials]);

  // 复制prompt到剪贴板
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      // 可以添加成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 获取区域的映射信息
  const getRegionMapping = (regionId: string) => {
    return mappings.find(m => m.regionId === regionId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主图片区域选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>主图片 - 框选要替换的区域</span>
            <Badge variant="outline">
              {regions.length} 个区域
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegionSelector
            imageSrc={mainImage}
            selectedRegions={regions}
            onRegionSelect={handleRegionSelect}
            onRegionRemove={handleRegionRemove}
            onMaterialDrop={handleMaterialDrop}
            getMaterialNumber={(materialId) => 
              materials.find(m => m.id === materialId)?.number || 0
            }
          />
        </CardContent>
      </Card>

      {/* 编号素材库 */}
      <NumberedLibrary
        materials={materials}
        onMaterialAdd={onMaterialAdd}
        onMaterialRemove={onMaterialRemove}
      />

      {/* 映射关系显示 */}
      {mappings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>替换计划</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mappings.map(mapping => {
                const region = regions.find(r => r.id === mapping.regionId);
                const material = materials.find(m => m.id === mapping.materialId);
                
                return (
                  <div key={mapping.regionId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">区域{mapping.regionNumber}</Badge>
                      <span>→</span>
                      <Badge variant="default">素材{mapping.materialNumber}</Badge>
                      {material && (
                        <img 
                          src={material.src} 
                          alt={`素材${material.number}`}
                          className="w-8 h-8 object-cover rounded border"
                        />
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMappingRemove(mapping.regionId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成控制区 */}
      <div className="flex gap-2">
        <Button
          onClick={generateSmartPrompt}
          disabled={mappings.length === 0}
          className="flex-1"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          生成智能提示词
        </Button>
        
        {generatedPrompt && (
          <Button
            variant="outline"
            onClick={() => setShowPrompt(!showPrompt)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPrompt ? '隐藏' : '查看'}
          </Button>
        )}
      </div>

      {/* 生成的prompt显示 */}
      {showPrompt && generatedPrompt && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>生成的智能提示词</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyPrompt}>
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onPromptGenerate(generatedPrompt)}
                >
                  发送给AI
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[200px] text-sm font-mono"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}