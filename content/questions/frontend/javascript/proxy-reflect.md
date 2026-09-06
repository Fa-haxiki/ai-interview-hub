---
title: "Proxy 和 Reflect 能做什么？和 defineProperty 比有什么差别？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 7
tags: [Proxy, Reflect, 响应式]
sources:
  - title: "Proxy - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy"
    lang: zh
  - title: "Reflect - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`defineProperty` 劫持已有属性，`Proxy` 劫持整对象的 13 种操作（读、写、in、delete、apply…）。** Vue 3 用 Proxy 做响应式，就是为了能侦测新增/删除属性。`Reflect` 提供与这些操作一一对应的默认行为，写 trap 时先 `Reflect.get` 再加点逻辑，不容易漏掉 `receiver`。

## 能力边界

```ts
const state = new Proxy(
  { count: 0 },
  {
    get(target, key, receiver) {
      track(key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const ok = Reflect.set(target, key, value, receiver);
      trigger(key);
      return ok;
    },
  },
);
```

Proxy 不能代理原始值；`===` 比较的是代理对象不是 target。数组、`Map` 内部方法走的是对象操作，要小心漏 trap。性能上热路径大量 Proxy 比普通对象慢，库会做按需代理。

`Object.freeze` 后的对象仍能包 Proxy，但 set 会失败。不可撤销的观察用 `Proxy.revocable`。

## 实践取舍

业务里少手写 Proxy，容易和框架自己的代理套娃。面试能讲清 Vue2 为什么要 `$set`、Vue3 为什么不用，就够了。

## 可能的追问

- 为什么 get 要传 receiver？为了访问器里的 `this` 指向代理，否则会绕过 trap。
- Proxy 能拦截 `for...in` 吗？能，靠 `ownKeys`。
