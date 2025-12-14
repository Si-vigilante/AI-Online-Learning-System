import React, { useMemo, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { FileText, Sparkles, Download, Eye, Layout, Image as ImageIcon, Wand2, Palette } from 'lucide-react';

interface TextToPPTProps {
  onNavigate: (page: string) => void;
}

export function TextToPPT({ onNavigate }: TextToPPTProps) {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [template, setTemplate] = useState<'modern' | 'academic' | 'vibrant'>('modern');
  const [slideCount, setSlideCount] = useState(0);
  const [matchImages, setMatchImages] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  type Slide = {
    title: string;
    bullets: string[];
    cover?: boolean;
  };

  const parseTextToSlides = (text: string): Slide[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const result: Slide[] = [];
    let current: Slide | null = null;

    lines.forEach((line) => {
      const headingMatch = line.match(/^(\d+(\.\d+)*)[\\.|、]\\s*(.+)$/);
      if (headingMatch) {
        if (current) result.push(current);
        current = { title: headingMatch[3], bullets: [] };
      } else if (/^第.*章|^第.*节|^Chapter/i.test(line)) {
        if (current) result.push(current);
        current = { title: line.replace(/[:：]/g, ''), bullets: [] };
      } else if (current) {
        current.bullets.push(line);
      } else {
        current = { title: line, bullets: [] };
      }
    });
    if (current) result.push(current);

    if (result.length) {
      result.unshift({
        title: '课程封面',
        bullets: ['课程名称', '讲师信息', '时间 / 场景'],
        cover: true
      });
      result.push({
        title: '总结与行动项',
        bullets: ['本节要点回顾', '下一步学习建议', '思考题']
      });
    }
    return result.slice(0, 25); // 避免过长
  };
  
  const handleGenerate = () => {
    setIsGenerating(true);
    const parsed = parseTextToSlides(inputText);
    setSlides(parsed);
    setSlideCount(parsed.length);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 1200);
  };

  const handleDownload = async () => {
    if (!slides.length) return;
    setIsDownloading(true);
    try {
      const pptxModule = await import('pptxgenjs');
      const PptxGenJS = pptxModule.default;
      const pptx = new PptxGenJS();

      slides.forEach((slide, idx) => {
        const s = pptx.addSlide();
        s.background = { color: 'F8F9FA' };

        s.addText(`${idx + 1}. ${slide.title}`, {
          x: 0.5, y: 0.5, fontSize: slide.cover ? 30 : 24, bold: true, color: '2F3E9E'
        });

        const bullets = slide.bullets.length ? slide.bullets : ['待补充内容'];
        s.addText(
          bullets.map((b) => `• ${b}`).join('\n'),
          { x: 0.6, y: 1.2, fontSize: 16, color: '374151', bullet: { type: 'bullet' }, lineSpacing: 18 }
        );

        if (matchImages) {
          s.addShape(pptx.ShapeType.rect, {
            x: 8, y: 1, w: 2, h: 2,
            fill: { color: 'E9ECEF' },
            line: { color: 'D0D7DE' }
          });
          s.addText('AI 配图', { x: 8.3, y: 1.8, fontSize: 14, color: '6B7280' });
        }
      });

      await pptx.writeFile(`AI课件-${new Date().toISOString().slice(0,10)}.pptx`);
    } catch (err) {
      console.error('PPT 生成失败', err);
      alert('生成 PPT 失败，请重试或检查浏览器下载权限');
    } finally {
      setIsDownloading(false);
    }
  };

  const colorByTemplate = useMemo(() => {
    if (template === 'academic') return { from: '#0B7285', to: '#364FC7' };
    if (template === 'vibrant') return { from: '#F76707', to: '#F03E3E' };
    return { from: '#4C6EF5', to: '#845EF7' };
  }, [template]);
  
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
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={matchImages}
                      onChange={(e) => setMatchImages(e.target.checked)}
                    />
                    自动匹配配图
                  </label>
                  <p className="text-xs text-[#ADB5BD] mt-1">将为每页选择主题插图与重点标注</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
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
                  <Button variant="secondary" size="sm" onClick={handleDownload} disabled={isDownloading}>
                    <Download className="w-4 h-4" />
                    {isDownloading ? '生成中…' : '下载 PPT'}
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
                  {slides.map((slide, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${colorByTemplate.from}, ${colorByTemplate.to})` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{idx + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {slide.cover ? <Layout className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                            <h5 className="mb-0 text-white">{slide.title}</h5>
                          </div>
                          <ul className="text-sm opacity-90 space-y-1">
                            {slide.bullets.slice(0, 4).map((b, i) => (
                              <li key={i}>• {b}</li>
                            ))}
                            {slide.bullets.length > 4 && <li>…</li>}
                          </ul>
                        </div>
                        {matchImages && (
                          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {hasGenerated && (
                <div className="mt-4 p-4 bg-[#F3F0FF] rounded-lg border border-[#845EF7]/20">
                  <p className="text-sm text-[#212529]">
                    <strong>已生成 {slideCount || slides.length} 页 PPT</strong>
                  </p>
                  <p className="text-xs text-[#ADB5BD] mt-1">
                    包含封面、目录、内容页和总结页（已自动配图与重点标注）
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
