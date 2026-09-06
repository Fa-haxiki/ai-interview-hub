---
title: "this 是怎么绑定的？箭头函数为什么没有自己的 this？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 3
tags: [this, call, bind, 箭头函数]
sources:
  - title: "this - JavaScript | MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/this"
    lang: zh
  - title: "Arrow functions - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/Arrow_functions"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**普通函数的 `this` 看调用方式，不看定义位置；箭头函数没有自己的 `this`，沿用词法作用域。** 面试按优先级讲：`new` > `bind/call/apply`（已绑定过的 bind 除外）> 对象调用 > 独立调用（严格模式是 `undefined`，非严格是全局）。

## 四种调用

```ts
function show() {
  return this?.id;
}
const obj = { id: 1, show };

obj.show();           // 1，对象调用
show();               // undefined（模块 / 严格模式）
show.call({ id: 2 }); // 2
new (function () { this.id = 3; })(); // 构造出来的实例
```

`obj.fn = show; obj.fn()` 仍是对象调用；`const fn = obj.show; fn()` 就是独立调用，这是把方法当回调丢掉 `this` 的经典坑。类里传 `this.handleClick` 给按钮，不绑就会丢。箭头函数或类字段 `handleClick = () => {}` 能避开。

箭头函数不能 `new`，也没有 `arguments`。它适合回调，不适合需要动态 `this` 的方法（除非你就是想锁死外层）。

## 实践取舍

React 类组件年代靠 bind；函数组件几乎不谈 `this`。写工具库仍要会：把别人的方法抽出来时先问「还靠不靠 this」。`bind` 会返回新函数，用作依赖或订阅时注意引用变了。

## 可能的追问

- `obj.fn.bind(obj2).bind(obj3)` 谁赢？第一次 bind 已经锁死，再 bind 改不了 this。
- 事件监听里的 this？DOM 回调里普通函数指向元素；箭头函数指向定义时的外层。
