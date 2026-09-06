---
title: "严格模式改了哪些行为？模块默认就是严格模式意味着什么？"
category: frontend
topic: javascript
section: 原型与作用域
difficulty: easy
order: 4
tags: [严格模式, 模块]
sources:
  - title: "Strict mode - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Strict_mode"
    lang: zh
  - title: "JavaScript modules - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`'use strict'` 让静默失败变成抛错：未声明赋值、删除不可删属性、重复参数名。** ES Module 和 `class` 体默认严格，独立调用的 `this` 是 `undefined` 而不是 `window`，这和 `this` 题是同一条。

## 还改了什么

`arguments` 不再和形参双向映射。`with` 禁用。`eval` 不污染外层。八进制字面量 `012` 非法。这些都是为了让引擎更好优化、少踩坑。

脚本里漏写 `'use strict'` 的老页面，函数 `this` 仍可能是全局，给 `window` 挂意外变量。打包后的 ESM 没有这个问题。面试手写工具函数要按严格模式想。

## 可能的追问

- 严格模式能按函数开吗？能，但模块级已经全局严格，不必再写。
- `this` 在浏览器回调里？DOM 监听的普通函数 `this` 仍是元素，那是调用约定，不是非严格全局对象。
