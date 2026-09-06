---
title: "HTTP 缓存怎么配？协商缓存和强制缓存分别走哪几条头？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 1
tags: [缓存, Cache-Control, ETag]
sources:
  - title: "HTTP caching - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Caching"
    lang: zh
  - title: "Prevent unnecessary network requests with the HTTP Cache - web.dev"
    url: "https://web.dev/articles/http-cache"
    lang: en
createdAt: "2026-09-06"
---

一句话：**带 hash 的静态资源用强制长缓存，HTML 入口用短缓存或每次协商。** `Cache-Control: max-age` / `immutable` 是强制缓存；过期后带 `ETag` / `If-None-Match` 或 `Last-Modified` 协商，304 就不下身体。

## 策略

Vite/Webpack 打出来的 `app.abc123.js` 内容变则文件名变，可以 `public, max-age=31536000, immutable`。`index.html` 若也被一年缓存，用户会永远拿到旧的脚本名，所以 HTML 通常 `no-cache`（允许存，但用前验证）或很短的 max-age。

`no-store` 才是真正不落盘，适合带隐私的 API。`private` 不让 CDN 存，`public` 可以。Service Worker 是另一层缓存，和 HTTP 缓存叠加时更要画图，否则会出现「已发版用户还在用旧壳」。

## 实践取舍

API GET 按资源可变性：用户信息短缓存或私有，配置可以 CDN。写操作不要被 GET 缓存。面试能画出「刷新 / 强制刷新 / 地址栏回车」三种对缓存的不同态度更好，但核心是 hash + HTML 不长缓存。

## 可能的追问

- `must-revalidate` 干什么？过期后必须和源站确认，不能偷偷用陈旧副本。
- CDN 和浏览器缓存谁先？先 CDN 再浏览器，清 CDN 不等于清用户磁盘。
