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
  },
  {
    id: deterministicId('大学英语'),
    title: '大学英语',
    instructor: '刘瑶',
    category: 'theory',
    level: '基础',
    students: 512,
    duration: '16周',
    rating: 4.76,
    thumbnail: '/image/大学英语.png',
    description: '围绕学术阅读、口语表达与写作能力，结合真实语料与课堂情景，帮助学生扎实提升英语综合应用水平。',
    learningGoals: [
      '熟练使用学术英语进行听说读写',
      '掌握常见学术写作结构与引用规范',
      '能针对真实情境完成演讲与报告表达',
      '积累跨学科核心词汇与表达策略'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '学术阅读与速记',
        lessons: [
          { id: 'l1', title: '长难句拆解与逻辑信号词', duration: '25分钟' },
          { id: 'l2', title: '论文摘要与主旨定位', duration: '20分钟' },
          { id: 'l3', title: '课堂速记与信息提取', duration: '18分钟' }
        ]
      },
      {
        id: 'c2',
        title: '口语表达与演讲',
        lessons: [
          { id: 'l4', title: '学术场景表达框架', duration: '22分钟' },
          { id: 'l5', title: '演讲结构与故事化表达', duration: '24分钟' },
          { id: 'l6', title: '即兴问答与互动技巧', duration: '16分钟' }
        ]
      },
      {
        id: 'c3',
        title: '写作与引用规范',
        lessons: [
          { id: 'l7', title: '议论文结构与论证展开', duration: '28分钟' },
          { id: 'l8', title: '引用、改写与避免抄袭', duration: '20分钟' },
          { id: 'l9', title: '期末写作实战工作坊', duration: '30分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '阅读', points: ['长难句', '主旨', '速记'] },
      { chapter: '口语', points: ['框架', '演讲', '问答'] },
      { chapter: '写作', points: ['结构', '引用', '实战'] }
    ],
    materials: [
      { id: randomId(), title: 'Academic English Reading Pack.pdf', type: 'pdf', size: '1.5MB' },
      { id: randomId(), title: 'Presentation Toolkit.ppt', type: 'ppt', size: '6.2MB' },
      { id: randomId(), title: 'Writing Checklist & Citation Guide.doc', type: 'doc', size: '780KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '阅读理解', progress: 40, nodes: ['信号词', '长难句', '主旨'] },
      { id: 'lp2', title: '口语表达', progress: 25, nodes: ['框架', '演讲', '互动'] },
      { id: 'lp3', title: '写作输出', progress: 20, nodes: ['结构', '引用', '批改'] },
      { id: 'lp4', title: '综合提升', progress: 10, nodes: ['语料积累', '场景实战', '反思'] }
    ],
    framework: '大学英语教案：以真实学术场景为驱动，兼顾听说读写联动训练，强调策略、实战与反馈闭环。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: deterministicId('离散数学'),
    title: '离散数学',
    instructor: '高云',
    category: 'theory',
    level: '核心',
    students: 688,
    duration: '12周',
    rating: 4.88,
    thumbnail: '/image/离散数学.jpg',
    description: '覆盖集合、逻辑、图论与组合数学等核心知识，配合算法思维练习，帮助学生建立严谨的离散模型化能力。',
    learningGoals: [
      '掌握命题与谓词逻辑的推理方法',
      '理解集合、关系与函数的基本性质',
      '能够在图论与组合问题中建模并求解',
      '将离散数学思想迁移到算法与程序设计'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '逻辑与证明',
        lessons: [
          { id: 'l1', title: '命题逻辑与等价变换', duration: '22分钟' },
          { id: 'l2', title: '谓词逻辑与量词推理', duration: '24分钟' },
          { id: 'l3', title: '常见证明方法：反证与归纳', duration: '26分钟' }
        ]
      },
      {
        id: 'c2',
        title: '集合、关系与函数',
        lessons: [
          { id: 'l4', title: '集合运算与代数结构', duration: '20分钟' },
          { id: 'l5', title: '等价关系与偏序关系', duration: '22分钟' },
          { id: 'l6', title: '函数与计数原理基础', duration: '24分钟' }
        ]
      },
      {
        id: 'c3',
        title: '图论与组合',
        lessons: [
          { id: 'l7', title: '图的表示与遍历', duration: '23分钟' },
          { id: 'l8', title: '最短路径与最小生成树', duration: '25分钟' },
          { id: 'l9', title: '组合计数与递推关系', duration: '27分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '逻辑', points: ['命题', '谓词', '证明'] },
      { chapter: '集合与关系', points: ['代数', '等价', '计数'] },
      { chapter: '图论组合', points: ['遍历', '路径', '递推'] }
    ],
    materials: [
      { id: randomId(), title: 'Discrete Math Lecture Notes.pdf', type: 'pdf', size: '2.1MB' },
      { id: randomId(), title: 'Graph Theory Examples.ppt', type: 'ppt', size: '4.9MB' },
      { id: randomId(), title: 'Proof Techniques Workbook.doc', type: 'doc', size: '980KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '逻辑基础', progress: 45, nodes: ['推理', '等价', '证明'] },
      { id: 'lp2', title: '结构建模', progress: 30, nodes: ['集合', '关系', '函数'] },
      { id: 'lp3', title: '图论算法', progress: 25, nodes: ['遍历', '路径', '最小树'] },
      { id: 'lp4', title: '组合思维', progress: 15, nodes: ['计数', '递推', '算法化'] }
    ],
    framework: '离散数学教案：以逻辑与证明为底座，结合图论与计数的算法化案例，强化建模与推理训练。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: deterministicId('摄影与镜头语言设计'),
    title: '摄影与镜头语言设计',
    instructor: '沈乔',
    category: 'design',
    level: '实践',
    students: 274,
    duration: '6周',
    rating: 4.81,
    thumbnail: '/image/摄影与镜头语言设计.png',
    description: '从光影、构图到镜头运动系统化训练，结合短视频与叙事案例，掌握用镜头讲故事的能力。',
    learningGoals: [
      '理解光影、色彩与构图的表达效果',
      '掌握常见镜头运动与剪辑衔接方法',
      '能独立完成分镜脚本与拍摄计划',
      '制作一支完成度高的叙事短片'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '光影与构图',
        lessons: [
          { id: 'l1', title: '三分法、对称与视觉平衡', duration: '18分钟' },
          { id: 'l2', title: '光线方向与情绪塑造', duration: '20分钟' },
          { id: 'l3', title: '色彩基调与风格化', duration: '16分钟' }
        ]
      },
      {
        id: 'c2',
        title: '镜头语言与运动',
        lessons: [
          { id: 'l4', title: '景别与镜头关系', duration: '19分钟' },
          { id: 'l5', title: '推拉摇移：运动设计与稳定', duration: '22分钟' },
          { id: 'l6', title: '剪辑节奏与转场策略', duration: '21分钟' }
        ]
      },
      {
        id: 'c3',
        title: '叙事与实战',
        lessons: [
          { id: 'l7', title: '分镜脚本与拍摄计划', duration: '24分钟' },
          { id: 'l8', title: '现场调度与多机位协作', duration: '23分钟' },
          { id: 'l9', title: '短片成片打磨与反馈', duration: '28分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '视觉基础', points: ['构图', '光影', '色彩'] },
      { chapter: '镜头语言', points: ['景别', '运动', '剪辑'] },
      { chapter: '实战叙事', points: ['分镜', '调度', '成片'] }
    ],
    materials: [
      { id: randomId(), title: 'Cinematography Handbook.pdf', type: 'pdf', size: '1.9MB' },
      { id: randomId(), title: 'Shot Design Templates.ppt', type: 'ppt', size: '5.1MB' },
      { id: randomId(), title: 'Storyboard Worksheet.doc', type: 'doc', size: '640KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '视觉语言', progress: 40, nodes: ['构图', '光线', '色彩'] },
      { id: 'lp2', title: '镜头运用', progress: 28, nodes: ['景别', '运动', '剪辑'] },
      { id: 'lp3', title: '拍摄执行', progress: 22, nodes: ['分镜', '计划', '调度'] },
      { id: 'lp4', title: '作品打磨', progress: 12, nodes: ['剪辑', '配乐', '反馈'] }
    ],
    framework: '摄影与镜头语言设计教案：以视觉与叙事双线推进，配合分镜-拍摄-剪辑的实战闭环，形成可落地的镜头语言体系。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: deterministicId('大学物理'),
    title: '大学物理',
    instructor: '林舟',
    category: 'theory',
    level: '基础',
    students: 742,
    duration: '14周',
    rating: 4.84,
    thumbnail: '/image/大学物理.png',
    description: '以力学、电磁学到近代物理为主线，结合实验与建模练习，夯实物理直觉与公式推导能力。',
    learningGoals: [
      '建立力学和电磁学的核心概念框架',
      '熟练运用基本公式进行建模与解题',
      '理解波动与光学的常见实验现象',
      '初步认识相对论与量子力学的基本思想'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '力学基础',
        lessons: [
          { id: 'l1', title: '牛顿运动定律与动力学分析', duration: '24分钟' },
          { id: 'l2', title: '能量与动量守恒应用', duration: '22分钟' },
          { id: 'l3', title: '简谐振动与波动概念', duration: '20分钟' }
        ]
      },
      {
        id: 'c2',
        title: '电磁与波',
        lessons: [
          { id: 'l4', title: '库仑定律与电场', duration: '21分钟' },
          { id: 'l5', title: '磁场与电磁感应', duration: '23分钟' },
          { id: 'l6', title: '麦克斯韦方程组概览', duration: '25分钟' }
        ]
      },
      {
        id: 'c3',
        title: '现代物理概览',
        lessons: [
          { id: 'l7', title: '狭义相对论的基本结论', duration: '20分钟' },
          { id: 'l8', title: '量子化与原子模型', duration: '22分钟' },
          { id: 'l9', title: '物理建模小实验与报告', duration: '26分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '力学', points: ['动力学', '守恒律', '振动'] },
      { chapter: '电磁', points: ['电场', '磁场', '感应'] },
      { chapter: '近代物理', points: ['相对论', '量子', '实验'] }
    ],
    materials: [
      { id: randomId(), title: 'University Physics Notes.pdf', type: 'pdf', size: '2.3MB' },
      { id: randomId(), title: 'Electromagnetism Slides.ppt', type: 'ppt', size: '5.5MB' },
      { id: randomId(), title: 'Lab Report Template.doc', type: 'doc', size: '720KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '力学入门', progress: 45, nodes: ['定律', '守恒', '振动'] },
      { id: 'lp2', title: '电磁基础', progress: 30, nodes: ['电场', '磁场', '感应'] },
      { id: 'lp3', title: '波与光', progress: 20, nodes: ['波动', '干涉', '衍射'] },
      { id: 'lp4', title: '近代物理', progress: 10, nodes: ['相对论', '量子', '展望'] }
    ],
    framework: '大学物理教案：以模型+实验驱动理解力学、电磁与现代物理的核心思想，强调公式推导与直觉结合。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: deterministicId('电路与电子学'),
    title: '电路与电子学',
    instructor: '黄岚',
    category: 'programming',
    level: '核心',
    students: 523,
    duration: '10周',
    rating: 4.82,
    thumbnail: '/image/电路与电子学.png',
    description: '从电路定律到放大与滤波电路的系统训练，结合仿真与板级实操，打通模拟与数字电路基础。',
    learningGoals: [
      '掌握电路分析的基本定律与方法',
      '能设计与调试常见放大、滤波电路',
      '理解运算放大器的核心应用场景',
      '具备读懂与绘制电路图的能力'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '电路基础与分析',
        lessons: [
          { id: 'l1', title: '基尔霍夫定律与等效变换', duration: '22分钟' },
          { id: 'l2', title: '交流分析与相量法', duration: '24分钟' },
          { id: 'l3', title: '一阶与二阶电路响应', duration: '20分钟' }
        ]
      },
      {
        id: 'c2',
        title: '器件与放大电路',
        lessons: [
          { id: 'l4', title: '二极管与晶体管特性', duration: '21分钟' },
          { id: 'l5', title: '共射与共集放大电路', duration: '23分钟' },
          { id: 'l6', title: '运算放大器基础与应用', duration: '25分钟' }
        ]
      },
      {
        id: 'c3',
        title: '滤波与仿真实战',
        lessons: [
          { id: 'l7', title: '有源/无源滤波器设计', duration: '22分钟' },
          { id: 'l8', title: '电源与噪声抑制', duration: '21分钟' },
          { id: 'l9', title: 'SPICE 仿真与板级调试', duration: '26分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '分析', points: ['基尔霍夫', '等效', '响应'] },
      { chapter: '放大', points: ['晶体管', '共射', '运放'] },
      { chapter: '滤波', points: ['有源', '无源', '仿真'] }
    ],
    materials: [
      { id: randomId(), title: 'Circuit Analysis Workbook.pdf', type: 'pdf', size: '1.8MB' },
      { id: randomId(), title: 'Op-Amp Application Notes.ppt', type: 'ppt', size: '4.7MB' },
      { id: randomId(), title: 'SPICE Simulation Guide.doc', type: 'doc', size: '650KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '电路分析', progress: 42, nodes: ['定律', '等效', '响应'] },
      { id: 'lp2', title: '器件理解', progress: 30, nodes: ['二极管', '晶体管', '运放'] },
      { id: 'lp3', title: '设计实现', progress: 24, nodes: ['放大', '滤波', '仿真'] },
      { id: 'lp4', title: '调试优化', progress: 12, nodes: ['噪声', '电源', '板级'] }
    ],
    framework: '电路与电子学教案：以电路分析为底座，结合运放与滤波的设计实战，串联仿真到板级调试的完整流程。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: deterministicId('数字逻辑设计'),
    title: '数字逻辑设计',
    instructor: '潘立',
    category: 'programming',
    level: '核心',
    students: 601,
    duration: '9周',
    rating: 4.86,
    thumbnail: '/image/数字逻辑设计.png',
    description: '覆盖布尔代数、组合/时序逻辑到有限状态机设计，配合仿真工具完成从真值表到可综合电路的闭环。',
    learningGoals: [
      '熟练使用布尔代数进行化简与最小化',
      '能设计常见组合逻辑与时序逻辑电路',
      '掌握有限状态机建模与编码方法',
      '理解可综合设计与基础时序约束'
    ],
    curriculum: [
      {
        id: 'c1',
        title: '布尔代数与组合逻辑',
        lessons: [
          { id: 'l1', title: '布尔代数与卡诺图化简', duration: '21分钟' },
          { id: 'l2', title: '编码器、译码器与选择器', duration: '22分钟' },
          { id: 'l3', title: '加法器与比较器设计', duration: '23分钟' }
        ]
      },
      {
        id: 'c2',
        title: '时序逻辑与寄存器',
        lessons: [
          { id: 'l4', title: '触发器与寄存器构建', duration: '20分钟' },
          { id: 'l5', title: '计数器与移位寄存器', duration: '22分钟' },
          { id: 'l6', title: '时钟、复位与同步原则', duration: '23分钟' }
        ]
      },
      {
        id: 'c3',
        title: '有限状态机与实现',
        lessons: [
          { id: 'l7', title: 'FSM 建模与编码策略', duration: '24分钟' },
          { id: 'l8', title: 'HDL 仿真与波形分析', duration: '25分钟' },
          { id: 'l9', title: '综合约束与实现小项目', duration: '28分钟', locked: true }
        ]
      }
    ],
    knowledgeSplits: [
      { chapter: '组合逻辑', points: ['化简', '编码/译码', '加法器'] },
      { chapter: '时序逻辑', points: ['触发器', '计数器', '同步'] },
      { chapter: 'FSM', points: ['建模', '仿真', '综合'] }
    ],
    materials: [
      { id: randomId(), title: 'Digital Logic Basics.pdf', type: 'pdf', size: '1.6MB' },
      { id: randomId(), title: 'FSM Design Slides.ppt', type: 'ppt', size: '4.3MB' },
      { id: randomId(), title: 'Verilog Simulation Cheatsheet.doc', type: 'doc', size: '610KB' }
    ],
    learningPath: [
      { id: 'lp1', title: '组合设计', progress: 44, nodes: ['化简', '组合模块', '验证'] },
      { id: 'lp2', title: '时序设计', progress: 32, nodes: ['触发器', '时钟', '约束'] },
      { id: 'lp3', title: 'FSM 实战', progress: 26, nodes: ['建模', '仿真', '综合'] },
      { id: 'lp4', title: '系统集成', progress: 12, nodes: ['接口', '调试', '优化'] }
    ],
    framework: '数字逻辑设计教案：从布尔代数到 FSM 的逐层递进训练，结合 HDL 仿真与综合形成可验证的数字系统设计流程。',
    createdBy: 'system',
    createdAt: new Date().toISOString()
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
