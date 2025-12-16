const SAMPLE_CONTENT = {
  'deep-learning': `
深度学习课程主要围绕神经网络基本原理展开，包括感知机、激活函数、前向传播与反向传播、损失函数与优化器、梯度消失与梯度爆炸的成因与解决策略（如 ReLU、BatchNorm、残差连接）、卷积神经网络结构（卷积核、步幅、填充、池化、特征提取）、循环神经网络与序列建模（RNN/LSTM/GRU 的梯度截断、长距离依赖）、正则化方法（L2、Dropout、数据增广）、模型评估指标（准确率、召回率、F1）、以及典型案例（图像分类、文本分类）。
`.trim(),
  'python-basics': `
Python 基础课程覆盖变量、数据类型、条件与循环、列表/字典/集合、函数与作用域、模块与包、异常处理、文件读写、列表推导式、lambda、面向对象基础（类、继承、多态）、常用标准库（os、sys、math、random）、以及简单的算法练习（排序、查找、栈队列）。
`.trim()
};

const defaultContent = `
本课程介绍机器学习与深度学习的基础概念、常见网络结构、训练流程以及模型评估，重点围绕神经网络的前向传播、反向传播、损失函数、优化算法、正则化、以及典型应用案例（图像分类、文本分类、序列预测）。
`.trim();

function getMockCourseContent(courseId = 'deep-learning') {
  const content = SAMPLE_CONTENT[courseId] || defaultContent;
  return (content || '').slice(0, 12000);
}

module.exports = { getMockCourseContent };
