---
title: "LCP、INP、CLS 分别量什么？你怎么定位和优化？"
category: frontend
topic: engineering
section: 性能优化
difficulty: medium
order: 1
tags: [Web Vitals, LCP, INP, CLS]
sources:
  - title: "Web Vitals - web.dev"
    url: "https://web.dev/articles/vitals"
    lang: en
  - title: "INP - web.dev"
    url: "https://web.dev/articles/inp"
    lang: en
createdAt: "2026-09-06"
---

一句话：**LCP 看最大内容何时画出来，INP 看交互到下一帧的延迟，CLS 看布局跳了多少。** 这是 Google 的 Core Web Vitals，场测（CrUX）比你本机 Lighthouse 更接近用户。优化要对着字段，不要只压 bundle 一个数。

## 怎么对症

**LCP**：常见是 Hero 图、大标题。图要有尺寸、优先 `fetchpriority="high"`、合适的格式和 CDN、别被同步 JS 挡住。SSR / 流式 HTML 让文本 LCP 更稳。

**INP**（已替代 FID）：点击后到绘制的最长一截。主线程长任务（大 hydration、同步 JSON.parse、重渲染）是元凶。拆长任务、`startTransition`、减 hydration 范围、事件处理器里少强制同步布局。

**CLS**：图和广告没有宽高、字体 swap 把标题顶下去、晚到的插入。留 aspect-ratio，字体内嵌关键或用 `size-adjust`，动态内容往下插不要在视口顶部插。

## 实践取舍

实验室数据用来回归，线上 RUM 用来发现机型和网络长尾。面试能把指标连到一条具体 DOM，比背阈值 2.5s 有用。

## 可能的追问

- TTFB 和 LCP 关系？TTFB 是 LCP 的下限，API 慢则怎么优化前端都晚。
- 为什么 FID 被换掉？FID 只量第一次输入的延迟，INP 覆盖页面生命周期里的差交互。
