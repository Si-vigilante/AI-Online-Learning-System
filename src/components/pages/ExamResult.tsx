import React from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Award, CheckCircle, XCircle, Lightbulb, BookOpen, RotateCcw, PenLine, ShieldCheck } from 'lucide-react';

interface ExamResultProps {
  onNavigate: (page: string) => void;
}

export function ExamResult({ onNavigate }: ExamResultProps) {
  const result = {
    score: 85,
    totalQuestions: 15,
    correctAnswers: 13,
    wrongAnswers: 2,
    timeSpent: '18分32秒',
    passingScore: 60,
    rank: 'A'
  };
  
  const questionResults = [
    {
      id: 1,
      question: '深度学习是机器学习的哪个分支？',
      yourAnswer: '以上都不是',
      correctAnswer: '以上都不是',
      isCorrect: true,
      aiExplanation: '深度学习是机器学习的一个重要分支，它通过多层神经网络来学习数据的表示。'
    },
    {
      id: 2,
      question: '以下哪些是常用的深度学习框架？（多选）',
      yourAnswer: 'TensorFlow, PyTorch, Scikit-learn',
      correctAnswer: 'TensorFlow, PyTorch, Keras',
      isCorrect: false,
      aiExplanation: 'Scikit-learn 主要是传统机器学习库，不是专门的深度学习框架。常用的深度学习框架包括 TensorFlow、PyTorch 和 Keras。',
      relatedTopics: ['深度学习框架', 'TensorFlow', 'PyTorch']
    },
    {
      id: 3,
      question: '神经网络中的激活函数作用是什么？',
      yourAnswer: '引入非线性',
      correctAnswer: '引入非线性',
      isCorrect: true,
      aiExplanation: '激活函数的主要作用是为神经网络引入非线性因素，使网络能够学习复杂的非线性关系。'
    }
  ];
  
  const weakTopics = [
    { topic: '深度学习框架', score: 60 },
    { topic: '卷积神经网络', score: 70 }
  ];

  const subjectiveScores = [
    { id: 4, question: '请简述反向传播算法的基本原理。', aiScore: 14, fullScore: 20, rubric: '要点覆盖度 60%，逻辑性 70%，关键公式描述清晰度 65%', status: '待复核' }
  ];
  
  const recommendations = [
    {
      type: 'course',
      title: '深度学习框架实战',
      description: '系统学习 TensorFlow 和 PyTorch'
    },
    {
      type: 'practice',
      title: '神经网络实践练习',
      description: '通过实战项目巩固知识'
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        {/* Score Card */}
        <Card className="p-8 mb-8 text-center bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] text-white">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Award className="w-10 h-10" />
          </div>
          
          <h1 className="text-white mb-2">测验完成！</h1>
          <p className="text-lg opacity-90 mb-6">深度学习基础 - 第一章测验</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl mb-2">{result.score}</div>
              <p className="text-sm opacity-90">总分</p>
            </div>
            <div>
              <div className="text-4xl mb-2">{result.rank}</div>
              <p className="text-sm opacity-90">等级</p>
            </div>
            <div>
              <div className="text-4xl mb-2">{result.correctAnswers}/{result.totalQuestions}</div>
              <p className="text-sm opacity-90">正确率</p>
            </div>
            <div>
              <div className="text-4xl mb-2">{result.timeSpent}</div>
              <p className="text-sm opacity-90">用时</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center mt-8">
            <Button variant="secondary" size="lg" onClick={() => onNavigate('test-center')}>
              返回测验中心
            </Button>
            <Button variant="secondary" size="lg">
              <RotateCcw className="w-5 h-5" />
              再次练习
            </Button>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Answer Analysis */}
          <div className="lg:col-span-2">
            <h3 className="mb-4">AI 答案解析</h3>
            <div className="space-y-4">
              {questionResults.map((item, index) => (
                <Card key={item.id} className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.isCorrect ? 'bg-[#51CF66]' : 'bg-[#FF6B6B]'
                    }`}>
                      {item.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-[#ADB5BD]">第 {index + 1} 题</span>
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          item.isCorrect 
                            ? 'bg-[#51CF66]/20 text-[#51CF66]' 
                            : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                        }`}>
                          {item.isCorrect ? '正确' : '错误'}
                        </span>
                      </div>
                      <h5 className="mb-3">{item.question}</h5>
                      
                      <div className="space-y-2 mb-4">
                        <div className="p-3 bg-[#F8F9FA] rounded-lg">
                          <p className="text-sm text-[#ADB5BD] mb-1">您的答案：</p>
                          <p className="text-sm">{item.yourAnswer}</p>
                        </div>
                        {!item.isCorrect && (
                          <div className="p-3 bg-[#E7F5FF] rounded-lg border border-[#4C6EF5]/20">
                            <p className="text-sm text-[#ADB5BD] mb-1">正确答案：</p>
                            <p className="text-sm text-[#4C6EF5]">{item.correctAnswer}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-[#F3F0FF] rounded-lg border border-[#845EF7]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-[#845EF7]" />
                          <h5 className="text-[#845EF7]">AI 解析</h5>
                        </div>
                        <p className="text-sm text-[#212529]">{item.aiExplanation}</p>
                      </div>
                      
                      {item.relatedTopics && (
                        <div className="flex gap-2 mt-3">
                          {item.relatedTopics.map((topic, i) => (
                            <span key={i} className="text-xs bg-[#E9ECEF] text-[#212529] px-3 py-1 rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weak Topics */}
            <Card className="p-6">
              <h5 className="mb-4">薄弱知识点</h5>
              <div className="space-y-4">
                {weakTopics.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">{item.topic}</span>
                      <span className="text-sm text-[#FF6B6B]">{item.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#FF6B6B] transition-all duration-300"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Recommendations */}
            <Card className="p-6">
              <h5 className="mb-4">AI 学习建议</h5>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-4 bg-[#F8F9FA] rounded-lg">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-[#4C6EF5] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="mb-1">{rec.title}</h5>
                        <p className="text-xs text-[#ADB5BD]">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="primary" fullWidth className="mt-4" onClick={() => onNavigate('course-list')}>
                查看推荐课程
              </Button>
            </Card>
            
            {/* Performance Chart */}
            <Card className="p-6">
              <h5 className="mb-4">历史成绩对比</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#ADB5BD]">本次测验</span>
                  <span className="text-[#51CF66]">85 分</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#ADB5BD]">上次测验</span>
                  <span>78 分</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#ADB5BD]">平均分</span>
                  <span>82 分</span>
                </div>
                <div className="pt-3 border-t border-[#E9ECEF]">
                  <p className="text-sm text-[#51CF66]">
                    ↑ 进步了 7 分，继续加油！
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-[#4C6EF5]" />
                  <h5 className="mb-0">主观题智能批改</h5>
                </div>
                <Button size="sm" variant="secondary">教师复核</Button>
              </div>
              <div className="space-y-3 text-sm">
                {subjectiveScores.map((item) => (
                  <div key={item.id} className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">题目 {item.id}</span>
                      <span className="text-xs text-[#845EF7]">{item.status}</span>
                    </div>
                    <p className="text-sm mb-2">{item.question}</p>
                    <div className="flex items-center gap-3 text-xs text-[#ADB5BD]">
                      <span>AI 评分：{item.aiScore} / {item.fullScore}</span>
                      <span>{item.rubric}</span>
                    </div>
                  </div>
                ))}
                {!subjectiveScores.length && <p className="text-xs text-[#ADB5BD]">暂无主观题</p>}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#4C6EF5]" />
                <h5 className="mb-0">评分说明</h5>
              </div>
              <p className="text-sm text-[#495057]">
                客观题已即时评分并附解析；主观题通过语义相似度匹配评分标准，教师可再次复核调整，最终成绩以复核结果为准。
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
