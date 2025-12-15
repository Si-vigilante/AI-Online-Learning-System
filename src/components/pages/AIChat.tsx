import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { ChatBubble } from '../design-system/ChatBubble';
import { Send, Sparkles, BookOpen, HelpCircle, Mic, MicOff, Link2, Clock, Video, Phone, ScreenShare } from 'lucide-react';
import { AiPanel } from '../AiPanel';

interface AIChatProps {
  onNavigate: (page: string) => void;
}

export function AIChat({ onNavigate }: AIChatProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      message: '你好！我是 AI 助教。已连接课程知识图谱，随时为你解答。你可以输入文字或语音，或附上课程片段以获取精准回答。',
      sender: 'ai' as const,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqLog, setFaqLog] = useState<{ id: number; question: string; answer: string; tag: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const quickQuestions = [
    '帮我总结本节课要点',
    '解释一下反向传播算法',
    '推荐相关学习资料',
    '这个概念的应用场景'
  ];

  const courseSegments = [
    { id: 'seg-1', title: '01:30 - 深度学习定义', time: '01:30', knowledge: '深度学习简介' },
    { id: 'seg-2', title: '05:40 - 激活函数示例', time: '05:40', knowledge: '激活函数详解' },
    { id: 'seg-3', title: '12:10 - 反向传播推导', time: '12:10', knowledge: '反向传播算法' }
  ];

  const faqBase = [
    { id: 1, question: '如何理解反向传播？', answer: '反向传播通过链式法则计算梯度，从输出误差向前层逐步传播，更新权重。', tag: '算法' },
    { id: 2, question: '激活函数怎么选择？', answer: '常用 ReLU/LeakyReLU；在输出层根据任务选择 Sigmoid/Softmax。', tag: '激活函数' },
    { id: 3, question: '学习率调多大合适？', answer: '建议从 1e-3 开始，观察损失曲线和梯度稳定性再调优。', tag: '训练' }
  ];
  const faqs = [...faqBase, ...faqLog];

  useEffect(() => {
    const SpeechRecognitionInstance =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionInstance) {
      setSpeechSupported(true);
      const recog: any = new SpeechRecognitionInstance();
      recog.continuous = false;
      recog.lang = 'zh-CN';
      recog.interimResults = false;
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recog.onend = () => setIsListening(false);
      recognitionRef.current = recog;
    }
  }, []);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const segmentText = selectedSegment
      ? `\n[关联片段] ${courseSegments.find((c) => c.id === selectedSegment)?.title || ''}`
      : '';

    const newMessage = {
      id: messages.length + 1,
      message: inputMessage + segmentText,
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');
    setSelectedSegment(null);
    
    // Simulate AI response
    setTimeout(() => {
      const segmentRef = selectedSegment
        ? `已定位至片段 ${courseSegments.find((c) => c.id === selectedSegment)?.time}，结合该知识点为你解答。`
        : '已基于课程知识图谱检索相关节点。';
      const aiResponse = {
        id: messages.length + 2,
        message: `${segmentRef}\n\n核心回答：深度学习是机器学习的子领域，通过多层非线性网络学习表示，关键包含自动特征提取、端到端训练与大规模数据支撑。\n\n可选动作：\n- 需要推送相关练习题吗？\n- 要不要生成本节 3 句总结？`,
        sender: 'ai' as const,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setFaqLog((prev) => [
        ...prev,
        {
          id: Date.now(),
          question: newMessage.message,
          answer: aiResponse.message,
          tag: selectedSegment ? '片段关联' : '通用'
        }
      ]);
    }, 1000);
  };
  
  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleStartVoice = () => {
    if (!speechSupported || !recognitionRef.current) return;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleStopVoice = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#845EF7] to-[#BE4BDB] text-white py-8 px-8">
        <div className="container-custom">
          <h2 className="text-white mb-2">AI 助教答疑</h2>
          <p className="opacity-90">24/7 智能解答，助力您的学习之旅</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="h-[calc(100vh-16rem)] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-[#E9ECEF]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#845EF7] to-[#BE4BDB] rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4>AI 助教</h4>
                    <p className="text-sm text-[#ADB5BD]">在线 · 随时为您服务</p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.message}
                    sender={msg.sender}
                    timestamp={msg.timestamp}
                  />
                ))}
              </div>
              
              {/* Input Area */}
              <div className="p-6 border-t border-[#E9ECEF]">
                <div className="flex gap-3 flex-wrap items-center">
                  <div className="flex-1 min-w-[240px]">
                    <textarea
                      className="w-full px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#845EF7] focus:ring-2 focus:ring-[#845EF7] outline-none transition-all resize-none"
                      rows={2}
                      placeholder="文字或语音提问，支持粘贴关键词与时间码..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 border-2 border-[#E9ECEF] rounded-lg">
                      <Link2 className="w-4 h-4 text-[#845EF7]" />
                      <select
                        className="text-sm outline-none bg-transparent"
                        value={selectedSegment ?? ''}
                        onChange={(e) => setSelectedSegment(e.target.value || null)}
                      >
                        <option value="">关联课程片段</option>
                        {courseSegments.map((seg) => (
                          <option key={seg.id} value={seg.id}>{seg.title}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="secondary" onClick={isListening ? handleStopVoice : handleStartVoice} disabled={!speechSupported}>
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {isListening ? '停止语音' : speechSupported ? '语音输入' : '不支持语音'}
                    </Button>
                    <Button onClick={handleSendMessage}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#845EF7]" />
                  <h5 className="mb-0">教师在线辅导</h5>
                </div>
                <Button size="sm" variant="secondary">预约 1 对 1</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">今晚 19:30 直播答疑</span>
                    <Video className="w-4 h-4 text-[#845EF7]" />
                  </div>
                  <p className="text-xs text-[#ADB5BD]">主题：第一章重难点解析</p>
                  <Button fullWidth size="sm" className="mt-3">进入直播</Button>
                </div>
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">明日 14:00 1v1</span>
                    <Phone className="w-4 h-4 text-[#845EF7]" />
                  </div>
                  <p className="text-xs text-[#ADB5BD]">教师：李老师 · 语音 + 屏幕共享</p>
                  <Button fullWidth size="sm" variant="secondary" className="mt-3">修改预约</Button>
                </div>
                <div className="p-3 border-2 border-[#E9ECEF] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">随时发起辅导</span>
                    <ScreenShare className="w-4 h-4 text-[#845EF7]" />
                  </div>
                  <p className="text-xs text-[#ADB5BD]">支持文字、语音、屏幕共享</p>
                  <Button fullWidth size="sm" variant="primary" className="mt-3" onClick={() => onNavigate('video-player')}>共享屏幕练习</Button>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <AiPanel />
            {/* Quick Questions */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-[#845EF7]" />
                <h5>快捷问题</h5>
              </div>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 bg-[#F8F9FA] rounded-lg hover:bg-[#E9ECEF] transition-colors text-sm"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Context Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#4C6EF5]" />
                <h5>当前上下文</h5>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm mb-1">课程</p>
                  <h5>深度学习基础</h5>
                </div>
                <div className="p-3 bg-[#F8F9FA] rounded-lg">
                  <p className="text-sm mb-1">当前章节</p>
                  <h5>第一章：深度学习简介</h5>
                </div>
              </div>
            </Card>
            
            {/* AI Features */}
            <Card className="p-6">
              <h5 className="mb-3">知识图谱节点</h5>
              <div className="flex flex-wrap gap-2 mb-4">
                {['深度学习', '神经网络', '激活函数', '反向传播', '优化器', '梯度消失'].map((node) => (
                  <span key={node} className="px-3 py-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-full text-xs">
                    {node}
                  </span>
                ))}
              </div>
              <h5 className="mb-3">课程 FAQ（自动沉淀）</h5>
              <input
                className="w-full px-3 py-2 border-2 border-[#E9ECEF] rounded-lg focus:border-[#845EF7] outline-none text-sm mb-3"
                placeholder="关键词检索，如：反向传播 / 激活"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
              />
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {faqs
                  .filter((f) => f.question.includes(faqSearch) || f.answer.includes(faqSearch) || f.tag.includes(faqSearch))
                  .map((item) => (
                    <div key={item.id} className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.question}</span>
                        <span className="text-xs text-[#845EF7]">{item.tag}</span>
                      </div>
                      <p className="text-xs text-[#495057] whitespace-pre-line">{item.answer}</p>
                    </div>
                  ))}
                {!faqs.length && <p className="text-xs text-[#ADB5BD]">暂无 FAQ 记录</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
