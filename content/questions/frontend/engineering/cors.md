---
title: "CORS 是谁在拦？简单请求和预检差在哪？Cookie 跨站怎么带？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 2
tags: [CORS, 预检, Cookie]
sources:
  - title: "Cross-Origin Resource Sharing (CORS) - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS"
    lang: zh
  - title: "Same-origin policy - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**CORS 是浏览器执行的读保护，服务器用响应头放行；不是防火墙，curl 不会被拦。** 简单请求直接发，JS 能不能读响应看 `Access-Control-Allow-Origin`；非简单请求先 OPTIONS 预检，问方法和自定义头允不允许。

## 规则

源 = 协议 + 主机 + 端口。跨源 AJAX 默认读不了响应。服务端要回 `Allow-Origin`（具体源或 `*`，但带 cookie 不能是 `*`）、`Allow-Methods`、`Allow-Headers`。带 cookie 必须前端 `credentials: 'include'`，后端 `Allow-Credentials: true`，Origin 必须枚举。

预检触发：`PUT/DELETE`、`Content-Type: application/json`、自定义头如 `Authorization`。开发代理把接口变成同源，是绕开浏览器，不是修了生产 CORS。

## 实践取舍

生产用网关统一加 CORS，不要每个 Nest 控制器手写 `*`。第三方图片画布要 `crossOrigin`，否则污染 canvas。面试强调：拦的是前端读，恶意网站仍可能打 CSRF（要 SameSite / CSRF token），CORS 不是 CSRF 的完整解。

## 可能的追问

- 为什么预检失败看 Network 是红色 OPTIONS？真正的业务请求没发出去。
- `*` 加 Cookie 会怎样？浏览器拒绝，这是规范。
