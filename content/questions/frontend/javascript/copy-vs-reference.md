---
title: "对象赋值是拷贝还是引用？浅拷贝和深拷贝你怎么做？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 4
tags: [浅拷贝, 深拷贝, 引用]
sources:
  - title: "Object.assign() - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign"
    lang: zh
  - title: "structuredClone() - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/Window/structuredClone"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**原始值按值走，对象按引用走。** `b = a` 两个变量指向同一块堆内存；改 `b.x` 就是改 `a.x`。浅拷贝只复制一层，深拷贝递归复制可结构化的子图。

## 怎么拷

浅：`{ ...obj }`、`Object.assign({}, obj)`、`arr.slice()`。嵌套对象仍共享。React 里 `setState({ ...state, nested: { ...state.nested, k } })` 就是在补这一层。

深：优先 `structuredClone(obj)`，能处理循环引用、`Date`、`Map`、`ArrayBuffer`。`JSON.parse(JSON.stringify(obj))` 会丢 `undefined`、函数、`Symbol`、`Date` 变成字符串，有循环就抛错，只适合纯 JSON 数据。lodash `cloneDeep` 是历史方案，浏览器够新就不必。

```ts
const state = { user: { name: "san" } };
const next = structuredClone(state);
next.user.name = "si";
// state.user.name 仍是 san
```

## 实践取舍

状态更新要不可变，浅拷贝改动路径上的每一层即可，不必每次深拷整棵树。传给 Web Worker 用 structured clone 算法（`postMessage` 同套）。不要用深拷贝当「保险」，大列表会卡主线程。

## 可能的追问

- `structuredClone` 不能拷什么？函数、DOM 节点、某些 Proxy；这些要自己定策略。
- 为什么 Redux 强调浅比较？因为只拷改动路径时，没改的引用保持不变，`===` 就能跳过渲染。
