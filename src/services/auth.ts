export type UserRole = 'student' | 'teacher' | 'assistant';

export interface UserStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  totalHours: number;
  certificates: number;
}

export interface UserProfile {
  id: string;
  name: string;
  userId: string;
  role: UserRole;
  password: string;
  email?: string;
  phone?: string;
  faceBound?: boolean;
  major?: string;
  grade?: string;
  interests?: string[];
  stats: UserStats;
  createdAt: string;
}

const USERS_KEY = 'ai-learning-users';
const SESSION_KEY = 'ai-learning-session';

const defaultStats: UserStats = {
  coursesEnrolled: 0,
  coursesCompleted: 0,
  totalHours: 0,
  certificates: 0
};

const TEST_STUDENT_ID = '12345678';

export const ensureTestStudent = () => {
  const users = getUsers();
  const exists = users.find((u) => u.userId === TEST_STUDENT_ID);
  if (exists) return;

  const demoUser: UserProfile = {
    id: randomId(),
    name: '学生测试账号',
    userId: TEST_STUDENT_ID,
    role: 'student',
    password: '00000000',
    faceBound: false,
    email: 'student@test.com',
    phone: '',
    major: '计算机科学与技术',
    grade: '大二',
    interests: ['深度学习', 'Python', '数据分析'],
    stats: { ...defaultStats },
    createdAt: new Date().toISOString()
  };

  users.push(demoUser);
  saveUsers(users);
};

const randomId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse localStorage value', error);
    return fallback;
  }
};

const getUsers = (): UserProfile[] =>
  safeParse<UserProfile[]>(typeof window !== 'undefined' ? localStorage.getItem(USERS_KEY) : null, []);

const saveUsers = (users: UserProfile[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveSession = (userId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
};

export const deleteUser = (userId: string) => {
  const users = getUsers().filter((u) => u.userId !== userId);
  saveUsers(users);
  const session = safeParse<{ userId: string } | null>(
    typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null,
    null
  );
  if (session?.userId === userId) {
    clearSession();
  }
};

export const getCurrentUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const session = safeParse<{ userId: string } | null>(localStorage.getItem(SESSION_KEY), null);
  if (!session?.userId) return null;
  const users = getUsers();
  return users.find((user) => user.userId === session.userId) ?? null;
};

export function registerUser(input: {
  name: string;
  userId: string;
  role: UserRole;
  password: string;
  faceBound?: boolean;
  email?: string;
  phone?: string;
  major?: string;
  grade?: string;
  interests?: string[];
}): UserProfile {
  const users = getUsers();
  if (users.some((user) => user.userId === input.userId)) {
    throw new Error('该学号/工号已注册');
  }

  const newUser: UserProfile = {
    id: randomId(),
    name: input.name,
    userId: input.userId,
    role: input.role,
    password: input.password,
    faceBound: Boolean(input.faceBound),
    email: input.email,
    phone: input.phone,
    major: input.major,
    grade: input.grade,
    interests: input.interests,
    stats: { ...defaultStats },
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  saveSession(newUser.userId);
  return newUser;
}

export function loginWithPassword(userId: string, password: string, expectedRole?: UserRole): UserProfile {
  const users = getUsers();
  const user = users.find((item) => item.userId === userId && item.password === password);
  if (!user) {
    throw new Error('账号或密码错误');
  }
  if (expectedRole && user.role !== expectedRole) {
    throw new Error('角色不匹配，请确认选择了正确的登录入口');
  }
  saveSession(user.userId);
  return user;
}

export function loginWithFace(userId: string, expectedRole?: UserRole): UserProfile {
  const users = getUsers();
  const user = users.find((item) => item.userId === userId);
  if (!user) {
    throw new Error('未找到账号，请先注册');
  }
  if (expectedRole && user.role !== expectedRole) {
    throw new Error('角色不匹配，请确认选择了正确的登录入口');
  }
  if (!user.faceBound) {
    throw new Error('该账号未绑定人脸识别');
  }
  saveSession(user.userId);
  return user;
}

export function updateUserProfile(userId: string, data: Partial<UserProfile>): UserProfile {
  const users = getUsers();
  const index = users.findIndex((user) => user.userId === userId);
  if (index === -1) {
    throw new Error('未找到用户');
  }

  const updated: UserProfile = {
    ...users[index],
    ...data,
    // 保留密码等敏感字段，避免被部分更新覆盖
    password: data.password ?? users[index].password,
    stats: { ...users[index].stats, ...(data.stats || {}) }
  };

  users[index] = updated;
  saveUsers(users);

  const session = getCurrentUser();
  if (session?.userId === updated.userId) {
    saveSession(updated.userId);
  }

  return updated;
}

export const rolePermissions: Record<UserRole, string[]> = {
  student: ['学习课程', '提交作业', '参加测验', '查看成绩'],
  teacher: ['创建/编辑课程', '布置作业', '发布测验', '查看班级分析'],
  assistant: ['答疑解惑', '批改测验', '报告审核', '知识推荐']
};
