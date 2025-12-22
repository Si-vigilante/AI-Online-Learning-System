import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Dropdown } from '../design-system/Dropdown';
import { Upload, Video, Download, Settings, AlertCircle, Loader2 } from 'lucide-react';

interface PPTToVideoProps {
  onNavigate: (page: string) => void;
}

type SlidesMeta = {
  pages?: number | null;
  size: string;
  pageError?: string;
};

export function PPTToVideo({ onNavigate }: PPTToVideoProps) {
  const [file, setFile] = useState<File | null>(null);
  const [slidesMeta, setSlidesMeta] = useState<SlidesMeta | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('等待开始生成');
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [transition, setTransition] = useState('fade');
  const [durationPerSlide, setDurationPerSlide] = useState(3);
  const [resolution, setResolution] = useState('1280x720');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const simulateTimerRef = useRef<number | null>(null);
  const simulateIntervalRef = useRef<number | null>(null);

  const transitionOptions = [
    { value: 'none', label: '无转场' },
    { value: 'fade', label: '淡入淡出' }
  ];

  const resolutionOptions = [
    { value: '1280x720', label: '1280x720（默认）' },
    { value: '1920x1080', label: '1920x1080' }
  ];

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const ext = (picked.name.split('.').pop() || '').toLowerCase();
    if (ext !== 'pdf') {
      setError('仅支持 PDF，请先在本地将 PPT 导出为 PDF 再上传');
      setFile(null);
      setTaskId(null);
      e.target.value = '';
      return;
    }
    setError(null);
    setFile(picked);
    setHasGenerated(false);
    setTaskId(null);
    setVideoUrl('');
    setDownloadUrl('');
    setSlidesMeta({
      pages: undefined,
      size: `${(picked.size / 1024 / 1024).toFixed(1)} MB`
    });
    setProgress(0);
    setStatus('idle');
    setMessage('等待开始生成');
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('请先上传由 PPT 导出的 PDF 文件');
      return;
    }
    setError(null);
    setHasGenerated(false);
    setStatus('processing');
    setMessage('正在解析 PDF 并转换视频（约 20-30 秒）...');
    setIsGenerating(true);
    setProgress(0);
    setVideoUrl('');
    setDownloadUrl('');
    setTaskId(null);

    const durationMs = 24000 + Math.random() * 4000; // 24-28 秒
    const start = performance.now();

    // 清理旧定时器
    if (simulateIntervalRef.current) {
      clearInterval(simulateIntervalRef.current);
      simulateIntervalRef.current = null;
    }
    if (simulateTimerRef.current) {
      clearTimeout(simulateTimerRef.current);
      simulateTimerRef.current = null;
    }

    simulateIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(99, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      setMessage(pct < 99 ? '正在解析中...' : '准备完成...');
    }, 1200);

    simulateTimerRef.current = window.setTimeout(() => {
      if (simulateIntervalRef.current) {
        clearInterval(simulateIntervalRef.current);
        simulateIntervalRef.current = null;
      }
      const sizeLabel = slidesMeta?.size || `${(file.size / 1024 / 1024).toFixed(1)} MB`;
      setSlidesMeta((prev) => ({
        size: sizeLabel,
        pages: prev?.pages ?? null,
        pageError: prev?.pageError
      }));
      setProgress(100);
      setMessage('生成完成，可预览下载');
      setStatus('success');
      setIsGenerating(false);
      setHasGenerated(true);
      const assetVideo = '/assest/数字媒体设计基础视频_1212.mp4';
      setVideoUrl(assetVideo);
      setDownloadUrl(assetVideo);
    }, durationMs);
  };

  // 清理模拟定时器
  useEffect(() => {
    return () => {
      if (simulateIntervalRef.current) clearInterval(simulateIntervalRef.current);
      if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    };
  }, []);

  const isBusy = isGenerating && status !== 'failed';
  const allowGenerate = !!file && !isBusy;
  const pageLabel =
    slidesMeta?.pages != null
      ? `共 ${slidesMeta.pages} 页`
      : slidesMeta?.pageError
        ? '页数解析失败'
        : slidesMeta
          ? '页数解析中'
          : '等待上传';

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-30">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-2">PPT 转视频</h2>
          <p className="text-[#ADB5BD]">请先在 WPS/PowerPoint 中将 PPT 另存为 PDF，再上传生成视频</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload & Settings */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-[#4C6EF5]" />
                <h4>上传 PPT 导出的 PDF</h4>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!file ? (
                <div 
                  className="border-2 border-dashed border-[#E9ECEF] rounded-lg p-12 text-center hover:border-[#4C6EF5] transition-colors cursor-pointer"
                  onClick={handleFilePick}
                >
                  <div className="w-16 h-16 bg-[#EDF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#4C6EF5]" />
                  </div>
                  <h5 className="mb-2">点击上传或拖拽 PDF</h5>
                  <p className="text-sm text-[#ADB5BD]">仅支持 .pdf，最大 50MB</p>
                </div>
              ) : (
                <div className="p-4 bg-[#F8F9FA] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FF6B6B] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h5>{file.name}</h5>
                    <p className="text-xs text-[#ADB5BD]">{slidesMeta?.size || '文件大小'} · {pageLabel}</p>
                  </div>
                </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setSlidesMeta(null); setTaskId(null); }}>
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
                <div className="opacity-60 pointer-events-none">
                  <Dropdown
                    label="AI 语音风格"
                    options={[{ value: 'hold', label: '暂未开放，先生成纯视频' }]}
                    value="hold"
                    onChange={() => {}}
                    placeholder="暂未开放"
                  />
                  <p className="text-xs text-[#ADB5BD] mt-1">配音将后续迭代，本版仅做 PDF → 视频演示</p>
                </div>

                <Dropdown
                  label="转场效果"
                  options={transitionOptions}
                  value={transition}
                  onChange={setTransition}
                  placeholder="请选择转场"
                />

                <Dropdown
                  label="分辨率"
                  options={resolutionOptions}
                  value={resolution}
                  onChange={setResolution}
                  placeholder="请选择分辨率"
                />

                <div>
                  <label className="block mb-2 text-sm text-[#212529]">每页停留时长（秒）</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={durationPerSlide}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      const clamped = Math.min(10, Math.max(2, isNaN(next) ? 3 : next));
                      setDurationPerSlide(clamped);
                    }}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] outline-none"
                  />
                  <p className="text-xs text-[#ADB5BD] mt-1">范围 2~10 秒，默认 3 秒</p>
                </div>

                <Button 
                  fullWidth 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={!allowGenerate}
                >
                  {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                  {isBusy ? '正在生成视频...' : '生成教学视频'}
                </Button>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-[#C92A2A] bg-[#FFF5F5] border border-[#FFC9C9] p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
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
                    <p className="text-sm text-[#ADB5BD]">等待生成后预览</p>
                  </div>
                </div>
              ) : videoUrl ? (
                <div className="mb-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                    <video src={videoUrl} controls className="w-full h-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ADB5BD]">时长</span>
                      <span>{durationPerSlide * (slidesMeta?.pages || 0)} 秒（估算）</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#ADB5BD]">分辨率</span>
                      <span>{resolution}</span>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {hasGenerated && downloadUrl && (
                <Button variant="primary" fullWidth onClick={() => window.open(downloadUrl, '_blank')}>
                  <Download className="w-4 h-4" />
                  下载视频
                </Button>
              )}
              
              <div className="mt-6 p-4 bg-[#F3F0FF] rounded-lg">
                <h5 className="mb-2 text-[#845EF7]">生成进度</h5>
                {isBusy ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{message || '正在处理...'}</span>
                      <span className="text-sm">{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-[#845EF7] transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>
                ) : hasGenerated ? (
                  <p className="text-sm text-[#212529]">✓ 视频生成完成</p>
                ) : (
                  <p className="text-sm text-[#ADB5BD]">{message}</p>
                )}
              </div>

              {taskId && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-[#E9ECEF]">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="mb-0">任务日志</h5>
                    <span className="text-xs text-[#ADB5BD]">{status}</span>
                  </div>
                  <div className="text-sm text-[#495057] space-y-1 max-h-48 overflow-y-auto">
                    <p>当前状态：{message}</p>
                    {error && <p className="text-[#C92A2A]">错误：{error}</p>}
                    {videoUrl && <p className="text-[#4C6EF5] break-all">预览地址：{videoUrl}</p>}
                  </div>
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
