---
title: "原型链是怎么查找属性的？class 和 ES5 构造函数是什么关系？"
category: frontend
topic: javascript
section: 原型与作用域
difficulty: medium
order: 1
tags: [原型, class, inheritance]
sources:
  - title: "Inheritance and the prototype chain - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Inheritance_and_the_prototype_chain"
    lang: zh
  - title: "Classes - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**读属性时先看对象自身，没有就沿 `[[Prototype]]`（`__proto__`）往上找，直到 `null`。** `class` 是构造函数 + `prototype` 的语法糖，方法挂在 `F.prototype` 上共享，不是每个实例一份。

## 查找和继承

```ts
class Animal {
  move() {}
}
class Dog extends Animal {
  bark() {}
}
const d = new Dog();
// d → Dog.prototype → Animal.prototype → Object.prototype → null
```

`d.bark` 在 `Dog.prototype`，`d.move` 在 `Animal.prototype`，`d.toString` 在 `Object.prototype`。`hasOwnProperty` 只看自身；`in` 会沿链。赋值默认写在自身，不会改原型上的同名方法，除非改 `Dog.prototype`。

`new` 做了：建对象、挂原型、执行构造、若构造没返回对象则返回实例。`class` 必须 `new`，严格模式，子类 `super` 之前不能碰 `this`。ES5 用 `Child.prototype = Object.create(Parent.prototype)` 接链，漏接 `constructor` 是老坑。

## 实践取舍

业务代码用 `class` 或组合，不要手改 `__proto__`。性能上深原型链几乎不是瓶颈，误用可变的原型方法当状态才是。`Object.create(null)` 做字典，避免 `toString` 被当 key 撞上。

## 可能的追问

- `instanceof` 看什么？沿对象原型链找 `Ctor.prototype`。
- 箭头函数能当构造吗？不能，没有 `prototype`，也没有自己的 `this`。
