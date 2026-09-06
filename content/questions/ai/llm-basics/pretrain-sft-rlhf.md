---
title: "预训练、SFT、RLHF / 偏好对齐各解决什么？应用开发要碰哪一层？"
category: ai
topic: llm-basics
section: 训练与推理
difficulty: easy
order: 6
tags: [预训练, SFT, RLHF, 对齐]
sources:
  - title: "Training language models to follow instructions with human feedback"
    url: "https://arxiv.org/abs/2203.02155"
    lang: en
  - title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
    url: "https://arxiv.org/abs/2305.18290"
    lang: en
createdAt: "2026-09-06"
---

一句话：**预训练学下一个 token，SFT 学会按指令说话，对齐让它更像「人想要的助手」而不是网页续写器。** 做应用的人默认站在对齐后的 Chat 模型上，用 Prompt / RAG / 工具；只有风格、格式、领域话术稳定复现时，才下沉到自己做 SFT。

## 三层目标

预训练：海量文本上的语言建模，长知识、语法和世界统计。它不会自然地「先思考再简短回答」，更不会拒绝有害请求。

SFT：用「指令 → 理想回答」对继续训，把模型拐进对话格式。数据质量比数量更要命，抄来的脏轨迹会变成稳定的坏习惯。

RLHF / DPO：同一提示下比较回答谁更好。经典 RLHF 先训奖励模型再 PPO；DPO 跳过显式 RM，直接在偏好对上优化策略。这一层改的是风格、安全、拒绝，不是突然多出一套私有知识。

## 应用侧怎么选

知识会变、要引用、要权限，用 RAG，不要幻想再 SFT 一遍就能追上上周的制度。口吻、工单字段、必须遵守的输出 JSON，小规模 SFT 或 LoRA 往往比把 3 页约束塞进系统提示稳。对齐做过头会出现「过度拒绝」或「只会客套」，要有回归集。细节见「微调与对齐」主题。

## 可能的追问

- 对齐会不会改事实？会偏向「听起来安全/讨喜」的说法，事实要以检索或工具为准。
- 基础模型和 Instruct 模型能混用吗？别把续写基座直接当客服；工具调用、拒答都按 Instruct / Chat 模型来。
