---
title: "Promise 和 async/await 是什么关系？错误怎么传、怎么并行？"
category: frontend
topic: javascript
section: 异步与事件循环
difficulty: medium
order: 2
tags: [Promise, async/await, 错误处理]
sources:
  - title: "Using promises - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Using_promises"
    lang: zh
  - title: "async function - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`async` 函数一定返回 Promise，`await` 是对 thenable 的语法糖，不自动并行。** 错误从 rejected Promise 冒泡到最近的 `try/catch` 或 `.catch`。并行要用 `Promise.all` / `allSettled` / `race`，不要在 `for` 里一个个 await 还以为在并发。

## 状态和组合

Promise 三态：pending、fulfilled、rejected，落定不可改。`then` 返回新 Promise，回调里抛错会变成 reject。`async` 函数里 `return x` 等于 `resolve(x)`，抛错等于 reject。

```ts
const [user, orders] = await Promise.all([
  fetch("/api/me").then((r) => r.json()),
  fetch("/api/orders").then((r) => r.json()),
]);
```

`all` 一个失败全失败；要部分成功用 `allSettled`。`race` 谁先结束听谁，适合超时：`Promise.race([job, sleep(3000).then(() => Promise.reject(new Error("timeout")))])`。

`for await` 是异步迭代，不是并行。顺序依赖（第二步要用第一步 id）才串行。

## 实践取舍

未处理的 rejection 在浏览器会进 `unhandledrejection`。Nest 或前端请求层要保证每个链路有 catch。把 `await` 写在 `map` 里得到的是 Promise 数组，要再 `all`。面试手写 Promise 考的是微任务队列和状态机，能讲清 `then` 回调总是异步即可。

## 可能的追问

- `await` 非 Promise 会怎样？当成已 resolve 的值，仍会插入微任务。
- 为什么 `Promise.all` 里一个 404 全挂？`fetch` 只有网络失败才 reject，要自己 `if (!r.ok) throw`。
