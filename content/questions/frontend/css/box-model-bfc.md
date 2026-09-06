---
title: "盒模型和 BFC 是什么？margin 重叠为什么会发生、怎么拆开？"
category: frontend
topic: css
section: 布局
difficulty: medium
order: 1
tags: [盒模型, BFC, margin]
sources:
  - title: "The box model - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Styling_basics/Box_model"
    lang: zh
  - title: "Block formatting context - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_display/Block_formatting_context"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**默认 content-box 的 width 只管内容，border-box 把 padding 和 border 算进设定宽度。** BFC 是一块独立的块级排版环境：内部 float 不会把外面撑塌，内外 margin 也不会和外面的块随便合并。

## 盒模型

`box-sizing: border-box` 是组件库默认，百分宽 + padding 才不会把栏撑破。margin 不算进 box，所以「宽 100% 再加 margin」仍可能溢出。行盒和替换元素（图片）的计算方式和块盒不同，面试先声明你在说块级盒。

## BFC 和重叠

相邻块的垂直 margin 会取较大者，不是相加。父子之间，子的 top margin 也可能「漏」到父外面。触发新 BFC（`overflow: auto/hidden`、`display: flow-root`、`flex/grid` 子项、`float`、`position: absolute`）后，这块内部自己排，float 能被包住，margin 不再和外面合并。

清浮动的现代写法是父级 `display: flow-root`，比 `overflow: hidden` 少副作用。flex / grid 容器本身已是新的格式化上下文，很多「重叠」在弹性布局里根本不会出现。

## 可能的追问

- `overflow: hidden` 当 BFC 的代价？可能裁剪阴影和 sticky 的包含块。
- 一行里的 margin 会重叠吗？水平 margin 不重叠，这是垂直块方向的规则。
