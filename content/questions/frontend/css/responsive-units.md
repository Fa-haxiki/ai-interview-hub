---
title: "em、rem、vw、svh 怎么选？响应式布局你怎么从移动端铺开？"
category: frontend
topic: css
section: 响应式与动画
difficulty: medium
order: 1
tags: [rem, em, vw, 响应式]
sources:
  - title: "CSS values and units - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Styling_basics/Values_and_units"
    lang: zh
  - title: "Viewport-relative units - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/length#viewport-relative_units"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**组件内部间距和字号跟组件走用 `em`，全站字号和间距用 `rem`，视口相关的大布局才用 `vw/dvh`。** 移动优先：默认写小屏，再用 `min-width` 往上加列。`100vh` 在移动浏览器会被地址栏坑，改用 `dvh` / `svh`。

## 单位

- `rem`：根元素，改 `html { font-size }` 能做整站缩放，也尊重用户浏览器字号。
- `em`：相对父级字号，按钮 padding 用 em 会跟着字号涨，嵌套会指数放大，要小心。
- `vw/vh`：相对视口。`100vw` 含滚动条时可能出现横滚，布局宽度更稳的是 `%` 或 Grid。
- `svh/lvh/dvh`：小/大/动态视口，全屏页用 `100dvh` 或 `100svh`。

断点按内容塌陷点来，不要按某款机型。`clamp(1rem, 2vw + 1rem, 1.25rem)` 做流体字号，比三个媒体查询少跳。

## 实践取舍

容器查询（`@container`）适合卡片在侧栏和主栏宽度不同的情况，比只看视口更准。面试要能说「响应的是谁」：视口、容器，还是用户字号。

## 可能的追问

- 为什么不把根字号设成 62.5%？`1rem = 10px` 好算，但破坏用户默认 16px 缩放预期，我更愿意用 16 做数学。
- `px` 还能用吗？发丝边框、和设计稿对齐的图标可以；正文尽量 `rem`。
