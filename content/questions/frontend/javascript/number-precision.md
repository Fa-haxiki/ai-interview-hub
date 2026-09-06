---
title: "0.1 + 0.2 为什么不是 0.3？钱和计数在前端怎么算才安全？"
category: frontend
topic: javascript
section: 语言基础
difficulty: easy
order: 10
tags: [浮点, IEEE754, 精度]
sources:
  - title: "Number - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number"
    lang: zh
  - title: "IEEE 754 - Wikipedia"
    url: "https://en.wikipedia.org/wiki/IEEE_754"
    lang: en
createdAt: "2026-09-06"
---

一句话：**JS 的 `number` 是 IEEE754 双精度，很多十进制小数没有精确二进制表示。** `0.1 + 0.2 === 0.3` 为假。钱用整数分、字符串或 `decimal.js` / `bigint`，不要用 `toFixed` 当精度算法。

## 边界

安全整数到 `2^53 - 1`，`Number.MAX_SAFE_INTEGER`。超过用 `BigInt`，JSON 默认不能带 BigInt，接口要当字符串。`NaN` 不等于自己；`Object.is` 可以。解析用 `Number.parseInt(str, 10)`，漏了 radix 的老坑在八进制。

比较浮点：`Math.abs(a - b) < Number.EPSILON * 某个倍数`，或先放大成整数再比。展示层 `Intl.NumberFormat` 管千分位和货币，不管计算。

## 实践取舍

后端算钱，前端只展示和做整数分加减。面试别只背「二进制算不准」，要落到「订单金额存在哪、谁四舍五入」。

## 可能的追问

- `==` 会修 0.1+0.2 吗？不会。
- `toFixed(2)` 为什么有时 1.005 变成 1.00？它基于已经误差过的二进制再四舍五入。
