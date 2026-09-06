---
title: "层叠上下文是什么？z-index 为什么有时怎么加都盖不住？"
category: frontend
topic: css
section: 层叠与选择器
difficulty: medium
order: 2
tags: [层叠上下文, z-index, stacking]
sources:
  - title: "Stacking context - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Stacking_context"
    lang: zh
  - title: "Understand z-index - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`z-index` 只在同一个层叠上下文里比大小；子级再高也出不了父级这块「玻璃」。** 父级一旦形成上下文（`position` + z-index、`opacity < 1`、`transform`、`filter`、`isolation`、某些 `fixed`），整棵子树被当成一层去和叔叔节点比。

## 为什么盖不住

弹层写了 `z-index: 9999`，仍在一个带 `transform` 的卡片下面，因为卡片先建了上下文。比较发生在「卡片 vs 弹层的祖先」，不是「9999 vs 1」。修法是把弹层用 Portal 挂到 `body`，或让祖先不要随便建上下文。

`opacity: 0.99`、`transform: translateZ(0)` 为了修字体或开合成层，副作用就是新建上下文。做动画前要想到这一点。

## 实践取舍

设计 token 里约定少数层级：下拉、对话框、toast，不要每人加两个 9。React 里弹层走 Portal。面试画一棵树比背触发条件列表更说明你排过 bug。

## 可能的追问

- `z-index: auto` 会建上下文吗？不会，只参与当前上下文排序。
- sticky 和上下文？sticky 元素相对最近的滚动祖先，祖先的 transform 会把它变成像 absolute 一样「粘不住」。
