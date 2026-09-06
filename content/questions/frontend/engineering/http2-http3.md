---
title: "HTTP/2 和 HTTP/3 对前端打包策略有什么影响？还要不要合并文件？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 5
tags: [HTTP2, HTTP3, 多路复用]
sources:
  - title: "HTTP/2 - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/HTTP_2"
    lang: zh
  - title: "HTTP/3 - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/HTTP_3"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**H2/H3 多路复用，不再需要为了「减少连接」把所有 JS 打成一个大包。** 但仍要控制请求数和依赖链：上百个小模块会有压缩字典和主线程编译成本，关键路径上的瀑布比协议版本更伤。

## 协议

H1：每主机 6 连接，雪碧图、合并文件有意义。H2：单连接多流，头压缩。H3：QUIC/UDP，弱网丢包不堵死整条连接。CDN 和证书要跟上，前端改不了协议，但能改资源粒度。

策略：按路由拆块 + 共享 vendor；预加载关键；不要回到「一个 3MB app.js」。小图标用 SVG 或字体子集，不必为 H2 拆成 200 个 HTTP 请求。

## 实践取舍

先看瀑布图：是下载慢还是解析慢。面试别说「有了 H2 就不用打包」。

## 可能的追问

- 域名分散还要吗？H2 下通常有害，会拆掉多路复用。
- Server Push 呢？基本被 preload 取代，别当答案。
