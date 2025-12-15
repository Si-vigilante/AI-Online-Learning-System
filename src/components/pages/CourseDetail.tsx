import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Tabs } from '../design-system/Tabs';
import { Play, BookOpen, FileText, Clock, Users, Star, CheckCircle, Lock, GitBranch, XCircle } from 'lucide-react';
import {
  Course,
  getCourseById,
  getCurrentCourseId,
  enrollCourse,
  dropCourse,
  isUserEnrolled,
  getUserEnrollments,
  subscribeCourseUpdates,
  setCurrentCourseId
} from '../../services/courses';
import { UserProfile } from '../../services/auth';

interface CourseDetailProps {
  onNavigate: (page: string) => void;
  onSelectCourse: (courseId: string) => void;
  courseId?: string;
  currentUser?: UserProfile | null;
}

export function CourseDetail({ onNavigate, onSelectCourse, courseId, currentUser }: CourseDetailProps) {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const isTeacher = currentUser?.role === 'teacher';

  const loadCourse = () => {
    const targetId = courseId || getCurrentCourseId();
    if (!targetId) {
      setCourse(null);
      return;
    }
    const data = getCourseById(targetId);
    if (data) {
      setCourse(data);
      setCurrentCourseId(targetId);
      setIsEnrolled(isTeacher || isUserEnrolled(currentUser?.userId, targetId));
      const record = getUserEnrollments(currentUser?.userId).find((item) => item.courseId === targetId);
      setProgress(record?.progress ?? 0);
    } else {
      setCourse(null);
    }
  };

  useEffect(() => {
    loadCourse();
    const unsubscribe = subscribeCourseUpdates(loadCourse);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [courseId, currentUser]);

  const handleEnroll = () => {
    if (!course) return;
    if (!currentUser) {
      alert('请先登录后再进行选课');
      onNavigate('login');
      return;
    }
    enrollCourse(currentUser, course.id);
    setIsEnrolled(true);
    setProgress(0);
    onSelectCourse(course.id);
  };

  const handleDrop = () => {
    if (!course || !currentUser || isTeacher) return;
    dropCourse(currentUser, course.id);
    setIsEnrolled(false);
    setProgress(0);
  };

  const handleLessonClick = () => {
    if (!isEnrolled && !isTeacher) {
      alert('请先选课后再开始学习');
      return;
    }
    const link = course?.contentSources?.find((item) => item.type === 'link')?.url;
    if (link) {
      window.open(link, '_blank');
      return;
    }
    onNavigate('video-player');
  };

  const tabs = useMemo(
    () => [
      { key: 'curriculum', label: '课程内容', icon: <BookOpen className="w-4 h-4" /> },
      { key: 'intro', label: '课程介绍', icon: <FileText className="w-4 h-4" /> },
      { key: 'materials', label: '课程资料', icon: <FileText className="w-4 h-4" /> }
    ],
    []
  );

  if (!course) {
    return (
      <div className="container-custom py-16">
        <Card className="p-8 text-center">
          <XCircle className="w-12 h-12 text-[#ADB5BD] mx-auto mb-4" />
          <h4 className="mb-2">未找到课程</h4>
          <p className="text-[#ADB5BD] mb-4">请先从课程中心选择一个课程</p>
          <Button onClick={() => onNavigate('course-list')}>返回课程中心</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-white mb-4">{course.title}</h1>
              <p className="text-lg opacity-90 mb-6">{course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.students} 名学生</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-[#FFD43B] text-[#FFD43B]" />
                  <span>{course.rating} 评分</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <Button size="lg" onClick={handleLessonClick}>
                  <Play className="w-5 h-5" />
                  {isTeacher ? '查看课程内容' : isEnrolled ? '继续学习' : '选课后开始学习'}
                </Button>
                <Button variant="secondary" size="lg" disabled={!isEnrolled && !isTeacher} onClick={() => setActiveTab('materials')}>
                  <FileText className="w-5 h-5" />
                  {isTeacher ? '查看课程资料' : isEnrolled ? '查看课程资料' : '资料需选课后查看'}
                </Button>
                {!isTeacher && (
                  isEnrolled ? (
                    <Button variant="ghost" size="lg" onClick={handleDrop}>
                      退课
                    </Button>
                  ) : (
                    <Button variant="ghost" size="lg" onClick={handleEnroll}>
                      立即选课
                    </Button>
                  )
                )}
              </div>
            </div>

            <div>
              <Card className="p-6">
                <h4 className="mb-4">学习进度</h4>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#ADB5BD]">总体进度</span>
                    <span className="text-lg text-[#4C6EF5]">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#E9ECEF] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#ADB5BD]">选课状态</span>
                    <span className="text-[#4C6EF5]">{isTeacher ? '教师查看' : isEnrolled ? '已选课' : '未选课'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#ADB5BD]">预计完成</span>
                    <span>{isTeacher ? '教师无需选课' : isEnrolled ? '按进度学习' : '选课后解锁'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#4C6EF5]" />
                  <h4 className="mb-0">课程结构</h4>
                </div>
                <div className="flex gap-2 text-xs text-[#ADB5BD]">
                  <span>教师侧章节拆分</span>
                  <span>学生侧路径实时同步</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-[#ADB5BD]">
                    <span>章节与知识点</span>
                    <span>选课后逐步解锁</span>
                  </div>
                  {course.knowledgeSplits.map((item) => (
                    <div key={item.chapter} className="p-4 border-2 border-[#E9ECEF] rounded-lg hover:border-[#4C6EF5] transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.chapter}</span>
                        <span className="text-xs text-[#4C6EF5] bg-[#EDF2FF] px-2 py-1 rounded-full">{item.points.length} 个知识点</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.points.map((point, idx) => (
                          <span key={idx} className="text-xs px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#E9ECEF]">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-[#ADB5BD]">
                    <span>学习路径</span>
                    <span>进度实时同步</span>
                  </div>
                  {course.learningPath.map((stage, index) => (
                    <div key={stage.id} className="relative p-4 border-2 border-[#E9ECEF] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] text-white flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{stage.title}</p>
                            <p className="text-xs text-[#ADB5BD]">知识点：{stage.nodes.join(' / ')}</p>
                          </div>
                        </div>
                        <span className="text-sm text-[#4C6EF5]">{stage.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#F1F3F5] rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] transition-all duration-300"
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                      {index < course.learningPath.length - 1 && (
                        <div className="absolute -right-3 top-8 w-6 h-0.5 bg-gradient-to-r from-[#4C6EF5] to-[#845EF7]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

              <div className="mt-6">
                {activeTab === 'curriculum' && (
                  <div className="space-y-6">
                    {course.curriculum.map((chapter) => (
                      <div key={chapter.id}>
                        <h4 className="mb-4">{chapter.title}</h4>
                        <div className="space-y-2">
                          {chapter.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                isEnrolled || isTeacher
                                  ? 'border-[#E9ECEF] hover:border-[#4C6EF5] cursor-pointer'
                                  : 'border-[#E9ECEF] bg-[#F8F9FA] opacity-70'
                              }`}
                              onClick={isEnrolled || isTeacher ? handleLessonClick : undefined}
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isEnrolled || isTeacher ? 'bg-[#EDF2FF]' : 'bg-[#E9ECEF]'
                                }`}
                              >
                                {isEnrolled || isTeacher ? (
                                  <Play className="w-5 h-5 text-[#4C6EF5]" />
                                ) : (
                                  <Lock className="w-5 h-5 text-[#ADB5BD]" />
                                )}
                              </div>

                              <div className="flex-1">
                                <h5 className="mb-1">{lesson.title}</h5>
                                <p className="text-xs text-[#ADB5BD]">{lesson.duration}</p>
                              </div>

                              {!isEnrolled && !isTeacher && (
                                <span className="text-xs text-[#ADB5BD] bg-[#E9ECEF] px-3 py-1 rounded-full">
                                  选课后学习
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'intro' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-3">课程简介</h4>
                      <p className="text-[#212529] leading-relaxed">{course.description}</p>
                    </div>

                    <div>
                      <h4 className="mb-3">学习目标</h4>
                      <ul className="space-y-2">
                        {course.learningGoals.map((goal, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-[#51CF66] flex-shrink-0 mt-0.5" />
                            <span>{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-3">AI 教案框架</h4>
                      <p className="text-sm text-[#212529] bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg p-4 leading-relaxed">
                        {course.framework || '讲师可通过 AI 助手生成教案草稿，自动铺开导学-讲授-案例-实验-评价流程。'}
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-3">授课讲师</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] rounded-full flex items-center justify-center text-white text-xl">
                          {course.instructor?.slice(0, 1) || '讲'}
                        </div>
                        <div>
                          <h5>{course.instructor}</h5>
                          <p className="text-sm text-[#ADB5BD]">课程创建者 · {course.level}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'materials' && (
                  <div className="space-y-3">
                    {course.materials.map((material) => (
                      <div
                        key={material.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                          isEnrolled || isTeacher ? 'border-[#E9ECEF] hover:border-[#4C6EF5]' : 'border-[#E9ECEF] bg-[#F8F9FA] opacity-70'
                        }`}
                      >
                        <div>
                          <h5 className="mb-1">{material.title}</h5>
                          <p className="text-xs text-[#ADB5BD]">{material.type.toUpperCase()} · {material.size || '资料'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!isEnrolled && !isTeacher}
                          onClick={() => {
                            if (!isEnrolled && !isTeacher) {
                              alert('请先完成选课再查看资料');
                              return;
                            }
                            if (material.url) window.open(material.url, '_blank');
                          }}
                        >
                          {isTeacher ? '查看/下载' : isEnrolled ? '查看/下载' : '需选课'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 mb-6">
              <h4 className="mb-4">课程资料概览</h4>
              <div className="space-y-2 text-sm text-[#ADB5BD]">
                <p>选课后可以直接访问课件、PPT、参考文档等资源。</p>
                <p>未选课状态下仅可浏览课程信息。</p>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="mb-4">需要帮助？</h4>
              <p className="text-sm text-[#ADB5BD] mb-4">
                遇到问题？AI 助教随时为您解答
              </p>
              <Button variant="primary" fullWidth onClick={() => onNavigate('ai-chat')}>
                咨询 AI 助教
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
