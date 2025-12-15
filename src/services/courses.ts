import { UserProfile } from './auth';

export type CourseCategory = 'ai' | 'programming' | 'data' | 'design' | 'theory';

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  locked?: boolean;
}

export interface CourseChapter {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  size?: string;
  url?: string;
}

export interface LearningPathStage {
  id: string;
  title: string;
  progress: number;
  nodes: string[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: CourseCategory | string;
  level: string;
  students: number;
  duration: string;
  rating: number;
  thumbnail?: string;
  description: string;
  learningGoals: string[];
  curriculum: CourseChapter[];
  knowledgeSplits: { chapter: string; points: string[] }[];
  materials: CourseMaterial[];
  learningPath: LearningPathStage[];
  framework?: string;
  createdBy?: string;
  createdAt: string;
}

interface EnrollmentRecord {
  courseId: string;
  progress: number;
  enrolledAt: string;
}

const COURSES_KEY = 'ai-learning-courses';
const ENROLL_KEY = 'ai-learning-enrollments';
const CURRENT_COURSE_KEY = 'ai-learning-current-course';
const COURSE_UPDATED_EVENT = 'ai-learning-course-updated';

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse localStorage value', error);
    return fallback;
  }
};

const saveJSON = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

const dispatchCourseUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COURSE_UPDATED_EVENT));
};

export const subscribeCourseUpdates = (callback: () => void) => {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(COURSE_UPDATED_EVENT, callback);
  return () => window.removeEventListener(COURSE_UPDATED_EVENT, callback);
};

const deterministicId = (title: string) =>
  `course-${encodeURIComponent(title).replace(/%/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}`;

