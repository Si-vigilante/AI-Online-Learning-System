import React, { useEffect, useMemo, useState } from 'react';
import { Card } from './design-system/Card';
import { Button } from './design-system/Button';
import { Loader2, Brain, Sparkles, Play, Pause } from 'lucide-react';

type AiTask = 'translate' | 'organize' | 'tutor' | 'quiz' | 'grade';

const taskOptions: { value: AiTask; label: string; hint: string }[] = [
  { value: 'translate', label: '实时翻译', hint: '仅输出译文，适合逐字讲解' },
  { value: 'organize', label: '自动整理', hint: '生成结构化摘要 JSON' },
  { value: 'tutor', label: '助教答疑', hint: '分点回答，不足先问澄清' },
  { value: 'quiz', label: '自动出题', hint: '返回测验题 JSON' },
  { value: 'grade', label: 'AI 批改', hint: '返回评分与建议 JSON' }
];

const defaultStreamMap: Record<AiTask, boolean> = {
  translate: true,
  tutor: true,
  organize: false,
  quiz: false,
  grade: false
};

const taskPlaceholders: Record<AiTask, string> = {
  translate: '输入需要翻译的文本（支持长文）',
  organize: '贴上需要整理的笔记或内容',
  tutor: '向助教提问，或描述你遇到的问题',
  quiz: '提供知识点/材料，生成测验题',
  grade: '粘贴作业/回答，AI 帮你批改'
};

interface AiPanelState {
  thinking: string;
  outputText: string;
  outputJson: any;
  warning?: string;
  error?: string;
}

const parseSseLines = (buffer: string, onPayload: (data: any) => void) => {
  const parts = buffer.split('\n\n');
  const pending = parts.pop() ?? '';
  for (const part of parts) {
    const line = part.trim();
    if (!line.startsWith('data:')) continue;
    const jsonStr = line.replace(/^data:\s*/, '');
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
  } catch (err) {
    return String(data);
  }
};

export function AiPanel() {
  const [task, setTask] = useState<AiTask>('tutor');
  const [input, setInput] = useState('');
  const [stream, setStream] = useState(defaultStreamMap['tutor']);
  const [enableThinking, setEnableThinking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<AiPanelState>({
    thinking: '',
    outputText: '',
    outputJson: null
  });

  const placeholder = useMemo(() => taskPlaceholders[task], [task]);

  useEffect(() => {
    setStream(defaultStreamMap[task]);
  }, [task]);

  const resetOutput = () => {
    setState({ thinking: '', outputText: '', outputJson: null });
  };

  const handleNonStream = async (body: any) => {
    const resp = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.error || '请求失败');
    }
    if (data?.success) {
      setState({
        thinking: '',
        outputText: typeof data.raw === 'string' ? data.raw : formatJson(data.raw),
        outputJson: data.data,
        warning: data.warning
      });
      return;
    }
    if (data?.data) {
      setState({
        thinking: '',
        outputText: typeof data.raw === 'string' ? data.raw : formatJson(data.raw),
        outputJson: data.data,
        warning: data.warning
      });
      return;
    }
    if (data?.content) {
      setState({ thinking: '', outputText: data.content, outputJson: null });
      return;
    }
    setState({ thinking: '', outputText: formatJson(data), outputJson: null });
  };

  const handleStream = async (body: any) => {
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
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    setState((prev) => ({ ...prev, thinking: '', outputText: '' }));
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSseLines(buffer, (payload) => {
        if (payload.type === 'thinking' && payload.delta) {
          setState((prev) => ({ ...prev, thinking: prev.thinking + payload.delta }));
        }
        if (payload.type === 'content' && payload.delta) {
          setState((prev) => ({ ...prev, outputText: prev.outputText + payload.delta }));
        }
        if (payload.type === 'done' && payload.content) {
          setState((prev) => ({ ...prev, outputText: payload.content, thinking: payload.reasoning || prev.thinking }));
        }
        if (payload.type === 'error' && payload.error) {
          throw new Error(payload.error);
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    resetOutput();
    setLoading(true);
    try {
      const body = {
        task,
        payload: input,
        stream,
        enable_thinking: enableThinking
      };
      if (stream) {
        await handleStream(body);
      } else {
        await handleNonStream(body);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败';
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setLoading(false);
    }
  };

  const showJson = state.outputJson && ['organize', 'quiz', 'grade'].includes(task);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#845EF7]" />
          <h5>AI 统一面板</h5>
        </div>
        <div className="text-xs text-[#868E96]">DeepSeek-V3.2 · ModelScope</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#495057]">任务</label>
          <select
            className="flex-1 border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#845EF7]"
            value={task}
            onChange={(e) => setTask(e.target.value as AiTask)}
          >
            {taskOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} · {opt.hint}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="w-full min-h-[140px] border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#845EF7]"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enableThinking}
              onChange={(e) => setEnableThinking(e.target.checked)}
            />
            启用思考 enable_thinking
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stream} onChange={(e) => setStream(e.target.checked)} />
            流式 stream
          </label>
          <Button size="sm" variant="secondary" onClick={resetOutput}>
            清空
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? '调用中' : '发送'}
          </Button>
        </div>

        <div className="space-y-2">
          {state.thinking && (
            <div className="p-3 bg-[#F8F9FA] rounded-lg border border-dashed border-[#CED4DA] text-sm text-[#495057]">
              <div className="flex items-center gap-2 text-[#845EF7] mb-1">
                <Brain className="w-4 h-4" />
                <span>思考中…</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{state.thinking}</pre>
            </div>
          )}

          {state.error && (
            <div className="p-3 bg-[#FFF0F6] border border-[#FA5252] text-[#C92A2A] rounded-lg text-sm">
              {state.error}
            </div>
          )}

          {state.warning && (
            <div className="p-3 bg-[#FFF9DB] border border-[#FFD43B] text-[#D9480F] rounded-lg text-xs">
              {state.warning}
            </div>
          )}

          <div className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF] text-sm">
            <div className="flex items-center gap-2 text-[#4C6EF5] mb-1">
              <Pause className="w-4 h-4" />
              <span>回答</span>
            </div>
            {showJson ? (
              <pre className="bg-white rounded-md border border-[#E9ECEF] p-3 text-xs overflow-auto max-h-64">
                {formatJson(state.outputJson)}
              </pre>
            ) : (
              <pre className="whitespace-pre-wrap leading-relaxed text-sm">{state.outputText}</pre>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
