---
title: "CSS 变量和预处理器变量差在哪？主题切换你怎么做？"
category: frontend
topic: css
section: 层叠与选择器
difficulty: medium
order: 3
tags: [CSS变量, 主题, custom properties]
sources:
  - title: "Using CSS custom properties - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties"
    lang: zh
  - title: "prefers-color-scheme - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media/prefers-color-scheme"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Sass 变量编译期消失，自定义属性是运行时、会继承、能被 JS 改。** 主题色、间距 token 用 `--color-bg` 挂在 `:root` 或 `[data-theme]`，暗色只换一层变量，组件不用重写。

## 运行时

```css
:root { --bg: #fff; --fg: #111; }
[data-theme="dark"] { --bg: #111; --fg: #f5f5f5; }
body { background: var(--bg); color: var(--fg); }
```

`var(--x, fallback)` 二级回退。变量是继承的，子树改 `--fg` 只影响自己。不能直接 `var(--n) + 1px`，要用 `calc(var(--n) + 1px)`。动画变量比动画整段颜色更便宜，但改 `--x` 仍可能触发依赖它的绘制。

`color-scheme` 和 `prefers-color-scheme` 管滚动条和系统控件。先跟系统，再允许用户覆盖并写入 `localStorage`，注意 SSR 闪白：尽早在 `html` 上打主题类。

## 实践取舍

设计 token 一层语义（`--bg-subtle`）不要直接把 `--blue-500` 洒满组件。Tailwind 的 theme 也是这个思想。面试对比「CSS 变量能主题化，Sass 不能热切换」。

## 可能的追问

- 变量无效会怎样？属性当未指定，用 fallback 或初始值，不是整条规则作废。
- 能把变量当媒体查询断点吗？不能，媒体查询不吃自定义属性（容器查询的长度另说）。
