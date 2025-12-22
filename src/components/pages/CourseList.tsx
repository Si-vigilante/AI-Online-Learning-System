import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Tabs } from '../design-system/Tabs';
import { BookOpen, Users, Clock, Star, Search, Filter, Plus } from 'lucide-react';
import {
  Course,
  enrollCourse,
  dropCourse,
  getCourses,
  createCourse,
  previewCoursePlan,
  getUserEnrollments,
  isUserEnrolled,
  setCurrentCourseId,
  subscribeCourseUpdates
} from '../../services/courses';
import { UserProfile } from '../../services/auth';

interface CourseListProps {
  onNavigate: (page: string) => void;
  onSelectCourse: (courseId: string) => void;
  currentUser?: UserProfile | null;
}

const categoryLabels: Record<string, string> = {
  all: '全部课程',
  ai: 'AI & 机器学习',
  programming: '编程开发',
  data: '数据科学',
  design: '设计艺术',
  theory: '通识/理论'
};

const courseTagMap: Record<string, string> = {
  '形势与政策': '通识课',
  '大学英语': '通识课',
  '马克思主义基本原理': '通识课',
  '数字逻辑设计': '计科',
  '离散数学': '计科',
  '电路与电子学': '计科',
  '大学物理': '计科',
  '计算机图形学': '计科',
  '现代设计史': '数媒',
  '设计美学': '数媒',
  '摄影与镜头语言设计': '数媒',
  '数字程序设计基础': '数媒'
};

