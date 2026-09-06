---
title: "闭包是什么？它为什么能访问外层变量，又为什么会把内存拖住？"
category: frontend
topic: javascript
section: 原型与作用域
difficulty: medium
order: 2
tags: [闭包, 作用域, 内存]
sources:
  - title: "Closures - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures"
    lang: zh
  - title: "Lexical scoping - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures#lexical_scoping"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**闭包是函数把它定义时所在的词法环境一起带走。** 所以内层函数能读到外层已经 return 的变量。引擎按「还被引用的绑定」留着，不是整个作用域永远不回收；你在回调里抓住一个大对象，它就走不了。

## 词法作用域

作用域在写代码时定，不在调用时定。模块、函数、块（`let`/`const`）一层层嵌套。典型工厂：

```ts
function makeCounter() {
  let n = 0;
  return () => ++n;
}
const inc = makeCounter();
inc(); // 1
```

`n` 不在全局，却活着，因为 `inc` 还引用它。React 的 `useEffect` 过期闭包、事件监听没 unsubscribe、`setInterval` 抓住旧 props，本质都是闭包拿到了过期或过长的环境。

循环加异步：`var` 一个绑定，三个 timeout 都是 3；`let` 每次迭代新绑定。这是作用域 + 闭包，不是定时器 bug。

## 实践取舍

需要私有状态时闭包很干净。需要释放时要切断引用：`removeEventListener` 必须是同一个函数引用，所以监听器要存下来。缓存 Map 要有上限或 WeakMap。面试别背「闭包就是函数套函数」，要说「保留了哪些绑定、何时释放」。

## 可能的追问

- 闭包一定泄漏吗？不一定；泄漏是「还活着的函数引用了本该死的大图」。
- 模块顶层变量是闭包吗？ESM 有模块作用域，导出的函数关闭在模块环境上，和闭包同一套机制。
