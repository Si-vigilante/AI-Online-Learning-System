import React, { useEffect, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Tabs } from '../design-system/Tabs';
import { apiDelete, apiGet, apiPost } from '../../lib/api';
import { MessageCircle, Check, Loader2 } from 'lucide-react';

export function StudyHub() {
  const [activeTab, setActiveTab] = useState('forum');
  const [nickname, setNickname] = useState(() => {
    const stored = localStorage.getItem('studyhub-name');
    return stored || `User-${Math.floor(Math.random() * 9000 + 1000)}`;
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingQA, setLoadingQA] = useState(false);
  const [loadingForum, setLoadingForum] = useState(false);
  const [qaOffline, setQaOffline] = useState(false);
  const [forumOffline, setForumOffline] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const sampleQuestions = [
    {
      id: 'sample-qa-1',
      title: '如何理解反向传播中的梯度消失？',
      content: '在多层网络中梯度会逐层衰减，有什么实用的规避策略？',
      author: 'Alice',
      createdAt: Date.now() - 3600 * 1000,
      answers: [
        {
          id: 'sample-ans-1',
          content: '使用ReLU/残差/BN以及合适初始化可以缓解。',
          author: 'Bob',
          createdAt: Date.now() - 3500 * 1000
        }
      ],
      acceptedAnswerId: 'sample-ans-1'
    },
    {
      id: 'sample-qa-2',
      title: 'BERT 微调新闻分类需要多大 batch size？',
      content: 'GPU 只有 8G 显存，batch size 过大会 OOM，有什么建议？',
      author: 'Carol',
      createdAt: Date.now() - 7200 * 1000,
      answers: [],
      acceptedAnswerId: null
    },
    {
      id: 'sample-qa-3',
      title: 'LSTM 和 Transformer 在长序列上的差异？',
      content: '课程作业要处理 1k 长度文本，Transformer 会更合适吗？',
      author: 'Dan',
      createdAt: Date.now() - 5400 * 1000,
      answers: [],
      acceptedAnswerId: null
    },
    {
      id: 'sample-qa-4',
      title: '卷积核大小对图像分类的影响？',
      content: '3x3 vs 5x5 卷积对小数据集分类效果差异大吗？',
      author: 'Eve',
      createdAt: Date.now() - 8000 * 1000,
      answers: [],
      acceptedAnswerId: null
    },
    {
      id: 'sample-qa-5',
      title: '学习率预热和余弦退火怎么搭配？',
      content: 'Warmup + Cosine 在小型模型上是否有明显收益？',
      author: 'Frank',
      createdAt: Date.now() - 4000 * 1000,
      answers: [],
      acceptedAnswerId: null
    }
  ];

  const samplePosts = [
    {
      id: 'sample-post-1',
      title: '分享：我用残差网络提升了 5% 的准确率',
      content: '把基础 CNN 换成 ResNet18 + 余弦退火，准确率提升 5%。',
      author: 'Dave',
      createdAt: Date.now() - 7200 * 1000,
      comments: [
        { id: 'sample-comment-1', content: '有代码链接吗？', author: 'Eve', createdAt: Date.now() - 7000 * 1000 }
      ]
    },
    {
      id: 'sample-post-2',
      title: '期中报告写作提纲',
      content: '整理了“背景-方法-实验-结论”模板，附常见坑点，欢迎补充。',
      author: 'Frank',
      createdAt: Date.now() - 3600 * 1000,
      comments: []
    },
    {
      id: 'sample-post-3',
      title: 'Transformer 训练踩坑记录',
      content: '记录了显存爆炸、梯度消失、学习率设置等问题的解决方案。',
      author: 'Grace',
      createdAt: Date.now() - 5400 * 1000,
      comments: []
    },
    {
      id: 'sample-post-4',
      title: '数据增强对小样本的帮助',
      content: 'CutMix/Mixup 在 CIFAR10 上的对比实验，提升约 2%。',
      author: 'Heidi',
      createdAt: Date.now() - 8000 * 1000,
      comments: []
    },
    {
      id: 'sample-post-5',
      title: 'GPU 不足时的训练技巧',
      content: '梯度累积、混合精度、减小 batch size 的实测效果。',
      author: 'Ivan',
      createdAt: Date.now() - 6000 * 1000,
      comments: []
    },
    {
      id: 'sample-post-6',
      title: '数字媒体技术：短视频智能剪辑方案',
      content: '用镜头检测 + 语音转字幕 + 关键帧选取，自动剪出 30s 精华片段，欢迎讨论实现细节。',
      author: 'Judy',
      createdAt: Date.now() - 4500 * 1000,
      comments: [
        { id: 'sample-comment-6', content: '转场和音乐怎么自动匹配？', author: 'Ken', createdAt: Date.now() - 4300 * 1000 }
      ]
    },
    {
      id: 'sample-post-7',
      title: '实时虚拟主播管线搭建',
      content: '数字人驱动方案：TTS + 表情/肢体驱动 + OBS 推流，延迟控制在 300ms 内的经验分享。',
      author: 'Lily',
      createdAt: Date.now() - 3200 * 1000,
      comments: []
    },
    {
      id: 'sample-post-8',
      title: 'WebGL 做交互式 3D 教材的小技巧',
      content: '用 three.js 做 3D 场景交互，注意模型压缩、贴图大小和抗锯齿设置，帧率能提升不少。',
      author: 'Ming',
      createdAt: Date.now() - 2800 * 1000,
      comments: []
    }
  ];

  const makeLocalId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

  const fetchQA = async () => {
    setLoadingQA(true);
    try {
      const data = await apiGet<any[]>('/api/qa/questions');
      setQuestions(data);
      setQaOffline(false);
    } catch (err) {
      console.warn('加载问答失败，使用示例数据', err);
      setQuestions(sampleQuestions);
      setQaOffline(true);
    } finally {
      setLoadingQA(false);
    }
  };

  const fetchForum = async () => {
    setLoadingForum(true);
    try {
      const data = await apiGet<any[]>('/api/forum/posts');
      setPosts(data);
      setForumOffline(false);
    } catch (err) {
      console.warn('加载论坛失败，使用示例数据', err);
      setPosts(samplePosts);
      setForumOffline(true);
    } finally {
      setLoadingForum(false);
    }
  };

  useEffect(() => {
    fetchQA();
    fetchForum();
  }, []);

  const handleCreateQuestion = async () => {
    if (!newQuestion.title.trim()) return;
    try {
      await apiPost('/api/qa/questions', { ...newQuestion, author: nickname });
      setNewQuestion({ title: '', content: '' });
      fetchQA();
    } catch (err) {
      console.error('发布失败', err);
      setQaOffline(true);
      const local = {
        id: makeLocalId(),
        title: newQuestion.title,
        content: newQuestion.content,
        author: nickname || '匿名',
        createdAt: Date.now(),
        answers: [],
        acceptedAnswerId: null
      };
      setQuestions((prev) => [local, ...prev]);
      setNewQuestion({ title: '', content: '' });
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    try {
      await apiPost(`/api/qa/questions/${questionId}/answers`, { content: answerText, author: nickname });
      setAnswerText('');
      fetchQA();
      const fresh = await apiGet<any>(`/api/qa/questions/${questionId}`);
      setSelectedQuestion(fresh);
    } catch (err) {
      console.error('回答失败', err);
      setQaOffline(true);
      const answer = {
        id: makeLocalId(),
        content: answerText,
        author: nickname || '匿名',
        createdAt: Date.now()
      };
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, answers: [...(q.answers || []), answer] } : q))
      );
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion({ ...selectedQuestion, answers: [...(selectedQuestion.answers || []), answer] });
      }
      setAnswerText('');
    }
  };

  const handleAccept = async (questionId: string, answerId: string, author: string) => {
    try {
      await apiPost(`/api/qa/questions/${questionId}/accept`, { answerId, requesterName: author });
      const fresh = await apiGet<any>(`/api/qa/questions/${questionId}`);
      setSelectedQuestion(fresh);
      fetchQA();
    } catch (err) {
      console.error('采纳失败', err);
      setQaOffline(true);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, acceptedAnswerId: answerId } : q))
      );
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion({ ...selectedQuestion, acceptedAnswerId: answerId });
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim()) return;
    try {
      await apiPost('/api/forum/posts', { ...newPost, author: nickname });
      setNewPost({ title: '', content: '' });
      fetchForum();
    } catch (err) {
      console.error('发帖失败', err);
      setForumOffline(true);
      const local = {
        id: makeLocalId(),
        title: newPost.title,
        content: newPost.content,
        author: nickname || '匿名',
        createdAt: Date.now(),
        comments: []
      };
      setPosts((prev) => [local, ...prev]);
      setNewPost({ title: '', content: '' });
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentDrafts[postId] || '';
    if (!content.trim()) return;
    try {
      await apiPost(`/api/forum/posts/${postId}/comments`, { content, author: nickname });
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      fetchForum();
    } catch (err) {
      console.error('评论失败', err);
      setForumOffline(true);
      const comment = {
        id: makeLocalId(),
        content,
        author: nickname || '匿名',
        createdAt: Date.now()
      };
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p)));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const handleDeleteQuestion = async (id: string, author: string) => {
    if (author !== nickname) return;
    if (!window.confirm('确认删除这条提问吗？')) return;
    try {
      await apiDelete(`/api/qa/questions/${id}`, { requesterName: nickname });
      if (selectedQuestion?.id === id) setSelectedQuestion(null);
      fetchQA();
    } catch (err) {
      console.error('删除失败', err);
      setQaOffline(true);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuestion?.id === id) setSelectedQuestion(null);
    }
  };

  const handleDeletePost = async (id: string, author: string) => {
    if (author !== nickname) return;
    if (!window.confirm('确认删除这条帖子吗？')) return;
    try {
      await apiDelete(`/api/forum/posts/${id}`, { requesterName: nickname });
      fetchForum();
    } catch (err) {
      console.error('删除失败', err);
      setForumOffline(true);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const tabs = [
    { key: 'qa', label: '互助问答', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'forum', label: '论坛', icon: <Check className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="container-custom py-8">
        <div className="mb-6">
          <h2 className="mb-1">学习论坛</h2>
          <p className="text-[#ADB5BD]">互助问答 · 论坛交流</p>
        </div>

        <Card className="p-4 mb-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </Card>

        {activeTab === 'qa' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="mb-0">互助问答</h4>
                <Button size="sm" variant="secondary" onClick={fetchQA}>
                  {loadingQA ? <Loader2 className="w-4 h-4 animate-spin" /> : '刷新'}
                </Button>
              </div>
              {qaOffline && <p className="text-xs text-[#E67700] mb-3">当前使用演示数据，发布/回答仅本地可见，请启动后端服务。</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <Input label="问题标题" value={newQuestion.title} onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })} />
                <Input label="问题内容" value={newQuestion.content} onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })} />
              </div>
              <Button onClick={handleCreateQuestion}>发布问题</Button>
              <div className="mt-6 space-y-3">
                {questions.map((q) => (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5>{q.title}</h5>
                      <span className="text-xs text-[#ADB5BD]">回答：{q.answers?.length || 0}</span>
                    </div>
                    <p className="text-sm text-[#495057] line-clamp-2">{q.content}</p>
                    <div className="text-xs text-[#ADB5BD] mt-2 flex gap-3">
                      <span>作者：{q.author}</span>
                      <span>{new Date(q.createdAt).toLocaleString()}</span>
                      {q.acceptedAnswerId && <span className="text-[#51CF66]">已采纳</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedQuestion(q)}>查看</Button>
                      {q.author === nickname && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(q.id, q.author)}>
                          删除
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {!questions.length && <p className="text-sm text-[#ADB5BD]">暂无问题</p>}
              </div>
            </Card>

            {selectedQuestion && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="mb-0">{selectedQuestion.title}</h4>
                  <div className="flex gap-2">
                    {selectedQuestion.author === nickname && (
                      <Button size="sm" variant="secondary" onClick={() => handleDeleteQuestion(selectedQuestion.id, selectedQuestion.author)}>
                        删除
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setSelectedQuestion(null)}>关闭</Button>
                  </div>
                </div>
                <p className="text-sm text-[#495057] mb-2">{selectedQuestion.content}</p>
                <p className="text-xs text-[#ADB5BD] mb-4">作者：{selectedQuestion.author}</p>
                <div className="space-y-2 mb-3">
                  {(selectedQuestion.answers || []).map((a: any) => (
                    <div key={a.id} className="p-3 bg-[#F8F9FA] rounded-lg border border-[#E9ECEF]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{a.author}</span>
                        <span className="text-xs text-[#ADB5BD]">{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm mt-2">{a.content}</p>
                      {selectedQuestion.acceptedAnswerId === a.id ? (
                        <span className="text-xs text-[#51CF66]">已采纳</span>
                      ) : selectedQuestion.author === nickname && (
                        <Button size="xs" variant="secondary" onClick={() => handleAccept(selectedQuestion.id, a.id, nickname)}>采纳</Button>
                      )}
                    </div>
                  ))}
                  {!selectedQuestion.answers?.length && <p className="text-xs text-[#ADB5BD]">暂无回答</p>}
                </div>
                <textarea
                  className="w-full border-2 border-[#E9ECEF] rounded-lg px-3 py-2 mb-2 text-sm outline-none focus:border-[#4C6EF5]"
                  rows={3}
                  placeholder="写下你的回答..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
                <Button size="sm" onClick={() => handleAnswer(selectedQuestion.id)}>提交回答</Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h4 className="mb-0">学习论坛</h4>
                <Button size="sm" variant="secondary" onClick={fetchForum}>
                  {loadingForum ? <Loader2 className="w-4 h-4 animate-spin" /> : '刷新'}
                </Button>
              </div>
              {forumOffline && <p className="text-xs text-[#E67700] mb-3">当前使用演示数据，发帖/评论仅本地可见，请启动后端服务。</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <Input label="帖子标题" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />
                <Input label="帖子内容" value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} />
              </div>
              <Button onClick={handleCreatePost}>发布</Button>
              <div className="mt-6 space-y-3">
                {posts.map((p) => (
                  <Card key={p.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5>{p.title}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#ADB5BD]">{new Date(p.createdAt).toLocaleString()}</span>
                        {p.author === nickname && (
                          <Button size="xs" variant="ghost" onClick={() => handleDeletePost(p.id, p.author)}>
                            删除
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[#495057] mb-3">{p.content}</p>
                    <div className="space-y-2">
                      {(p.comments || []).map((c: any) => (
                        <div key={c.id} className="p-2 bg-[#F8F9FA] rounded">
                          <div className="flex items-center justify-between text-xs text-[#ADB5BD]">
                            <span>{c.author}</span>
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm mt-1">{c.content}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        className="flex-1 px-3 py-2 border-2 border-[#E9ECEF] rounded-lg focus:border-[#4C6EF5] outline-none text-sm"
                        placeholder="评论内容"
                        value={commentDrafts[p.id] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => handleComment(p.id)}>评论</Button>
                    </div>
                  </Card>
                ))}
                {!posts.length && <p className="text-sm text-[#ADB5BD]">暂无帖子</p>}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
