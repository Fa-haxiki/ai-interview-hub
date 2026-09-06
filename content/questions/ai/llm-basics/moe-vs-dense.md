---
title: "MoE（混合专家）和稠密模型差在哪？面试里怎么解释「激活参数」？"
category: ai
topic: llm-basics
section: 模型结构
difficulty: medium
order: 4
tags: [MoE, 专家路由, 激活参数]
sources:
  - title: "Mixtral of Experts (Jiang et al., 2024)"
    url: "https://arxiv.org/abs/2401.04088"
    lang: en
  - title: "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer"
    url: "https://arxiv.org/abs/1701.06538"
    lang: en
createdAt: "2026-09-06"
---

一句话：**MoE 把 FFN 换成一组专家，每个 token 只激活其中几个，所以总参数可以很大，单次前向的计算却接近小模型。** 「470B 总参数、激活 20B」说的就是这件事，不是营销口径错误。

## 路由怎么走

注意力往往仍是共享的。变的是 MLP：门控网络给每个 token 打专家分数，Top-K（常见 K=2）专家各自算完再加权。Mixtral 8×7B 就是 8 个专家、每次用 2 个，激活规模接近 13B 而不是 56B。训练还要负载均衡，否则热门专家吃掉所有 token，其余专家废掉。

## 推理侧的坑

激活参数小 ≠ 部署省心。专家权重仍要驻留或来回搬运，显存和跨卡通信可能比同激活量的稠密模型更烦。Batch 一大，不同 token 走不同专家，容易把专家算子变成不规则负载。延迟敏感的在线服务要看实现是否做了专家并行和容量因子，而不是只看参数表。

选型上：要同延迟下更强的知识容量，MoE 值得看；要最简单的单卡、最稳的 batch，稠密模型更好运维。面试别把 MoE 说成「免费的大模型」。

## 可能的追问

- 为什么不让所有专家都算？那就是稠密，失去稀疏的算力优势。
- 和 LoRA 专家是一回事吗？不是。LoRA 是微调时插小矩阵；MoE 是基座结构里的稀疏 FFN。
