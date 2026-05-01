const { Redis } = require('@upstash/redis');
const { createClient } = require('@supabase/supabase-js');

const redis = new Redis({
  url: 'https://free-hyena-96606.upstash.io',
  token: 'gQAAAAAAAXleAAIncDJkYzlhYjRlYjY2OTU0MzM0Yjk1NTMxMGQ5ZjczYzI4Y3AyOTY2MDY',
});

const supabase = createClient(
  'https://wkgpyneafghqykiciyxg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZ3B5bmVhZmdocXlraWNpeXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjczNzEsImV4cCI6MjA5MTUwMzM3MX0.zTPkPVOzK-MtgaMAkdKS6gnKiI9OLJEMe0j1oUqRssw'
);

// 你的真实用户 ID（用于测试「我的」功能）
const REAL_USER_ID = '125c4b2f-b47d-4eba-ab89-33e973706214';
const REAL_USERNAME = 'testuser';

// 模拟其他用户
const MOCK_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000001', username: 'LiMing_PKU', institution: '北京大学计算机科学与技术学院' },
  { id: 'a0000000-0000-0000-0000-000000000002', username: 'ZhangWei_THU', institution: '清华大学电子工程系' },
  { id: 'a0000000-0000-0000-0000-000000000003', username: 'ChenYu_SJTU', institution: '上海交通大学人工智能研究院' },
  { id: 'a0000000-0000-0000-0000-000000000004', username: 'WangXue_ZJU', institution: '浙江大学控制科学与工程学院' },
  { id: 'a0000000-0000-0000-0000-000000000005', username: 'LiuFeng_USTC', institution: '中国科学技术大学物理学院' },
];

// ─── 社区帖子（Redis）───

