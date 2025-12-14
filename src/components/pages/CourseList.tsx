import React, { useState } from 'react';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { Tabs } from '../design-system/Tabs';
import { BookOpen, Users, Clock, Star, Search, Filter } from 'lucide-react';

interface CourseListProps {
  onNavigate: (page: string) => void;
}

export function CourseList({ onNavigate }: CourseListProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    { key: 'all', label: '全部课程' },
    { key: 'ai', label: 'AI & 机器学习' },
    { key: 'programming', label: '编程开发' },
    { key: 'data', label: '数据科学' }
  ];
  
  const courses = [
    {
      id: 1,
      title: '深度学习基础',
      instructor: '张教授',
      category: 'ai',
      level: '中级',
      students: 1256,
      duration: '12周',
      rating: 4.8,
      progress: 0,
      thumbnail: 'neural-network'
    },
    {
      id: 2,
      title: 'Python 数据分析实战',
      instructor: '李老师',
      category: 'data',
      level: '初级',
      students: 2341,
      duration: '10周',
      rating: 4.9,
      progress: 30,
      thumbnail: 'data-analysis'
    },
    {
      id: 3,
      title: '机器学习算法详解',
      instructor: '王博士',
      category: 'ai',
      level: '高级',
      students: 892,
      duration: '16周',
      rating: 4.7,
      progress: 0,
      thumbnail: 'ml-algorithms'
    },
    {
      id: 4,
      title: 'Web 全栈开发',
      instructor: '陈工程师',
      category: 'programming',
      level: '中级',
      students: 1876,
      duration: '14周',
      rating: 4.8,
      progress: 60,
      thumbnail: 'web-dev'
    },
    {
      id: 5,
      title: '自然语言处理入门',
      instructor: '赵教授',
      category: 'ai',
      level: '中级',
      students: 1043,
      duration: '11周',
      rating: 4.6,
      progress: 0,
      thumbnail: 'nlp'
    },
    {
      id: 6,
      title: '数据可视化艺术',
      instructor: '周设计师',
      category: 'data',
      level: '初级',
      students: 1654,
      duration: '8周',
      rating: 4.9,
      progress: 0,
      thumbnail: 'data-viz'
    }
  ];
  
  const filteredCourses = courses.filter(course => {
    const matchesTab = activeTab === 'all' || course.category === activeTab;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });
  
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-gradient-to-r from-[#4C6EF5] to-[#845EF7] text-white py-12 px-8">
        <div className="container-custom">
          <h1 className="text-white mb-4">课程中心</h1>
          <p className="text-lg opacity-90 mb-6">探索 AI 驱动的优质课程，开启智能学习之旅</p>
          
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
            <Button variant="secondary" size="lg">
              <Filter className="w-5 h-5" />
              筛选
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container-custom py-8">
        <Tabs tabs={categories} activeTab={activeTab} onChange={setActiveTab} />
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden" onClick={() => onNavigate('course-detail')}>
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-[#4C6EF5] to-[#845EF7] relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white opacity-30" />
                </div>
                {course.progress > 0 && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-[#4C6EF5]">
                    进行中 {course.progress}%
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {course.level}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <h4 className="mb-2 line-clamp-1">{course.title}</h4>
                <p className="text-sm text-[#ADB5BD] mb-4">讲师：{course.instructor}</p>
                
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
                
                {course.progress > 0 ? (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#ADB5BD]">学习进度</span>
                      <span className="text-xs text-[#4C6EF5]">{course.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E9ECEF] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4C6EF5] transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                
                <Button 
                  variant={course.progress > 0 ? 'primary' : 'secondary'} 
                  fullWidth
                  size="sm"
                >
                  {course.progress > 0 ? '继续学习' : '查看详情'}
                </Button>
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
