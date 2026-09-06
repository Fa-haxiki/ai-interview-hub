---
title: "overflow、滚动链和滚动锁定怎么处理？为什么 body 锁了还能滚？"
category: frontend
topic: css
section: 布局
difficulty: medium
order: 6
tags: [overflow, 滚动, overscroll]
sources:
  - title: "overflow - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/overflow"
    lang: zh
  - title: "overscroll-behavior - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/overscroll-behavior"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**弹层打开时要锁住背后的滚动，只锁 `body` 往往不够，因为真正滚动的是内部容器。** `overflow: hidden` 会裁剪阴影和 sticky；`overscroll-behavior: contain` 阻止滚动链把背后页面带着走。

## 滚动链

触摸滑到子容器尽头，浏览器把滚动交给祖先，背后页面就动了。弹层、下拉用 `overscroll-behavior: contain`。锁背景：记 `scrollY`，`position: fixed; inset: 0; top: -y`，关掉再还原，比只改 overflow 更稳（尤其 iOS）。

`overflow: auto` vs `scroll`：后者总显示滚动条轨道。`overflow-x: hidden` 可能把 overflow-y 变成 compute 成 auto，意外剪裁。查「高度 100% 滚不动」先看哪一层有确定高度。

## 实践取舍

组件库 Dialog 一般已处理锁滚。自己做要测移动端橡皮筋。面试连到「包含块 + sticky 被 overflow 的祖先截获」。

## 可能的追问

- `scrollbar-gutter`？给滚动条预留槽，减少出现滚动条时的布局抖动。
- 虚拟列表的 overflow 必须在哪？高度固定的那个视口元素上。
