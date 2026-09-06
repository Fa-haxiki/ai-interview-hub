---
title: "var、let、const 有什么差别？暂时性死区是什么？"
category: frontend
topic: javascript
section: 语言基础
difficulty: easy
order: 1
tags: [var, let, const, TDZ]
sources:
  - title: "let - JavaScript | MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/let"
    lang: zh
  - title: "const - JavaScript | MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/const"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`var` 是函数作用域且会提升成 `undefined`，`let` / `const` 是块作用域，进入作用域到声明之前不能访问，这就是暂时性死区（TDZ）。** `const` 禁止重新绑定，不保证对象内部不可变。

## 提升和 TDZ

`var` 声明提升到函数顶，赋值留在原地，所以声明前读到 `undefined`。`let` / `const` 也会「创建」绑定，但在初始化前访问会抛 `ReferenceError`，这段窗口叫 TDZ。面试里我会写：

```ts
console.log(a); // undefined
var a = 1;

console.log(b); // ReferenceError
let b = 2;
```

`for (var i = 0; i < 3; i++)` 三个回调共享同一个 `i`；换成 `let` 每次循环是新绑定。这是闭包题和 `var` 题的交汇点。

## const 的边界

`const obj = { x: 1 }; obj.x = 2` 合法。要冻结用 `Object.freeze`，且只冻一层。模块顶层、不会被重新赋值的绑定我默认 `const`，循环变量和会改绑的用 `let`，新代码不再用 `var`。

## 可能的追问

- 循环里 `var` 加 IIFE 或 `bind` 能修吗？能，但那是补丁；正确做法是 `let`。
- 全局 `var` 和 `let` 差在哪？`var` 会变成 `window` 的属性，`let` 不会。
