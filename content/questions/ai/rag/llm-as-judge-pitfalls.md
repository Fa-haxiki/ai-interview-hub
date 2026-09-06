---
title: "用 LLM 做评估（LLM-as-a-judge）有哪些坑？怎么校准让它可信？"
category: ai
topic: rag
section: 评估
difficulty: hard
order: 5
tags: [LLM-as-a-judge, 评估偏差, 校准, Cohen's kappa]
sources:
  - title: "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (Zheng et al., 2023)"
    url: "https://arxiv.org/abs/2306.05685"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
  - title: "Production RAG Architecture in 2026 - prompt20"
    url: "https://blog.prompt20.com/posts/rag-production-architecture/"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

我的观点是：LLM-as-a-judge 是**可扩展的近似人工**，不是 ground truth。它的偏差是系统性的，所以我的做法是先校准到与人工标注一致，再只把它当**相对信号**用，不宣称绝对分数。

## 六个常见的坑

1. **位置偏差**：成对比较时偏向某个位置（多数模型偏向排在前面的）。MT-Bench 论文里两个相近答案交换顺序后，只有 GPT-4 能在六成多的情况下给出一致结论，其他模型更差。
2. **长度偏差**：更长、看起来更详细的答案得分更高。论文用“重复列表攻击”验证过：把原答案的列表改写一遍拼在前面，信息量没变，不少 judge 却判它更好。
3. **自我偏好**：judge 对同源模型的输出打分偏高。论文观察到 GPT-4 给自己的胜率高约 10%，Claude 高约 25%（作者注明数据有限、不能定论）。RAG 项目里生成和评估用同一家模型是很常见的隐患。
4. **评分不稳定**：绝对分（1～10）对同一答案多次打分会波动，temperature、prompt 措辞微改都会变。升级 judge 模型后历史分数全部不可比，看板上的“回归”其实是尺子换了。
5. **对 rubric 敏感**：没有评分标准的“打个分”接近随机；有了标准，措辞稍改分布就变。
6. **判断“是否被支撑”时偏宽松**：Faithfulness 这类指标要判断陈述能否从上下文推出，LLM 倾向把合理推断、常识补充甚至数字偏差都算作支撑，导致忠实度虚高；论文也发现 judge 会被给定答案带偏，哪怕单独问它能算对。

## 怎么校准

我按下面的顺序做，前两步是底线：

- **先建人工锚点**：抽 100～200 条人工标注，算 judge 与人工的一致率和 Cohen's kappa。kappa 在 0.6 以下我不会拿它做决策。参考标准是论文里 GPT-4 与人类超过 80% 的一致率，与人和人之间相当；达不到这个量级，judge 只是在放大噪音。
- **成对比较代替绝对打分**：“A 和 B 哪个更好”比“给 A 打几分”稳定得多。配合交换顺序各判一次，结论不一致就记 tie，这是论文推荐的保守做法。
- **固定 rubric 加 few-shot**：把标准写成可核对的条目，例如“每条陈述必须能在上下文中找到对应句子，推断不算”，再给正反各两三个例子。论文里 few-shot 把一致性从 65% 提到了 77.5%，代价是 prompt 变长、成本上升。
- **多次采样取多数**：temperature 为 0 也不完全确定，重要指标我会采样 3～5 次取多数，或用两个不同家族的 judge 交叉投票。
- **用更强且不同源的模型做 judge**：生成用一家，评估用另一家；judge 版本 pin 住，升级时用锚点集重新做基线。
- **Faithfulness 专项处理**：强制 judge 先拆原子陈述再逐条判，并要求引用上下文原句作为证据；有条件时用 NLI 类小模型做第二意见。
- **只当相对信号，定期抽检**：报告“新版本比旧版本忠实度高 5 个点”，而不是“忠实度 0.92”；每次大改或每月人工抽检几十条，judge 和人分歧大的样本直接进难例集。

## 我的取舍

生产里我用两层体系：便宜的自动打分覆盖全量抽样流量看趋势，小规模人工标注集负责校准 judge、抓漂移。judge 的价值是把人工从“每条都看”变成“只看分歧和抽检”，不是取代人。

## 可能的追问

- judge 与人工一致率多少才够？至少接近人与人之间的一致率。还要区分分歧是系统性的（某类样本总偏高，改 rubric 能修）还是随机的（多采样、换更强模型），前者更危险。
- 线上没有对照，成对比较怎么用？离线回归用成对，线上用校准过的绝对分只看趋势；或者固定一个基线版本的输出作为 B 侧，把线上答案和它成对比较。