const seedPosts = [
  {
    id: 'p001',
    title: '基于Transformer架构的多模态医学影像融合方法研究',
    content: '本文提出了一种基于Vision Transformer的多模态医学影像融合框架。通过引入跨模态注意力机制，实现了CT与MRI影像的自适应特征对齐与融合。在BraTS 2023数据集上的实验表明，本方法在SSIM指标上较现有SOTA提升了3.7%，在边缘保持指标上提升了5.2%。消融实验进一步验证了跨模态注意力模块的有效性。\n\n关键词：医学影像融合、Transformer、多模态学习、注意力机制',
    tags: ['深度学习', '医学影像', 'Transformer', '计算机视觉'],
    author: MOCK_USERS[0].username,
    authorId: MOCK_USERS[0].id,
    institution: MOCK_USERS[0].institution,
    stars: 67,
    comments: 12,
    favorites: [REAL_USER_ID, MOCK_USERS[2].id],
    views: 1842,
    createdAt: '2026-04-28T10:30:00.000Z'
  },
  {
    id: 'p002',
    title: '联邦学习中非独立同分布数据的梯度补偿策略',
    content: '针对联邦学习中客户端数据非独立同分布(Non-IID)导致的模型性能退化问题，本文提出了FedGC算法。核心思想是在本地训练阶段引入梯度补偿项，通过估计全局梯度方向对本地更新进行修正。在CIFAR-10、CIFAR-100和FMNIST上的实验表明，在Dirichlet α=0.1的极端Non-IID场景下，FedGC相比FedAvg准确率提升12.4%，相比FedProx提升6.8%。\n\n关键词：联邦学习、非独立同分布、梯度补偿、分布式优化',
    tags: ['联邦学习', '分布式系统', '隐私计算', '优化算法'],
    author: MOCK_USERS[1].username,
    authorId: MOCK_USERS[1].id,
    institution: MOCK_USERS[1].institution,
    stars: 89,
    comments: 24,
    favorites: [REAL_USER_ID],
    views: 2567,
    createdAt: '2026-04-26T14:20:00.000Z'
  },
  {
    id: 'p003',
    title: '大语言模型在代码生成中的安全性评估框架',
    content: '随着GPT-4、Claude等大语言模型在代码生成领域的广泛应用，其生成代码的安全性日益受到关注。本文构建了一个包含2,400个测试用例的代码安全评估基准SecCodeBench，覆盖OWASP Top 10漏洞类型。对6个主流LLM的测试发现，即使是表现最优的模型，在复杂场景下的安全漏洞检出率仅为63.2%，且存在较高比例的误报。本文还提出了一种基于上下文感知提示的安全增强方法，可将漏洞检出率提升至81.7%。\n\n关键词：大语言模型、代码安全、漏洞检测、安全评估',
    tags: ['大语言模型', '代码安全', '漏洞检测', 'NLP'],
    author: MOCK_USERS[2].username,
    authorId: MOCK_USERS[2].id,
    institution: MOCK_USERS[2].institution,
    stars: 156,
    comments: 38,
    favorites: [REAL_USER_ID, MOCK_USERS[0].id, MOCK_USERS[3].id],
    views: 5234,
    createdAt: '2026-04-24T09:15:00.000Z'
  },
  {
    id: 'p004',
    title: '基于图神经网络的分子性质预测：一种异构图建模方法',
    content: '分子性质预测是药物发现中的关键任务。现有方法多将分子建模为同构图，忽略了原子类型和键类型的异构性。本文提出HeteroMol框架，将分子建模为异构图，使用关系图卷积网络(RGCN)学习不同类型原子和键的特征表示。在MoleculeNet基准的7个数据集上，HeteroMol在5个任务上达到了新的SOTA。特别是在HIV活性预测任务上，AUROC达到0.827，较最佳基线提升4.1个百分点。\n\n关键词：图神经网络、分子性质预测、药物发现、异构图',
    tags: ['图神经网络', '药物发现', '分子建模', 'AI4Science'],
    author: MOCK_USERS[3].username,
    authorId: MOCK_USERS[3].id,
    institution: MOCK_USERS[3].institution,
    stars: 45,
    comments: 9,
    favorites: [],
    views: 987,
    createdAt: '2026-04-22T16:45:00.000Z'
  },
  {
    id: 'p005',
    title: '面向自动驾驶的3D点云目标检测综述',
    content: '本文对基于3D点云的目标检测方法进行了系统性综述。从点云表示方式（原始点、体素、柱体、多模态融合）和检测范式（单阶段、两阶段、Anchor-free）两个维度对现有方法进行分类梳理。在Waymo Open Dataset和nuScenes上的定量比较显示，基于Transformer的方法在精度上具有明显优势，但在实时性方面仍有不足。最后讨论了当前面临的挑战：远距离小目标检测、恶劣天气鲁棒性和计算效率优化。\n\n关键词：3D目标检测、点云、自动驾驶、深度学习综述',
    tags: ['自动驾驶', '3D检测', '点云处理', '综述'],
    author: MOCK_USERS[4].username,
    authorId: MOCK_USERS[4].id,
    institution: MOCK_USERS[4].institution,
    stars: 112,
    comments: 31,
    favorites: [REAL_USER_ID, MOCK_USERS[1].id, MOCK_USERS[4].id],
    views: 4012,
    createdAt: '2026-04-20T11:00:00.000Z'
  },
  {
    id: 'p006',
    title: '扩散模型在高分辨率图像合成中的条件控制机制研究',
    content: '扩散模型在图像生成领域取得了突破性进展，但精确的条件控制仍是一个开放性问题。本文提出了ControlNet++框架，通过引入多尺度条件注入模块和自适应特征融合策略，实现了对生成图像空间布局、颜色分布和纹理细节的精细控制。在512×512和1024×1024分辨率下的实验表明，本方法在FID指标上较ControlNet降低14.3%，在用户偏好评测中获得72.6%的胜率。\n\n关键词：扩散模型、图像生成、条件控制、计算机视觉',
    tags: ['扩散模型', '图像生成', 'AIGC', '深度学习'],
    author: MOCK_USERS[0].username,
    authorId: MOCK_USERS[0].id,
    institution: MOCK_USERS[0].institution,
    stars: 203,
    comments: 47,
    favorites: [MOCK_USERS[2].id, MOCK_USERS[3].id],
    views: 7891,
    createdAt: '2026-04-18T08:30:00.000Z'
  },
  {
    id: 'p007',
    title: '基于强化学习的柔性机械臂轨迹规划与振动抑制',
    content: '柔性机械臂因其轻量化和高灵活性的优势在工业领域有广泛应用前景，但柔性变形导致的末端定位精度下降是制约其实际部署的关键问题。本文将柔性机械臂的轨迹规划建模为马尔可夫决策过程，提出了一种结合SAC算法和LSTM状态预测器的强化学习框架。仿真和物理实验表明，该方法在2m长单连杆柔性臂上实现了0.8mm的末端定位精度，残余振动抑制率达到94.7%。\n\n关键词：柔性机械臂、强化学习、轨迹规划、振动控制',
    tags: ['强化学习', '机器人学', '控制工程', '机械臂'],
    author: MOCK_USERS[3].username,
    authorId: MOCK_USERS[3].id,
    institution: MOCK_USERS[3].institution,
    stars: 34,
    comments: 7,
    favorites: [],
    views: 623,
    createdAt: '2026-04-16T20:10:00.000Z'
  },
  {
    id: 'p008',
    title: '基于对比学习的跨语言文本情感分析迁移方法',
    content: '跨语言情感分析旨在利用高资源语言（如英语）的标注数据帮助低资源语言进行情感分类。本文提出CL-XSA框架，通过构造多粒度对比学习目标（句子级、方面级、标签级）来对齐不同语言的语义空间。在XNLI和MLDoc基准上的实验表明，CL-XSA在零样本跨语言迁移场景下，平均准确率较mBERT基线提升5.8个百分点，在小样本（100条）场景下提升7.2个百分点。\n\n关键词：跨语言、情感分析、对比学习、迁移学习',
    tags: ['NLP', '情感分析', '对比学习', '跨语言'],
    author: MOCK_USERS[2].username,
    authorId: MOCK_USERS[2].id,
    institution: MOCK_USERS[2].institution,
    stars: 58,
    comments: 15,
    favorites: [REAL_USER_ID],
    views: 1345,
    createdAt: '2026-04-14T13:25:00.000Z'
  },
  {
    id: 'p009',
    title: '量子纠错码的拓扑性质与新型表面码设计',
    content: '量子纠错是实现容错量子计算的核心挑战。本文从拓扑量子场论的视角分析了表面码的纠错机制，提出了一种基于三晶格结构的自适应表面码方案。通过动态调整稳定子测量频率，该方案在物理错误率p=0.5%到1.5%的区间内，逻辑错误率较标准表面码降低了一个数量级。利用匹配译码器和神经网络的混合译码策略，实现了接近理论阈值的纠错性能。\n\n关键词：量子纠错、表面码、拓扑量子计算、容错计算',
    tags: ['量子计算', '量子纠错', '拓扑物理', '量子信息'],
    author: MOCK_USERS[4].username,
    authorId: MOCK_USERS[4].id,
    institution: MOCK_USERS[4].institution,
    stars: 76,
    comments: 19,
    favorites: [MOCK_USERS[0].id],
    views: 2103,
    createdAt: '2026-04-12T17:40:00.000Z'
  },
  {
    id: 'p010',
    title: '基于因果推断的推荐系统去偏方法研究',
    content: '推荐系统普遍存在的选择偏差、曝光偏差和位置偏差问题。本文从因果推断的角度出发，提出了IPW-DP框架，结合逆倾向加权(IPW)和去混杂(Deconfounding)两种策略进行联合去偏。在KuaiRec和Coat数据集上的实验表明，本方法在NDCG@10上较无偏基线提升8.3%，较IPS方法提升4.1%。此外，本文还从理论上证明了所提估计量的无偏性和一致性。\n\n关键词：推荐系统、因果推断、去偏、逆倾向加权',
    tags: ['推荐系统', '因果推断', '机器学习', '去偏方法'],
    author: MOCK_USERS[1].username,
    authorId: MOCK_USERS[1].id,
    institution: MOCK_USERS[1].institution,
    stars: 91,
    comments: 22,
    favorites: [REAL_USER_ID, MOCK_USERS[3].id],
    views: 3456,
    createdAt: '2026-04-10T15:00:00.000Z'
  },
  {
    id: 'p011',
    title: '大规模预训练模型的高效微调：现状与展望',
    content: '本文对参数高效微调(PEFT)方法进行了全面综述，系统比较了Adapter、Prefix-Tuning、LoRA、QLoRA等主流方法在NLU、NLG和多模态任务上的表现。实验覆盖模型规模从1.5B到70B参数，训练数据集从1K到100K样本。结果表明，LoRA在大多数场景下提供了最佳的性能-效率权衡，在仅更新0.1%参数的情况下达到全参数微调97.3%的性能。本文还讨论了PEFT在端侧部署和持续学习中的应用前景。\n\n关键词：参数高效微调、大语言模型、LoRA、模型压缩',
    tags: ['大语言模型', '参数高效微调', 'LoRA', '综述'],
    author: REAL_USERNAME,
    authorId: REAL_USER_ID,
    institution: '你的大学',
    stars: 287,
    comments: 56,
    favorites: [MOCK_USERS[0].id, MOCK_USERS[1].id, MOCK_USERS[2].id],
    views: 9120,
    createdAt: '2026-04-08T09:30:00.000Z'
  },
  {
    id: 'p012',
    title: '基于神经辐射场的三维重建加速：从训练到推理的全流程优化',
    content: '神经辐射场(NeRF)在三维重建和新视角合成方面展现了卓越的性能，但其高昂的计算成本限制了实际应用。本文提出了FastNeRF框架，从三个层面进行优化：(1) 基于哈希编码的位置编码替代频率编码；(2) 基于知识蒸馏的模型压缩；(3) 基于TensorRT的推理引擎。在Blender Synthetic和LLFF数据集上的实验表明，FastNeRF的训练速度较Instant-NGP提升1.8倍，推理速度达到120FPS（RTX 4090），PSNR仅下降0.3dB。\n\n关键词：NeRF、三维重建、模型加速、实时渲染',
    tags: ['NeRF', '三维重建', '计算机视觉', '实时渲染'],
    author: MOCK_USERS[0].username,
    authorId: MOCK_USERS[0].id,
    institution: MOCK_USERS[0].institution,
    stars: 134,
    comments: 28,
    favorites: [REAL_USER_ID],
    views: 4567,
    createdAt: '2026-04-05T19:20:00.000Z'
  },
];

