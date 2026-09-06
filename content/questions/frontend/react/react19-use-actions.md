---
title: "React 19 的 use、Actions 和编译器你怎么看？和老写法怎么并存？"
category: frontend
topic: react
section: Hooks
difficulty: medium
order: 6
tags: [React19, use, Actions]
sources:
  - title: "React 19 Upgrade Guide"
    url: "https://zh-hans.react.dev/blog/2024/04/25/react-19-upgrade-guide"
    lang: zh
  - title: "use - React"
    url: "https://zh-hans.react.dev/reference/react/use"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`use` 能在渲染里读 Promise/Context，Actions 把表单提交和 pending/error 收成一等公民，Compiler 自动插入记忆。** 它们不废除 `useEffect` 和 `useState`，只是把「数据未就绪」和「提交中」从手写状态机里解救出来。

## 新能力

`use(promise)` 必须能被 Suspense 接住，且 Hook 规则对它更松（可在条件里调用，但仍不能在循环里乱序）。表单 `action={fn}` + `useFormStatus` / `useOptimistic` 做乐观更新。`ref` 不再必须 `forwardRef`。

Compiler 要求组件尽量纯。写了不合法的副作用，编译器会跳过优化而不是静默写错。存量项目可以按文件渐进开。

## 实践取舍

新功能用新 API；请求缓存、去重仍可交给框架或 Query。面试别把 19 背成清单，要能说「以前用 useEffect 发请求的哪一类现在可以不写」。

## 可能的追问

- `use` 读 Context 和 `useContext`？`use` 可条件调用，这是差别。
- 没有 Server Actions 的 CSR 项目？一样能用客户端函数当 action，只是没有服务端突变。
