---
title: "哪些 CSS 属性会继承？为什么颜色能传下去、margin 不能？"
category: frontend
topic: css
section: 层叠与选择器
difficulty: easy
order: 4
tags: [继承, inherit, unset]
sources:
  - title: "Inheritance - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_cascade/Inheritance"
    lang: zh
  - title: "inherit, initial, unset, revert - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/inherit"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**字面上的属性（`color`、`font-*`、`line-height`、`visibility`）默认继承；盒模型、背景、定位不继承。** 这是为了段落里的 `em` 自然跟着走，而不是每个 span 都长出一份 margin。

## 关键字

`inherit` 强制继承。`initial` 回该属性初始值。`unset` 在可继承属性上等于 inherit，否则等于 initial。`revert` 回到用户代理/用户样式，比 unset 更接近「浏览器默认」。`all: unset` 能把按钮打回几乎无样式，做 reset 要谨慎。

`opacity` 不继承，但视觉上子元素都会淡——它建的是整棵子树的效果。`visibility: hidden` 继承，子可以再 `visible`；`display: none` 不继承，子无法把自己显示出来。

## 实践取舍

组件根上设 `font` 和 `color`，内部少重复。不继承的间距用变量而不是指望传下去。面试别背完整列表，按「文字 vs 盒子」分类即可。

## 可能的追问

- `currentColor` 是什么？用当前 `color` 计算值，图标描边跟文字走。
- 为什么 `a` 不继承父级颜色？用户代理给链接写了更具体的颜色。
