---
title: "怎么取消进行中的 fetch？AbortController 和竞态覆盖怎么处理？"
category: frontend
topic: javascript
section: 异步与事件循环
difficulty: medium
order: 5
tags: [AbortController, fetch, 竞态]
sources:
  - title: "AbortController - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController"
    lang: zh
  - title: "fetch() - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**每个请求一个 `AbortController`，下次发请求或卸载时 `abort()`。** 防抖只推迟发送，不取消已发出的；后发先至会把旧数据画上去，必须取消或丢弃过期响应。

## 写法

```ts
let ac: AbortController | undefined;

async function search(q: string) {
  ac?.abort();
  ac = new AbortController();
  const res = await fetch(`/api/search?q=${q}`, { signal: ac.signal });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
```

`abort` 让 fetch reject 一个 `AbortError`，要和业务错误分开，避免弹出「失败」。React 的 effect cleanup 里 abort。同一 signal 可以挂多个 fetch。超时：`AbortSignal.timeout(5000)` 或自己 `setTimeout` 再 abort。

还有一种不 abort、只比序号：每次请求 `++seq`，回来时 `if (seq !== latest) return`。abort 更干净，少占连接。

## 可能的追问

- axios 怎么取消？同样用 signal，或旧的 CancelToken。
- Service Worker 里 abort 有用吗？有，能停掉从页面发起的请求。
