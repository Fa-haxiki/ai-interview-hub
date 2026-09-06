---
title: "重排和重绘差在哪？读 offsetHeight 为什么会强制同步布局？"
category: frontend
topic: css
section: 响应式与动画
difficulty: medium
order: 4
tags: [reflow, repaint, 强制同步布局]
sources:
  - title: "Reflow - MDN glossary"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/Reflow"
    lang: zh
  - title: "Avoid large, complex layouts - web.dev"
    url: "https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing"
    lang: en
createdAt: "2026-09-06"
---

一句话：**重排（reflow/layout）重新算几何，重绘（repaint）只改像素；合成不走前两步。** 循环里写 style 再读 `offsetHeight`，浏览器不得不立刻把排队的布局算完，这叫强制同步布局 / layout thrashing。

## 哪些触发布局

改宽高、字体、增减 DOM、读几何（`getBoundingClientRect`、`scrollTop`、`offsetWidth`）。只改 `color` / `background` 通常重绘。只改 `transform` / `opacity` 尽量只合成。

```ts
// 坏：读/写交错
items.forEach((el) => {
  el.style.width = el.offsetWidth + 1 + "px";
});
// 好：先读完再写
const widths = items.map((el) => el.offsetWidth);
items.forEach((el, i) => {
  el.style.width = widths[i] + 1 + "px";
});
```

批量改 DOM 用 `DocumentFragment` 或先 `display: none` 再改（仍要权衡）。虚拟列表就是在少让布局看见那么多节点。

## 实践取舍

性能题要能量：Performance 面板看紫色 Layout。面试连到 INP：一次点击里的强制布局会直接抬交互延迟。

## 可能的追问

- `classList` 改很多属性算几次布局？通常批成一帧一次，除非中途读几何。
- `contain: layout` 有什么用？把重排限制在子树，卡片内部抖不影响整页。
