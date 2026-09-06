---
title: "Vite 和 Webpack 的开发体验差在哪？生产构建还要打包器吗？"
category: frontend
topic: engineering
section: 构建与模块化
difficulty: medium
order: 2
tags: [Vite, Webpack, 构建]
sources:
  - title: "Why Vite"
    url: "https://vite.dev/guide/why"
    lang: en
  - title: "Webpack concepts"
    url: "https://webpack.js.org/concepts/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**开发时 Vite 用原生 ESM 按需编译，冷启动不打整包；Webpack 先建依赖图再启动开发服务，大项目更慢。** 生产两边都要打包、拆块、压缩——浏览器不能为每个源文件打几百个 HTTP/1 请求，即便 HTTP/2 也还有依赖瀑布。

## 开发 vs 生产

Vite dev：浏览器直接请求 `/src/App.tsx`，esbuild 转译，依赖预构建进 `node_modules/.vite`。改一个模块往往只失效那一个。Webpack HMR 成熟，生态 loader 多，但要从入口走完图。

生产 Vite 默认 Rollup（现在也在接 Rolldown）：tree-shake、code split。Webpack 的 splitChunks、Module Federation 在微前端和老仓库里仍常见。选工具看存量：已经有一堆自定义 loader，迁移成本可能高于启动慢。

## 实践取舍

新 SPA / 组件库用 Vite。要 Module Federation 多团队运行时集成、或构建必须插古老 loader，Webpack / Rspack 仍合理。面试讲清「开发服务器 ≠ 生产打包」，不要说 Vite 上线后就不打包。

## 可能的追问

- esbuild 为什么不直接当生产打包？早期缺一些复杂 splitting / 兼容；生态在变，但 Vite 生产管线仍是打包器。
- Turbopack / Rspack 呢？同一问题的不同实现：更快的图构建，概念没变。
