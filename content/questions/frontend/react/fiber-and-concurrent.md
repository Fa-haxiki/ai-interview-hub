---
title: "Fiber 解决了什么问题？并发渲染里 interrupt 和优先级是什么意思？"
category: frontend
topic: react
section: 渲染机制
difficulty: hard
order: 2
tags: [Fiber, Concurrent, 优先级]
sources:
  - title: "什么是并发 React？ - React 中文文档"
    url: "https://zh-hans.react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react"
    lang: zh
  - title: "startTransition - React 中文文档"
    url: "https://zh-hans.react.dev/reference/react/startTransition"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Fiber 把递归不可打断的协调改成链表上的可中断工作单元。** 高优先级更新（输入）可以插队，正在算的低优先级渲染被扔掉或重做。Concurrent 是「渲染过程可暂停」，不是「两个界面同时提交」。

## 为什么要 Fiber

旧栈协调一旦开始必须走完，长列表会堵住输入。Fiber 节点对应组件，存 pending props、state、副作用。Render 阶段可重复执行（纯函数组件必须能跑两次，Strict Mode 就是在逼你），Commit 阶段同步改 DOM，不能随便打断。

`startTransition` 把「搜索关键字引起的大列表过滤」标成过渡：输入框的 `value` 仍紧急更新，列表可以晚一帧。`useDeferredValue` 同理。`Suspense` 让数据未就绪时停在 fallback，而不是整树转圈。

## 实践取舍

不是所有 `setState` 都要包 transition。输入、点击反馈必须同步。CPU 密集的过滤、路由切换后的非首屏块，才降优先级。面试别说「Fiber 就是虚拟 DOM 换了个名字」——它是调度模型。

## 可能的追问

- 为什么组件会 render 两次？开发 Strict Mode 故意双调用；生产一次，但你仍不能在 render 里做副作用。
- 和浏览器时间切片关系？React 用消息循环把工作切到空闲，仍受 JS 单线程限制。
