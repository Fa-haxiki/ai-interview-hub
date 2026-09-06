---
title: "ESM 和 CJS 有什么差别？Tree-shaking 为什么有时摇不掉？"
category: frontend
topic: engineering
section: 构建与模块化
difficulty: medium
order: 1
tags: [ESM, CommonJS, tree-shaking]
sources:
  - title: "JavaScript modules - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules"
    lang: zh
  - title: "Tree shaking - web.dev"
    url: "https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking"
    lang: en
createdAt: "2026-09-06"
---

一句话：**ESM 是编译期静态依赖，CJS 是运行时 `require`。** 打包器只能对静态 `import { foo }` 做 tree-shaking；`require`、动态拼接路径、`export default { a, b }` 再被整对象引用，都摇不干净。

## 差异

ESM：`import`/`export` 提升，循环依赖有活绑定，浏览器原生支持，Node 要 `.mjs` 或 `package.json` 的 `"type": "module"`。CJS：`module.exports` 是值拷贝，可以写在 if 里，循环依赖拿到的是未完成的对象。

互操作：CJS 默认导出在 ESM 里常是 `mod.default`，`esModuleInterop` 就是在抹平这个差异。库的 `exports` 字段要同时给 `import` 和 `require` 指不同文件，否则双份副本或报错。

Tree-shaking 还要求副作用可分析。`package.json` 的 `"sideEffects": false` 是在向打包器保证纯模块；自己在模块顶层改 `window` 却标 false，会出运行时 bug。lodash-es 能摇，lodash 的 CJS 很难。

## 实践取舍

应用源码只写 ESM。依赖优先选提供 ESM 且 `sideEffects` 诚实的包。动态 `import()` 是代码分割点，不是 CJS。

## 可能的追问

- 循环依赖 ESM 为什么有时能跑？绑定是实时的，函数声明可先用后定义；CJS 导出对象可能还是空的。
- `import()` 和静态 import 的 shaking？动态导入以模块为粒度，按路由切块，不是按符号。
