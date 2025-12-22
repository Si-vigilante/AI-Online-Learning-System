require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const dns = require('dns');
const { setGlobalDispatcher, Agent } = require('undici');
const cors = require('cors');
const { Server } = require('socket.io');
const { LowSync, JSONFileSync } = require('lowdb');
const path = require('path');
const { OpenAI } = require('openai');
const PptxGenJS = require('pptxgenjs');
const dayjs = require('dayjs');
const { getMockCourseContent } = require('./mocks/courseContent');
const { QUESTION_BANK } = require('./mocks/questionBank');
const { randomUUID } = require('crypto');
const multer = require('multer');

// ===== Diagnostics: intercept bad hosts in dev to surface .https usage =====
if (process.env.NODE_ENV !== 'production') {
  const rawLookup = dns.lookup.bind(dns);
  dns.lookup = function (hostname, ...rest) {
    if (typeof hostname === 'string' && hostname.includes('.https')) {
      console.error('[DNS LOOKUP HIT BAD HOST]', hostname, new Error().stack);
    }
    return rawLookup(hostname, ...rest);
  };
  if (dns.promises?.lookup) {
    const rawLookupPromise = dns.promises.lookup.bind(dns.promises);
    dns.promises.lookup = async function (hostname, ...rest) {
      if (typeof hostname === 'string' && hostname.includes('.https')) {
        console.error('[DNS PROMISE LOOKUP HIT BAD HOST]', hostname, new Error().stack);
      }
      return rawLookupPromise(hostname, ...rest);
    };
  }
  const wrapRequest = (mod, name) => {
    const raw = mod.request.bind(mod);
    mod.request = function (options, cb) {
      const host =
        typeof options === 'string'
          ? options
          : options?.hostname || options?.host || (typeof options?.href === 'string' ? options.href : undefined);
      if (host && String(host).includes('.https')) {
        console.error(`[${name}.request BAD HOST]`, host, options, new Error().stack);
      }
      return raw(options, cb);
    };
  };
  wrapRequest(http, 'http');
  wrapRequest(https, 'https');

  // undici (fetch) interception to catch .https hosts
  const originalAgentConnect = Agent.prototype.connect;
  const diagAgent = new Agent({
    connect: function (opts, cb) {
      const host = opts?.hostname || opts?.host;
      if (host && String(host).includes('.https')) {
        console.error('[HIT undici.connect BAD HOST]', host, opts, new Error('undici.connect stack').stack);
      }
      return originalAgentConnect.call(this, opts, cb);
    }
  });
  setGlobalDispatcher(diagAgent);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());

// Lowdb setup
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter, { qaQuestions: [], forumPosts: [], examPapers: [], examGrades: [], reportAssignments: [], reportSubmissions: [], reportFeedback: [] });
db.read();
db.data = db.data || { qaQuestions: [], forumPosts: [], examPapers: [], examGrades: [], reportAssignments: [], reportSubmissions: [], reportFeedback: [] };
db.data.examPapers = db.data.examPapers || [];
db.data.examGrades = db.data.examGrades || [];
db.data.reportAssignments = db.data.reportAssignments || [];
db.data.reportSubmissions = db.data.reportSubmissions || [];
db.data.reportFeedback = db.data.reportFeedback || [];
if (db.data.reportAssignments.length === 0) {
  db.data.reportAssignments.push({
    id: 'report-demo-1',
    courseId: 'deep-learning',
    title: '深度学习课程报告',
    description: '围绕反向传播与梯度问题写一篇综述，包含案例与改进方法。',
    knowledgePoints: ['反向传播', '梯度消失', '梯度爆炸', '优化'],
    dueAt: null,
    rubric: { relevance: 0.25, structure: 0.25, coverage: 0.25, language: 0.25, originality: 0.1 },
    exemplar: {
      title: '示例报告',
      rawText:
        '本报告综述反向传播原理、梯度消失/爆炸成因及缓解方法，结合卷积网络与循环网络的实践案例，提出改进建议与实验对比。'
    },
    createdBy: 'teacher',
    createdAt: new Date().toISOString()
  });
  db.write();
}

// ModelScope / DeepSeek config
const MODELSCOPE_BASE_URL = 'https://api-inference.modelscope.cn/v1';
const MODELSCOPE_MODEL = process.env.MODELSCOPE_MODEL || 'deepseek-ai/DeepSeek-V3.2';
const MODELSCOPE_TOKEN = process.env.MODELSCOPE_TOKEN || 'placeholder-token';
if (!process.env.MODELSCOPE_TOKEN) {
  console.warn('[ppt-to-video] MODELSCOPE_TOKEN not set, AI routes may fail but video routes still work.');
}
const openai = new OpenAI({
  baseURL: MODELSCOPE_BASE_URL,
  apiKey: MODELSCOPE_TOKEN
});

const systemPrompts = {
  translate: '你是精准的实时翻译助手，仅输出译文，保持简洁准确，不添加解释。',
  organize:
    '请将输入内容整理为结构化摘要，必须输出 JSON {title, summary, key_points[], action_items[]}，不要额外解释。',
  tutor:
    '你是简洁的助教，回答时使用分点。如果信息不足，先提出1-2个澄清问题再回答。',
  quiz:
    '基于输入生成测验题，必须输出 JSON {questions:[{type,stem,options,answer,analysis,difficulty,knowledge}]}，覆盖关键知识点，答案清晰。',
  grade:
    '请对提交内容进行批改，必须输出 JSON {score, breakdown:[{item,score,comment}], strengths[], issues[], suggestions[]}，给出可执行建议。'
};

const defaultStreamByTask = {
  translate: true,
  tutor: true,
  organize: false,
  quiz: false,
  grade: false
};

const taskRequiresJson = (task) => ['organize', 'quiz', 'grade'].includes(task);

const formatPayload = (payload) => {
  if (payload === undefined || payload === null) return '';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload);
  } catch (err) {
    return String(payload);
  }
};

const parseJsonFallback = (raw) => {
  if (typeof raw === 'object' && raw !== null) {
    return { success: true, data: raw, raw };
  }
  if (typeof raw !== 'string') {
    return { success: false, raw, error: 'Response is not a string' };
  }
  try {
    return { success: true, data: JSON.parse(raw), raw };
  } catch (err) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return {
          success: true,
          data: JSON.parse(match[0]),
          raw,
          warning: 'Parsed first JSON object from mixed content.'
        };
      } catch (err2) {
        // fall through
      }
    }
  }
  return { success: false, raw, error: 'Failed to parse JSON from model response' };
};

const callDeepSeek = async ({ messages, stream = false, enableThinking = false, responseFormat }) => {
  return openai.chat.completions.create({
    model: MODELSCOPE_MODEL,
    messages,
    stream,
    response_format: responseFormat,
    extra_body: { enable_thinking: enableThinking }
  });
};

const sanitizeFilePart = (name) => {
  if (!name || typeof name !== 'string') return 'AI课件';
  return name.replace(/[\r\n\t]/g, ' ').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 40) || 'AI课件';
};

