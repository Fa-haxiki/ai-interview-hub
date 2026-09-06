---
title: "长任务从哪来？怎么拆才不会把 INP 打爆？"
category: frontend
topic: engineering
section: 性能优化
difficulty: hard
order: 4
tags: [长任务, INP, scheduler]
sources:
  - title: "Long tasks API - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/Performance_API/Long_task_attribution"
    lang: zh
  - title: "Optimize Interaction to Next Paint - web.dev"
    url: "https://web.dev/articles/optimize-inp"
    lang: en
createdAt: "2026-09-06"
---

一句话：**主线程连续忙超过 50ms 就是长任务，点击只能排队。** Hydration、大 JSON、同步正则、一次渲染几千节点，都是来源。拆成让出事件循环的小块，或挪到 Worker。

## 拆法

`scheduler.yield()` / `await new Promise(r => setTimeout(r))` 切开循环。`requestIdleCallback` 只做非紧急。`startTransition` 让 React 渲染可打断。二进制解析、加解密、语法高亮进 Worker，用 `postMessage` 回主线程。

先用 Performance 面板看火焰图，不要猜。第三方脚本（统计、客服）经常是元凶，能 async/defer 就别同步放头里。

## 实践取舍

列表虚拟化、减少 hydration 范围，比微优化 for 循环更有效。面试连到事件循环：长任务就是一个不肯结束的宏任务。

## 可能的追问

- Web Worker 能碰 DOM 吗？不能，只能算数据。
- `defer` 和 `async`？defer 保序、在 HTML 解析完执行；async 谁先下完谁先跑，可能打乱依赖。