export function CourseList({ onNavigate, onSelectCourse, currentUser }: CourseListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [userEnrollments, setUserEnrollments] = useState(() => getUserEnrollments(currentUser?.userId));
  const [plan, setPlan] = useState<{
    framework: string;
    curriculum: Course['curriculum'];
    materials: Course['materials'];
    learningGoals: string[];
  } | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'ai',
    level: '基础',
    duration: '8周',
    thumbnail: '',
    uploadedThumbnailName: '',
    description: '',
    materials: '',
    chapters: ''
  });
  const [materialFiles, setMaterialFiles] = useState<{ name: string; url: string }[]>([]);
  const [contentSources, setContentSources] = useState<{ type: 'file' | 'link'; name: string; url: string }[]>([]);
  const [contentLink, setContentLink] = useState('');
  
  useEffect(() => {
    const load = () => setCourses(getCourses());
    load();
    const unsubscribe = subscribeCourseUpdates(load);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setUserEnrollments(getUserEnrollments(currentUser?.userId));
  }, [currentUser, courses]);

  const isTeacher = currentUser?.role === 'teacher';
  const enrolledIds = useMemo(
    () => new Set(userEnrollments.map((item) => item.courseId)),
    [userEnrollments]
  );

  const sortedCourses = useMemo(() => {
    const hasThumb = (course: Course) => Boolean(course.thumbnail);
    const isEnrolled = (course: Course) => enrolledIds.has(course.id);
    const tagPriority = (course: Course) => (courseTagMap[course.title] ? 1 : 0);

    return [...courses].sort((a, b) => {
      const aEnrolled = isEnrolled(a);
      const bEnrolled = isEnrolled(b);
      if (aEnrolled !== bEnrolled) return Number(bEnrolled) - Number(aEnrolled);

      // 优先显示有分类标签的课程
      const aTag = tagPriority(a);
      const bTag = tagPriority(b);
      if (aTag !== bTag) return bTag - aTag;

      const aThumb = hasThumb(a);
      const bThumb = hasThumb(b);
      if (aThumb !== bThumb) return Number(bThumb) - Number(aThumb);

      return 0;
    });
  }, [courses, enrolledIds]);
  const myCourses = useMemo(
    () => courses.filter(
      (c) =>
        c.createdBy === (currentUser?.userId || 'teacher') ||
        (currentUser?.role === 'teacher' && c.createdBy === 'teacher')
    ),
    [courses, currentUser]
  );
  
  const categories = useMemo(() => {
    const unique = new Set<string>(['all']);
    courses.forEach((c) => unique.add(c.category));
    return Array.from(unique).map((key) => ({
      key,
      label: categoryLabels[key] || key
    }));
  }, [courses]);
  
  const filteredCourses = sortedCourses.filter(course => {
    const matchesTab = activeTab === 'all' || course.category === activeTab;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCourseClick = (courseId: string) => {
    setCurrentCourseId(courseId);
    onSelectCourse(courseId);
  };

  const handleEnrollToggle = (courseId: string, enrolled: boolean) => {
    if (!currentUser) {
      alert('请先登录后再进行选课');
      onNavigate('login');
      return;
    }
    if (enrolled) {
      dropCourse(currentUser, courseId);
    } else {
      enrollCourse(currentUser, courseId);
    }
    setUserEnrollments(getUserEnrollments(currentUser.userId));
  };

  const getProgress = (courseId: string) =>
    userEnrollments.find((item) => item.courseId === courseId)?.progress ?? 0;

  const handleGeneratePlan = () => {
    if (!form.title.trim()) {
      alert('请先填写课程名称以生成教案');
      return;
    }
    const draft = previewCoursePlan(form.title);
    setPlan({
      framework: draft.framework || '',
      curriculum: draft.curriculum,
      materials: draft.materials,
      learningGoals: draft.learningGoals
    });
    setForm((prev) => ({
      ...prev,
      description: prev.description || draft.framework || '',
      materials: prev.materials || draft.materials.map((m) => m.title).join('\n'),
      chapters: prev.chapters || draft.curriculum.map((c) => c.title).join('\n')
    }));
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('请填写课程名称');
      return;
    }
    const materials = form.materials
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const chapters = form.chapters
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const content = [...contentSources];

    const course = createCourse({
      title: form.title.trim(),
      instructor: currentUser?.name || '教师',
      category: form.category,
      level: form.level,
      duration: form.duration,
      thumbnail: form.thumbnail,
      uploadedThumbnailName: form.uploadedThumbnailName,
      description: form.description,
      materials,
      uploadedMaterials: materialFiles,
      contentSources: content,
      framework: plan?.framework,
      createdBy: currentUser?.userId || 'teacher',
      chapters,
      learningGoals: plan?.learningGoals
    });

    setForm({
      title: '',
      category: 'ai',
      level: '基础',
      duration: '8周',
      thumbnail: '',
      uploadedThumbnailName: '',
      description: '',
      materials: '',
      chapters: ''
    });
    setPlan(null);
    setMaterialFiles([]);
    setContentSources([]);
    setContentLink('');
    onSelectCourse(course.id);
    onNavigate('course-detail');
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, thumbnail: url, uploadedThumbnailName: file.name }));
  };

  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setMaterialFiles((prev) => [...prev, ...next]);
  };

  const handleContentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setContentSources((prev) => [...prev, { type: 'file', name: file.name, url }]);
  };

  const handleAddContentLink = () => {
    if (!contentLink.trim()) return;
    setContentSources((prev) => [...prev, { type: 'link', name: contentLink.trim(), url: contentLink.trim() }]);
    setContentLink('');
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-4">课程中心</h1>
          <p className="text-lg opacity-90 mb-6">
            {isTeacher ? '教师可在此管理与上传课程，学生端仅可选课后学习' : '新增设计、美学与理论课程，默认未选课，可随时自助选/退'}
          </p>
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ADB5BD]" />
              <input
                type="text"
                placeholder="搜索课程、讲师..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {!isTeacher && (
              <Button variant="secondary" size="lg">
                <Filter className="w-5 h-5" />
                筛选
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <Tabs tabs={categories} activeTab={activeTab} onChange={setActiveTab} />

        {isTeacher && (
          <div className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="mb-1">上传课程并实时上线</h4>
                  <p className="text-sm text-[#ADB5BD]">填写课程信息 · 一键生成 AI 教案 · 即刻发布</p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={handleGeneratePlan}>
                  <Plus className="w-4 h-4" />
                  AI 生成教案
                </Button>
              </div>
              <form className="space-y-4" onSubmit={handleSubmitCourse}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    placeholder="课程名称"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="ai">AI</option>
                    <option value="programming">编程</option>
                    <option value="data">数据</option>
                    <option value="design">设计</option>
                    <option value="theory">通识</option>
                  </select>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    placeholder="课程难度"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                  />
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    placeholder="课程时长"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                  <div className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF] flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-[#ADB5BD] mb-1">封面图片</p>
                      <p className="text-sm text-[#212529] line-clamp-1">
                        {form.uploadedThumbnailName || '选择文件上传封面'}
                      </p>
                    </div>
                    <label className="px-3 py-2 bg-[#EDF2FF] text-[#4C6EF5] rounded-lg cursor-pointer text-sm whitespace-nowrap">
                      选择文件
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                    </label>
                  </div>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    value={currentUser?.name || '教师'}
                    readOnly
                  />
                </div>

                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                  rows={3}
                  placeholder="课程描述"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                      rows={4}
                      placeholder="课程资料（每行一条）"
                      value={form.materials}
                      onChange={(e) => setForm({ ...form, materials: e.target.value })}
                    />
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg border-2 border-dashed border-[#E9ECEF]">
                      <div>
                        <p className="text-sm text-[#212529]">上传课程资料</p>
                        <p className="text-xs text-[#ADB5BD]">支持多文件（如 PDF/PPT）</p>
                      </div>
                      <label className="px-3 py-2 bg-[#F8F9FA] text-[#4C6EF5] rounded-lg cursor-pointer text-sm whitespace-nowrap">
                        选择文件
                        <input type="file" multiple className="hidden" onChange={handleMaterialUpload} />
                      </label>
                    </div>
                    {materialFiles.length > 0 && (
                      <div className="text-xs text-[#ADB5BD] space-y-1">
                        {materialFiles.map((file) => (
                          <div key={file.url} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4C6EF5]" />
                            <span className="line-clamp-1">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-[#E9ECEF]"
                    rows={4}
                    placeholder="课程结构/章节（每行一章）"
                    value={form.chapters}
                    onChange={(e) => setForm({ ...form, chapters: e.target.value })}
                  />
                </div>

                <div className="space-y-2 p-3 border-2 border-[#E9ECEF] rounded-lg bg-[#F8F9FA]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#212529] mb-1">课程内容上传</p>
                      <p className="text-xs text-[#ADB5BD]">可上传视频文件，或添加网页跳转链接</p>
                    </div>
                    <label className="px-3 py-2 bg-white text-[#4C6EF5] rounded-lg cursor-pointer text-sm border border-[#E9ECEF]">
                      上传视频/文件
                      <input type="file" accept="video/*,application/*" className="hidden" onChange={handleContentFile} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-[#E9ECEF]"
                      placeholder="粘贴内容链接（如网页或网盘地址）"
                      value={contentLink}
                      onChange={(e) => setContentLink(e.target.value)}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddContentLink}>
                      添加链接
                    </Button>
                  </div>
                  {contentSources.length > 0 && (
                    <div className="text-xs text-[#ADB5BD] space-y-1">
                      {contentSources.map((item, idx) => (
                        <div key={item.url + idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#845EF7]" />
                          <span className="text-[#212529]">{item.type === 'file' ? '文件' : '链接'}：</span>
                          <span className="line-clamp-1">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {plan && (
                  <div className="p-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg space-y-2 text-sm text-[#212529]">
                    <div className="font-medium">AI 教案框架</div>
                    <div>{plan.framework}</div>
                    <div className="text-[#ADB5BD]">学习目标：{plan.learningGoals.join(' / ')}</div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="submit">提交并发布</Button>
                </div>
              </form>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4>我创建的课程</h4>
                <span className="text-sm text-[#ADB5BD]">点击即可查看/编辑</span>
              </div>
              {myCourses.length === 0 ? (
                <p className="text-[#ADB5BD]">暂无创建的课程，提交左侧表单即可上线。</p>
              ) : (
                <div className="space-y-3">
                  {myCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8F9FA] cursor-pointer transition"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-lg flex items-center justify-center text-white">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="mb-1">{course.title}</h5>
                          <p className="text-xs text-[#ADB5BD]">{course.students} 名学生 · {course.level}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[#4C6EF5] bg-[#EDF2FF] px-2 py-1 rounded-full">{course.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden" onClick={() => handleCourseClick(course.id)}>
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white opacity-30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20" />
                {isUserEnrolled(currentUser?.userId, course.id) && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-[#4C6EF5]">
                    已选课
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {course.level}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <h4 className="mb-2 line-clamp-1">{course.title}</h4>
                {courseTagMap[course.title] && (
                  <span className="inline-block text-xs text-[#4C6EF5] bg-[#EDF2FF] px-2 py-1 rounded-full mb-2">
                    {courseTagMap[course.title]}
                  </span>
                )}
                <p className="text-sm text-[#ADB5BD] mb-2">讲师：{course.instructor}</p>
                <p className="text-xs text-[#ADB5BD] line-clamp-2 mb-3">{course.description}</p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-[#ADB5BD]">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#FFD43B] text-[#FFD43B]" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                
                {!isTeacher && (
                  <>
                    {isUserEnrolled(currentUser?.userId, course.id) ? (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#ADB5BD]">学习进度</span>
                          <span className="text-xs text-[#4C6EF5]">{getProgress(course.id)}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#4C6EF5] transition-all duration-300"
                            style={{ width: `${getProgress(course.id)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#ADB5BD] mb-3">未选课 · 选课后可追踪进度</p>
                    )}
                  </>
                )}
                
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-3 items-center">
                  <Button 
                    variant="primary"
                    fullWidth
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course.id);
                    }}
                  >
                    {isTeacher ? '管理 / 查看' : '查看详情'}
                  </Button>
                  {!isTeacher && (
                    <Button
                      variant={isUserEnrolled(currentUser?.userId, course.id) ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnrollToggle(course.id, isUserEnrolled(currentUser?.userId, course.id));
                      }}
                    >
                      {isUserEnrolled(currentUser?.userId, course.id) ? '退课' : '选课'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-[#ADB5BD] mx-auto mb-4" />
            <h4 className="mb-2">未找到相关课程</h4>
            <p className="text-[#ADB5BD]">尝试调整搜索关键词或筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