// ─── 论文（Supabase）───

const seedPapers = [
  {
    user_id: REAL_USER_ID,
    title: '基于多尺度特征金字塔的遥感图像目标检测方法',
    description: '针对遥感图像中目标尺度变化大、背景复杂的问题，提出了一种多尺度特征金字塔网络。通过设计自适应特征融合模块和上下文感知注意力机制，在DOTA和DIOR数据集上取得了优异的检测性能。',
    tags: ['遥感图像', '目标检测', '特征金字塔', '计算机视觉'],
    institution: '北京大学计算机科学与技术学院',
    file_url: '',
    stars: 23,
    views: 456,
    starred_by: [REAL_USER_ID],
    created_at: '2026-04-25T08:00:00.000Z'
  },
  {
    user_id: REAL_USER_ID,
    title: '面向边缘计算的轻量级知识蒸馏框架',
    description: '本文提出了一种面向边缘设备的知识蒸馏框架LiteKD，通过引入教师-学生特征对齐损失和任务自适应蒸馏策略，在保持模型精度的同时将参数量压缩至原来的1/20。在ImageNet分类和COCO检测任务上验证了框架的有效性。',
    tags: ['知识蒸馏', '模型压缩', '边缘计算', '轻量级网络'],
    institution: '清华大学电子工程系',
    file_url: '',
    stars: 45,
    views: 892,
    starred_by: [REAL_USER_ID],
    created_at: '2026-04-21T14:30:00.000Z'
  },
  {
    user_id: REAL_USER_ID,
    title: '基于时空图卷积网络的城市交通流量预测',
    description: '城市交通流量预测是智能交通系统的核心问题之一。本文提出了一种时空图卷积网络(ST-GCN++)，通过多层级时空特征提取和动态图结构学习，在METR-LA和PEMS-BAY两个基准数据集上实现了最优预测精度。',
    tags: ['时空预测', '图卷积网络', '交通流量', '智慧城市'],
    institution: '你的大学',
    file_url: '',
    stars: 12,
    views: 234,
    starred_by: [],
    created_at: '2026-04-18T10:15:00.000Z'
  },
  {
    user_id: REAL_USER_ID,
    title: '面向低资源场景的少样本命名实体识别方法',
    description: '命名实体识别(NER)在低资源语言和垂直领域面临数据稀缺的挑战。本文提出了一种基于提示学习(Prompt Learning)的少样本NER方法，通过构建实体类型相关的提示模板和动态原型网络，在仅有5-10条标注样本的条件下，F1值较基线方法提升15.3%。',
    tags: ['命名实体识别', '少样本学习', '提示学习', 'NLP'],
    institution: '上海交通大学人工智能研究院',
    file_url: '',
    stars: 31,
    views: 567,
    starred_by: [],
    created_at: '2026-04-15T16:45:00.000Z'
  },
  {
    user_id: REAL_USER_ID,
    title: '基于深度强化学习的微电网能量管理优化策略',
    description: '微电网的能量管理是一个复杂的多目标优化问题。本文提出了一种基于多智能体深度强化学习的能量管理框架，将分布式电源、储能系统和负荷调度建模为协作多智能体系统。在含光伏、风电和锂电池的典型微电网场景中，运行成本较规则方法降低18.6%，可再生能源消纳率提升至96.3%。',
    tags: ['微电网', '深度强化学习', '能量管理', '智能电网'],
    institution: '浙江大学控制科学与工程学院',
    file_url: '',
    stars: 38,
    views: 723,
    starred_by: [REAL_USER_ID],
    created_at: '2026-04-12T09:00:00.000Z'
  },
  {
    user_id: REAL_USER_ID,
    title: '基于密度泛函理论的二维材料催化活性第一性原理研究',
    description: '本文利用密度泛函理论(DFT)系统研究了过渡金属硫族化合物(TMDCs)作为电催化析氢反应(HER)催化剂的性能。通过高通量计算筛选了超过200种TMDC变体，确定了12种具有优异催化活性的候选材料，其中MoS2/VSe2异质结的ΔGH*接近0 eV，展现出接近铂催化剂的催化潜力。',
    tags: ['第一性原理', '密度泛函理论', '二维材料', '电催化'],
    institution: '中国科学技术大学物理学院',
    file_url: '',
    stars: 52,
    views: 1034,
    starred_by: [],
    created_at: '2026-04-08T11:20:00.000Z'
  },
];

