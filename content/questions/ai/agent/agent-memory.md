---
title: "Agent 的记忆怎么分层？哪些东西不该写进长期记忆？"
category: ai
topic: agent
section: 记忆与协议
difficulty: medium
order: 4
tags: [记忆, checkpoint, 长期记忆]
sources:
  - title: "Generative Agents: Interactive Simulacra of Human Behavior"
    url: "https://arxiv.org/abs/2304.03442"
    lang: en
  - title: "Persistence - LangGraph docs"
    url: "https://docs.langchain.com/oss/javascript/langgraph/persistence"
    lang: en
createdAt: "2026-09-06"
---

一句话：**工作记忆是当前 thread 的 messages / State，长期记忆是跨会话可检索的事实，情节记忆是「上次发生过什么」的摘要。** 三者混成无限追加的聊天记录，窗口和隐私会一起炸。

## 三层

- **工作记忆**：本轮工具观察、检索片段、未完成的计划。随请求或 checkpoint 走，用完可丢。
- **会话记忆**：同一 `thread_id` 的对话连续性，靠检查点，不是靠把全文再 embed 一次。
- **长期记忆**：用户偏好、已确认档案。按 `userId` 写入 Store 或业务库，读取时限条、带时间。

Generative Agents 用检索+反思模拟长期行为，产品上要冷静：那是研究设定。真实系统里，模型随口总结的「用户讨厌周末发货」不能直接落库。

## 不该写入的

未确认的推断、一次性验证码、别人的 PII、完整工具日志、过期工单细节。写入要有门槛：用户明示、或规则抽取后人工抽检。读取必须受 ACL 约束，否则记忆层变成第二条未鉴权检索。

框架上 Checkpointer ≠ Store，见 LangGraph 题。这里要能讲清产品语义：记忆是数据，不是魔法人格。

## 可能的追问

- 记忆要不要向量检索？条目多、语义问法多时要；几十条偏好直接按 key 取更稳。
- 和 RAG 知识库一回事吗？知识库是组织文档；记忆是用户或任务的状态。权限模型和更新频率都不同。
