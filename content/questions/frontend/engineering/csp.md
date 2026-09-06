---
title: "CSP 怎么防 XSS？nonce 和 hash 差在哪？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 6
tags: [CSP, nonce, XSS]
sources:
  - title: "Content Security Policy - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Content_Security_Policy"
    lang: zh
  - title: "CSP nonce - web.dev"
    url: "https://web.dev/articles/strict-csp"
    lang: en
createdAt: "2026-09-06"
---

一句话：**CSP 用白名单限制脚本、样式、连接从哪来，即使页面被插入了攻击者的 `<script>` 也跑不起来。** 严格 CSP 禁 `unsafe-inline`，用每次请求随机的 `nonce` 或文件 `hash` 放行自己的脚本。

## 要点

`Content-Security-Policy: default-src 'self'; script-src 'nonce-abc' 'strict-dynamic'`。`unsafe-eval` 一开，`new Function` 和很多模板就回来了。上报用 `report-uri` / `Reporting-API`，先 `Content-Security-Policy-Report-Only` 观察再强制。

框架的 inline 运行时要能打上 nonce（Next 有配置）。第三方统计往往逼你放松，能用 proxy 接到自己域更好。CSP 不是替代转义，是纵深防御。

## 可能的追问

- `'strict-dynamic'`？被放行的脚本再加载的子脚本也信任，减少列 CDN 域名。
- 为什么有了 CSP 还要过滤 HTML？CSP 配错或老浏览器，以及非脚本类注入（钓鱼链接）。
