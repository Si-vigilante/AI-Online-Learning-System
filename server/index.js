const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { LowSync, JSONFileSync } = require('lowdb');
const path = require('path');

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

// Helpers
const genId = () => Math.random().toString(36).slice(2, 10);

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
