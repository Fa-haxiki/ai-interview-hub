---
title: "水平垂直居中有哪些做法？你现在默认用哪一种？"
category: frontend
topic: css
section: 布局
difficulty: easy
order: 3
tags: [居中, Flex, Grid, absolute]
sources:
  - title: "Centering in CSS - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/Layout_cookbook/Center_an_element"
    lang: zh
  - title: "Centering in CSS: A Complete Guide - CSS-Tricks"
    url: "https://css-tricks.com/centering-css-complete-guide/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**已知是单轴或一堆子项，父级 `display: flex; place-content: center; align-items: center`（或 Grid 的 `place-items: center`）。** 绝对定位 + `translate(-50%, -50%)` 留给弹层叠在已有布局上、又不想改父级 display 的时候。

## 常见写法

- **Flex / Grid**：不定宽高都能居中，这是默认。
- **绝对定位**：子级 `inset: 0; margin: auto` 要求子级有尺寸；或 `top/left: 50%` + `transform: translate(-50%, -50%)` 不要求写死宽高，且 transform 不触发对方块布局重算。
- **行内**：`text-align: center` + 行高约等于盒高，只适合单行文字，基线问题多。

弹层还要考虑滚动容器和 `100dvh`，否则移动端地址栏会让「视口居中」偏掉。`position: fixed` 相对视口，`absolute` 相对最近的定位祖先。

## 实践取舍

组件库内部用 Flex。覆盖第三方区域、做拖拽预览，才上绝对定位。面试能画三种并说出适用边界即可，不必背 12 种古董技巧。

## 可能的追问

- `margin: auto` 在 Flex 里为什么能把一项推到另一端？剩余空间分给 auto margin，这是「空间分配」不是「居中专用属性」。
- 为什么不用 table-cell 了？语义和响应式都差，Flex/Grid 已普及。
