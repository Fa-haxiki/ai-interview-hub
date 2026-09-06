---
title: "中文场景下 ES 分词要注意什么？为什么分词会直接决定 RAG 的精确召回？"
category: ai
topic: search-infra
section: Elasticsearch
difficulty: medium
order: 3
tags: [Elasticsearch, 中文分词, IK, BM25, 领域词典]
sources:
  - title: "2026年RAG大厂面试题汇总 - 卡码笔记"
    url: "https://notes.kamacoder.com/interview/llm/rag_interview.html"
    lang: zh
  - title: "RAG Interview Questions (2026): The Complete Guide with 41 Answers - gitGood.dev"
    url: "https://gitgood.dev/blog/complete-guide-rag-interview-questions-2026"
    lang: en
createdAt: "2026-09-06"
---

中文没有空格，BM25 打的是分析器切出来的 term。分词切错，倒排里就没有用户会搜的那个「词」，精确召回直接失败。混合检索里 BM25 一路本来就是为错误码、产品名准备的，专有名词被切碎，这一路等于白做。向量检索救不了「字面必须命中」的查询，所以分词是 RAG 精确召回的开关，不是锦上添花。

## 常用分析器怎么选

ES 官方有 `smartcn`；社区常用 IK（`ik_smart` 粗粒度、`ik_max_word` 细粒度）、HanLP 等。百科问答细切召回面更宽；产品文档、工单更需要粗切保住专有名词。只用官方插件或源码可审计的发行版，不要用来路不明的破解包。

英文 `standard` 分析器对中文近似按字切开，字级倒排能「搜到」但丢失词级 IDF，专有名词的稀有词优势没了。面试里我会先问「你们现在 `_analyze` 出来是什么」，再谈算法。

## 粗切、细切、词典、同义词

细切把「弹性伸缩」拆成「弹性」「伸缩」，召回更宽但专有名词被打碎；粗切保住完整词，可能漏掉子串查询。常见做法是索引用细粒度、查询用粗粒度，或同一字段 `multi-field` 两套分析器。

产品名、错误码、内部缩写必须进自定义词典，否则「HPA」「ECONNRESET」会被切开。同义词（K8s = Kubernetes）用 synonym token filter，索引和查询策略要一致，避免一边扩一边不扩导致漏召或乱召。停用词表也要谨慎：领域里「的」可以去，但别把产品名里的有效字误删。上线前用 `_analyze` 看真实 token，比只看召回数字更能定位问题。

我在项目里的检查清单很短：拿十条真实用户问法（含错误码、型号、中英混写）跑分析器，看切出来的 term 能不能在文档里对上。对不上就先补词典或改粒度，而不是先上 Rerank。Rerank 救不了倒排里根本不存在的词。分词和切块也要对齐：块太碎时，完整产品名可能跨块，词典再好也召不回整句。词典要纳入发布流程，和文档一起评审，而不是临时改线上分析器。

## 可能的追问

- 英文术语夹在中文里怎么处理？尽量保留 ASCII 连续串，别把错误码拆成单字母。
- 改词典要不要全量重建？要。旧倒排还是旧 term，增量只覆盖新文档。
