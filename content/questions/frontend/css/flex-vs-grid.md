---
title: "Flex 和 Grid 怎么选？一维和二维布局的边界在哪？"
category: frontend
topic: css
section: 布局
difficulty: medium
order: 2
tags: [Flexbox, Grid, 布局]
sources:
  - title: "Flexbox vs Grid - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_and_other_layout_methods"
    lang: zh
  - title: "A Complete Guide to Flexbox - CSS-Tricks"
    url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/"
    lang: en
createdAt: "2026-09-06"
---

一句话：**一条轴上分配空间用 Flex，行列都要对齐用 Grid。** 导航、工具栏、两端对齐是 Flex；卡片墙、表单标签对齐、整页框架是 Grid。两者能套：格子用 Grid，格子里的图标+文字用 Flex。

## 能力差在哪

Flex 是「内容驱动」：子项按 `flex-grow/shrink/basis` 抢剩余空间，换行后每一行各自算，列对不齐是常态。`align-items` / `justify-content` 管交叉轴和主轴。

Grid 是「轨道驱动」：先定 `grid-template-columns`，再往单元格放。子项可以 `span` 跨行跨列，`minmax(0, 1fr)` 才能让 `1fr` 真的收缩（默认 `minmax(auto, 1fr)` 会被内容撑开）。这是面试高频坑。

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}
```

## 实践取舍

未知数量的响应式卡片，Grid `auto-fill` 比媒体查询写三套 Flex 干净。已经是一条横向工具栏，不要上 Grid 显摆。`gap` 两边都有，能不用 margin 偏方就不用。

## 可能的追问

- `1fr` 和 `100%` 差在哪？`fr` 分的是剩余空间，受 `minmax` 约束；`100%` 相对包含块。
- Flex 项目默认 `min-width: auto` 会怎样？内容把容器撑破，要设 `min-width: 0` 才允许收缩。
