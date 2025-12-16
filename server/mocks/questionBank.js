const { randomUUID } = require('crypto');

const pickId = () => randomUUID();

const QUESTION_BANK = [
  {
    id: pickId(),
    type: 'single',
    stem: '在深度学习中，使用 ReLU 激活函数的主要优点是？',
    options: [
      { key: 'A', text: '输出恒为正，避免数值不稳定' },
      { key: 'B', text: '简化计算并缓解梯度消失' },
      { key: 'C', text: '保证输出均值为 0' },
      { key: 'D', text: '天然抵抗过拟合' }
    ],
    answer: ['B'],
    explanation: 'ReLU 计算简单且在正区间梯度恒为 1，可缓解梯度消失问题。',
    knowledgePoints: ['激活函数', '梯度消失'],
    difficulty: '中等',
    score: 5
  },
  {
    id: pickId(),
    type: 'multiple',
    stem: '以下哪些操作可以缓解梯度爆炸？',
    options: [
      { key: 'A', text: '梯度裁剪' },
      { key: 'B', text: '使用较小的学习率' },
      { key: 'C', text: '更换为 Sigmoid 激活函数' },
      { key: 'D', text: '使用残差连接' }
    ],
    answer: ['A', 'B', 'D'],
    explanation: '常用手段包括梯度裁剪、降低学习率、引入残差/规范化，Sigmoid 可能加重梯度消失。',
    knowledgePoints: ['梯度爆炸', '优化'],
    difficulty: '中等',
    score: 6
  },
  {
    id: pickId(),
    type: 'tf',
    stem: '在卷积神经网络中，增加步幅（stride）通常会减少特征图的尺寸。',
    answer: true,
    explanation: '步幅越大，每次卷积滑动跨越的距离越大，输出特征图尺寸会减小。',
    knowledgePoints: ['卷积神经网络'],
    difficulty: '简单',
    score: 2
  },
  {
    id: pickId(),
    type: 'short',
    stem: '简述反向传播算法的核心步骤。',
    referenceAnswer: '前向计算得到损失，逐层按链式法则计算梯度，按参数维度累计梯度并应用优化器更新权重，可结合正则与梯度裁剪。',
    gradingRubric: [
      { item: '说明前向-损失计算', points: 2 },
      { item: '链式法则逐层回传', points: 3 },
      { item: '参数更新与优化器/正则', points: 3 }
    ],
    knowledgePoints: ['反向传播', '优化'],
    difficulty: '中等',
    score: 8
  },
  {
    id: pickId(),
    type: 'essay',
    stem: '论述 Batch Normalization 在深度网络训练中的作用与局限。',
    referenceAnswer:
      '作用：稳定中间分布，加快收敛，允许更大学习率，缓解梯度消失。局限：对小 batch 不稳定，在 RNN 场景效果有限，引入额外计算开销。',
    gradingRubric: [
      { item: '作用描述（稳定/收敛/学习率）', points: 4 },
      { item: '局限说明（小 batch/RNN/开销）', points: 4 },
      { item: '结合适用场景或替代方案', points: 2 }
    ],
    knowledgePoints: ['BatchNorm', '训练技巧'],
    difficulty: '困难',
    score: 10
  },
  {
    id: pickId(),
    type: 'single',
    stem: '下列哪项最能体现卷积核参数共享的好处？',
    options: [
      { key: 'A', text: '减少模型参数数量' },
      { key: 'B', text: '提升非线性表达能力' },
      { key: 'C', text: '自动生成数据增强' },
      { key: 'D', text: '避免过拟合风险' }
    ],
    answer: ['A'],
    explanation: '参数共享减少参数量，并提升平移不变性，但并非直接增加非线性或自动增强。',
    knowledgePoints: ['卷积神经网络', '参数共享'],
    difficulty: '简单',
    score: 4
  }
];

module.exports = { QUESTION_BANK };
