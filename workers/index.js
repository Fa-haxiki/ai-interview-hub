const SYSTEM = `你是面试辅导助手。用简体中文、第一人称面试者口吻回答。
要求：
- 先给结论，再分点讲原理和取舍，控制在 400 字以内
- 使用 Markdown：二级标题、列表、粗体、必要时用表格或短代码块
- 不要编造具体论文数字或虚假链接
- 若用户提供了本站相关笔记标题，可以点名「可以先看某某题」再补充
- 不要使用 emoji`;

/** id 与 src/lib/ai-models.ts 保持一致 */
const WORKERS_MODELS = {
  qwen3: {
    cf: "@cf/qwen/qwen3-30b-a3b-fp8",
    label: "Qwen3 30B（Cloudflare Workers AI）",
  },
  "glm-flash": {
    cf: "@cf/zai-org/glm-4.7-flash",
    label: "GLM-4.7 Flash（Cloudflare Workers AI）",
  },
  "llama-8b": {
    cf: "@cf/meta/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B（Cloudflare Workers AI）",
  },
  "llama-70b": {
    cf: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    label: "Llama 3.3 70B（Cloudflare Workers AI）",
  },
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function pickModelId(requested, env) {
  const fallback = env.DEFAULT_MODEL || "qwen3";
  const id = String(requested || fallback).trim();
  if (id === "openai") return "openai";
  if (WORKERS_MODELS[id]) return id;
  return WORKERS_MODELS[fallback] ? fallback : "qwen3";
}

function extractAnswer(result) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  if (typeof result.response === "string") return result.response;
  if (typeof result.result === "string") return result.result;
  const choice = result.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text ?? "").join("");
  }
  return "";
}

async function runWorkersModel(env, modelId, messages) {
  if (!env.AI) {
    throw Object.assign(new Error("未绑定 Workers AI"), { status: 503 });
  }
  const spec = WORKERS_MODELS[modelId];
  const result = await env.AI.run(spec.cf, {
    messages,
    max_tokens: 700,
  });
  return { answer: extractAnswer(result), label: spec.label };
}

async function runOpenAICompat(env, messages) {
  const key = env.OPENAI_API_KEY;
  if (!key) {
    throw Object.assign(
      new Error("未配置 OPENAI_API_KEY，无法使用自定义模型"),
      { status: 503 },
    );
  }
  const base = String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 700,
      temperature: 0.4,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.error?.message || data.message || `HTTP ${res.status}`;
    throw Object.assign(new Error(`自定义模型调用失败：${detail}`), {
      status: 502,
    });
  }
  return {
    answer: extractAnswer(data),
    label: `${model}（OpenAI 兼容接口）`,
  };
}

async function handleAsk(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (request.method === "GET") {
    return json({
      defaultModel: env.DEFAULT_MODEL || "qwen3",
      openaiEnabled: Boolean(env.OPENAI_API_KEY),
      models: [
        ...Object.keys(WORKERS_MODELS),
        ...(env.OPENAI_API_KEY ? ["openai"] : []),
      ],
    });
  }
  if (request.method !== "POST") {
    return json({ error: "只接受 GET / POST" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }

  const question = String(body?.question ?? "").trim();
  if (!question || question.length > 300) {
    return json({ error: "问题不能为空，且不超过 300 字" }, 400);
  }

  const pageTitle = String(body?.pageTitle ?? "").slice(0, 200);
  const related = Array.isArray(body?.related)
    ? body.related
        .slice(0, 4)
        .map((item) => String(item?.title ?? "").trim())
        .filter(Boolean)
    : [];

  const user = [
    pageTitle ? `当前正在阅读的题目：${pageTitle}` : "",
    related.length ? `本站可能相关的笔记：${related.join("；")}` : "",
    `请回答这个面试追问：${question}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ];
  const modelId = pickModelId(body?.model, env);

  try {
    const { answer, label } =
      modelId === "openai"
        ? await runOpenAICompat(env, messages)
        : await runWorkersModel(env, modelId, messages);
    if (!answer.trim()) {
      return json({ error: "模型没有返回内容" }, 502);
    }
    return json({ answer: answer.trim(), model: label, modelId });
  } catch (error) {
    const status = error?.status || 502;
    const message = error instanceof Error ? error.message : "模型调用失败";
    return json({ error: message }, status);
  }
}

const PROGRESS_KEY = "last_read";
const PROGRESS_TTL = 60 * 60 * 24 * 365; // 一年

function isValidProgress(body) {
  if (!body || typeof body !== "object") return false;
  if (typeof body.path !== "string" || !body.path.startsWith("/")) return false;
  if (typeof body.title !== "string" || !body.title) return false;
  if (typeof body.scrollRatio !== "number" || body.scrollRatio < 0 || body.scrollRatio > 1)
    return false;
  return true;
}

async function handleProgress(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (!env.PROGRESS) {
    return json({ error: "未绑定 KV PROGRESS" }, 503);
  }
  if (request.method === "GET") {
    const raw = await env.PROGRESS.get(PROGRESS_KEY);
    if (!raw) return json({ progress: null });
    try {
      return json({ progress: JSON.parse(raw) });
    } catch {
      return json({ progress: null });
    }
  }
  if (request.method !== "PUT") {
    return json({ error: "只接受 GET / PUT" }, 405);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON" }, 400);
  }
  if (!isValidProgress(body)) {
    return json({ error: "进度字段不合法" }, 400);
  }
  const record = {
    category: typeof body.category === "string" ? body.category : "",
    topic: typeof body.topic === "string" ? body.topic : "",
    slug: typeof body.slug === "string" ? body.slug : "",
    title: String(body.title).slice(0, 300),
    section: typeof body.section === "string" ? String(body.section).slice(0, 100) : "",
    path: String(body.path).slice(0, 500),
    scrollRatio: body.scrollRatio,
    updatedAt: new Date().toISOString(),
  };
  await env.PROGRESS.put(PROGRESS_KEY, JSON.stringify(record), {
    expirationTtl: PROGRESS_TTL,
  });
  return json({ ok: true, progress: record });
}

const worker = {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/ask" || pathname === "/api/ask/") {
      return handleAsk(request, env);
    }
    if (pathname === "/api/progress" || pathname === "/api/progress/") {
      return handleProgress(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

export default worker;
