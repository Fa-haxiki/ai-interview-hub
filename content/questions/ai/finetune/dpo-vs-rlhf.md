---
title: "DPO 和经典 RLHF 差在哪？应用侧什么时候需要做偏好对齐？"
category: ai
topic: finetune
section: 对齐
difficulty: medium
order: 3
tags: [DPO, RLHF, 偏好对齐]
sources:
  - title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
    url: "https://arxiv.org/abs/2305.18290"
    lang: en
  - title: "Training language models to follow instructions with human feedback"
    url: "https://arxiv.org/abs/2203.02155"
    lang: en
createdAt: "2026-09-06"
---

一句话：**RLHF 是「奖励模型 + 强化学习」两条链，DPO 用偏好对直接改策略，少一套 RM 和 PPO。** 应用团队要的通常不是再训一遍「人类价值」，而是让模型更听话地遵守自家口吻、拒答和引用格式。没成对偏好数据，两条路都走不动。

## 机制差在哪

RLHF：人工或规则比较回答 → 训奖励模型 → 用 PPO 等让策略抬奖励，同时 KL 惩罚避免离 SFT 太远。效果强，超参和训练稳定性烦人。

DPO：把同一提示下的 win/lose 对直接写成分类目标，策略隐式扮演奖励。实现短，仍要高质量对，且对分布外提示可能过拟合「评委口味」。

## 实践取舍

客服要更少废话、更常引用、更少编订单号——先用规则和 SFT。只有「同样正确但体验差」的成对数据够多，才上 DPO。对齐之后必须回归安全和事实集，防止过度谄媚或过度拒绝。基座厂商已经做过通用 RLHF，你做的是领域偏好，规模要克制。

## 可能的追问

- 没有人类标注能不能对齐？可以用更强模型当评委，但会继承评委偏差，要抽检。
- DPO 能当知识注入吗？不该。偏好对教的是比较，不是往权重里写百科。
