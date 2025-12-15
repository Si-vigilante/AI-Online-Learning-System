import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import {
  FileText,
  Sparkles,
  Download,
  Eye,
  Palette,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ListTree,
  Loader2
} from 'lucide-react';

interface TextToPPTProps {
  onNavigate: (page: string) => void;
}

type OutlineSlide = {
  type?: string;
  title: string;
  bullets?: string[];
  speakerNotes?: string;
  imagePrompt?: string;
};

type PPTOutline = {
  title?: string;
  subtitle?: string;
  slides: OutlineSlide[];
};

export function TextToPPT({ onNavigate }: TextToPPTProps) {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  const [inputText, setInputText] = useState('');
  const [audience, setAudience] = useState('');
  const [duration, setDuration] = useState('');
  const [template, setTemplate] = useState<'modern' | 'academic' | 'vibrant'>('modern');
  const [minPages, setMinPages] = useState<string>('');
  const [maxPages, setMaxPages] = useState<string>('');
  const [rangeError, setRangeError] = useState('');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [outline, setOutline] = useState<PPTOutline | null>(null);
  const [expandedSlides, setExpandedSlides] = useState<Set<number>>(new Set());
  const [previewError, setPreviewError] = useState('');
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const colorByTemplate = useMemo(() => {
    if (template === 'academic') return { from: '#0B7285', to: '#364FC7' };
    if (template === 'vibrant') return { from: '#F76707', to: '#F03E3E' };
    return { from: '#4C6EF5', to: '#845EF7' };
  }, [template]);

  const mapTemplateToStyle = (tpl: 'modern' | 'academic' | 'vibrant') => tpl;

  const validateRange = (minStr: string, maxStr: string) => {
    if (!minStr && !maxStr) {
      setRangeError('');
      return;
    }
    const min = Number(minStr);
    const max = Number(maxStr);
    if (!minStr || !maxStr || Number.isNaN(min) || Number.isNaN(max)) {
      setRangeError('请输入完整的页数区间');
      return;
    }
    if (min < 3 || max > 30 || min > max) {
      setRangeError('页数区间需满足 3 ≤ min ≤ max ≤ 30');
      return;
    }
    setRangeError('');
  };

  const getPageRangePayload = () => {
    if (!minPages || !maxPages) return undefined;
    const min = Number(minPages);
    const max = Number(maxPages);
    if (Number.isNaN(min) || Number.isNaN(max)) return undefined;
    return { min, max };
  };

  const getFallbackCourseName = () => {
    const firstLine = inputText.split('\n').map((l) => l.trim()).find((l) => l) || 'AI课件';
    return firstLine.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || 'AI课件';
  };

  useEffect(() => {
    if (outline && previewRef.current) {
      previewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [outline]);

  const toggleSlide = (idx: number) => {
    setExpandedSlides((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleGenerateOutline = async () => {
    if (!inputText.trim() || rangeError) return;
    setIsGeneratingOutline(true);
    setPreviewError('');
    setHasDownloaded(false);
    try {
      const pageRange = getPageRangePayload();
      const resp = await fetch(`${apiBase}/api/ppt/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          audience,
          duration,
          style: mapTemplateToStyle(template),
          pageRange
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error('生成大纲失败', data?.detail || data);
        throw new Error(data?.error || '生成 PPT 大纲失败');
      }
      if (!data?.outline) {
        throw new Error('未获取到 PPT 大纲');
      }
      setOutline(data.outline);
      setExpandedSlides(new Set([0]));
    } catch (err: any) {
      setPreviewError(err?.message || '生成 PPT 大纲失败');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleBuildPPT = async () => {
    if (!outline) {
      setPreviewError('请先生成大纲');
      return;
    }
    setIsBuilding(true);
    setPreviewError('');
    try {
      const resp = await fetch(`${apiBase}/api/ppt/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline,
          courseName: outline.title || getFallbackCourseName(),
          style: mapTemplateToStyle(template),
          filenameHint: outline.title
        })
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error('生成 PPT 失败', errData?.detail || errData);
        throw new Error(errData?.error || '生成 PPT 失败');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const disposition = resp.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fallbackName = () => {
        const clean = (outline.title || getFallbackCourseName()).replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `AI课件_${clean || '课程'}_${mm}${dd}.pptx`;
      };
      const filename = match ? match[1] : fallbackName();
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setHasDownloaded(true);
    } catch (err: any) {
      setPreviewError(err?.message || '生成 PPT 失败');
    } finally {
      setIsBuilding(false);
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
          <div className="h-4 w-1/2 bg-[#E9ECEF] rounded mb-3" />
          <div className="space-y-2">
            <div className="h-3 w-5/6 bg-[#E9ECEF] rounded" />
            <div className="h-3 w-4/6 bg-[#E9ECEF] rounded" />
            <div className="h-3 w-3/6 bg-[#E9ECEF] rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderOutline = () => {
    if (!outline) return null;
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-[#E9ECEF] bg-white p-4 shadow-sm">
          <p className="text-sm text-[#845EF7] font-semibold mb-1">PPT 大纲预览</p>
          <p className="text-lg font-semibold text-[#212529]">{outline.title || 'AI 生成课件'}</p>
          {outline.subtitle && <p className="text-sm text-[#6C757D] mt-1">{outline.subtitle}</p>}
        </div>
        {outline.slides.map((sl, idx) => {
          const expanded = expandedSlides.has(idx);
          return (
            <div key={`${sl.title}-${idx}`} className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F1F3F5] text-[#845EF7] flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[#212529]">{sl.title || `第 ${idx + 1} 页`}</p>
                    {sl.type && <p className="text-xs text-[#ADB5BD] capitalize">{sl.type}</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2"
                  onClick={() => toggleSlide(idx)}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expanded ? '收起' : '展开'}
                </Button>
              </div>
              {expanded && (
                <div className="mt-3 space-y-2">
                  <ul className="pl-5 list-disc text-sm text-[#495057] space-y-1">
                    {(sl.bullets && sl.bullets.length > 0 ? sl.bullets : ['核心概念', '典型应用/例题']).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  {sl.speakerNotes && (
                    <div className="mt-2 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] p-3 text-xs text-[#6C757D]">
                      <p className="font-medium text-[#495057] mb-1">讲稿备注</p>
                      <p>{sl.speakerNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-2">文本转 PPT</h2>
          <p className="text-[#ADB5BD]">一键生成结构化教学课件（DeepSeek-V3.2 + pptxgenjs），先预览再下载</p>
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
                <div className="p-4 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[#495057]">PPT 页数（区间）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#4C6EF5]"
                      placeholder="如：6"
                      value={minPages}
                      onChange={(e) => {
                        setMinPages(e.target.value);
                        validateRange(e.target.value, maxPages);
                      }}
                      type="number"
                      min={3}
                      max={30}
                    />
                    <span className="text-sm text-[#ADB5BD]">~</span>
                    <input
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:border-[#4C6EF5]"
                      placeholder="如：8"
                      value={maxPages}
                      onChange={(e) => {
                        setMaxPages(e.target.value);
                        validateRange(minPages, e.target.value);
                      }}
                      type="number"
                      min={3}
                      max={30}
                    />
                  </div>
                  <p className="text-xs text-[#ADB5BD] mt-1">可选，范围 3~30，建议 6~12</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleGenerateOutline}
                  disabled={!inputText || isGeneratingOutline || isBuilding || Boolean(rangeError)}
                >
                  {isGeneratingOutline ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGeneratingOutline ? '生成大纲中...' : '生成大纲'}
                </Button>
                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  onClick={handleBuildPPT}
                  disabled={!outline || isGeneratingOutline || isBuilding}
                >
                  {isBuilding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isBuilding ? '正在生成 PPT...' : '生成并下载 PPT'}
                </Button>
                {rangeError && (
                  <div className="p-3 bg-[#FFF0F6] border border-[#FA5252] text-[#C92A2A] rounded-lg text-sm">
                    {rangeError}
                  </div>
                )}
                <div className="p-4 bg-[#EDF2FF] rounded-lg border border-[#4C6EF5]/20">
                  <h5 className="mb-2 text-[#4C6EF5]">AI 生成特性：</h5>
                  <ul className="text-sm text-[#212529] space-y-1">
                    <li>• DeepSeek-V3.2 生成幻灯片大纲（JSON），extra_body.enable_thinking=false</li>
                    <li>• pptxgenjs 本地生成 16:9 PPTX，避免重复扣费</li>
                    <li>• 先预览大纲，再点击下载，文件名自动包含日期</li>
                    <li>• 去重/清洗 bullets，避免标题与正文重复</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Preview Section */}
          <div className="space-y-4">
            <Card className="p-6 h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-[#845EF7]" />
                  <div>
                    <h4>生成预览</h4>
                    <p className="text-xs text-[#ADB5BD]">先看 PPT 大纲，再生成可下载的 PPTX</p>
                  </div>
                </div>
                {outline && (
                  <div className="text-xs text-[#51CF66] flex items-center gap-1">
                    <ListTree className="w-4 h-4" /> 已生成大纲
                  </div>
                )}
                {hasDownloaded && (
                  <div className="text-xs text-[#51CF66] flex items-center gap-1 ml-3">
                    <Download className="w-4 h-4" /> 已下载
                  </div>
                )}
              </div>

              <div
                ref={previewRef}
                className="mt-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-xl p-4 max-h-[640px] overflow-y-auto"
              >
                {previewError && (
                  <div className="p-4 mb-3 bg-[#FFF0F6] border border-[#FA5252] text-[#C92A2A] rounded-lg text-sm flex gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{previewError}</span>
                  </div>
                )}
                {isGeneratingOutline ? (
                  renderSkeleton()
                ) : outline ? (
                  renderOutline()
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-[#ADB5BD] gap-2">
                    <ListTree className="w-10 h-10 text-[#CED4DA]" />
                    <p className="text-sm">请先在左侧输入教案，点击【生成大纲】</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-[#845EF7]" />
                <h5 className="text-[#212529]">生成说明与建议</h5>
              </div>
              <div
                className="p-4 rounded-lg text-white"
                style={{ background: `linear-gradient(135deg, ${colorByTemplate.from}, ${colorByTemplate.to})` }}
              >
                <p className="text-base font-semibold mb-1">流程</p>
                <p className="opacity-90 text-sm">
                  前端先调用 <code>/api/ppt/outline</code> 获取 JSON 大纲并在右侧预览，确认后调用 <code>/api/ppt/build</code> 使用 pptxgenjs 生成 16:9 PPTX 并返回二进制下载（无二次模型扣费）。
                </p>
              </div>
              <div className="p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] mt-3">
                <p className="font-medium mb-1">建议</p>
                <p className="text-sm text-[#6C757D]">
                  输入时尽量提供清晰的章节与要点，并注明受众、时长与页数区间（如 6~8 页）；大纲会自动去重/清洗 bullets，避免标题与正文重复。
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
