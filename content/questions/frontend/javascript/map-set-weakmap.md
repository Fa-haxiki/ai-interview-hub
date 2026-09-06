---
title: "Map、Set、WeakMap、WeakSet 和普通对象比有什么差别？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 6
tags: [Map, Set, WeakMap]
sources:
  - title: "Map - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map"
    lang: zh
  - title: "WeakMap - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**对象的键只能是字符串/Symbol，Map 的键可以是任意值且保序；Set 是去重集合；Weak* 的键必须是对象，且不阻止 GC。** 缓存 DOM 节点或临时对象用 WeakMap，避免把节点树拖住。

## 选哪种

对象当字典：键会被 `ToString`，`obj[1]` 和 `obj['1']` 撞车，且有 `toString` 等原型键干扰。`Object.create(null)` 能去掉原型，仍不能用对象当键。

`Map`：`get/set/has`，按插入序迭代，`size` 是准确计数。适合频繁增删的查找表。`Set` 去重引用或原始值；对象去重要的是同一个引用。

`WeakMap`：键不可枚举，没有 `size`，不能遍历——因为遍历会观察到「还没被回收的键」，破坏 GC 语义。典型用法：给 DOM 挂私有数据、给类实例挂私有字段（现在更多用 `#priv`）。

## 实践取舍

React 里用 Map 做 id→vnode 索引没问题。不要用 WeakMap 当「自动过期的 LRU」，它只在对象不可达时回收，不是 TTL。面试要能说清「弱」弱在引用，不是弱在性能。

## 可能的追问

- `Set` 能深比较对象吗？不能，只比 SameValueZero。
- 为什么 WeakMap 键不能是原始值？原始值没有「对象身份」，无法被 GC 挂钩。
