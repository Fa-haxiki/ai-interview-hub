---
title: "为什么说组合优于继承？children 和 render props 还要不要用？"
category: frontend
topic: react
section: 状态管理与性能
difficulty: medium
order: 5
tags: [组合, children, render props]
sources:
  - title: "Containing Content in a Component - React"
    url: "https://zh-hans.react.dev/learn/passing-props-to-a-component#passing-jsx-as-children"
    lang: zh
  - title: "Thinking in React"
    url: "https://zh-hans.react.dev/learn/thinking-in-react"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**用 `children` / 具名插槽组合 UI，用 Hook 组合逻辑，不要 `class Modal extends Dialog`。** 继承把变体冻在层级里，组合让调用方决定中间塞什么。

## 怎么组

```tsx
<Card>
  <Card.Title />
  <Card.Body>{children}</Card.Body>
</Card>
```

`children` 是最简单的插槽。需要「把内部 state 交出去」时才 render props 或 `function as child`，现在更多是自定义 Hook + 无样式组件。组合组件（compound components）用 Context 让 `Tabs` 和 `TabPanel` 通信，API 好看，但 Context 一变会渲整组。

继承在 React 几乎没有位置：生命周期耦合、难以树摇、TypeScript 也别扭。

## 实践取舍

能 props 下发就不要 Context。能 children 就不要 cloneElement 改子节点。面试「高阶组件 vs Hook」也归到组合这一题。

## 可能的追问

- `cloneElement` 的问题？依赖子类型、和 memo 打架、类型难写。
- 具名 props 当插槽？`title={<X/>}` 可以，适合一两处；多了就 compound。
