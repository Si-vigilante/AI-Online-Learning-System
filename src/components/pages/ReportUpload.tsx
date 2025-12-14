import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Dropdown } from '../design-system/Dropdown';
import { Upload, FileText, Send, Sparkles } from 'lucide-react';

interface ReportUploadProps {
  onNavigate: (page: string) => void;
}

export function ReportUpload({ onNavigate }: ReportUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [course, setCourse] = useState('');
  
  const courseOptions = [
    { value: 'dl-basics', label: '深度学习基础' },
    { value: 'python-data', label: 'Python 数据分析' },
    { value: 'ml-advanced', label: '机器学习进阶' }
  ];
  
  const handleFileUpload = () => {
    setUploadedFile('深度学习期中报告.pdf');
  };
  
  const handleSubmit = () => {
    onNavigate('report-review');
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-2">报告提交</h1>
          <p className="text-lg opacity-90">AI 智能批改，即时获得专业反馈</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h3 className="mb-6">提交报告</h3>
              
              <div className="space-y-6">
                <Input
                  label="报告标题"
                  placeholder="请输入报告标题"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
                
                <Dropdown
                  label="所属课程"
                  options={courseOptions}
                  value={course}
                  onChange={setCourse}
                  placeholder="请选择课程"
                />
                
                <div>
                  <label className="block mb-2 text-sm text-[#212529]">
                    上传报告文件
                  </label>
                  
                  {!uploadedFile ? (
                    <div 
                      className="border-2 border-dashed border-[#E9ECEF] rounded-lg p-12 text-center hover:border-[#4C6EF5] transition-colors cursor-pointer"
                      onClick={handleFileUpload}
                    >
                      <div className="w-16 h-16 bg-[#EDF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-[#4C6EF5]" />
                      </div>
                      <h5 className="mb-2">点击上传或拖拽文件</h5>
                      <p className="text-sm text-[#ADB5BD]">支持 .pdf, .docx, .md 格式，最大 10MB</p>
                    </div>
                  ) : (
                    <div className="p-6 bg-[#F8F9FA] rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#FF6B6B] rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="mb-1">{uploadedFile}</h5>
                          <p className="text-sm text-[#ADB5BD]">2.4 MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                          重新上传
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 bg-[#F3F0FF] rounded-lg border border-[#845EF7]/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#845EF7] flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="mb-2 text-[#845EF7]">AI 智能批改功能</h5>
                      <ul className="text-sm text-[#212529] space-y-1">
                        <li>• 自动检查语法和拼写</li>
                        <li>• 评估内容逻辑性和连贯性</li>
                        <li>• 分析知识点覆盖程度</li>
                        <li>• 提供改进建议和优秀示例</li>
                        <li>• 多维度评分（结构、内容、语言）</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Button 
                  fullWidth 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!reportTitle || !course || !uploadedFile}
                >
                  <Send className="w-5 h-5" />
                  提交并让 AI 批改
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Guidelines */}
            <Card className="p-6">
              <h5 className="mb-4">报告撰写指南</h5>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5] flex-shrink-0">1.</span>
                  <span>清晰的标题和摘要</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5] flex-shrink-0">2.</span>
                  <span>完整的研究背景和目标</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5] flex-shrink-0">3.</span>
                  <span>详细的方法论和实验设计</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5] flex-shrink-0">4.</span>
                  <span>数据分析和结果讨论</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5] flex-shrink-0">5.</span>
                  <span>结论和参考文献</span>
                </li>
              </ul>
            </Card>
            
            {/* Submitted Reports */}
            <Card className="p-6">
              <h5 className="mb-4">已提交的报告</h5>
              <div className="space-y-3">
                {[
                  { title: 'Python 数据分析实践', score: 92, status: '已批改' },
                  { title: '机器学习算法总结', score: 88, status: '已批改' }
                ].map((report, index) => (
                  <div key={index} className="p-4 bg-[#F8F9FA] rounded-lg">
                    <h5 className="mb-2 text-sm">{report.title}</h5>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#51CF66]">{report.status}</span>
                      <span className="text-[#ADB5BD]">分数：{report.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Tips */}
            <Card className="p-6">
              <h5 className="mb-4">温馨提示</h5>
              <ul className="space-y-2 text-sm text-[#212529]">
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>AI 批改通常需要 2-3 分钟</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>可多次提交修改后的版本</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#4C6EF5]">•</span>
                  <span>教师会进行最终人工审阅</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
