---
title: "CSS 动画为什么优先改 transform 和 opacity？合成层是什么？"
category: frontend
topic: css
section: 响应式与动画
difficulty: medium
order: 2
tags: [animation, transform, 合成层]
sources:
  - title: "CSS and JavaScript animation performance - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance"
    lang: zh
  - title: "Animations and performance - web.dev"
    url: "https://web.dev/articles/animations-guide"
    lang: en
createdAt: "2026-09-06"
---

一句话：**改 `top/left/width` 容易触发布局和绘制；`transform` 和 `opacity` 多半能在合成线程上变。** 合成层是浏览器把部分图层交给 GPU 单独叠。层太多会吃内存，该促进行动画的元素再提升，不要给每个卡片 `translateZ(0)`。

## 像素流水线

JS / CSS → 样式 → 布局（reflow）→ 绘制（paint）→ 合成。动画 60fps 只有约 16ms。`left` 动画每帧重排后面的文档；`transform: translate3d` 通常只合成。`will-change: transform` 是预告，用完要去掉，否则层常驻。

`transition` 适合状态往返，`animation` 适合循环或关键帧。无限旋转的 loading 用 CSS，不要 `setInterval` 改 style。已经在主线程做复杂计算时，CSS 动画仍可能掉帧，因为合成也要等 vsync，但通常比 JS 改布局稳。

## 实践取舍

弹层淡入用 opacity + 少量 translate。高度展开用 `grid-template-rows: 0fr / 1fr` 这类技巧，或让 JS 量一次高度再过渡，避免 `height: auto` 不能插值。面试能连到「为什么弹层的 transform 害得 z-index 失效」——提升层会新建层叠上下文。

## 可能的追问

- FLIP 是什么？先记录 First/Last 位置，用 invert 的 transform 过渡，把布局跳变伪装成合成动画。
- SVG 动画也走合成吗？不一定，很多仍吃主线程；大 SVG 要测。