const randomId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `course-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const generateCourseScaffold = (title: string): Pick<Course, 'curriculum' | 'materials' | 'knowledgeSplits' | 'learningGoals' | 'learningPath' | 'framework'> => {
  const baseTitle = title.replace(/\s+/g, '');
  return {
    learningGoals: [
      `理解${baseTitle}的核心概念与价值`,
      `能够设计并实现${baseTitle}的基础案例`,
      '掌握资料查阅、拆解与沉淀的流程',
      '完成一次端到端的小型项目演练'
    ],
    curriculum: [
      {
        id: 'c1',
        title: `导论：${title} 的全景图`,
        lessons: [
          { id: 'l1', title: `${title} 能解决什么问题`, duration: '15分钟', completed: false },
          { id: 'l2', title: `${title} 的核心概念速览`, duration: '20分钟', completed: false },
          { id: 'l3', title: '课程资源与评估方式', duration: '10分钟', completed: false }
        ]
      },
      {
        id: 'c2',
        title: '进阶与方法论',
        lessons: [
          { id: 'l4', title: '关键方法/公式拆解', duration: '25分钟', completed: false },
          { id: 'l5', title: '案例：从需求到方案', duration: '30分钟', completed: false },
          { id: 'l6', title: '常见误区与纠偏', duration: '18分钟', completed: false }
        ]
      },
      {
        id: 'c3',
        title: '实践与拓展',
        lessons: [
          { id: 'l7', title: '项目实操：阶段任务', duration: '35分钟', completed: false, locked: true },
          { id: 'l8', title: '成果展示与同伴互评', duration: '20分钟', completed: false, locked: true },
          { id: 'l9', title: '扩展阅读与研究方向', duration: '15分钟', completed: false, locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '基础认知', points: ['核心概念', '价值场景', '关键术语'] },
      { chapter: '方法论', points: ['步骤拆解', '案例路径', '常见误区'] },
      { chapter: '实战演练', points: ['任务分解', '作品要求', '评估标准'] }
    ],
    materials: [
      { id: randomId(), title: `${title} 导学手册.pdf`, type: 'pdf', size: '1.2MB' },
      { id: randomId(), title: `${title} 教学PPT`, type: 'ppt', size: '5.8MB' },
      { id: randomId(), title: `${title} 参考资料与延伸阅读`, type: 'doc', size: '850KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '认知入门', progress: 35, nodes: ['概念', '价值', '案例'] },
      { id: 'lp2', title: '技能掌握', progress: 20, nodes: ['方法', '演练', '纠偏'] },
      { id: 'lp3', title: '项目实践', progress: 10, nodes: ['需求拆解', '提交作品', '互评'] },
      { id: 'lp4', title: '拓展研究', progress: 0, nodes: ['阅读', '讨论', '应用'] }
    ],
    framework: `${title} 教案生成：梳理导学、讲授、案例、实验、评价五段式流程，结合 AI 辅助快速产出可发布的课程框架。`
  };
};

const defaultCourses: Course[] = [
  {
    id: deterministicId('设计美学'),
    title: '设计美学',
    instructor: '李然',
    category: 'design',
    level: '基础',
    students: 126,
    duration: '8周',
    rating: 4.9,
    thumbnail: '/image/设计美学.png',
    description: '以视觉与交互为主线，拆解经典设计案例，帮助学生建立审美体系并掌握美学表达的实操方法。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('设计美学')
  },
  {
    id: deterministicId('马克思主义基本原理'),
    title: '马克思主义基本原理',
    instructor: '王哲',
    category: 'theory',
    level: '通识',
    students: 189,
    duration: '10周',
    rating: 4.8,
    thumbnail: '/image/马克思主义基本原理.png',
    description: '从现实问题出发理解马克思主义的基本立场、观点与方法，结合案例体会理论的现实意义与思辨力量。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('马克思主义基本原理')
  },
  {
    id: deterministicId('数字程序设计基础'),
    title: '数字程序设计基础',
    instructor: '周衡',
    category: 'programming',
    level: '初级',
    students: 210,
    duration: '9周',
    rating: 4.85,
    thumbnail: '/image/数字程序设计基础.png',
    description: '以问题驱动的方式掌握算法思维与程序设计基础，覆盖数据结构、流程控制到小型项目实践。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('数字程序设计基础')
  },
  {
    id: deterministicId('现代设计史'),
    title: '现代设计史',
    instructor: '陈一帆',
    category: 'design',
    level: '通识',
    students: 143,
    duration: '7周',
    rating: 4.7,
    thumbnail: '/image/现代设计史.png',
    description: '梳理现代设计的发展脉络，洞察艺术、科技与社会变迁对设计语言的影响，培养批判性观察能力。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('现代设计史')
  },
  {
    id: deterministicId('深度学习基础'),
    title: '深度学习基础',
    instructor: '张教授',
    category: 'ai',
    level: '中级',
    students: 1256,
    duration: '12周',
    rating: 4.8,
    thumbnail: '',
    description: '系统学习深度学习的核心概念和实践技能，从神经网络基础到框架应用，通过实战项目掌握 AI 技术。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('深度学习基础')
  },
  {
    id: deterministicId('Python 数据分析实战'),
    title: 'Python 数据分析实战',
    instructor: '李老师',
    category: 'data',
    level: '初级',
    students: 2341,
    duration: '10周',
    rating: 4.9,
    thumbnail: '',
    description: '用真实数据集完成从清洗、建模到可视化的完整链路，快速建立数据分析实战能力。',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('Python 数据分析实战')
  },
  {
    id: deterministicId('自然语言处理速成'),
    title: '自然语言处理速成',
    instructor: '赵清扬',
    category: 'ai',
    level: '进阶',
    students: 876,
    duration: '8周',
    rating: 4.7,
    thumbnail: '',
    description: '覆盖分词、序列标注、文本分类与预训练模型等核心能力，配套真实语料实践。 ',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('自然语言处理速成')
  },
  {
    id: deterministicId('数据可视化与故事讲述'),
    title: '数据可视化与故事讲述',
    instructor: '刘思敏',
    category: 'data',
    level: '中级',
    students: 532,
    duration: '6周',
    rating: 4.82,
    thumbnail: '',
    description: '用设计语言讲好数据故事，实战多种可视化工具与叙事框架，输出高质量仪表盘。 ',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('数据可视化与故事讲述')
  },
  {
    id: deterministicId('产品原型设计实战'),
    title: '产品原型设计实战',
    instructor: '邵一诺',
    category: 'design',
    level: '初级',
    students: 642,
    duration: '5周',
    rating: 4.75,
    thumbnail: '',
    description: '掌握从需求到交互原型的全过程，结合案例快速产出可落地的产品方案。 ',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('产品原型设计实战')
  },
  {
    id: deterministicId('区块链基础与智能合约'),
    title: '区块链基础与智能合约',
    instructor: '韩博',
    category: 'programming',
    level: '进阶',
    students: 411,
    duration: '7周',
    rating: 4.65,
    thumbnail: '',
    description: '理解区块链原理与以太坊生态，动手编写与部署智能合约，掌握安全与优化要点。 ',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('区块链基础与智能合约')
  },
  {
    id: deterministicId('教育技术与AI应用'),
    title: '教育技术与AI应用',
    instructor: '程琳',
    category: 'theory',
    level: '通识',
    students: 378,
    duration: '6周',
    rating: 4.73,
    thumbnail: '',
    description: '结合课堂案例讲解AI赋能教学的设计方法，输出可落地的智慧课堂方案。 ',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    ...generateCourseScaffold('教育技术与AI应用')
  }
];

export const ensureCourseSeed = () => {
  if (typeof window === 'undefined') return;
  const stored = safeParse<Course[]>(localStorage.getItem(COURSES_KEY), []);
  const merged = [...stored];

  defaultCourses.forEach((course) => {
    const exists = merged.find((item) => item.id === course.id || item.title === course.title);
    if (!exists) {
      merged.push(course);
    }
  });

  saveJSON(COURSES_KEY, merged);
  dispatchCourseUpdated();
};

export const getCourses = (): Course[] => {
  const courses = safeParse<Course[]>(typeof window !== 'undefined' ? localStorage.getItem(COURSES_KEY) : null, []);
  if (!courses.length) {
    ensureCourseSeed();
    return safeParse<Course[]>(typeof window !== 'undefined' ? localStorage.getItem(COURSES_KEY) : null, []);
  }
  return courses;
};

export const saveCourses = (courses: Course[]) => saveJSON(COURSES_KEY, courses);

export const getCourseById = (courseId: string): Course | undefined =>
  getCourses().find((course) => course.id === courseId);

export const setCurrentCourseId = (courseId: string) => saveJSON(CURRENT_COURSE_KEY, { courseId });

export const getCurrentCourseId = () => {
  const data = safeParse<{ courseId?: string }>(
    typeof window !== 'undefined' ? localStorage.getItem(CURRENT_COURSE_KEY) : null,
    {}
  );
  return data.courseId;
};

type CourseCreateInput = {
  title: string;
  instructor: string;
  category: CourseCategory | string;
  level?: string;
  duration?: string;
  thumbnail?: string;
  description?: string;
  materials?: string[];
  framework?: string;
  createdBy?: string;
  chapters?: string[];
  learningGoals?: string[];
};

const buildCurriculumFromChapters = (chapters: string[] | undefined, fallback: CourseChapter[]): CourseChapter[] => {
  if (!chapters || chapters.length === 0) return fallback;
  return chapters.filter(Boolean).map((title, index) => ({
    id: `c${index + 1}-${randomId()}`,
    title: title.trim(),
    lessons: [
      { id: `${index + 1}-1-${randomId()}`, title: `${title} · 核心概念`, duration: '15分钟', completed: false },
      { id: `${index + 1}-2-${randomId()}`, title: `${title} · 案例拆解`, duration: '20分钟', completed: false },
      { id: `${index + 1}-3-${randomId()}`, title: `${title} · 实操演练`, duration: '25分钟', completed: false, locked: true }
    ]
  }));
};

export const previewCoursePlan = (title: string) => generateCourseScaffold(title);

export const createCourse = (input: CourseCreateInput) => {
  const courses = getCourses();
  const scaffold = generateCourseScaffold(input.title);
  const curriculum = buildCurriculumFromChapters(input.chapters, scaffold.curriculum);

  const newCourse: Course = {
    id: deterministicId(input.title) || randomId(),
    title: input.title,
    instructor: input.instructor,
    category: input.category,
    level: input.level || '基础',
    students: 0,
    duration: input.duration || '8周',
    rating: 4.9,
    thumbnail: input.thumbnail || '',
    description:
      input.description || `${input.title} 课程，结合案例与项目驱动，帮助你快速上手并完成一次可展示的作品。`,
    learningGoals: input.learningGoals?.length ? input.learningGoals : scaffold.learningGoals,
    curriculum,
    knowledgeSplits: curriculum.map((chapter) => ({
      chapter: chapter.title,
      points: chapter.lessons.slice(0, 3).map((lesson) => lesson.title)
    })),
    materials: input.materials?.map((title) => ({
      id: randomId(),
      title,
      type: 'doc' as const,
      size: ''
    })) || scaffold.materials,
    learningPath: scaffold.learningPath,
    framework: input.framework || scaffold.framework,
    createdBy: input.createdBy || 'teacher',
    createdAt: new Date().toISOString()
  };

  courses.push(newCourse);
  saveJSON(COURSES_KEY, courses);
  dispatchCourseUpdated();
  return newCourse;
};

const getAllEnrollments = (): Record<string, EnrollmentRecord[]> =>
  safeParse<Record<string, EnrollmentRecord[]>>(typeof window !== 'undefined' ? localStorage.getItem(ENROLL_KEY) : null, {});

const saveAllEnrollments = (value: Record<string, EnrollmentRecord[]>) => saveJSON(ENROLL_KEY, value);

export const getUserEnrollments = (userId?: string | null): EnrollmentRecord[] => {
  if (!userId) return [];
  const all = getAllEnrollments();
  return all[userId] || [];
};

export const isUserEnrolled = (userId: string | undefined | null, courseId: string) => {
  if (!userId) return false;
  return getUserEnrollments(userId).some((item) => item.courseId === courseId);
};

export const enrollCourse = (user: UserProfile | null | undefined, courseId: string) => {
  if (!user) return;
  const all = getAllEnrollments();
  const existing = all[user.userId] || [];
  if (!existing.find((item) => item.courseId === courseId)) {
    existing.push({ courseId, progress: 0, enrolledAt: new Date().toISOString() });
  }
  all[user.userId] = existing;
  saveAllEnrollments(all);
  dispatchCourseUpdated();
};

export const dropCourse = (user: UserProfile | null | undefined, courseId: string) => {
  if (!user) return;
  const all = getAllEnrollments();
  all[user.userId] = (all[user.userId] || []).filter((item) => item.courseId !== courseId);
  saveAllEnrollments(all);
  dispatchCourseUpdated();
};

export const updateEnrollmentProgress = (user: UserProfile | null | undefined, courseId: string, progress: number) => {
  if (!user) return;
  const all = getAllEnrollments();
  const list = all[user.userId] || [];
  const target = list.find((item) => item.courseId === courseId);
  if (target) {
    target.progress = Math.min(100, Math.max(0, progress));
  }
  all[user.userId] = list;
  saveAllEnrollments(all);
  dispatchCourseUpdated();
};
