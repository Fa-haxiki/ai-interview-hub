---
title: "受控组件和非受控组件怎么选？为什么不要半受控？"
category: frontend
topic: react
section: 状态管理与性能
difficulty: medium
order: 4
tags: [受控, 非受控, 表单]
sources:
  - title: "Sharing State Between Components - React"
    url: "https://zh-hans.react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components"
    lang: zh
  - title: "useImperativeHandle - React"
    url: "https://zh-hans.react.dev/reference/react/useImperativeHandle"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**值由 React state 驱动、每次按键都 `setState` 叫受控；值活在 DOM 里、用 ref 读取叫非受控。** 不要有时靠 props、有时靠内部 state 还允许两者一起改——用户会看到光标跳、中文输入法丢字。

## 怎么选

要即时校验、和兄弟字段联动、提交前就能预览，用受控。文件选择、富文本、和原生插件集成，非受控更少打架。设计组件 API：要么 `value + onChange`，要么 `defaultValue`，不要既有 `value` 又在内部偷偷改。

`defaultValue` 只用于挂载。重置用换 `key`。受控输入不能把 `value` 设成 `undefined` 再变字符串，会从非受控切到受控并警告。

## 实践取舍

表单库（React Hook Form）默认非受控减渲染，要受控再 `watch`。面试能讲清「单一数据源」。

## 可能的追问

- 中文输入为什么受控会抖？`compositionstart/end` 期间不要强制改 value，或交给成熟输入组件。
- `useImperativeHandle` 暴露 `focus` 算受控吗？那是命令式句柄，和值的所属无关。
