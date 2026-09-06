---
title: "typeof、instanceof、Array.isArray 各看什么？为什么 typeof null 是 object？"
category: frontend
topic: javascript
section: 语言基础
difficulty: easy
order: 5
tags: [typeof, instanceof, Array]
sources:
  - title: "typeof - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof"
    lang: zh
  - title: "instanceof - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/instanceof"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`typeof` 看内部类型标签，函数是 `function`，数组和 `null` 都是 `object`；`instanceof` 沿原型链找 `Ctor.prototype`；判数组用 `Array.isArray`。** `typeof null === 'object'` 是早期值标签的历史错误，规范不敢改。

## 怎么选

```ts
typeof 1;            // "number"
typeof function () {}; // "function"
typeof [];           // "object"
typeof null;         // "object"
[] instanceof Array; // true，但跨 iframe 可能 false
Array.isArray([]);   // 跨窗口仍可靠
```

`instanceof` 依赖原型，`Object.create(Array.prototype)` 也会为 true。跨 iframe 的数组来自另一套 `Array`，`instanceof` 会失败，这是为什么库用 `Array.isArray`。`typeof` 对包装对象：`typeof new String('a')` 是 `object`。

## 实践取舍

业务判空：`value == null`。判函数：`typeof fn === 'function'`。判数组：`Array.isArray`。不要用 `typeof` 区分普通对象和数组。TypeScript 里这些运行时检查仍要写，类型在编译期会被擦掉。

## 可能的追问

- `Symbol.hasInstance` 能改 instanceof 吗？能，自定义类可以劫持。
- `typeof NaN`？`number`，要用 `Number.isNaN` 判 NaN。
