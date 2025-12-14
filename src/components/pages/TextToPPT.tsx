import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Download, Eye } from 'lucide-react';

interface TextToPPTProps {
  onNavigate: (page: string) => void;
}

export function TextToPPT({ onNavigate }: TextToPPTProps) {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-2">文本转 PPT</h2>
          <p className="text-[#ADB5BD]">一键生成结构化教学课件</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <Card className="p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#4C6EF5]" />
                <h4>输入教案内容</h4>
              </div>
              
              <textarea
                className="w-full h-96 p-4 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5] outline-none transition-all resize-none mb-4"
                placeholder="请粘贴或输入您的教案内容...&#10;&#10;示例：&#10;第一章：深度学习简介&#10;1.1 什么是深度学习&#10;1.2 深度学习的应用场景&#10;1.3 神经网络基础&#10;..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              
              <div className="space-y-3">
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={!inputText || isGenerating}
                >
                  <Sparkles className="w-5 h-5" />
                  {isGenerating ? '正在生成中...' : '生成 PPT'}
                </Button>
                
                <div className="p-4 bg-[#EDF2FF] rounded-lg border border-[#4C6EF5]/20">
                  <h5 className="mb-2 text-[#4C6EF5]">AI 生成特性：</h5>
                  <ul className="text-sm text-[#212529] space-y-1">
                    <li>• 自动提取章节结构</li>
                    <li>• 智能生成标题与要点</li>
                    <li>• 配色方案自动匹配</li>
                    <li>• 支持多种模板风格</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Preview Section */}
          <div>
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#845EF7]" />
                  <h4>生成预览</h4>
                </div>
                {hasGenerated && (
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4" />
                    下载 PPT
                  </Button>
                )}
              </div>
              
              {!hasGenerated ? (
                <div className="h-96 bg-[#F8F9FA] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#E9ECEF] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-[#ADB5BD]" />
                    </div>
                    <p className="text-[#ADB5BD]">PPT 预览将在此显示</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Slide Previews */}
                  {[1, 2, 3, 4].map((slide) => (
                    <div key={slide} className="p-4 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg text-white">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{slide}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="mb-2 text-white">
                            {slide === 1 && '深度学习简介'}
                            {slide === 2 && '什么是深度学习'}
                            {slide === 3 && '深度学习的应用'}
                            {slide === 4 && '神经网络基础'}
                          </h5>
                          <p className="text-sm opacity-90">
                            {slide === 1 && '课程概述与学习目标'}
                            {slide === 2 && '定义、发展历程、核心概念'}
                            {slide === 3 && '计算机视觉、NLP、推荐系统'}
                            {slide === 4 && '感知机、激活函数、反向传播'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {hasGenerated && (
                <div className="mt-4 p-4 bg-[#F3F0FF] rounded-lg border border-[#845EF7]/20">
                  <p className="text-sm text-[#212529]">
                    <strong>已生成 12 页 PPT</strong>
                  </p>
                  <p className="text-xs text-[#ADB5BD] mt-1">
                    包含封面、目录、内容页和总结页
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Tips */}
        <Card className="p-6 mt-8">
          <h4 className="mb-4">使用技巧</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#4C6EF5] rounded-full flex items-center justify-center text-white text-xs">1</div>
                <h5>清晰的结构</h5>
              </div>
              <p className="text-sm text-[#ADB5BD]">使用明确的标题层级，如一级标题、二级标题等</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#845EF7] rounded-full flex items-center justify-center text-white text-xs">2</div>
                <h5>要点分明</h5>
              </div>
              <p className="text-sm text-[#ADB5BD]">每个章节包含清晰的知识要点和关键概念</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-[#51CF66] rounded-full flex items-center justify-center text-white text-xs">3</div>
                <h5>简洁语言</h5>
              </div>
              <p className="text-sm text-[#ADB5BD]">避免冗长句子，AI 会自动提炼核心内容</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
