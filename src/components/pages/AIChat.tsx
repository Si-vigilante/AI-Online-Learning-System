import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { ChatBubble } from '../design-system/ChatBubble';
import { Send, Sparkles, BookOpen, HelpCircle, Mic, MicOff, Link2 } from 'lucide-react';

interface AIChatProps {
  onNavigate: (page: string) => void;
}

export function AIChat({ onNavigate }: AIChatProps) {
  const [messages, setMessages] = useState<
    { id: number; message: string; sender: 'ai' | 'user'; timestamp: string; thinking?: string; json?: any }[]
  >([
    {
      id: 1,
      message: '你好！我是 AI 助教，已接入 ModelScope · DeepSeek-V3.2，随时为你解答。请选择右侧任务后开始对话。',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqLog, setFaqLog] = useState<{ id: number; question: string; answer: string; tag: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [task, setTask] = useState<'translate' | 'organize' | 'tutor' | 'quiz' | 'grade'>('tutor');
  const [stream, setStream] = useState(true);
  const [enableThinking, setEnableThinking] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const defaultStreamMap = {
    translate: true,
    tutor: true,
    organize: false,
    quiz: false,
    grade: false
  };
  
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

  useEffect(() => {
    setStream(defaultStreamMap[task]);
  }, [task]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseSseBuffer = (buffer: string, onPayload: (data: any) => void) => {
    const parts = buffer.split('\n\n');
    const pending = parts.pop() || '';
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed.startsWith('data:')) continue;
      const jsonStr = trimmed.replace(/^data:\s*/, '');
      try {
        const payload = JSON.parse(jsonStr);
        onPayload(payload);
      } catch (err) {
        // ignore malformed chunk
      }
    }
    return pending;
  };

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    setErrorMsg('');

    const segmentText = selectedSegment
      ? `\n[关联片段] ${courseSegments.find((c) => c.id === selectedSegment)?.title || ''}`
      : '';

    const userContent = inputMessage + segmentText;
    const newMessage = {
      id: messages.length + 1,
      message: userContent,
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');
    setSelectedSegment(null);

    const aiMsgId = newMessage.id + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        message: '',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        thinking: '',
        json: null
      }
    ]);

    setIsSending(true);
    try {
      const body = {
        task,
        payload: { text: userContent },
        stream,
        enable_thinking: enableThinking
      };

      if (stream) {
        const resp = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData?.error || '请求失败');
        }
        const reader = resp.body?.getReader();
        if (!reader) throw new Error('读取流失败');
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSseBuffer(buffer, (payload) => {
            if (payload.type === 'thinking' && payload.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, thinking: (m.thinking || '') + payload.delta } : m
                )
              );
            }
            if (payload.type === 'content' && payload.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, message: (m.message || '') + payload.delta } : m
                )
              );
            }
            if (payload.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        message: payload.content || m.message,
                        thinking: payload.reasoning || m.thinking
                      }
                    : m
                )
              );
            }
            if (payload.type === 'error' && payload.error) {
              throw new Error(payload.error);
            }
          });
        }
      } else {
        const resp = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data?.error || '请求失败');
        }

        let messageText = '';
        let jsonData: any = null;
        if (data?.success || data?.data) {
          jsonData = data.data || data.raw || null;
          messageText = formatJson(jsonData);
        } else if (data?.content) {
          messageText = data.content;
        } else {
          messageText = formatJson(data);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  message: messageText,
                  json: jsonData
                }
              : m
          )
        );
      }
    } catch (err: any) {
      const message = err?.message || '请求失败';
      setErrorMsg(message);
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
    } finally {
      setIsSending(false);
    }
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
          <p className="opacity-90">统一对话入口 · 支持翻译 / 整理 / 答疑 / 出题 / 批改</p>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Chat Area */}
          <Card className="min-h-[70vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-[#E9ECEF] flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#845EF7] to-[#BE4BDB] rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4>AI 助教</h4>
                <p className="text-sm text-[#ADB5BD]">DeepSeek-V3.2 · ModelScope</p>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <ChatBubble
                    message={msg.message}
                    sender={msg.sender}
                    timestamp={msg.timestamp}
                  />
                  {msg.thinking && (
                    <div className="ml-12 text-xs text-[#845EF7] bg-[#F3F0FF] border border-dashed border-[#DEC9FF] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>思考中</span>
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.thinking}</div>
                    </div>
                  )}
                  {msg.json && (
                    <pre className="ml-12 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg p-3 text-xs whitespace-pre-wrap overflow-auto">
                      {formatJson(msg.json)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            {errorMsg && (
              <div className="px-6 pb-2">
                <div className="text-sm text-[#C92A2A] bg-[#FFF0F6] border border-[#FA5252] rounded-lg p-3">
                  {errorMsg}
                </div>
              </div>
            )}
            
            {/* Input Area */}
            <div className="p-6 border-t border-[#E9ECEF]">
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex-1 min-w-[240px]">
                  <textarea
                    className="w-full px-4 py-3 border-2 border-[#E9ECEF] rounded-lg focus:border-[#845EF7] focus:ring-2 focus:ring-[#845EF7] outline-none transition-all resize-none"
                    rows={3}
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
                  <Button onClick={handleSendMessage} disabled={isSending}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Sidebar as settings / helpers */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#845EF7]" />
                  <h5>对话设置</h5>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setMessages((prev) => prev.slice(0, 1))}>
                  清空对话
                </Button>
              </div>
              <div className="space-y-3">
                <label className="text-sm text-[#495057]">任务</label>
                <select
                  className="w-full border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#845EF7]"
                  value={task}
                  onChange={(e) => setTask(e.target.value as any)}
                >
                  <option value="translate">translate · 实时翻译</option>
                  <option value="organize">organize · 自动整理 (JSON)</option>
                  <option value="tutor">tutor · 助教答疑</option>
                  <option value="quiz">quiz · 自动出题 (JSON)</option>
                  <option value="grade">grade · AI 批改 (JSON)</option>
                </select>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={enableThinking}
                      onChange={(e) => setEnableThinking(e.target.checked)}
                    />
                    启用思考 enable_thinking
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={stream}
                      onChange={(e) => setStream(e.target.checked)}
                    />
                    流式 stream
                  </label>
                </div>
              </div>
            </Card>

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
