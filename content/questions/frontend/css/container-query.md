---
title: "容器查询和媒体查询差在哪？卡片组件为什么更该看容器？"
category: frontend
topic: css
section: 响应式与动画
difficulty: medium
order: 3
tags: [container query, 媒体查询]
sources:
  - title: "CSS container queries - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_containment/Container_queries"
    lang: zh
  - title: "Container queries - web.dev"
    url: "https://web.dev/articles/cq-webinar"
    lang: en
createdAt: "2026-09-06"
---

一句话：**媒体查询看视口，容器查询看最近容器的宽高。** 同一张卡片在主栏三列、在侧栏一列，视口宽度没变，CQ 才能各自改布局。

## 怎么写

```css
.card-list { container-type: inline-size; }
@container (min-width: 24rem) {
  .card { display: grid; grid-template-columns: 8rem 1fr; }
}
```

`container-type` 会变成包含块并可能影响 `%` / sticky，这是 containment 的代价。命名容器可以跳过中间层。`cqw` 等单位相对容器，不是视口。

媒体查询仍适合：导航从汉堡到整栏、整页栅格、暗色偏好、打印、`prefers-reduced-motion`。组件内部断点尽量 CQ。

## 实践取舍

老项目没有 CQ 就用父级 class（`--compact`）模拟。新项目卡片、数据块优先 CQ，少写三套「屏幕 < 768 且侧栏打开」的耦合媒体查询。

## 可能的追问

- 为什么要 containment？浏览器得先知道容器尺寸再排内部，否则循环依赖。
- 和容器查询单位 `cqi`？随容器内联尺寸变，做流体字号可以 `clamp` + `cqi`。
