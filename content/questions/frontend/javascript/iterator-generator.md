---
title: "可迭代协议、迭代器和 generator 是什么关系？for...of 到底在调什么？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 8
tags: [iterator, generator, for-of]
sources:
  - title: "Iteration protocols - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols"
    lang: zh
  - title: "function* - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**对象有 `@@iterator` 方法就是可迭代；该方法返回一个带 `next()` 的迭代器；`function*` 是生成迭代器的语法糖。** `for...of`、展开、`Promise.all` 都走这套协议。`for...in` 走的是可枚举键，两回事。

## 协议

```ts
const range = {
  from: 1,
  to: 3,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) yield i;
  },
};
[...range]; // [1, 2, 3]
```

`next()` 返回 `{ value, done }`。`return()` 用于 `break` / `throw` 时释放资源。`async function*` + `for await` 是异步迭代，fetch 流、分页都可以做成这种。

数组、Map、Set、字符串默认可迭代。普通对象不行，所以 `for...of ({})` 会抛错。不要给对象乱加迭代器除非语义真是序列。

## 实践取舍

能用数组方法就别手写 generator。无限序列、惰性流水线、需要中途 `yield` 交还控制权时才值得。面试手写「能被 for-of 的对象」比背名词有用。

## 可能的追问

- 迭代器耗尽还能再 for-of 吗？看可迭代每次是否返回新迭代器；生成器函数每次调用是新的。
- 和 Iterator Helpers 提案？现在可用库做惰性 map/filter，原生支持在跟进。
