---
title: "relative、absolute、fixed、sticky 分别相对谁定位？包含块怎么找？"
category: frontend
topic: css
section: 布局
difficulty: medium
order: 4
tags: [position, 包含块, sticky]
sources:
  - title: "position - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/position"
    lang: zh
  - title: "Containing block - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/Containing_block"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`relative` 相对自己原来的位置；`absolute` 相对最近的非 static 祖先；`fixed` 相对视口（祖先有 transform/filter/perspective 时变成相对那个祖先）；`sticky` 在最近滚动容器里「到阈值前当 relative，之后当卡住」。** 包含块找错，是弹层和吸顶失效的第一原因。

## 细节

`absolute` 的百分比宽高相对包含块，不是相对父级 content 那么直觉——padding 边是参考。`fixed` 弹层若放在带 `transform` 的卡片里，滚动页面时会跟着卡片走，看起来像 bug。React Portal 挂 `document.body` 就是为了躲开这些包含块。

`sticky` 的祖先不能 `overflow: hidden`，否则滚动祖先不是你想的那个，粘不住。还要给 `top/left` 一个阈值，光写 `sticky` 没有效果。

## 实践取舍

文档流能解决的不要脱离。表格吸头用 sticky，整页导航用 sticky，全屏遮罩用 fixed + Portal。面试画「从元素往上找包含块」比背四个词有用。

## 可能的追问

- `sticky` 和 `fixed` 能一起用吗？职责不同；侧栏内部吸顶用 sticky。
- `inset: 0; margin: auto` 居中依赖什么？元素要有尺寸，包含块要能算。
