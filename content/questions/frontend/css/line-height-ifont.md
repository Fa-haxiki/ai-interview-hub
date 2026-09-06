---
title: "行高、基线和垂直对齐为什么总对不齐？图标和文字怎么排？"
category: frontend
topic: css
section: 布局
difficulty: medium
order: 5
tags: [line-height, vertical-align, 基线]
sources:
  - title: "line-height - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/line-height"
    lang: zh
  - title: "vertical-align - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/vertical-align"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**行内布局按基线对齐，图标当行内盒时会「坐」在文字基线上，看起来偏下。** `vertical-align` 只对行内/表格单元有效，对 flex 项无效。图标+文字用 flex `align-items: center` 最省事。

## 行盒

`line-height` 无单位数字是相对字号的倍，推荐 `1.5` 这种，不写 `px` 以免缩放崩。行高撑开的是行框，不是给每个字母加 padding。`vertical-align: middle` 相对行框中线，和「视觉中心」仍可能差 1～2 像素，字体 metrics 不同。

图片默认 `inline`，底部留基线空隙（像字母 q 的下行）。修：`img { display: block }` 或 `vertical-align: middle`。按钮里的 SVG 设宽高并 flex 居中。

## 实践取舍

设计稿「垂直居中」在行内世界并不存在一条属性。能上 flex 就上。面试别把 `line-height: 100%` 和 `height` 搞混，百分比行高相对自己的 font-size。

## 可能的追问

- `line-height: normal` 是多少？看字体，大约 1.2，跨字体不稳。
- 多行截断？`-webkit-line-clamp` + `box-orient`，或现在的 `line-clamp`。
