---
title: "输出护栏怎么做才有效？为什么只靠「模型自己不要乱说」不够？"
category: ai
topic: safety
section: 护栏
difficulty: medium
order: 3
tags: [护栏, 内容安全, 策略]
sources:
  - title: "OWASP Top 10 for LLM Applications"
    url: "https://genai.owasp.org/llm-top-10/"
    lang: en
  - title: "Building guardrails for large language models"
    url: "https://arxiv.org/abs/2402.01822"
    lang: en
createdAt: "2026-09-06"
---

一句话：**护栏是策略引擎，不是另一段更长的系统提示。** 输入过滤、工具权限、输出校验应在模型外面用代码执行。模型自检可以当软信号，不能当唯一闸门。

## 三道

1. **进**：注入模式、超量上传、明显越权请求，直接拒或改走人工，不消耗工具循环。
2. **中**：工具白名单、参数 schema、HITL、速率限制。
3. **出**：PII 正则/识别、禁发字段、品牌与合规词、JSON schema。失败就重试或降级模板，不要把脏输出流给用户。

流式输出要「先缓冲再扫」或分段扫，否则 PII 已经推到前端。延迟和安全在这里对撞，产品要选。

分类器可以用小模型或规则。规则对卡号、邮箱稳；语义攻击用分类器。两者都要可关、可审计、可算误伤率。护栏误伤会逼业务把它关掉，比没有更糟。

## 实践取舍

NestJS 里护栏是拦截器/管道，和鉴权一个层级。Prompt 里写「不要输出手机号」只是补充。面试能画出这三道，比背安全形容词重要。

## 可能的追问

- 护栏模型被注入怎么办？护栏输入只要用户可见文本和工具参数，不要把完整系统提示再喂给它；规则通道保持独立。
- 和法律审核的关系？护栏减风险，不替代合规审查和日志留存。
