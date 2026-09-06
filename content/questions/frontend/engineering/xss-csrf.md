---
title: "XSS 和 CSRF 差在哪？前端能做的和必须后端做的各是什么？"
category: frontend
topic: engineering
section: 浏览器与网络
difficulty: medium
order: 3
tags: [XSS, CSRF, 安全]
sources:
  - title: "Cross-site scripting (XSS) - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/Cross-site_scripting"
    lang: zh
  - title: "CSRF - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Glossary/CSRF"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**XSS 是攻击者的脚本跑在你的源里，CSRF 是用户的浏览器被诱导向你的站发带身份的请求。** XSS 能偷 token，于是也能绕过很多 CSRF 防御，所以两者要一起做。

## XSS

反射、存储、DOM 型。React 默认文本插值会转义，`dangerouslySetInnerHTML`、`href="javascript:"`、把用户输入塞进 `eval` / 动态 `new Function` 才会破功。Markdown / 富文本必须白名单过滤。`Content-Security-Policy` 的 `script-src` 是最后一道，inline 要 nonce。

## CSRF

Cookie 会话下，别的站点可以让浏览器自动带 cookie 发 POST。防御：SameSite=Lax/Strict、CSRF token、关键操作不接受单纯 cookie 认证（Authorization header 不自动带）。JSON API + 自定义头往往逼出预检，但不要只靠这个。

## 实践取舍

前端转义是默认，后端仍要编码和 CSP。HttpOnly cookie 防 XSS 读 token，换来 CSRF 面，要用 SameSite。面试能画「谁在执行脚本、谁在发请求」，不要背两个缩写定义就结束。

## 可能的追问

- innerHTML 赋值用户字符串安全吗？不安全，这是 DOM XSS。
- JWT 放 localStorage？XSS 一次全丢，要和 CSP、过滤一起评估，不是绝对禁令也不是最佳默认。