async function seed() {
  console.log('开始灌入种子数据...\n');

  // 0. 写入模拟用户到 public.users
  for (const u of MOCK_USERS) {
    await supabase.from('users').upsert([
      { id: u.id, username: u.username, institution: u.institution, email: `${u.username.toLowerCase()}@mock.test`, favorites: [], created_at: new Date().toISOString() }
    ], { onConflict: 'id' });
  }
  console.log(`✅ 已写入 ${MOCK_USERS.length} 个模拟用户`);

  // 1. 写入 Redis 帖子
  await redis.set('third:posts', JSON.stringify(seedPosts));
  console.log(`✅ 已写入 ${seedPosts.length} 条社区帖子到 Redis`);

  // 2. 写入 Supabase 论文
  let paperCount = 0;
  for (const paper of seedPapers) {
    const { error } = await supabase.from('papers').insert([paper]);
    if (error) {
      console.error(`❌ 论文写入失败: ${paper.title}`, error.message);
    } else {
      paperCount++;
    }
  }
  console.log(`✅ 已写入 ${paperCount} 条论文到 Supabase`);

  console.log('\n完成！其中：');
  console.log(`  - 你的账号 (${REAL_USERNAME}) 发布了 1 条帖子和 1 篇论文`);
  console.log(`  - 4 条帖子和 2 篇论文已被你收藏，可测试收藏功能`);
  console.log('\n请刷新页面查看。');
}

seed().catch(err => {
  console.error('种子数据写入失败:', err);
  process.exit(1);
});
