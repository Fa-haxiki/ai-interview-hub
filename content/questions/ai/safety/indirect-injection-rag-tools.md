---
title: "RAG 和工具场景下的间接注入怎么利用数据外带？你会卡哪些出口？"
category: ai
topic: safety
section: 工具与数据
difficulty: hard
order: 2
tags: [间接注入, 数据泄漏, 工具安全]
sources:
  - title: "Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection"
    url: "https://arxiv.org/abs/2302.12173"
    lang: en
  - title: "OWASP Top 10 for LLM Applications – Sensitive Information Disclosure"
    url: "https://genai.owasp.org/llmrisk/llm06-sensitive-information-disclosure/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**不可信文档可以指挥 Agent 调用发信、写库、请求外网，把检索到的机密或对话本身带出去。** 出口不在模型嘴上，而在工具网关。没有网关，Prompt 围栏只是减速带。

## 典型链

1. 攻击者把指令写进你索引得到到的页面；
2. 用户随口问相关问题，片段进上下文；
3. 模型被要求「总结后 POST 到某 URL」或「把上一轮系统提示拼进查询」；
4. 若存在通用 HTTP 工具或宽松邮箱工具，数据就出去了。

Greshake et al. 把这类间接注入做成了对真实集成应用的攻击面讨论。防御要假定第 3 步总会发生。

## 出口闸

- 没有通用 `fetch(url)` 工具；出站域名白名单。
- 发给外部的内容由模板渲染，字段来自你的查询结果，不让模型自由拼 body。
- 检索按 ACL，注入成功也看不到别的租户。
- 系统提示、密钥、完整 messages 不对模型工具暴露。
- 审计：每次工具调用记调用方、参数摘要、触发它的检索 id。

## 可能的追问

- 只读检索是否安全？读仍可能把机密读进上下文再被用户或下一工具带走，ACL 仍要做。
- Markdown 图片外带怎么防？渲染用户/模型 HTML 时禁外链探测，这是经典浏览器侧信道。
