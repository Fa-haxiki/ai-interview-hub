---
title: "MCP（Model Context Protocol）是什么？和自己注册一堆 Tool 有什么差别？"
category: ai
topic: agent
section: 记忆与协议
difficulty: medium
order: 5
tags: [MCP, Tool, 协议]
sources:
  - title: "Model Context Protocol specification"
    url: "https://modelcontextprotocol.io/specification/2025-06-18"
    lang: en
  - title: "What is the Model Context Protocol (MCP)?"
    url: "https://modelcontextprotocol.io/docs/getting-started/intro"
    lang: en
createdAt: "2026-09-06"
---

一句话：**MCP 是模型宿主和外部能力之间的标准协议：用统一方式发现工具、取资源、要提示模板。** 自己在代码里 `bindTools` 是点对点集成；MCP 把「能力提供方」做成可插拔的 server，IDE、Agent 运行时、内部平台可以共用同一套。

## 它管什么

典型能力：tools（可调用函数）、resources（可读上下文）、prompts（可复用模板）。Client（Claude Desktop、自研 Agent、Cursor 一类）连上 MCP server，列出工具再交给模型做 function calling。传输可以是本地 stdio 或远端 HTTP。协议不替代鉴权：server 仍要知道「当前用户是谁」。

和 OpenAPI 工具网关的差别：MCP 面向「给 LLM 用的上下文与行动」，带有发现和会话语义；OpenAPI 更偏传统 HTTP 集成。两者可以同时存在——MCP server 背后仍是你的 NestJS 服务。

## 实践取舍

内部三五个 API，直接注册 Tool 更快。工具要跨多个 Agent / 多个客户端复用，或要让非开发同事在桌面端接公司知识库，才值得上 MCP。风险是：每个 server 都是新的攻击面，提示注入会诱导模型调用危险工具。上线清单和自研 Tool 一样：白名单、只读默认、写操作 HITL、审计日志。

## 可能的追问

- MCP 能代替检索服务吗？不能。它只是管道；分块、权限、索引仍要自己做。
- 和 Skill / Plugin 市场呢？都是「可发现的外部能力」；选型看你要不要开放协议，而不是品牌。
