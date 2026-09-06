---
title: "Milvus 的整体架构是怎样的？各节点分别干什么？"
category: ai
topic: search-infra
section: Milvus
difficulty: medium
order: 1
tags: [Milvus, 存算分离, 协调节点, Zilliz]
sources:
  - title: "Milvus Architecture Overview"
    url: "https://milvus.io/docs/architecture_overview.md"
    lang: en
  - title: "What is Milvus? - Overview"
    url: "https://milvus.io/docs/overview.md"
    lang: en
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

Milvus 是存算分离、面向大规模向量的分布式系统，不是「把 FAISS 包一层 HTTP」。官网把集群拆成接入、协调、工作节点，底下再挂对象存储、元数据和消息队列。计算节点尽量无共享本地数据，扩容是加工人，不是搬磁盘。

## 各层分别干什么

- **接入层**：Proxy 接 SDK / REST，做校验、路由和结果汇总。客户端通常只跟这一层说话。
- **协调节点**：集群的大脑，管拓扑、负载、时间戳和 DDL（建 collection、分区、索引），并把 compaction、建索引这类后台任务派给工人。新版本常把过去拆开的多个协调角色收成一套，面试说清职责即可，不必背旧组件名。
- **工作节点**：查询节点加载数据做检索；数据节点负责落盘、compaction；索引工作给封存后的段建索引（新版本常并进数据节点）。一次 search 会在多个查询节点上并行扫段，再由接入层合并。
- **存储**：向量和索引文件在对象存储（S3 / MinIO）；元数据与服务发现在 etcd；写入走消息队列 / WAL，保证持久后再异步消费。

无共享的含义是：工人挂了可以换一台，从对象存储重新 load；状态不绑在某块本地盘上。代价是依赖变多，etcd、对象存储、队列任一不稳，集群都会抖。

## 和单机 FAISS、和托管版的差别

嵌入式 FAISS 是进程内库：快，但没有持久化、分布式和元数据过滤。Milvus 为的是持久、副本、标量过滤和水平扩展。Zilliz 是云上托管，省 etcd / 对象存储 / 队列；开源自建要自己扛这套依赖。规模没到、团队只有几个人时，组件本身就是成本——这和向量库选型总览里「先看量级再上分布式」是同一句话。

面试加分点是能画出写入和查询两条路径：写入经接入层进 WAL / 队列，再被数据节点落对象存储、被查询节点变成可搜视图；查询则由协调节点给出拓扑，查询节点扫段，接入层汇总。说清这两条，就说明你没有把 Milvus 当成一个黑盒 HTTP。

## 可能的追问

- Standalone 和 Cluster 差在哪？单机把角色压进一个进程，队列也可以是本地；集群才真正拆开。
- 查询节点挂了怎么办？段可以从对象存储重新 load，由协调节点再调度，这是存算分离的意义。
