---
title: "new 一个函数时引擎做了哪几步？手写一个 new 要注意什么？"
category: frontend
topic: javascript
section: 原型与作用域
difficulty: medium
order: 3
tags: [new, 构造函数, prototype]
sources:
  - title: "new operator - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/new"
    lang: zh
  - title: "Object.create() - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**建对象 → 挂上 `Ctor.prototype` → 用这个对象当 `this` 执行构造 → 若构造返回对象就用返回值，否则用刚建的实例。** 漏掉第四步，`new Date` 一类「构造里 return 包装对象」就会手写错。

## 步骤

```ts
function myNew(Ctor: new (...args: unknown[]) => object, ...args: unknown[]) {
  const obj = Object.create(Ctor.prototype);
  const result = Ctor.apply(obj, args);
  return result !== null && typeof result === "object" ? result : obj;
}
```

箭头函数没有 `prototype`，也不能 `new`。`class` 必须 `new`，漏了会抛错；普通函数漏 `new` 时 `this` 会落到全局或 `undefined`，这是历史坑。

`new.target` 能检测是否被 new 调用。工厂函数不想被 new，就判断 `new.target` 抛错。

## 实践取舍

业务用 `class` 或对象字面量，不要在生产里用自制 `new`。面试考的是原型挂载和返回值规则，和「原型链怎么找属性」是一套。

## 可能的追问

- 构造函数 return 原始值呢？被忽略，仍返回实例。
- `Object.create` 和 `new` 差在哪？前者只建对象并挂原型，不跑构造。
