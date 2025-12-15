require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { LowSync, JSONFileSync } = require('lowdb');
const path = require('path');
const { OpenAI } = require('openai');
const PptxGenJS = require('pptxgenjs');
const dayjs = require('dayjs');

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
const db = new LowSync(adapter, { qaQuestions: [], forumPosts: [] });
db.read();
db.data = db.data || { qaQuestions: [], forumPosts: [] };

// ModelScope / DeepSeek config
const MODELSCOPE_BASE_URL = 'https://api-inference.modelscope.cn/v1';
const MODELSCOPE_MODEL = process.env.MODELSCOPE_MODEL || 'deepseek-ai/DeepSeek-V3.2';
const openai = new OpenAI({
  baseURL: MODELSCOPE_BASE_URL,
  apiKey: process.env.MODELSCOPE_TOKEN
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
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40) || 'AI课件';
};

const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return 'AI课件.pptx';
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
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

// Helpers
const genId = () => Math.random().toString(36).slice(2, 10);

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

app.post('/api/ppt', async (req, res) => {
  const { text, audience, duration, style, pageRange } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  const hasRange =
    pageRange &&
    typeof pageRange.min === 'number' &&
    typeof pageRange.max === 'number' &&
    pageRange.min >= 3 &&
    pageRange.max <= 30 &&
    pageRange.min <= pageRange.max;

  const rangeText = hasRange
    ? `目标页数区间：${pageRange.min} - ${pageRange.max} 页。内容足够长则靠近上限，较短则靠近下限，但必须落在区间内。`
    : '默认页数区间 6-12 页，可根据内容长短适当增减。';

  const messages = [
    { role: 'system', content: pptSystemPrompt },
    {
      role: 'user',
      content: `内容:\n${text}\n受众:${audience || '未指定'}\n时长:${duration || '未指定'}\n风格:${style || 'modern'}\n${rangeText}`
    }
  ];
  try {
    const completion = await callDeepSeek({
      messages,
      stream: false,
      enableThinking: false,
      responseFormat: { type: 'json_object' }
    });
    const rawContent = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseJsonFallback(rawContent);
    const data = parsed.data || {};
    if (!data.slides || !Array.isArray(data.slides) || !data.slides.length) {
      return res.status(500).json({ error: '模型未返回有效的幻灯片结构', detail: parsed.error || parsed.raw });
    }

    // derive course name
    const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) || '';
    const courseName = sanitizeFilePart(data.title || firstLine || 'AI课件');

    // clean slides
    const cleanedSlides = cleanSlides(data.slides);

    // apply page range constraints
    const slidesForUse = applyPageRange(cleanedSlides, pageRange);

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    // Cover
    const cover = pptx.addSlide();
    cover.background = { color: 'FFFFFF' };
    cover.addText(data.title || firstLine || 'AI 生成课件', {
      x: 0.7,
      y: 1.6,
      fontSize: 36,
      bold: true,
      color: '2F3E9E'
    });
    cover.addText(data.subtitle || audience || '', { x: 0.8, y: 2.6, fontSize: 20, color: '555555' });

    // Content slides
    slidesForUse.forEach((sl, idx) => {
      const s = pptx.addSlide();
      s.background = { color: 'FFFFFF' };
      s.addText(sl.title || `第 ${idx + 1} 页`, {
        x: 0.7,
        y: 0.4,
        fontSize: 32,
        bold: true,
        color: '1F2937'
      });
      const bullets = (sl.bullets || []).slice(0, 6);
      const bulletText = bullets.length ? bullets.map((b) => `• ${b}`).join('\n') : '• 核心概念\n• 典型应用/例题';
      s.addText(bulletText, {
        x: 0.9,
        y: 1.6,
        fontSize: 18,
        color: '374151',
        lineSpacing: 26
      });
      if (sl.speakerNotes) {
        s.addNotes(sl.speakerNotes);
      }
    });

    const buffer = await pptx.write('nodebuffer');
    const dateStr = dayjs().format('MMDD');
    const filename = sanitizeFileName(`AI课件_${courseName}_${dateStr}.pptx`);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    return res.send(Buffer.from(buffer));
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