const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return 'AI课件.pptx';
  return name.replace(/[\r\n\t]/g, ' ').replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 60);
};

const buildDisposition = (filename) => {
  const asciiName = filename.replace(/[^\x20-\x7E]/g, '_') || 'AI_Kejian.pptx';
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`;
};

const normalizeStr = (str) =>
  (str || '')
    .replace(/^[\s　]+|[\s　]+$/g, '')
    .replace(/[，,。．·]/g, '')
    .replace(/[:：]/g, ':')
    .trim();

const cleanBullets = (title, bullets = []) => {
  const cleaned = [];
  const seen = new Set();
  const normalizedTitle = normalizeStr(title);
  const stripPrefixes = (text) => text.replace(/^(标题|本页|内容)[:：]\s*/i, '').trim();

  bullets.forEach((b) => {
    let bullet = stripPrefixes(b || '');
    if (!bullet) return;
    const normalizedBullet = normalizeStr(bullet);
    if (normalizedBullet === normalizedTitle) return;
    if (normalizedTitle && normalizedBullet.startsWith(normalizedTitle)) {
      bullet = bullet.slice(title.length).replace(/^[:：\s-]+/, '').trim();
    }
    const finalNormalized = normalizeStr(bullet);
    if (!finalNormalized) return;
    const key = finalNormalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    cleaned.push(bullet);
  });

  if (!cleaned.length) {
    cleaned.push('核心概念', '典型应用/例题');
  }
  return cleaned.slice(0, 6).map((b) => (b.length > 24 ? b.slice(0, 24) : b));
};

const cleanSlides = (slides = []) =>
  slides.map((sl, idx) => {
    const title = (sl.title || `第 ${idx + 1} 页`).trim();
    const bullets = cleanBullets(title, sl.bullets || []);
    return {
      ...sl,
      title,
      bullets
    };
  });

const applyPageRange = (slides, pageRange) => {
  const hasRange =
    pageRange &&
    typeof pageRange.min === 'number' &&
    typeof pageRange.max === 'number' &&
    pageRange.min >= 3 &&
    pageRange.max <= 30 &&
    pageRange.min <= pageRange.max;

  if (!hasRange) return slides.slice(0, 20);
  const { min, max } = pageRange;
  let result = slides.slice(0, max);
  if (result.length < min) {
    const fillerCount = min - result.length;
    for (let i = 0; i < fillerCount; i++) {
      result.push({
        type: 'content',
        title: `补充内容 ${result.length + 1}`,
        bullets: ['核心概念', '典型应用/例题']
      });
    }
  }
  return result;
};

const textWordCount = (txt = '') => {
  if (!txt) return 0;
  return txt.trim().split(/\s+/).filter(Boolean).length;
};

const safeString = (v) => (typeof v === 'string' ? v : '');

const limitText = (txt, maxLen = 20000) => {
  const str = safeString(txt);
  return str.length > maxLen ? str.slice(0, maxLen) : str;
};

// ===== Exam/Quiz helpers =====
const clampPlan = (plan = {}) => {
  const safe = {};
  ['single', 'multiple', 'tf', 'short', 'essay'].forEach((key) => {
    const val = Number(plan[key]);
    safe[key] = Number.isFinite(val) && val > 0 ? Math.min(20, Math.max(0, Math.round(val))) : 0;
  });
  return safe;
};

const shuffle = (arr = []) => {
  const list = [...arr];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const pickFromBank = (plan, knowledgeScope = [], difficulty) => {
  const picked = [];
  const remaining = { ...plan };
  const scopeLower = (knowledgeScope || []).map((k) => (k || '').toLowerCase());
  const matchScope = (q) => {
    if (!scopeLower.length) return true;
    return (q.knowledgePoints || []).some((kp) => scopeLower.includes((kp || '').toLowerCase()));
  };
  const bankByType = QUESTION_BANK.reduce((acc, q) => {
    if (!acc[q.type]) acc[q.type] = [];
    acc[q.type].push(q);
    return acc;
  }, {});

  Object.keys(plan).forEach((type) => {
    const need = plan[type] || 0;
    if (!need) return;
    const pool = shuffle((bankByType[type] || []).filter((q) => matchScope(q) && (!difficulty || q.difficulty === difficulty)));
    while (remaining[type] > 0 && pool.length) {
      picked.push(pool.pop());
      remaining[type] -= 1;
    }
  });
  return { picked, remaining };
};

const defaultScoreByType = {
  single: 5,
  multiple: 6,
  tf: 2,
  short: 8,
  essay: 10
};

const normalizeLLMQuestion = (q = {}, fallbackType = 'single') => {
  const base = {
    id: genId(),
    type: q.type || fallbackType,
    stem: q.stem || '',
    knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints : [],
    difficulty: q.difficulty || '中等',
    score: Number(q.score) || defaultScoreByType[q.type] || 5,
    explanation: q.explanation || q.analysis || ''
  };
  if (base.type === 'single' || base.type === 'multiple') {
    const opts = Array.isArray(q.options) ? q.options : [];
    const normalizedOpts = opts
      .filter(Boolean)
      .map((opt, idx) => ({
        key: opt.key || String.fromCharCode(65 + idx),
        text: opt.text || opt
      }))
      .slice(0, 6);
    const ans = Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : [];
    return {
      ...base,
      type: base.type,
      options: normalizedOpts,
      answer: ans.map((a) => (typeof a === 'string' ? a.trim().toUpperCase() : a)).filter(Boolean)
    };
  }
  if (base.type === 'tf') {
    return { ...base, answer: Boolean(q.answer) };
  }
  return {
    ...base,
    type: base.type === 'essay' ? 'essay' : 'short',
    referenceAnswer: q.referenceAnswer || q.answer || '',
    gradingRubric: Array.isArray(q.gradingRubric) ? q.gradingRubric : [{ item: '要点完整', points: base.score }]
  };
};

const validateQuestions = (qs = []) => {
  const valid = [];
  qs.forEach((q) => {
    if (!q || !q.stem) return;
    const type = q.type;
    if (!['single', 'multiple', 'tf', 'short', 'essay'].includes(type)) return;
    const normalized = normalizeLLMQuestion(q, type);
    valid.push(normalized);
  });
  return valid;
};

const buildExamPrompt = ({ courseContext, knowledgeScope, difficulty, plan }) => {
  const planEntries = Object.entries(plan).filter(([, v]) => v > 0);
  const planText = planEntries.map(([k, v]) => `${k}:${v}题`).join('，');
  const schemaHint = {
    questions: [
      {
        type: 'single | multiple | tf | short | essay',
        stem: '题干',
        knowledgePoints: ['知识点1', '知识点2'],
        difficulty: '简单|中等|困难',
        score: 5,
        explanation: '解析',
        options: [{ key: 'A', text: '选项文本' }],
        answer: ['A']
      }
    ]
  };
  const sys = `你是严格的教育测验出题助手。必须且只能输出一个合法 JSON 对象。不要输出 Markdown、不要代码块、不要解释或注释。如果无法生成完整 JSON，请输出 {"error":"generation_failed"}。题目必须可用于自动判分，覆盖给定知识点与课程内容。客观题必须给正确答案与解析；主观题给参考答案与评分要点。`;
  const user = `
课程内容片段（可截断）：${courseContext}
知识点范围：${knowledgeScope.join('，') || '未指定'}
目标难度：${difficulty}
缺口题量计划：${planText || '无'}
要求：
- 题目紧扣课程内容与知识点，不要超纲。
- 单/多选选项 4~6 个，禁止“以上都对”类模糊选项。
- 每题提供解析 explanation。
- 主观题需 referenceAnswer 与 gradingRubric（小项加和=score）。
输出 JSON（不要 Markdown 代码块），示例结构：${JSON.stringify(schemaHint)}
`;
  return [
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ];
};

// ===== Grading helpers =====
const mapQuestionsById = (paper) => {
  const map = new Map();
  (paper?.questions || []).forEach((q) => {
    map.set(q.id, q);
  });
  return map;
};

const gradeObjective = ({ question, studentAnswer }) => {
  const maxScore = Number(question.score) || defaultScoreByType[question.type] || 0;
  if (!studentAnswer) {
    return {
      questionId: question.id,
      correct: false,
      score: 0,
      maxScore,
      correctAnswer: question.answer,
      studentAnswer,
      explanation: question.explanation || ''
    };
  }
  if (question.type === 'tf') {
    const correct = Boolean(studentAnswer.value) === Boolean(question.answer);
    return {
      questionId: question.id,
      correct,
      score: correct ? maxScore : 0,
      maxScore,
      correctAnswer: question.answer,
      studentAnswer,
      explanation: question.explanation || ''
    };
  }
  const studentChoices = Array.isArray(studentAnswer.selected) ? studentAnswer.selected : [];
  const correctChoices = Array.isArray(question.answer) ? question.answer : [];
  const correct =
    studentChoices.length === correctChoices.length &&
    studentChoices.every((c) => correctChoices.includes(c));
  return {
    questionId: question.id,
    correct,
    score: correct ? maxScore : 0,
    maxScore,
    correctAnswer: correctChoices,
    studentAnswer: studentChoices,
    explanation: question.explanation || ''
  };
};

const validateSubjectiveItem = (item, maxScore, questionId) => {
  if (!item || typeof item !== 'object') return null;
  const safeScore = Math.max(0, Math.min(maxScore, Number(item.score) || 0));
  return {
    questionId,
    score: safeScore,
    maxScore,
    studentAnswerText: item.studentAnswerText || '',
    referenceAnswer: item.referenceAnswer || '',
    rubric: Array.isArray(item.rubric) ? item.rubric : [],
    strengths: Array.isArray(item.strengths) ? item.strengths : [],
    weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses : [],
    suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],
    keywordCoverage: Array.isArray(item.keywordCoverage) ? item.keywordCoverage : undefined,
    semanticSimilarity: typeof item.semanticSimilarity === 'number' ? item.semanticSimilarity : undefined
  };
};

const buildSubjectiveGradingPrompt = ({ questionId, question, studentAnswerText }) => {
  const sys =
    '你是严格的课程助教批改器。必须按 rubric 逐项给分，score 为 0..maxScore 的数字。只输出 JSON，对象本身，不要 Markdown。';
  const user = {
    questionId,
    stem: question.stem,
    knowledgePoints: question.knowledgePoints || [],
    difficulty: question.difficulty || '中等',
    maxScore: Number(question.score) || defaultScoreByType[question.type] || 0,
    studentAnswerText,
    referenceAnswer: question.referenceAnswer || '',
    rubric: question.gradingRubric || question.rubric || [{ item: '要点完整', points: Number(question.score) || 5 }],
    keywords: question.keywords || question.knowledgePoints || []
  };
  return [
    { role: 'system', content: sys },
    { role: 'user', content: `请按以下 JSON schema 输出，不要代码块：${JSON.stringify(user)}` }
  ];
};

const buildReportEvaluationPrompt = ({ assignment, rawText, needComparison }) => {
  const sys =
    '你是严格的课程报告评估助手。只能输出一个合法 JSON 对象，不要 Markdown/代码块/解释/注释。若无法生成完整 JSON，输出 {"error":"generation_failed"}.';
  const user = {
    assignment: {
      title: assignment.title,
      description: assignment.description,
      knowledgePoints: assignment.knowledgePoints || [],
      rubric: assignment.rubric
    },
    studentReport: limitText(rawText, 20000),
    exemplar: assignment.exemplar ? limitText(assignment.exemplar.rawText || '', 12000) : '',
    needComparison
  };
  const schemaHint = {
    id: 'fb1',
    assignmentId: assignment.id,
    submissionId: 'subId',
    gradedAt: new Date().toISOString(),
    model: MODELSCOPE_MODEL,
    totalScore: 90,
    maxScore: 100,
    breakdown: {
      relevance: { score: 20, maxScore: 25, reasons: ['切题性高'] },
      structure: { score: 20, maxScore: 25, reasons: ['结构清晰'] },
      coverage: {
        score: 25,
        maxScore: 25,
        reasons: ['知识点覆盖充分'],
        missingKnowledgePoints: [],
        hitKnowledgePoints: ['反向传播']
      },
      language: {
        score: 20,
        maxScore: 25,
        reasons: ['表达流畅'],
        issues: [{ type: '用词', example: '模糊词', suggestion: '替换为准确术语' }]
      }
    },
    summary: '总体评价...',
    strengths: ['优点1', '优点2'],
    improvements: ['改进1', '改进2'],
    suggestedOutline: ['引言', '主体', '结论'],
    paragraphLevelAdvice: [
      { paragraphIndex: 1, issue: '缺少案例', suggestion: '补充具体实验案例' }
    ],
    comparison: needComparison
      ? {
          overallGapSummary: '与范例相比仍有差距...',
          missingSections: ['相关工作'],
          structureDiff: {
            studentOutline: ['引言', '方法'],
            exemplarOutline: ['引言', '背景', '方法', '实验'],
            suggestions: ['补充背景与实验章节']
          },
          keyPointDiff: {
            missing: ['梯度爆炸'],
            covered: ['反向传播'],
            exemplarHighlights: ['详细案例分析']
          },
          styleDiff: ['语言可更正式']
        }
      : undefined
  };
  return [
    { role: 'system', content: sys },
    {
      role: 'user',
      content: `根据 assignment 与 studentReport 进行评分，严格输出 JSON 对象：${JSON.stringify(schemaHint)}`
    },
    { role: 'user', content: JSON.stringify(user) }
  ];
};
// Helpers
const genId = () => Math.random().toString(36).slice(2, 10);
const getValidPageRange = (pageRange) =>
  pageRange &&
  typeof pageRange.min === 'number' &&
  typeof pageRange.max === 'number' &&
  pageRange.min >= 3 &&
  pageRange.max <= 30 &&
  pageRange.min <= pageRange.max
    ? { min: pageRange.min, max: pageRange.max }
    : null;

const buildErrorPayload = (err) => {
  const statusCode = err?.status || err?.statusCode || err?.response?.status || 500;
  const message =
    statusCode === 401
      ? '鉴权失败：请检查 MODELSCOPE_TOKEN'
      : statusCode === 429
        ? '请求过于频繁或额度不足，请稍后再试'
        : statusCode >= 500
          ? '模型服务异常，请稍后重试'
          : err?.message || '调用模型失败';
  return { statusCode, message, detail: err?.response?.data || err?.message };
};

const callDeepSeekExam = async ({ messages, retry = 0 }) => {
  const maxRetry = 2;
  try {
    const completion = await callDeepSeek({
      messages,
      stream: false,
      enableThinking: false,
      responseFormat: { type: 'json_object' }
    });
    const content = completion?.choices?.[0]?.message?.content;
    const raw = typeof content === 'string' ? content : JSON.stringify(content || '');
    console.log('[LLM raw length]', raw?.length || 0);
    console.log('[LLM raw head]', raw?.slice(0, 200) || '');
    console.log('[LLM raw tail]', raw?.slice(-200) || '');
    if (!raw) throw new Error('模型无返回');
    let data = raw;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    if (typeof data !== 'object' || !data.questions) {
      throw new Error('返回格式不含 questions');
    }
    return { data, meta: { model: MODELSCOPE_MODEL, usage: completion?.usage, retries: retry } };
  } catch (err) {
    if (retry < maxRetry) {
      const fixMessages = [
        ...messages,
        {
          role: 'user',
          content: `上次解析失败：${err?.message || err}. 请严格输出 JSON 对象 {questions:[...]}, 不要代码块，不要额外文字。`
        }
      ];
      return callDeepSeekExam({ messages: fixMessages, retry: retry + 1 });
    }
    throw err;
  }
};

const callDeepSeekSubjective = async ({ messages, retry = 0 }) => {
  const maxRetry = 2;
  try {
    const completion = await callDeepSeek({
      messages,
      stream: false,
      enableThinking: false,
      responseFormat: { type: 'json_object' }
    });
    const content = completion?.choices?.[0]?.message?.content;
    if (!content) throw new Error('模型无返回');
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    return { data, usage: completion?.usage, retries: retry };
  } catch (err) {
    if (retry < maxRetry) {
      const fix = [
        ...messages,
        {
          role: 'user',
          content: `上次解析失败：${err?.message || err}。请直接输出 JSON 对象，字段完整，score 为 0..maxScore`
        }
      ];
      return callDeepSeekSubjective({ messages: fix, retry: retry + 1 });
    }
    throw err;
  }
};

const callDeepSeekReport = async ({ messages, retry = 0 }) => {
  const maxRetry = 2;
  try {
    const completion = await callDeepSeek({
      messages,
      stream: false,
      enableThinking: false,
      responseFormat: { type: 'json_object' }
    });
    const content = completion?.choices?.[0]?.message?.content;
    const raw = typeof content === 'string' ? content : JSON.stringify(content || '');
    console.log('[Report LLM raw length]', raw?.length || 0);
    console.log('[Report LLM head]', raw?.slice(0, 200) || '');
    console.log('[Report LLM tail]', raw?.slice(-200) || '');
    if (!raw) throw new Error('模型无返回');
    const data = JSON.parse(raw);
    return { data, usage: completion?.usage, retries: retry };
  } catch (err) {
    if (retry < maxRetry) {
      const fix = [
        ...messages,
        {
          role: 'user',
          content:
            '你输出的 JSON 无法解析或不符合 schema，请重新输出单个 JSON 对象，不要 Markdown/解释。若无法生成，输出 {"error":"generation_failed"}。'
        }
      ];
      return callDeepSeekReport({ messages: fix, retry: retry + 1 });
    }
    throw err;
  }
};

app.post('/api/ai', async (req, res) => {
  const { task, payload, stream: streamFlag, enable_thinking } = req.body || {};
  const systemPrompt = systemPrompts[task];
  if (!systemPrompt) {
    return res.status(400).json({ error: 'Unsupported task' });
  }

  const stream = typeof streamFlag === 'boolean' ? streamFlag : defaultStreamByTask[task] || false;
  const enableThinking = Boolean(enable_thinking);
  const responseFormat = taskRequiresJson(task) && !stream ? { type: 'json_object' } : undefined;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: formatPayload(payload) }
  ];

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const sendSse = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    let finalContent = '';
    let reasoningContent = '';

    try {
      const completion = await callDeepSeek({ messages, stream: true, enableThinking, responseFormat });
      for await (const chunk of completion) {
        const delta = chunk.choices?.[0]?.delta || {};
        if (delta.reasoning_content) {
          reasoningContent += delta.reasoning_content;
          sendSse({ type: 'thinking', delta: delta.reasoning_content });
        }
        if (delta.content) {
          finalContent += delta.content;
          sendSse({ type: 'content', delta: delta.content });
        }
      }
      sendSse({ type: 'done', content: finalContent, reasoning: reasoningContent });
      res.end();
    } catch (err) {
      const statusCode = err?.status || err?.statusCode || err?.response?.status || 500;
      const message =
        statusCode === 401
          ? '鉴权失败：请检查 MODELSCOPE_TOKEN'
          : statusCode === 429
            ? '请求过于频繁或额度不足，请稍后再试'
            : statusCode >= 500
              ? '模型服务异常，请稍后重试'
              : err.message || '调用模型失败';
      if (res.headersSent) {
        sendSse({ type: 'error', error: message });
        return res.end();
      }
      return res.status(statusCode).json({ error: message, detail: err?.response?.data || err?.message });
    }
    return;
  }

  try {
    const completion = await callDeepSeek({ messages, stream: false, enableThinking, responseFormat });
    const message = completion?.choices?.[0]?.message || {};
    const rawContent = message.content ?? '';
    if (taskRequiresJson(task)) {
      const parsed = parseJsonFallback(rawContent);
      return res.json(parsed);
    }
    return res.json({ content: rawContent });
  } catch (err) {
    const statusCode = err?.status || err?.statusCode || err?.response?.status || 500;
    const message =
      statusCode === 401
        ? '鉴权失败：请检查 MODELSCOPE_TOKEN'
        : statusCode === 429
          ? '请求过于频繁或额度不足，请稍后再试'
          : statusCode >= 500
            ? '模型服务异常，请稍后重试'
            : err.message || '调用模型失败';
    return res.status(statusCode).json({ error: message, detail: err?.response?.data || err?.message });
  }
});

const pptSystemPrompt = `
你是教学课件生成助手。请严格输出 JSON，不要多余文字。
JSON 结构示例：
{
  "title": "课程主题",
  "subtitle": "副标题或场景/受众",
  "slides": [
    {
      "type": "content",
      "title": "本节标题",
      "bullets": ["要点1","要点2","要点3"],
      "speakerNotes": "讲解提纲",
      "imagePrompt": "配图提示"
    }
  ]
}
要求：
- 默认生成 6-12 页内容（含封面），每页 3-6 条要点。若收到页数区间要求，slides 数量必须落在该区间内；内容长则多页，短则少页，但必须在区间内。
- 每页 title 必须是短语，不超过 18 个字；bullets 每条不超过 24 字，3~6 条。
- bullets 不能与 title 完全相同，且不要出现“本页标题/标题/内容”等提示词。
- 不要出现 Markdown、不要额外说明，仅输出 JSON。`;

const buildRangeText = (pageRange) =>
  pageRange
    ? `目标页数区间：${pageRange.min} - ${pageRange.max} 页。内容足够长则靠近上限，较短则靠近下限，但必须落在区间内。`
    : '默认页数区间 6-12 页，可根据内容长短适当增减。';

const normalizeOutline = ({ rawOutline = {}, pageRange, fallbackTitle, fallbackSubtitle }) => {
  const slides = cleanSlides(rawOutline.slides || []);
  return {
    title: rawOutline.title || fallbackTitle || 'AI 生成课件',
    subtitle: rawOutline.subtitle || fallbackSubtitle || '',
    slides: applyPageRange(slides, pageRange)
  };
};

const generateOutline = async ({ text, audience, duration, style, pageRange }) => {
  const validRange = getValidPageRange(pageRange);
  const rangeText = buildRangeText(validRange);
  const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || 'AI 生成课件';
  const fallbackSubtitle = [audience, duration].filter(Boolean).join(' · ');
  const messages = [
    { role: 'system', content: pptSystemPrompt },
    {
      role: 'user',
      content: `内容:\n${text}\n受众:${audience || '未指定'}\n时长:${duration || '未指定'}\n风格:${style || 'modern'}\n${rangeText}`
    }
  ];
  const completion = await callDeepSeek({
    messages,
    stream: false,
    enableThinking: false,
    responseFormat: { type: 'json_object' }
  });
  const rawContent = completion?.choices?.[0]?.message?.content || '';
  const parsed = parseJsonFallback(rawContent);
  if (!parsed.data || !Array.isArray(parsed.data.slides) || !parsed.data.slides.length) {
    const error = new Error('模型未返回有效的幻灯片结构');
    error.detail = parsed.error || parsed.raw;
    throw error;
  }
  const outline = normalizeOutline({
    rawOutline: parsed.data,
    pageRange: validRange,
    fallbackTitle: firstLine,
    fallbackSubtitle
  });
  return { outline, parsed };
};

const themes = {
  modern: { title: '2F3E9E', subtitle: '4C6EF5', text: '1F2937', accent: '845EF7' },
  academic: { title: '0B7285', subtitle: '1C7ED6', text: '0B7285', accent: '15AABF' },
  vibrant: { title: 'C92A2A', subtitle: 'F76707', text: '2D1F18', accent: 'E8590C' },
  simple: { title: '1F2937', subtitle: '4B5563', text: '111827', accent: '6B7280' }
};

const getTheme = (style) => themes[style] || themes.modern;

const buildPptxFromOutline = async ({ outline, style, courseName, filenameHint }) => {
  const theme = getTheme(style);
  const safeOutline = {
    title: outline?.title || 'AI 生成课件',
    subtitle: outline?.subtitle || '',
    slides: cleanSlides(outline?.slides || [])
  };

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const cover = pptx.addSlide();
  cover.background = { color: 'FFFFFF' };
  cover.addText(safeOutline.title, {
    x: 0.7,
    y: 1.5,
    fontSize: 36,
    bold: true,
    color: theme.title
  });
  if (safeOutline.subtitle) {
    cover.addText(safeOutline.subtitle, { x: 0.8, y: 2.5, fontSize: 20, color: theme.subtitle });
  }

  safeOutline.slides.forEach((sl, idx) => {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addText(sl.title || `第 ${idx + 1} 页`, {
      x: 0.7,
      y: 0.5,
      fontSize: 32,
      bold: true,
      color: theme.title
    });
    const bullets = (sl.bullets || []).slice(0, 6);
    const bulletText = bullets.length ? bullets.map((b) => `• ${b}`).join('\n') : '• 核心概念\n• 典型应用/例题';
    s.addText(bulletText, {
      x: 0.9,
      y: 1.6,
      fontSize: 18,
      color: theme.text,
      lineSpacing: 26
    });
    if (sl.speakerNotes) {
      s.addNotes(sl.speakerNotes);
    }
  });

  const buffer = await pptx.write('nodebuffer');
  const dateStr = dayjs().format('MMDD');
  const coursePart = sanitizeFilePart(filenameHint || courseName || safeOutline.title);
  const filename = sanitizeFileName(`AI课件_${coursePart}_${dateStr}.pptx`);
  return { buffer, filename };
};

app.post('/api/ppt/outline', async (req, res) => {
  const { text, audience, duration, style, pageRange } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    const { outline } = await generateOutline({ text, audience, duration, style, pageRange });
    return res.json({ outline });
  } catch (err) {
    const { statusCode, message, detail } = buildErrorPayload(err);
    return res.status(statusCode).json({ error: message, detail: err?.detail || detail });
  }
});

app.post('/api/ppt/build', async (req, res) => {
  const { outline, courseName, style, filenameHint, pageRange } = req.body || {};
  if (!outline || typeof outline !== 'object') {
    return res.status(400).json({ error: 'outline is required' });
  }
  const normalizedOutline = normalizeOutline({
    rawOutline: outline,
    pageRange: getValidPageRange(pageRange),
    fallbackTitle: outline?.title,
    fallbackSubtitle: outline?.subtitle
  });
  if (!normalizedOutline.slides || !normalizedOutline.slides.length) {
    return res.status(400).json({ error: 'outline.slides is required' });
  }
  try {
    const { buffer, filename } = await buildPptxFromOutline({
      outline: normalizedOutline,
      style,
      courseName: courseName || normalizedOutline.title,
      filenameHint
    });
    res.setHeader('Content-Disposition', buildDisposition(filename));
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('PPT build failed', err);
    const statusCode = err?.status || err?.statusCode || 500;
    const message = err?.message || '生成 PPT 失败，请稍后重试';
    return res.status(statusCode).json({ error: message, detail: err?.detail || err?.stack || err });
  }
});

// Backward-compatible单步生成
app.post('/api/ppt', async (req, res) => {
  const { text, audience, duration, style, pageRange } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  try {
    const { outline } = await generateOutline({ text, audience, duration, style, pageRange });
    const { buffer, filename } = await buildPptxFromOutline({
      outline,
      style,
      courseName: outline.title
    });
    res.setHeader('Content-Disposition', buildDisposition(filename));
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    return res.send(Buffer.from(buffer));
  } catch (err) {
    const { statusCode, message, detail } = buildErrorPayload(err);
    return res.status(statusCode).json({ error: message, detail: err?.detail || detail });
  }
});

// Seed sample data for QA & forum
const seedData = () => {
  if (!db.data.qaQuestions || db.data.qaQuestions.length === 0) {
    const sampleQuestionId = genId();
    const answerId = genId();
    db.data.qaQuestions = [
      {
        id: sampleQuestionId,
        title: '如何理解反向传播中的梯度消失？',
        content: '在多层网络中梯度会逐层衰减，有什么实用的规避策略？',
        author: 'Alice',
        createdAt: Date.now() - 1000 * 60 * 60 * 5,
        answers: [
          {
            id: answerId,
            content: '可以使用ReLU/LeakyReLU、批归一化、残差结构，并合理初始化权重。',
            author: 'Bob',
            createdAt: Date.now() - 1000 * 60 * 60 * 4
          }
        ],
        acceptedAnswerId: answerId
      },
      {
        id: genId(),
        title: '文本分类任务中，BERT 还是 RNN 更合适？',
        content: '课程项目需要做新闻分类，是否必须用 BERT？',
        author: 'Carol',
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
        answers: [],
        acceptedAnswerId: null
      }
    ];
  }

  if (!db.data.forumPosts || db.data.forumPosts.length === 0) {
    db.data.forumPosts = [
      {
        id: genId(),
        title: '分享：我用残差网络提升了 5% 的准确率',
        content: '在课程作业里把基础 CNN 换成 ResNet18，配合余弦退火学习率，准确率有 5% 提升。',
        author: 'Dave',
        createdAt: Date.now() - 1000 * 60 * 60 * 3,
        comments: [
          {
            id: genId(),
            content: '有代码仓库吗？想参考一下实现细节。',
            author: 'Eve',
            createdAt: Date.now() - 1000 * 60 * 60 * 2
          }
        ]
      },
      {
        id: genId(),
        title: '期中报告写作提纲',
        content: '我整理了“背景-方法-实验-结论”的提纲，附带常见坑点，欢迎补充。',
        author: 'Frank',
        createdAt: Date.now() - 1000 * 60 * 30,
        comments: []
      }
    ];
  }
  db.write();
};
seedData();

// Q&A routes
app.get('/api/qa/questions', (req, res) => {
  db.read();
  res.json(db.data.qaQuestions);
});

app.post('/api/qa/questions', (req, res) => {
  db.read();
  const question = {
    id: genId(),
    title: req.body.title || '未命名问题',
    content: req.body.content || '',
    author: req.body.author || '匿名',
    createdAt: Date.now(),
    answers: [],
    acceptedAnswerId: null
  };
  db.data.qaQuestions.unshift(question);
  db.write();
  res.json(question);
});

app.get('/api/qa/questions/:id', (req, res) => {
  db.read();
  const question = db.data.qaQuestions.find((q) => q.id === req.params.id);
  if (!question) return res.status(404).json({ error: 'not found' });
  res.json(question);
});

app.post('/api/qa/questions/:id/answers', (req, res) => {
  db.read();
  const question = db.data.qaQuestions.find((q) => q.id === req.params.id);
  if (!question) return res.status(404).json({ error: 'not found' });
  const answer = {
    id: genId(),
    content: req.body.content || '',
    author: req.body.author || '匿名',
    createdAt: Date.now()
  };
  question.answers.push(answer);
  db.write();
  res.json(answer);
});

app.post('/api/qa/questions/:id/accept', (req, res) => {
  db.read();
  const question = db.data.qaQuestions.find((q) => q.id === req.params.id);
  if (!question) return res.status(404).json({ error: 'not found' });
  const { answerId, requesterName } = req.body;
  if (requesterName && requesterName !== question.author) {
    return res.status(403).json({ error: 'only author can accept' });
  }
  const exists = question.answers.find((a) => a.id === answerId);
  if (!exists) return res.status(404).json({ error: 'answer not found' });
  question.acceptedAnswerId = answerId;
  db.write();
  res.json({ ok: true });
});

app.delete('/api/qa/questions/:id', (req, res) => {
  db.read();
  const question = db.data.qaQuestions.find((q) => q.id === req.params.id);
  if (!question) return res.status(404).json({ error: 'not found' });
  const { requesterName } = req.body || {};
  if (!requesterName || requesterName !== question.author) {
    return res.status(403).json({ error: 'only author can delete' });
  }
  db.data.qaQuestions = db.data.qaQuestions.filter((q) => q.id !== req.params.id);
  db.write();
  res.json({ ok: true });
});

// Forum routes
app.get('/api/forum/posts', (req, res) => {
  db.read();
  res.json(db.data.forumPosts);
});

app.post('/api/forum/posts', (req, res) => {
  db.read();
  const post = {
    id: genId(),
    title: req.body.title || '未命名帖子',
    content: req.body.content || '',
    author: req.body.author || '匿名',
    createdAt: Date.now(),
    comments: []
  };
  db.data.forumPosts.unshift(post);
  db.write();
  res.json(post);
});

app.post('/api/forum/posts/:id/comments', (req, res) => {
  db.read();
  const post = db.data.forumPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  const comment = {
    id: genId(),
    content: req.body.content || '',
    author: req.body.author || '匿名',
    createdAt: Date.now()
  };
  post.comments.push(comment);
  db.write();
  res.json(comment);
});

app.delete('/api/forum/posts/:id', (req, res) => {
  db.read();
  const post = db.data.forumPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'not found' });
  const { requesterName } = req.body || {};
  if (!requesterName || requesterName !== post.author) {
    return res.status(403).json({ error: 'only author can delete' });
  }
  db.data.forumPosts = db.data.forumPosts.filter((p) => p.id !== req.params.id);
  db.write();
  res.json({ ok: true });
});

// Socket.IO rooms (in-memory)
const roomUsers = new Map(); // roomId -> Map<socketId, {name,status}>
const socketRooms = new Map(); // socketId -> roomId

const broadcastUsers = (roomId) => {
  const users = roomUsers.get(roomId);
  if (!users) return;
  const list = Array.from(users.values());
  io.to(roomId).emit('room:users', { roomId, users: list });
};

io.on('connection', (socket) => {
  socket.on('room:join', ({ roomId, name }) => {
    if (!roomId || !name) return;
    socket.join(roomId);
    socketRooms.set(socket.id, roomId);
    if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
    roomUsers.get(roomId).set(socket.id, { name, status: 'focus' });
    broadcastUsers(roomId);
    io.to(roomId).emit('room:message', {
      roomId,
      message: { id: genId(), name: '系统', text: `${name} 加入了房间`, ts: Date.now() }
    });
  });

  socket.on('room:leave', ({ roomId, name }) => {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId).delete(socket.id);
      broadcastUsers(roomId);
    }
    io.to(roomId).emit('room:message', {
      roomId,
      message: { id: genId(), name: '系统', text: `${name} 离开了房间`, ts: Date.now() }
    });
  });

  socket.on('room:message', ({ roomId, name, text }) => {
    if (!roomId || !text) return;
    io.to(roomId).emit('room:message', {
      roomId,
      message: { id: genId(), name, text, ts: Date.now() }
    });
  });

  socket.on('room:status', ({ roomId, name, status }) => {
    if (!roomId || !roomUsers.has(roomId)) return;
    const user = roomUsers.get(roomId).get(socket.id);
    if (user) {
      user.status = status;
      broadcastUsers(roomId);
      io.to(roomId).emit('room:message', {
        roomId,
        message: { id: genId(), name: '系统', text: `${name} 现在${status === 'focus' ? '专注' : '休息'}`, ts: Date.now() }
      });
    }
  });

  socket.on('disconnect', () => {
    const roomId = socketRooms.get(socket.id);
    if (roomId && roomUsers.has(roomId)) {
      const users = roomUsers.get(roomId);
      const user = users.get(socket.id);
      users.delete(socket.id);
      broadcastUsers(roomId);
      if (user) {
        io.to(roomId).emit('room:message', {
          roomId,
          message: { id: genId(), name: '系统', text: `${user.name} 断开连接`, ts: Date.now() }
        });
      }
    }
    socketRooms.delete(socket.id);
  });
});

// ===== Exam generation =====
app.post('/api/exams/generate', async (req, res) => {
  const body = req.body || {};
  const courseId = body.courseId || 'deep-learning';
  const knowledgeScope = Array.isArray(body.knowledgeScope) ? body.knowledgeScope : [];
  const difficulty = body.difficulty || '中等';
  const questionPlan = clampPlan(body.questionPlan || {});
  const durationMinutes = Number(body.durationMinutes) || 20;

  const totalNeed = Object.values(questionPlan).reduce((a, b) => a + b, 0);
  if (!totalNeed) {
    return res.status(400).json({ error: { code: 'INVALID_PLAN', message: '题量为空，请至少选择 1 道题' } });
  }

  try {
    const courseContext = getMockCourseContent(courseId);
    const { picked, remaining } = pickFromBank(questionPlan, knowledgeScope, difficulty);
    const needLLM = Object.values(remaining).some((v) => v > 0);
    let llmQuestions = [];
    let retries = 0;
    let modelMeta = {};

    if (needLLM) {
      const messages = buildExamPrompt({ courseContext, knowledgeScope, difficulty, plan: remaining });
      const resp = await callDeepSeekExam({ messages, retry: 0 });
      retries = resp?.meta?.retries || 0;
      modelMeta = { model: MODELSCOPE_MODEL, tokens: resp?.meta?.usage?.total_tokens, retries };
      const rawQs = Array.isArray(resp?.data?.questions) ? resp.data.questions : [];
      llmQuestions = validateQuestions(rawQs);
    }

    const allQuestions = [...picked, ...llmQuestions].map((q) => ({
      ...q,
      id: q.id || genId(),
      score: Number(q.score) || defaultScoreByType[q.type] || 5,
      knowledgePoints: Array.isArray(q.knowledgePoints) ? q.knowledgePoints : []
    }));

    const totalScore = allQuestions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
    const source =
      picked.length && llmQuestions.length ? 'mixed' : picked.length ? 'bank_only' : 'llm_only';
    const paper = {
      id: genId(),
      title: body.title || `AI测验-${dayjs().format('MMDD HH:mm')}`,
      courseId,
      createdBy: body.createdBy || 'teacher',
      createdAt: new Date().toISOString(),
      difficulty,
      knowledgeScope,
      durationMinutes,
      totalScore,
      questions: allQuestions,
      meta: { ...modelMeta, source }
    };
    db.read();
    db.data.examPapers = db.data.examPapers || [];
    db.data.examPapers.unshift(paper);
    db.write();
    return res.json({ paper });
  } catch (err) {
    console.error('generate exam failed', err);
    return res.status(500).json({ error: { code: 'GEN_FAIL', message: err?.message || '生成失败' } });
  }
});

app.get('/api/exams', (req, res) => {
  db.read();
  const { courseId } = req.query || {};
  const list = (db.data.examPapers || []).filter((p) => !courseId || p.courseId === courseId);
  res.json({ papers: list });
});

app.post('/api/exams', (req, res) => {
  const paper = req.body?.paper;
  if (!paper || !paper.id) {
    return res.status(400).json({ error: { code: 'INVALID_PAPER', message: '缺少试卷数据' } });
  }
  db.read();
  db.data.examPapers = db.data.examPapers || [];
  db.data.examPapers.unshift(paper);
  db.write();
  res.json({ ok: true });
});

app.post('/api/grading/grade', async (req, res) => {
  try {
    const { paperId, submission } = req.body || {};
    if (!paperId) return res.status(400).json({ error: { message: '缺少 paperId' } });
    db.read();
    const paper = (db.data.examPapers || []).find((p) => p.id === paperId);
    if (!paper) return res.status(404).json({ error: { message: '试卷不存在' } });
    const answers = submission?.answers || {};
    const rawText = submission?.rawText || '';
    const objective = [];
    const subjective = [];

    for (const q of paper.questions || []) {
      const ans = answers[q.id];
      if (q.type === 'single' || q.type === 'multiple' || q.type === 'tf') {
        objective.push(gradeObjective({ question: q, studentAnswer: ans }));
      } else {
        const studentAnswerText = ans?.text || rawText || '';
        const messages = buildSubjectiveGradingPrompt({ questionId: q.id, question: q, studentAnswerText });
        const resp = await callDeepSeekSubjective({ messages, retry: 0 });
        const validated = validateSubjectiveItem(
          resp.data,
          Number(q.score) || defaultScoreByType[q.type] || 0,
          q.id
        );
        if (!validated) throw new Error('主观题批改解析失败');
        subjective.push(validated);
      }
    }

    const maxScore = paper.questions.reduce(
      (s, q) => s + (Number(q.score) || defaultScoreByType[q.type] || 0),
      0
    );
    const totalScore =
      objective.reduce((s, o) => s + (Number(o.score) || 0), 0) +
      subjective.reduce((s, o) => s + (Number(o.score) || 0), 0);

    const result = {
      id: genId(),
      paperId,
      submissionId: submission?.id || genId(),
      gradedAt: new Date().toISOString(),
      gradedBy: req.body?.gradedBy || 'teacher',
      totalScore,
      maxScore,
      objective,
      subjective,
      meta: { model: MODELSCOPE_MODEL, confidence: 'medium' }
    };

    db.data.examGrades = db.data.examGrades || [];
    db.data.examGrades.unshift(result);
    db.write();
    return res.json({ result });
  } catch (err) {
    console.error('grading failed', err);
    return res.status(500).json({ error: { message: err?.message || '批改失败' } });
  }
});

app.post('/api/grading/save', (req, res) => {
  const { result } = req.body || {};
  if (!result || !result.id) return res.status(400).json({ error: { message: '缺少 result' } });
  db.read();
  db.data.examGrades = db.data.examGrades || [];
  db.data.examGrades = [result, ...db.data.examGrades].slice(0, 100);
  db.write();
  res.json({ ok: true });
});

// ===== Report assignments/submissions/feedback =====
app.post('/api/reportAssignments', (req, res) => {
  const body = req.body || {};
  const id = body.id || genId();
  const assignment = {
    id,
    courseId: body.courseId || 'default-course',
    title: body.title || '未命名作业',
    description: body.description || '',
    knowledgePoints: Array.isArray(body.knowledgePoints) ? body.knowledgePoints : [],
    dueAt: body.dueAt || null,
    rubric: body.rubric || { relevance: 0.25, structure: 0.25, coverage: 0.25, language: 0.25 },
    exemplar: body.exemplar || null,
    createdBy: body.createdBy || 'teacher',
    createdAt: body.createdAt || new Date().toISOString()
  };
  db.read();
  db.data.reportAssignments = [assignment, ...db.data.reportAssignments.filter((a) => a.id !== id)].slice(0, 50);
  db.write();
  return res.json({ assignment });
});

app.get('/api/reportAssignments', (req, res) => {
  db.read();
  const { courseId } = req.query || {};
  const list = (db.data.reportAssignments || []).filter((a) => !courseId || a.courseId === courseId);
  res.json({ assignments: list });
});

app.post('/api/reportSubmissions', (req, res) => {
  const body = req.body || {};
  if (!body.assignmentId || !body.rawText) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '缺少 assignmentId 或 rawText' } });
  }
  const submission = {
    id: body.id || genId(),
    assignmentId: body.assignmentId,
    studentId: body.studentId || 'student',
    studentName: body.studentName || '学生',
    submittedAt: new Date().toISOString(),
    format: body.format || 'paste',
    fileMeta: body.fileMeta,
    rawText: body.rawText,
    wordCount: textWordCount(body.rawText)
  };
  db.read();
  db.data.reportSubmissions = [submission, ...db.data.reportSubmissions.filter((s) => s.id !== submission.id)].slice(
    0,
    100
  );
  db.write();
  res.json({ submission });
});

app.get('/api/reports/feedback', (req, res) => {
  const { submissionId } = req.query || {};
  if (!submissionId) return res.status(400).json({ error: { message: '缺少 submissionId' } });
  db.read();
  const feedback = (db.data.reportFeedback || []).find((f) => f.submissionId === submissionId);
  res.json({ feedback: feedback || null });
});

app.post('/api/reports/evaluate', async (req, res) => {
  try {
    const { assignmentId, submissionId, rawText } = req.body || {};
    if (!assignmentId || !submissionId || !rawText) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '缺少必要参数' } });
    }
    db.read();
    const assignment = (db.data.reportAssignments || []).find((a) => a.id === assignmentId);
    if (!assignment) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '作业不存在' } });
    const needComparison = Boolean(assignment.exemplar?.rawText);
    const messages = buildReportEvaluationPrompt({ assignment, rawText, needComparison });
    const resp = await callDeepSeekReport({ messages, retry: 0 });
    const fb = resp.data || {};

    const maxScore = 100;
    const breakdown = fb.breakdown || {
      relevance: { score: 0, maxScore: 25, reasons: [] },
      structure: { score: 0, maxScore: 25, reasons: [] },
      coverage: { score: 0, maxScore: 25, reasons: [], missingKnowledgePoints: [], hitKnowledgePoints: [] },
      language: { score: 0, maxScore: 25, reasons: [], issues: [] }
    };
    const totalScore =
      (Number(breakdown.relevance.score) || 0) +
      (Number(breakdown.structure.score) || 0) +
      (Number(breakdown.coverage.score) || 0) +
      (Number(breakdown.language.score) || 0);

    const feedback = {
      id: fb.id || genId(),
      assignmentId,
      submissionId,
      gradedAt: new Date().toISOString(),
      model: MODELSCOPE_MODEL,
      totalScore,
      maxScore,
      breakdown,
      summary: fb.summary || '',
      strengths: fb.strengths || [],
      improvements: fb.improvements || [],
      suggestedOutline: fb.suggestedOutline || [],
      paragraphLevelAdvice: fb.paragraphLevelAdvice || [],
      comparison: fb.comparison,
      meta: { retries: resp.retries || 0, confidence: 'medium' }
    };

    db.data.reportFeedback = [feedback, ...db.data.reportFeedback.filter((f) => f.submissionId !== submissionId)].slice(
      0,
      100
    );
    db.write();
    return res.json({ feedback });
  } catch (err) {
    console.error('report evaluate failed', err);
    return res.status(500).json({ error: { code: 'EVAL_FAIL', message: err?.message || '评估失败' } });
  }
});

// ===== Submission parse (minimal) =====
const uploadParser = multer({ storage: multer.memoryStorage() });
app.post('/api/submissions/parse', uploadParser.single('file'), async (req, res) => {
  try {
    const textBody = req.body?.text;
    if (textBody && typeof textBody === 'string' && textBody.trim()) {
      return res.json({
        rawText: textBody.trim(),
        answers: {},
        submission: {
          id: randomUUID(),
          rawText: textBody.trim(),
          answers: {},
          source: 'paste',
          submittedAt: new Date().toISOString()
        }
      });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '缺少文件或文本' } });
    }
    const mime = file.mimetype || '';
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!['txt', 'md'].includes(ext)) {
      return res.status(400).json({ error: { code: 'UNSUPPORTED_FORMAT', message: '暂不支持该格式，请粘贴文本或上传 txt/md' } });
    }
    const rawText = file.buffer.toString('utf8');
    return res.json({
      rawText,
      answers: {},
      submission: {
        id: randomUUID(),
        rawText,
        answers: {},
        source: 'upload',
        fileMeta: { name: file.originalname, size: file.size, mime },
        submittedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('parse submission failed', err);
    return res.status(500).json({ error: '解析失败' });
  }
});

// ===== Report parse =====
app.post('/api/reports/parse', uploadParser.single('file'), async (req, res) => {
  try {
    const textBody = req.body?.text;
    if (textBody && typeof textBody === 'string' && textBody.trim()) {
      const rawText = textBody.trim();
      return res.json({
        rawText,
        format: 'paste',
        wordCount: textWordCount(rawText)
      });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: '缺少文件或文本' } });
    }
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (['txt', 'md'].includes(ext)) {
      const rawText = file.buffer.toString('utf8');
      return res.json({
        rawText,
        format: ext,
        fileMeta: { name: file.originalname, size: file.size, mime: file.mimetype },
        wordCount: textWordCount(rawText)
      });
    }
    return res.status(400).json({
      error: { code: 'UNSUPPORTED', message: '暂不支持此格式，请改为上传 txt/md 或粘贴正文' }
    });
  } catch (err) {
    console.error('report parse failed', err);
    return res.status(500).json({ error: { code: 'PARSE_FAIL', message: '解析失败' } });
  }
});

// PPT -> Video (PDF -> PNG -> VOD)
const { registerPptToVideoRoutes } = require('./pptToVideo');
registerPptToVideoRoutes(app);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
