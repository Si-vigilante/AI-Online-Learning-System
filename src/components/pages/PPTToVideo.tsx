import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Dropdown } from '../design-system/Dropdown';
import { Upload, Video, Download, Play, Settings } from 'lucide-react';

interface PPTToVideoProps {
  onNavigate: (page: string) => void;
}

export function PPTToVideo({ onNavigate }: PPTToVideoProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [slidesMeta, setSlidesMeta] = useState<{ pages: number; size: string } | null>(null);
  const [voiceStyle, setVoiceStyle] = useState('');
  const [animationStyle, setAnimationStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [script, setScript] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const voiceOptions = [
    { value: 'male-standard', label: '男声 - 标准' },
    { value: 'male-warm', label: '男声 - 温和' },
    { value: 'female-standard', label: '女声 - 标准' },
    { value: 'female-sweet', label: '女声 - 甜美' }
  ];
  
  const animationOptions = [
    { value: 'simple', label: '简洁切换' },
    { value: 'smooth', label: '流畅过渡' },
    { value: 'dynamic', label: '动态特效' },
    { value: 'professional', label: '专业演示' }
  ];
  
  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file.name);
    setSlidesMeta({ pages: Math.max(8, Math.min(30, Math.round(file.size / 150000))), size: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
    setScript([
      '欢迎来到本节课程，我们将快速回顾核心概念。',
      '在第一部分，我们讨论神经网络的基本结构。',
      '接着解析反向传播如何更新权重。',
      '最后给出实践建议与下一步行动项。'
    ]);
    setHasGenerated(false);
    setProgress(0);
  };
  
  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(10);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsGenerating(false);
          setHasGenerated(true);
          return 100;
        }
        return prev + Math.random() * 18;
      });
    }, 600);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-2">PPT 转视频</h2>
          <p className="text-[#ADB5BD]">AI 自动生成专业教学视频</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload & Settings */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-[#4C6EF5]" />
                <h4>上传 PPT 文件</h4>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".ppt,.pptx"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!uploadedFile ? (
                <div 
                  className="border-2 border-dashed border-[#E9ECEF] rounded-lg p-12 text-center hover:border-[#4C6EF5] transition-colors cursor-pointer"
                  onClick={handleFilePick}
                >
                  <div className="w-16 h-16 bg-[#EDF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#4C6EF5]" />
                  </div>
                  <h5 className="mb-2">点击上传或拖拽文件</h5>
                  <p className="text-sm text-[#ADB5BD]">支持 .pptx, .ppt 格式，最大 50MB</p>
                </div>
              ) : (
                <div className="p-4 bg-[#F8F9FA] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FF6B6B] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h5>{uploadedFile}</h5>
                      <p className="text-xs text-[#ADB5BD]">{slidesMeta?.size || '文件大小'} · {slidesMeta?.pages || 0} 页</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setUploadedFile(null); setSlidesMeta(null); }}>
                    重新上传
                  </Button>
                </div>
              )}
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-[#845EF7]" />
                <h4>生成设置</h4>
              </div>
              
              <div className="space-y-4">
                <Dropdown
                  label="AI 语音风格"
                  options={voiceOptions}
                  value={voiceStyle}
                  onChange={setVoiceStyle}
                  placeholder="请选择语音风格"
                />
                
                <Dropdown
                  label="动画风格"
                  options={animationOptions}
                  value={animationStyle}
                  onChange={setAnimationStyle}
                  placeholder="请选择动画风格"
                />
                
                <div className="p-4 bg-[#EDF2FF] rounded-lg border border-[#4C6EF5]/20">
                  <h5 className="mb-2 text-[#4C6EF5]">智能功能：</h5>
                  <ul className="text-sm text-[#212529] space-y-1">
                    <li>• AI 自动生成讲解文稿</li>
                    <li>• 智能匹配语速与停顿</li>
                    <li>• 自动添加背景音乐</li>
                    <li>• 支持多语言配音</li>
                  </ul>
                </div>
                
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={!uploadedFile || !voiceStyle || !animationStyle || isGenerating}
                >
                  <Video className="w-5 h-5" />
                  {isGenerating ? '正在生成视频...' : '生成教学视频'}
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Preview */}
          <div>
            <Card className="p-6">
              <h4 className="mb-4">视频预览</h4>
              
              {!hasGenerated ? (
                <div className="aspect-video bg-[#F8F9FA] rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#E9ECEF] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="w-8 h-8 text-[#ADB5BD]" />
                    </div>
                    <p className="text-sm text-[#ADB5BD]">视频预览</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="aspect-video bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <Button size="lg">
                      <Play className="w-6 h-6" />
                      播放预览
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ADB5BD]">时长</span>
                      <span>8:32</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ADB5BD]">分辨率</span>
                      <span>1920x1080</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ADB5BD]">文件大小</span>
                      <span>45.6 MB</span>
                    </div>
                  </div>
                </div>
              )}
              
              {hasGenerated && (
                <Button variant="primary" fullWidth>
                  <Download className="w-4 h-4" />
                  下载视频
                </Button>
              )}
              
              <div className="mt-6 p-4 bg-[#F3F0FF] rounded-lg">
                <h5 className="mb-2 text-[#845EF7]">生成进度</h5>
                {isGenerating ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">正在处理...</span>
                      <span className="text-sm">{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-[#845EF7] transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>
                ) : hasGenerated ? (
                  <p className="text-sm text-[#212529]">✓ 视频生成完成</p>
                ) : (
                  <p className="text-sm text-[#ADB5BD]">等待开始生成</p>
                )}
              </div>

              {uploadedFile && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-[#E9ECEF]">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="mb-0">AI 讲解脚本</h5>
                    <span className="text-xs text-[#ADB5BD]">字幕已同步</span>
                  </div>
                  <ul className="text-sm text-[#495057] space-y-2 max-h-48 overflow-y-auto">
                    {script.map((line, idx) => (
                      <li key={idx}>• {line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileText(props: any) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>;
}
