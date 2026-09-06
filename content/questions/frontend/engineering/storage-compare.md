---
title: "Cookie、localStorage、sessionStorage、IndexedDB 怎么选？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 4
tags: [localStorage, IndexedDB, Cookie]
sources:
  - title: "Web Storage API - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Storage_API"
    lang: zh
  - title: "IndexedDB - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**要给服务器自动带的用 Cookie（少、HttpOnly）；同步小配置用 `localStorage`；关标签就丢用 `sessionStorage`；大量结构化、索引查询用 IndexedDB。** Storage 同步且有配额，大 JSON 会卡主线程。

## 边界

Cookie：每次请求可能带上，4KB 级，要设 `Secure` `SameSite`。别放 token 明文还让 JS 读，除非你接受 XSS 风险。

`localStorage`：同源持久，约 5MB，无过期 API。不能给 Web Worker 直接用同一套同步 API 当数据库。隐私模式可能禁用。

IndexedDB：异步，可建索引，适合离线草稿、缓存资源清单。API 丑，用 `idb` 封装。Safari 早期坑多，要有降级。

## 实践取舍

主题、语言：localStorage。购物车未登录：localStorage + 过期。聊天记录：IDB。会话登录：Cookie。面试画出「谁读、大不大、要不要带上服务器」。

## 可能的追问

- `sessionStorage` 和会话 Cookie？前者按顶级窗口副本，新标签不共享；后者按浏览器会话。
- QuotaExceeded 怎么办？捕获、清理、别存整图 base64。
