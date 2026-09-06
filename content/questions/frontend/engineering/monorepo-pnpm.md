---
title: "Monorepo 和 pnpm workspace 解决什么问题？和多仓比呢？"
category: frontend
topic: engineering
section: 构建与模块化
difficulty: medium
order: 4
tags: [monorepo, pnpm, workspace]
sources:
  - title: "pnpm workspaces"
    url: "https://pnpm.io/workspaces"
    lang: en
  - title: "Turborepo handbook"
    url: "https://turborepo.dev/docs"
    lang: en
createdAt: "2026-09-06"
---

一句话：**多包共享一套 git 和依赖图，改 UI 库立刻被业务仓库链到。** pnpm workspace 用硬链/隔离 `node_modules`，避免幽灵依赖；Turbo / nx 做缓存和按影响面构建。

## 取舍

Monorepo 适合强耦合的前端包（ui、config、app）。跨语言、权限隔离、发版节奏完全不同，多仓更合适。痛点是 CI 变慢、权限粗、新手容易改到不该改的包——靠 CODEOWNERS 和 affected 构建。

本仓库用 pnpm 是单包，但面试要能说 `workspace:` 协议、为什么不要从内部包直接引用 lodash 的内部模块当公共 API。幽灵依赖：Webpack 碰巧解析到别人的包，pnpm 默认不让你 `import` 没声明的依赖。

## 可能的追问

- 和 git submodule 比呢？submodule 维护麻烦，workspace 是包管理层面的方案。
- 内部包该发 npm 吗？要给外部用才发；仅内部用 workspace 链接。
