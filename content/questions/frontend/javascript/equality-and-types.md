---
title: "== 和 === 差在哪？JavaScript 的类型转换规则你怎么记？"
category: frontend
topic: javascript
section: 语言基础
difficulty: easy
order: 2
tags: [相等, 类型转换, 原始类型]
sources:
  - title: "Equality comparisons and sameness - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Equality_comparisons_and_sameness"
    lang: zh
  - title: "Type coercion - MDN glossary"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/Type_coercion"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`===` 只比类型和值，`==` 会先按抽象相等算法做强制转换。** 业务判断一律 `===`（或 `Object.is` 处理 `NaN` / `-0`）。`==` 只留在你能背出转换结果、并且确实需要的地方，比如和 `null` 一起判空。

## 转换怎么走

`==` 两端类型不同时：一方 `null`、一方 `undefined` 为真；一方是数字一方是字符串则字符串转数字；布尔先转数字；对象先 `ToPrimitive`。所以 `'0' == false` 是 `true`（两边都变成 0），`[] == false` 也是 `true`。这类题考的是你有没有在线上用过 `==`。

七种原始类型要能数出来：`string` / `number` / `bigint` / `boolean` / `undefined` / `symbol` / `null`，加上 `object`（含数组和函数）。`typeof null === 'object'` 是历史包袱，判空用 `value == null` 同时吃掉 `null` 和 `undefined`，这是我唯一还接受的 `==`。

## 实践取舍

表单、接口字段、React props 比较都用 `===`。需要「看起来像同一个数字」时显式 `Number(x)` 再比，不要靠 `==`。`Object.is(NaN, NaN)` 为真，适合写工具函数，不适合替换所有 `===`。

## 可能的追问

- `[] == ![]` 为什么是 true？`![]` 是 `false`，`[] == false` 再走上面的 ToPrimitive。
- `Object.is` 和 `===` 仅有的差别？`NaN` 和 `+0` / `-0`。
