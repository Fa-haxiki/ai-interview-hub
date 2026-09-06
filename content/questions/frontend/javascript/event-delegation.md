---
title: "事件冒泡、捕获和委托是怎么回事？为什么列表要用委托？"
category: frontend
topic: javascript
section: 异步与事件循环
difficulty: medium
order: 4
tags: [事件委托, 冒泡, 捕获]
sources:
  - title: "Event bubbling and capture - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Scripting/Event_bubbling"
    lang: zh
  - title: "EventTarget.addEventListener - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**捕获从外到内，目标阶段，再冒泡从内到外。** 委托是把监听绑在祖先，靠 `event.target` 判断点了谁。1000 行列表绑 1000 个监听既贵又难在新增行时补绑。

## 路径

`addEventListener(type, fn, { capture: true })` 走捕获。同元素上捕获先于冒泡。`stopPropagation` 拦住后续阶段，`stopImmediatePropagation` 连同一元素上后面的监听也停。`preventDefault` 拦默认行为（链接跳转、表单提交），不拦传播。

```ts
list.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest("[data-id]");
  if (!btn || !list.contains(btn)) return;
  removeItem(btn.dataset.id);
});
```

`closest` 是为了点到按钮里的图标也能命中。React 17 起委托挂在根容器而不是 `document`，和原生混用时要注意。

## 实践取舍

`focus` 不冒泡，要用捕获或 `focusin`。`scroll` 默认不冒泡。模态里点遮罩关闭要分清 target 是不是自己。面试别把「委托」说成「只有冒泡才能做」——捕获也能委托。

## 可能的追问

- 委托会不会误点到后加的节点？会，这正是优点；过滤条件要写严。
- `once: true` 干什么？自动移除，适合一次性引导。
