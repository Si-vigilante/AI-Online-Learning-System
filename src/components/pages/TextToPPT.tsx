import React, { useMemo, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Download, Eye, Palette } from 'lucide-react';

interface TextToPPTProps {
  onNavigate: (page: string) => void;
}

export function TextToPPT({ onNavigate }: TextToPPTProps) {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [template, setTemplate] = useState<'modern' | 'academic' | 'vibrant'>('modern');
  const [audience, setAudience] = useState('');
  const [duration, setDuration] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const colorByTemplate = useMemo(() => {
    if (template === 'academic') return { from: '#0B7285', to: '#364FC7' };
    if (template === 'vibrant') return { from: '#F76707', to: '#F03E3E' };
    return { from: '#4C6EF5', to: '#845EF7' };
  }, [template]);

  const mapTemplateToStyle = (tpl: string) => {
    if (tpl === 'modern') return 'modern';
    return 'simple';
  };

  const handleGenerateAndDownload = async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const resp = await fetch(`${apiBase}/api/ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          audience,
          duration,
          style: mapTemplateToStyle(template)
        })
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData?.error || errData?.detail || '生成 PPT 失败');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI课件-${new Date().toISOString().slice(0, 10)}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setHasDownloaded(true);
    } catch (err: any) {
      setErrorMsg(err?.message || '生成 PPT 失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-2">文本转 PPT</h2>
          <p className="text-[#ADB5BD]">一键生成结构化教学课件（DeepSeek-V3.2 + pptxgenjs）</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <label className="text-sm text-[#495057] mb-1 block">受众 / 场景</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#4C6EF5]"
                    placeholder="如：大一新生 / 工作坊"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <label className="text-sm text-[#495057] mb-1 block">时长 / 节数</label>
                  <input
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#4C6EF5]"
                    placeholder="如：30 分钟 / 2 学时"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-[#4C6EF5]" />
                    <span className="text-sm">模板风格</span>
                  </div>
                  <select
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#4C6EF5]"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                  >
                    <option value="modern">现代蓝紫</option>
                    <option value="academic">学术蓝绿</option>
                    <option value="vibrant">活力橙红</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleGenerateAndDownload}
                  disabled={!inputText || isGenerating}
                >
                  <Sparkles className="w-5 h-5" />
                  {isGenerating ? '正在生成中...' : '生成并下载 PPT'}
                </Button>
                {errorMsg && (
                  <div className="p-3 bg-[#FFF0F6] border border-[#FA5252] text-[#C92A2A] rounded-lg text-sm">
                    {errorMsg}
                  </div>
                )}
                
                <div className="p-4 bg-[#EDF2FF] rounded-lg border border-[#4C6EF5]/20">
                  <h5 className="mb-2 text-[#4C6EF5]">AI 生成特性：</h5>
                  <ul className="text-sm text-[#212529] space-y-1">
                    <li>• 调用 DeepSeek-V3.2 生成幻灯片 JSON 结构</li>
                    <li>• pptxgenjs 生成 16:9 真正 PPTX 文件</li>
                    <li>• 封面 + 内容页，备注写入 speaker notes</li>
                    <li>• 一键下载，无需手动保存草稿</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Info Section */}
          <div>
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#845EF7]" />
                  <h4>生成说明</h4>
                </div>
                {hasDownloaded && (
                  <div className="text-xs text-[#51CF66] flex items-center gap-1">
                    <Download className="w-4 h-4" /> 已生成并下载
                  </div>
                )}
              </div>
              
              <div className="space-y-3 text-sm text-[#495057]">
                <div
                  className="p-4 rounded-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${colorByTemplate.from}, ${colorByTemplate.to})` }}
                >
                  <p className="text-base font-semibold mb-1">流程</p>
                  <p className="opacity-90">
                    前端将文本、受众、时长、风格发送到 <code>/api/ppt</code>，后端用 DeepSeek-V3.2 生成 JSON 幻灯片结构，再用 pptxgenjs 生成 PPTX 并直接返回二进制供下载。
                  </p>
                </div>
                <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                  <p className="font-medium mb-1">建议</p>
                  <p className="text-sm text-[#6C757D]">
                    输入时尽量提供清晰的章节与要点，注明受众和时长，便于 AI 生成合适页数与讲稿备注。
                  </p>
                </div>
              </div>
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
