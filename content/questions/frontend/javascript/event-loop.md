---
title: "浏览器事件循环怎么走？宏任务、微任务和渲染穿插在哪？"
category: frontend
topic: javascript
section: 异步与事件循环
difficulty: medium
order: 1
tags: [事件循环, 宏任务, 微任务]
sources:
  - title: "Event loop - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Event_loop"
    lang: zh
  - title: "In The Loop (Jake Archibald, JSConf)"
    url: "https://www.youtube.com/watch?v=cCOL7MC4Pl0"
    lang: en
createdAt: "2026-09-06"
---

一句话：**一个宏任务跑完，清空所有微任务，然后浏览器才有机会渲染，再取下一个宏任务。** `Promise.then` / `queueMicrotask` / `MutationObserver` 是微任务；`setTimeout`、`setInterval`、I/O、消息事件是宏任务。`requestAnimationFrame` 挂在渲染前，不是微任务。

## 一圈里发生什么

```ts
console.log("a");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("micro"));
console.log("b");
// a, b, micro, timeout
```

`async/await` 在 await 之后的代码等价于微任务。`setTimeout(fn, 0)` 不是 0ms 必跑，只是尽快排进宏任务队列，还要等当前栈和微任务、以及最小延迟。

渲染不是每个宏任务后都发生。浏览器会合并：若你在循环里同步改 1000 次 DOM，用户只看到最后一次。微任务若不断互相 `then`，会饿死渲染，页面卡住——这是「为什么不能用微任务当动画循环」。

Node 的阶段（timers、poll、check）和浏览器不完全一样，面试先问清环境。浏览器答 Jake Archibald 那套「task → microtasks → render」就够用。

## 可能的追问

- `queueMicrotask` 和 `Promise.then` 顺序？先注册先执行，都在同一轮微任务队列。
- 点击事件里改 DOM 再 `then`，用户先看到哪次？同步改和微任务都在下一次绘制前完成，通常一起画出来。
