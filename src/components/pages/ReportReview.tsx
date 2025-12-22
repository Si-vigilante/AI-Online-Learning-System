import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { FileText, Sparkles, TrendingUp, AlertCircle, CheckCircle, Lightbulb, Upload, Download } from 'lucide-react';
import { UserProfile } from '../../services/auth';
import { reportExemplar } from '../../assets/reportExemplar';

interface ReportReviewProps {
  onNavigate: (page: string) => void;
  currentUser?: UserProfile | null;
}

export function ReportReview({ onNavigate, currentUser }: ReportReviewProps) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [uploadedReport, setUploadedReport] = useState<{ name: string; size: string; type: string } | null>(null);
  const [analysisReady, setAnalysisReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const aiReview = {
    overallScore: 88,
    dimensions: {
      structure: 92,
      content: 85,
      language: 87,
      innovation: 84
    },
    strengths: [
      '论文结构清晰，章节划分合理',
      '研究方法科学严谨，数据分析充分',
      '语言表达流畅，专业术语使用准确',
      '图表使用恰当，辅助说明效果好'
    ],
    improvements: [
      {
        type: 'structure',
        issue: '摘要部分可以更加精炼',
        suggestion: '建议将摘要控制在 200-300 字之间，突出核心发现'
      },
      {
        type: 'content',
        issue: '文献综述部分略显薄弱',
        suggestion: '建议增加 5-8 篇近三年的相关研究文献，加强理论支撑'
      },
      {
        type: 'language',
        issue: '部分句子过长，影响阅读',
        suggestion: '建议将复杂句子拆分，提高可读性。例如第 3 页第 2 段'
      }
    ]
  };
  
  const extractKeyPhrases = (text: string) =>
    text
      .split(/[\n\r，。、“”‘’？?！!；;：:、,.]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 6);

  const calcSimilarity = (a: string, b: string) => {
    const bag = (text: string) =>
      text
        .replace(/[^\u4e00-\u9fa5A-Za-z0-9]+/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);
    const setA = new Set(bag(a));
    const setB = new Set(bag(b));
    const intersect = Array.from(setA).filter((t) => setB.has(t)).length;
    const union = setA.size + setB.size - intersect || 1;
    return Math.round((intersect / union) * 100);
  };

  const exemplarPhrases = useMemo(() => extractKeyPhrases(reportExemplar.rawText), []);
  const [myReportText, setMyReportText] = useState('');
  const [diffResult, setDiffResult] = useState(() => ({
    similarity: 0,
    coverage: 0,
    missing: exemplarPhrases.slice(0, 4)
  }));

  useEffect(() => {
    const studentPhrases = extractKeyPhrases(myReportText || '');
    const missing = exemplarPhrases.filter((p) => !studentPhrases.includes(p)).slice(0, 6);
    const coverage = exemplarPhrases.length
      ? Math.round(((exemplarPhrases.length - missing.length) / exemplarPhrases.length) * 100)
      : 0;
    setDiffResult({
      similarity: calcSimilarity(myReportText || '', reportExemplar.rawText),
      coverage,
      missing
    });
  }, [myReportText, exemplarPhrases]);
  
  const tabs = [
    { key: 'overview', label: '总体评价', icon: <FileText className="w-4 h-4" /> },
    { key: 'detailed', label: '详细分析', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'examples', label: '优秀示例', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    setUploadedReport({ name: file.name, size, type: file.type || '未知' });
    setAnalysisReady(true);
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#845EF7] to-[#BE4BDB] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">AI 报告批改</h1>
          <p className="text-lg opacity-90">深度学习期中报告 - 智能评估结果</p>
          <p className="text-sm opacity-80 mt-3">
            当前身份：{currentUser?.role === 'teacher' ? '教师' : currentUser?.role === 'assistant' ? 'AI 助教' : '学生/访客'}
            {currentUser?.name ? `（${currentUser.name}）` : ''}
          </p>
        </div>
        </div>
        
        <div className="container-custom py-8">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="mb-1">报告在线提交</h4>
              <p className="text-sm text-[#ADB5BD]">支持 Word / PDF / Markdown，上传后自动触发 AI 批改</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleFilePick}>
                <Upload className="w-4 h-4" />
                上传报告
              </Button>
              {analysisReady && (
                <Button variant="primary" onClick={() => setActiveTab('overview')}>
                  重新分析
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.md,.markdown"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {uploadedReport ? (
            <div className="mt-4 p-4 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{uploadedReport.name}</p>
                <p className="text-xs text-[#ADB5BD]">大小：{uploadedReport.size} · 类型：{uploadedReport.type}</p>
              </div>
              <span className="text-xs text-[#51CF66]">已准备 AI 批改</span>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#ADB5BD]">尚未上传报告</p>
          )}
        </Card>

          {/* Score Overview */}
          <Card className="p-8 mb-8 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] text-white">
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <div>
                <div className="text-5xl mb-1">{aiReview.overallScore}</div>
                <div className="text-sm opacity-90">综合评分</div>
              </div>
            </div>
            <p className="text-lg opacity-90">优秀！继续保持</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">{aiReview.dimensions.structure}</div>
              <p className="text-sm opacity-90">结构完整性</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{aiReview.dimensions.content}</div>
              <p className="text-sm opacity-90">内容深度</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{aiReview.dimensions.language}</div>
              <p className="text-sm opacity-90">语言规范</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">{aiReview.dimensions.innovation}</div>
              <p className="text-sm opacity-90">创新性</p>
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              
              <div className="mt-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-[#51CF66]" />
                        <h4>优点亮点</h4>
                      </div>
                      <div className="space-y-3">
                        {aiReview.strengths.map((strength, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-[#E7F5FF] rounded-lg border border-[#51CF66]/20">
                            <span className="text-[#51CF66]">✓</span>
                            <p className="text-sm">{strength}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Improvements */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-[#FFD43B]" />
                        <h4>改进建议</h4>
                      </div>
                      <div className="space-y-4">
                        {aiReview.improvements.map((item, index) => (
                          <Card key={index} className="p-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-8 h-8 bg-[#FFD43B]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h5 className="mb-2">{item.issue}</h5>
                                <div className="p-3 bg-[#F3F0FF] rounded-lg border border-[#845EF7]/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-[#845EF7]" />
                                    <span className="text-sm text-[#845EF7]">AI 建议</span>
                                  </div>
                                  <p className="text-sm text-[#212529]">{item.suggestion}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'detailed' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-4">逐段分析</h4>
                      <div className="space-y-4">
                        {[
                          { section: '摘要', score: 85, comment: '内容完整，但可以更精炼' },
                          { section: '引言', score: 90, comment: '背景介绍充分，研究意义明确' },
                          { section: '方法论', score: 92, comment: '方法描述详细，逻辑清晰' },
                          { section: '结果分析', score: 88, comment: '数据充分，分析深入' },
                          { section: '结论', score: 86, comment: '总结到位，但建议增加未来展望' }
                        ].map((section, index) => (
                          <div key={index} className="p-4 bg-[#F8F9FA] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5>{section.section}</h5>
                              <span className="text-lg text-[#4C6EF5]">{section.score}</span>
                            </div>
                            <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-[#4C6EF5] transition-all duration-300"
                                style={{ width: `${section.score}%` }}
                              />
                            </div>
                            <p className="text-sm text-[#ADB5BD]">{section.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'examples' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-[#F8F9FA] rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-xs text-[#ADB5BD]">优秀范例（来自 assets/学习心得.docx）</p>
                          <h4 className="mb-1">{reportExemplar.title}</h4>
                          <p className="text-sm text-[#495057] whitespace-pre-line">
                            {reportExemplar.rawText.split('\n').slice(0, 3).join('\n')}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="secondary" onClick={() => window.open('/assets/学习心得.docx', '_blank')}>
                            <Download className="w-4 h-4" />
                            下载 Word 范例
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setMyReportText(reportExemplar.rawText)}>
                            一键填充范例
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="mb-0">粘贴我的报告正文</h5>
                          <Button size="xs" variant="ghost" onClick={() => setMyReportText('')}>
                            清空
                          </Button>
                        </div>
                        <textarea
                          className="w-full min-h-[220px] border-2 border-[#E9ECEF] rounded-lg px-3 py-2 text-sm"
                          placeholder="在此粘贴或输入你的报告内容，系统将与优秀范例进行段落层面的差异对比"
                          value={myReportText}
                          onChange={(e) => setMyReportText(e.target.value)}
                        />
                        <p className="mt-2 text-xs text-[#ADB5BD]">提示：内容仅本地使用，不会上传到服务器。</p>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-[#4C6EF5]" />
                          <h5 className="mb-0">与优秀范例的差异</h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-[#E7F5FF] rounded-lg">
                            <p className="text-xs text-[#4C6EF5] mb-1">相似度</p>
                            <div className="text-2xl font-semibold text-[#1C7ED6]">{diffResult.similarity}%</div>
                          </div>
                          <div className="p-3 bg-[#F3F0FF] rounded-lg">
                            <p className="text-xs text-[#845EF7] mb-1">关键段落覆盖</p>
                            <div className="text-2xl font-semibold text-[#5F3DC4]">{diffResult.coverage}%</div>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-[#ADB5BD] mb-2">建议补充的关键表达</p>
                          {diffResult.missing.length ? (
                            <ul className="space-y-2 text-sm list-disc list-inside text-[#212529]">
                              {diffResult.missing.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-[#51CF66]">已覆盖范例中的核心段落，保持！</p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Button size="sm" variant="secondary" onClick={() => window.open('/assets/学习心得.docx', '_blank')}>
                            <Download className="w-4 h-4" />
                            下载范例全文
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onNavigate('report-upload')}>
                            上传/提交报告
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Report Info */}
            <Card className="p-6">
              <h5 className="mb-4">报告信息</h5>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#ADB5BD]">提交时间</span>
                  <span>2小时前</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#ADB5BD]">字数统计</span>
                  <span>5,432 字</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#ADB5BD]">原创率</span>
                  <span className="text-[#51CF66]">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#ADB5BD]">引用文献</span>
                  <span>12 篇</span>
                </div>
              </div>
            </Card>
            
              {/* Knowledge Coverage */}
              <Card className="p-6">
                <h5 className="mb-4">知识点覆盖</h5>
                <div className="space-y-3">
                  {[
                  { topic: '深度学习基础', coverage: 95 },
                  { topic: '神经网络原理', coverage: 88 },
                  { topic: '优化算法', coverage: 75 },
                  { topic: '应用案例', coverage: 82 }
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{item.topic}</span>
                      <span className="text-sm text-[#4C6EF5]">{item.coverage}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4C6EF5] transition-all duration-300"
                        style={{ width: `${item.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Actions */}
            <Card className="p-6">
              <h5 className="mb-4">操作</h5>
              <div className="space-y-3">
                <Button variant="primary" fullWidth>
                  下载报告
                </Button>
                <Button variant="secondary" fullWidth>
                  修改后重新提交
                </Button>
                <Button variant="ghost" fullWidth onClick={() => onNavigate('ai-chat')}>
                  咨询 AI 助教
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
