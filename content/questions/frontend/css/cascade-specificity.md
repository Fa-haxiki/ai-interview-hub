---
title: "层叠和选择器优先级怎么算？为什么现在更推荐用层而不是加权重？"
category: frontend
topic: css
section: 层叠与选择器
difficulty: medium
order: 1
tags: [层叠, 优先级, CSS层, important]
sources:
  - title: "Cascade, specificity, and inheritance - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts"
    lang: zh
  - title: "@layer - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/@layer"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**先比来源和层，再比优先级，再比顺序；`!important` 会把比较倒过来。** 优先级粗记：行内 > id > class/属性/伪类 > 元素/伪元素。现代做法是用 `@layer` 把 reset、组件、工具类分层，而不是把选择器写成 `#app .box.box.box`。

## 怎么比

同一个属性，来源高的赢（作者样式压用户代理）。同来源里，后声明的 `@layer` 比先声明的层更强；**未分层的作者样式比任何层都强**。层内再算 `(id, class, type)` 三元组，不是十进制加法——11 个 class 赢不了一个 id。再相同，后面的声明覆盖前面的。

`!important` 在同层里抬权，跨层时 important 的比较顺序相反，所以第三方 important 很难压。能不用就不用。

## 实践取舍

Tailwind / CSS Modules 降低了「谁覆盖谁」的心智：工具类后写或模块哈希。写组件库时显式 `layer(components)`，让业务工具类稳赢。面试若只背数字 100/10/1，我要补一句层和来源，否则解释不了「为什么我的 class 盖不住 reset」。

## 可能的追问

- `:is()` / `:where()` 的优先级？`:is` 取参数里最高的；`:where` 永远是 0，适合重置。
- 属性选择器和 class 谁高？一样，都算 class 级。
