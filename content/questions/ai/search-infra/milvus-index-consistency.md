---
title: "Milvus 里索引怎么选？一致性级别（Strong / Bounded / Session / Eventually）对 RAG 意味着什么？"
category: ai
topic: search-infra
section: Milvus
difficulty: hard
order: 3
tags: [Milvus, HNSW, IVF, DiskANN, 一致性]
sources:
  - title: "In-memory Index - Milvus"
    url: "https://milvus.io/docs/index.md"
    lang: en
  - title: "Consistency - Milvus"
    url: "https://milvus.io/docs/consistency.md"
    lang: en
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
createdAt: "2026-09-06"
---

索引选规模，一致性选「写完能不能立刻搜到」。HNSW 用图、IVF 用聚类，原理在站内「HNSW vs IVF」那题已经讲过，这里只谈 Milvus 产品层：段上的索引何时生效，以及四个一致性级别怎么影响 RAG。

## 索引怎么选

| 场景 | 更常见的选择 |
| --- | --- |
| 千万级以下、内存够、要低延迟高召回 | HNSW |
| 更大、内存紧 | IVF_FLAT，或 IVF_PQ 再压缩 |
| 内存装不下、接受走磁盘 | DiskANN 一类 |
| 量很小或做对照基线 | FLAT |

写入先进 **growing** 段，通常只有临时索引；达到阈值后变成 **sealed** 段，才按你指定的类型建正式索引。刚写入的数据和已经 HNSW 化的历史段，检索路径并不完全一样。批量导入知识库后应 flush / load，等 sealed 段索引就绪再对外。参数仍是那几个：HNSW 调 `M` / `ef`，IVF 调 `nlist` / `nprobe`，用自己的评测集画召回-延迟曲线，不要在面试里背一套与数据无关的「最佳值」。

## 四个一致性级别

默认 **Bounded**：允许短暂落后，延迟更友好。

- **Strong**：能读到最新，查询要等到对应时间戳，延迟最高。
- **Session**：同一客户端能看到自己刚写的。
- **Eventually**：几乎不做一致性等待，最快，可能短时间搜不到刚入库的文档。

一致性越强，延迟越高。RAG 若要求「运营点发布，问答立刻引用新文档」，collection 或单次 search 用 Strong / Session，或写入后主动 flush 再查。离线知识库、小时级更新，Bounded 通常够用。注意：一致性解决的是「这段数据在不在当前可见视图里」，不保证 sealed 段的正式索引已经建完，两件事要分开排障。

生产上我不会全局 Strong：问答主路径用 Bounded 保延迟，运营后台的「发布后立刻自检」这条请求单独升到 Strong 或先 flush 再搜。把一致性当成按请求选择的旋钮，而不是集群永久开关。Session 适合「我刚上传的文档，我自己马上提问」这种控制台场景；Eventually 只适合对新鲜度不敏感的离线批检索，不要用在对用户可见的知识库问答上。排障时先确认可见性，再看索引是否已经从临时形态切到正式索引。

## 可能的追问

- 为什么搜不到刚插入的？可见性受一致性约束，sealed 段正式索引也可能还在建。
- 默认 Bounded 能改吗？可以，collection 设默认，单次 search 还能覆盖。
