---
title: "状态放组件、Context 还是外部 store？你怎么选？"
category: frontend
topic: react
section: 状态管理与性能
difficulty: medium
order: 2
tags: [状态, Context, Zustand]
sources:
  - title: "Choosing the State Structure - React"
    url: "https://zh-hans.react.dev/learn/choosing-the-state-structure"
    lang: zh
  - title: "Passing Data Deeply with Context - React"
    url: "https://zh-hans.react.dev/learn/passing-data-deeply-with-context"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**能本地就本地，能往下放就往下放；跨远距离的只读配置用 Context，高频写入的共享状态用外部 store。** Context 不是全局 Redux 替代品：value 一变，所有 `useContext` 的消费者都重渲染。

## 三层

- **组件 state**：输入框、开关、当前 tab。最容易测，也最少意外。
- **提升 / 组合**：兄弟要同步，提到最近公共父。用 children 组合避免「props 透传十层还把整页变成巨型组件」。
- **Context**：主题、当前用户、i18n。值要稳定。
- **Zustand / Jotai / Redux**：购物车、编辑器文档、多处写入的缓存。选择器可以让组件只订一片字段。

服务端数据用 TanStack Query 一类，别再手写 `useEffect` + 全局 loading。URL 才是分享出去的状态：筛选、分页进 search params。

## 实践取舍

面试我会先问「谁写、谁读、多频繁、要不要刷新还在」。三个组件偶发同步，Context 够。看板每个格子都在拖，上 store。不要为了架构图先上 Redux。

## 可能的追问

- Context 怎么减渲染？拆分 Context，或把订阅改成 store 选择器。
- 受控和非受控怎么选？表单库里单个输入非受控更省事；要即时校验、和父级同步用受控。
