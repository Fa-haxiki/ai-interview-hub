---
title: "Service Worker 能做什么？缓存策略 stale-while-revalidate 是什么？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 7
tags: [Service Worker, PWA, 缓存]
sources:
  - title: "Service Worker API - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API"
    lang: zh
  - title: "Offline Cookbook - web.dev"
    url: "https://web.dev/articles/offline-cookbook"
    lang: en
createdAt: "2026-09-06"
---

一句话：**SW 是浏览器和网络之间的代理，能拦截 fetch、做离线、推送、后台同步。** 它和 HTTP 缓存叠两层，发版后用户还在用旧壳，多半是 SW 把 `index.html` 强缓存了。

## 策略

- Cache First：静态 hash 资源。
- Network First：API。
- Stale-While-Revalidate：先回缓存再后台更新，下次才新。
- Network Only：支付、验证码。

Workbox 能少写样板。更新：`skipWaiting` + `clients.claim` 要谨慎，可能打断正在用的旧页。调试用 Application 面板，硬刷新有时仍走 SW。

HTTPS（或 localhost）才能注册。不要给所有站点无脑加 PWA，管理后台没离线需求就别上。

## 可能的追问

- SW 能改 Cookie 吗？fetch 事件里能改请求，但 HttpOnly cookie 仍由浏览器管。
- 和 App Cache ？Application Cache 已废，不要提它当方案。
