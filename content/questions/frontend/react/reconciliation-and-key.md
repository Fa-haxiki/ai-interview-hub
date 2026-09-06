---
title: "React 协调（reconciliation）怎么决定复用还是销毁？key 为什么不能用 index？"
category: frontend
topic: react
section: 渲染机制
difficulty: medium
order: 1
tags: [协调, reconciliation, key, 虚拟DOM]
sources:
  - title: "保留与重置状态 - React 中文文档"
    url: "https://zh-hans.react.dev/learn/preserving-and-resetting-state"
    lang: zh
  - title: "渲染和提交 - React 中文文档"
    url: "https://zh-hans.react.dev/learn/render-and-commit"
    lang: zh
  - title: "React 中文文档 - 协调"
    url: "https://zh-hans.react.dev/reference/react/reconcile"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**同层比较类型和 key：类型变了就卸载整棵子树，类型相同再按 key 对齐去复用 state。** `key` 是身份，不是性能开关。列表用 index 当 key，插入/删除/排序会把输入框状态错位到下一行。

## 协调规则

React 先渲染出新的虚拟树（对象描述），再和上次比。`<div>` 换成 `<span>`，里面的 state 全扔。两个 `<Counter>` 并排，key 从 `a` 换成 `b`，等于卸掉 a 再挂 b，计数归零。父级把 `key={user.id}` 打在子组件上，是在命令「这是另一个人」。

虚拟 DOM（Virtual DOM）的价值不是「比真实 DOM 快」这句空话，而是把「声明式 UI」diff 成最少的 DOM 操作，并保住组件 state。现在还有 Fiber 把工作切片，但身份规则没变。

```tsx
{todos.map((t) => (
  <TodoItem key={t.id} todo={t} />
))}
```

静态不会重排的列表，index 勉强能用；面试要主动说边界。

## 实践取舍

重置表单用换 key，比写一堆 `useEffect` 清字段干净。不要用随机数当 key，每次渲染都是新身份，输入会丢焦点。

## 可能的追问

- 为什么不用对象当 key？key 要稳定且可转成字符串，对象每次都是新引用。
- 协调是深度优先吗？按 Fiber 树走，可中断；规则仍是同层比。
