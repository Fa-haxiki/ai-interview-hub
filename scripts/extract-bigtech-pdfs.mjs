import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const SRC_DIR = "/Users/sansan/Downloads/LLS/学习资料/大厂面试题";
const OUT_DIR = path.join(process.cwd(), "content/questions/bigtech/packs");
const CACHE_DIR = path.join(process.cwd(), ".cache/mineru");
const API = "https://mineru.net/api/v4";
const PILOT_NAMES = [
  "2026字节前端AI开发.pdf",
  "【精】2024字节前端面试题（45题）.pdf",
  "美团前端一面.pdf",
  "京东零售前端开发工程师1-3面.pdf",
];
const SKIP_NAMES = new Set([
  "2026字节前端AI开发_watermarked.pdf",
  "2026网易AI前端工程师d.pdf",
  "2024字节前端面试题（45题）.pdf",
  "2026美团前端开发工程师（AICoding 方向）.pdf",
]);

function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function token() {
  const value = process.env.MINERU_API_TOKEN;
  if (!value) {
    throw new Error("缺少 MINERU_API_TOKEN，请写在 .env.local");
  }
  return value;
}

function headers() {
  return {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    Accept: "*/*",
  };
}

const LEGACY_DATA_ID = {
  "2026字节前端AI开发.pdf": "2026_AI",
  "【精】2024字节前端面试题（45题）.pdf": "2024_45",
};

function dataIdOf(file) {
  if (LEGACY_DATA_ID[file]) return LEGACY_DATA_ID[file];
  const hash = createHash("sha1").update(file).digest("hex").slice(0, 12);
  const ascii = file
    .replace(/\.pdf$/i, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/_+/g, "_")
    .slice(0, 32);
  if (ascii.length < 4) return `pack_${hash}`;
  return `${ascii}_${hash}`.slice(0, 80);
}

function cacheDir(id) {
  return path.join(CACHE_DIR, id);
}

function cachedMarkdown(id) {
  const file = path.join(cacheDir(id), "full.md");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

async function mineruJson(url, init, attempt = 0) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`MinerU 返回非 JSON（${res.status}）：${text.slice(0, 200)}`);
  }
  if (res.status === 429 && attempt < 6) {
    const wait = 20_000 * (attempt + 1);
    console.log(`  限流，${wait / 1000}s 后重试…`);
    await new Promise((r) => setTimeout(r, wait));
    return mineruJson(url, init, attempt + 1);
  }
  if (!res.ok || body.code !== 0) {
    throw new Error(`MinerU ${url} 失败：${body.msg || res.status} ${text.slice(0, 240)}`);
  }
  return body.data;
}

async function parseWithMinerU(files) {
  const pending = files.filter((file) => !cachedMarkdown(dataIdOf(file)));
  if (pending.length === 0) return;

  for (let offset = 0; offset < pending.length; offset += 50) {
    const chunk = pending.slice(offset, offset + 50);
    const ids = chunk.map((file) => dataIdOf(file));
    if (new Set(ids).size !== ids.length) {
      throw new Error("MinerU data_id 冲突，请检查 dataIdOf");
    }
    const payload = {
      files: chunk.map((file) => ({
        name: file,
        data_id: dataIdOf(file),
        is_ocr: true,
      })),
      model_version: "vlm",
      language: "ch",
      enable_formula: false,
      enable_table: true,
    };
    console.log(`MinerU 申请上传 ${chunk.length} 个文件…`);
    const applied = await mineruJson(`${API}/file-urls/batch`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    const batchId = applied.batch_id;
    const urls = applied.file_urls;
    if (!batchId || !urls?.length) {
      throw new Error("MinerU 未返回 batch_id / file_urls");
    }
    for (let i = 0; i < chunk.length; i++) {
      const buf = readFileSync(path.join(SRC_DIR, chunk[i]));
      const put = await fetch(urls[i], { method: "PUT", body: buf });
      if (!put.ok) {
        throw new Error(`上传失败 ${chunk[i]}：${put.status} ${await put.text()}`);
      }
      console.log(`  已上传 ${chunk[i]}`);
    }

    const deadline = Date.now() + 90 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 8000));
      const data = await mineruJson(`${API}/extract-results/batch/${batchId}`, {
        headers: { Authorization: `Bearer ${token()}`, Accept: "*/*" },
      });
      const results = data.extract_result ?? [];
      const done = results.filter((r) => r.state === "done" || r.state === "failed");
      const running = results.filter((r) => r.state === "running")[0];
      const progress = running?.extract_progress
        ? ` ${running.extract_progress.extracted_pages}/${running.extract_progress.total_pages}`
        : "";
      console.log(`  批次 ${batchId.slice(0, 8)}：${done.length}/${results.length} 完成${progress}`);
      if (done.length < results.length) continue;

      for (const item of results) {
        const id = item.data_id || dataIdOf(item.file_name);
        if (item.state === "failed") {
          console.warn(`  解析失败 ${item.file_name}：${item.err_msg}`);
          mkdirSync(cacheDir(id), { recursive: true });
          writeFileSync(path.join(cacheDir(id), "error.txt"), item.err_msg || "failed");
          continue;
        }
        if (!item.full_zip_url) {
          console.warn(`  ${item.file_name} 完成但没有 zip`);
          continue;
        }
        await saveZipMarkdown(id, item.full_zip_url);
      }
      break;
    }
    if (Date.now() >= deadline) {
      throw new Error(`MinerU 批次 ${batchId} 等待超时`);
    }
  }
}

async function saveZipMarkdown(id, zipUrl) {
  const dir = cacheDir(id);
  mkdirSync(dir, { recursive: true });
  const zipPath = path.join(dir, "result.zip");
  const res = await fetch(zipUrl);
  if (!res.ok) throw new Error(`下载 zip 失败 ${id}：${res.status}`);
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  execFileSync("unzip", ["-o", "-q", zipPath, "-d", dir]);
  const found = findFullMd(dir);
  if (!found) throw new Error(`${id} 的 zip 里没有 full.md`);
  if (found !== path.join(dir, "full.md")) {
    writeFileSync(path.join(dir, "full.md"), readFileSync(found));
  }
  console.log(`  已缓存 ${id}/full.md`);
}

function findFullMd(dir) {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const name of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, name.name);
      if (name.isDirectory()) stack.push(full);
      else if (name.name === "full.md") return full;
    }
  }
  return "";
}

function compact(text) {
  return text
    .replace(/\s+/g, "")
    .replace(/[.．。？?、，,：:·•\-—_（）()【】\[\]"'`]/g, "")
    .toLowerCase();
}

function yearOf(title) {
  const m = title.match(/20(2[4-6])/);
  return m ? `20${m[1]}` : "其他";
}

function baseSlug(title) {
  const slug = title
    .replace(/【精】/g, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[^\u4e00-\u9fffA-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  return slug || "pack";
}

function slugify(title, used) {
  const slug = baseSlug(title);
  let out = slug;
  let i = 2;
  while (used.has(out)) {
    out = `${slug}-${i}`;
    i += 1;
  }
  used.add(out);
  return out;
}

function removePackFiles(title) {
  const slug = baseSlug(title);
  for (const suffix of ["", "-2", "-3"]) {
    const file = path.join(OUT_DIR, `${slug}${suffix}.md`);
    if (existsSync(file)) rmSync(file);
  }
}

function looksLikeQuestion(title) {
  const t = title.replace(/\s+/g, " ").trim();
  if (t.length < 6 || t.length > 220) return false;
  if (/[：:]\s*$/.test(t)) return false;
  if (/^(难度|考点|答案|代码块|参考答案|常见坑|追问|核心区别|使用场景|工作原理|实现思路)/.test(t)) {
    return false;
  }
  if (/[？?]/.test(t)) return true;
  if (
    /^(请|简述|谈谈|讲讲|讲一下|说一下|说说|介绍|描述|解释|说明|实现|手写|写出|对比|比较|列举|分析|如何|怎么|为什么|什么是|聊聊|简单|获取|使用|说出|看你|挑一|你先|你有|自我介绍)/.test(
      t,
    )
  ) {
    return true;
  }
  if (/(是什么|为什么|怎么|如何|区别|原理|实现|优缺点|场景|作用|理解|设计|优化|处理|机制)/.test(t)) {
    return true;
  }
  if (/[\u4e00-\u9fff]{5,}/.test(t) && /[。．.]$/.test(t)) return true;
  if (/[\u4e00-\u9fff]{8,}/.test(t) && !/[：:]/.test(t)) return true;
  return false;
}

function isAnswerBoundary(line) {
  const t = line.replace(/^#+\s*/, "").replace(/\s+/g, "");
  return /^(一面|二面|三面|四面|五面)?参考答案/.test(t) || /^答案[:：]?$/.test(t);
}

function isAnswerPoint(line) {
  const t = line.replace(/^#+\s*/, "").replace(/\s+/g, "");
  return /^答案要点/.test(t);
}

function isRoundHeader(line) {
  const t = line.replace(/^#+\s*/, "").replace(/\s+/g, "");
  if (t.length > 48 || isAnswerBoundary(line)) return false;
  return /^(第[一二三四五六七八九十\d]+轮|[一二三四五]面|HR面|技术面)/.test(t) || /面试题/.test(t);
}

function numberedMatch(line) {
  const t = line.replace(/^#{1,3}\s+/, "");
  return (
    t.match(/^(\d{1,2})[.．、:：]\s*(.+)$/) ||
    t.match(/^\((\d{1,2})\)\s*(.+)$/) ||
    t.match(/^（(\d{1,2})）\s*(.+)$/)
  );
}

function bulletMatch(line) {
  return line.replace(/^#{1,3}\s+/, "").match(/^\\?[-*•·●]\s+(.+)$/);
}

function stripQuestionMarks(line) {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\\?[-*•·●]\s+/, "")
    .replace(/^\d{1,2}[.．、:：]\s*/, "")
    .replace(/[#*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isQuestionStartLine(line) {
  const t = line.trim();
  return /^(#{1,3}\s+\d{1,2}[.．、:：]\s*|#{2,3}\s+|\d{1,2}[.．、:：]\s*)/.test(t);
}

function isSameQuestion(a, b) {
  const ca = compact(a);
  const cb = compact(b);
  if (!ca || !cb) return false;
  return ca === cb || ca.includes(cb) || cb.includes(ca);
}

function isAnswerStyleTitle(text) {
  if (/[？?]/.test(text)) return false;
  if (/^(手写|场景|算法|问答|编程|附加)题?[：:]/.test(text)) return false;
  return /[：:]/.test(text.slice(0, 16));
}

function titleMatches(canonical, candidate) {
  if (!canonical || !candidate || candidate.length > 60) return false;
  if (isAnswerStyleTitle(candidate)) return false;
  if (isSameQuestion(canonical, candidate)) return true;
  const a = compact(canonical);
  const b = compact(candidate);
  if (a.length >= 8 && b.length >= 8 && (a.startsWith(b) || b.startsWith(a))) return true;
  const runs = (b.match(/[\u4e00-\u9fff]{5,}/g) ?? []).filter(
    (run) => !/^(解决了什么问题|有什么区别|是怎么工作的|结合实际应用|结合源码分析)/.test(run),
  );
  return runs.some((run) => a.includes(run));
}

function nextUnusedIndex(used, length) {
  for (let i = 0; i < length; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

function extendTitle(lines, start, first) {
  let q = first;
  let i = start;
  while (i < lines.length) {
    const next = lines[i].trim();
    if (!next) {
      i += 1;
      continue;
    }
    if (
      isAnswerBoundary(next) ||
      isRoundHeader(next) ||
      numberedMatch(next) ||
      bulletMatch(next) ||
      /^```/.test(next)
    ) {
      break;
    }
    if (/^(难度|考点|答案要点)/.test(next.replace(/\s+/g, ""))) break;
    if (/[。？?!！]$/.test(q.replace(/\s+/g, ""))) break;
    if (next.length > 80 || /[：:]/.test(next.slice(0, 16))) break;
    q += next;
    i += 1;
  }
  return { q: q.replace(/\s+/g, " ").trim(), next: i };
}

function collectPlainQuestions(lines) {
  const titles = [];
  let inFence = false;
  let sinceAnswer = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;
    if (isAnswerBoundary(line)) break;
    if (isAnswerPoint(line)) {
      if (titles.length >= 5 && sinceAnswer >= 5) break;
      sinceAnswer = 0;
      continue;
    }
    if (numberedMatch(line) || bulletMatch(line) || isRoundHeader(line)) continue;
    const q = stripQuestionMarks(line);
    if (!looksLikeQuestion(q) || q.length < 10 || q.length > 140) continue;
    if (titles.length >= 2 && titleMatches(titles[0], q)) break;
    titles.push(q);
    sinceAnswer += 1;
  }
  return titles;
}

function collectToc(markdown) {
  const lines = markdown.split("\n");
  const numbered = [];
  const bullets = [];
  let inFence = false;
  let numberedSinceAnswer = 0;
  let bulletsSinceAnswer = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line) continue;
    if (isAnswerBoundary(line)) break;
    if (isAnswerPoint(line)) {
      if (numbered.length >= 5 && numberedSinceAnswer >= 5) break;
      if (bullets.length >= 5 && bulletsSinceAnswer >= 5) break;
      numberedSinceAnswer = 0;
      bulletsSinceAnswer = 0;
      continue;
    }

    const num = numberedMatch(line);
    if (num) {
      const { q, next } = extendTitle(lines, i + 1, num[2].replace(/[#*`]/g, "").trim());
      i = next - 1;
      if (numbered.length >= 2 && titleMatches(numbered[0], q)) break;
      if (q.length >= 4 && looksLikeQuestion(q)) {
        numbered.push(q);
        numberedSinceAnswer += 1;
      }
      continue;
    }

    const bullet = bulletMatch(line);
    if (bullet) {
      const { q, next } = extendTitle(lines, i + 1, bullet[1].replace(/[#*`]/g, "").trim());
      i = next - 1;
      if (bullets.length >= 2 && titleMatches(bullets[0], q)) break;
      if (q.length >= 4 && looksLikeQuestion(q)) {
        bullets.push(q);
        bulletsSinceAnswer += 1;
      }
    }
  }

  let titles = numbered.length >= 5 || numbered.length >= bullets.length ? numbered : bullets;
  if (titles.length < 5) {
    const plain = collectPlainQuestions(lines);
    if (plain.length > titles.length) titles = plain;
  }
  return [...new Map(titles.map((t) => [compact(t), t])).values()];
}

function findMatchingToc(titles, text, used) {
  for (let i = 0; i < titles.length; i++) {
    if (used.has(i)) continue;
    if (titleMatches(titles[i], text)) return i;
  }
  if (text.length > 48 || isAnswerStyleTitle(text)) return -1;
  const unique = new Set();
  for (const word of [...text.matchAll(/[A-Za-z][A-Za-z0-9]{3,}/g)].map((m) => m[0].toLowerCase())) {
    const hits = titles.flatMap((title, i) => (!used.has(i) && compact(title).includes(word) ? [i] : []));
    if (hits.length === 1) unique.add(hits[0]);
  }
  return unique.size === 1 ? [...unique][0] : -1;
}

function findBodyStartLine(lines, titles) {
  let questions = 0;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (isAnswerBoundary(line)) return i;
    if (isAnswerPoint(line) && questions >= 5) return i;
    if (isQuestionStartLine(line)) {
      const text = stripQuestionMarks(line);
      if (text && looksLikeQuestion(text)) questions += 1;
    }
  }
  if (!titles[0]) return 0;
  let seen = 0;
  inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !isQuestionStartLine(line)) continue;
    const text = stripQuestionMarks(line);
    if (text && titleMatches(titles[0], text)) {
      seen += 1;
      if (seen >= 2) return i;
    }
  }
  return 0;
}

function mapOutsideFences(markdown, fn) {
  return markdown
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) => (index % 2 === 1 ? part : fn(part)))
    .join("");
}

function tidyAnswer(markdown) {
  return mapOutsideFences(markdown, (part) =>
    part
      .replace(/^#{1,6}\s+/gm, (m) => `${"#".repeat(Math.min(m.trim().length + 1, 6))} `)
      .replace(/!\[.*?\]\([^)]+\)/g, "")
      .replace(/^\\?[-*•·●]\s+/gm, "- ")
      .replace(/^(难度|考点)[：:].*$/gm, "")
      .replace(/^#{0,6}\s*答案要点[：:]?\s*$/gm, "")
      .replace(/^代码块\s*$/gm, ""),
  )
    .replace(/```(\w*)\n代码块\n/g, "```$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitBodyByToc(markdown, titles) {
  const lines = markdown.split("\n");
  const startLine = findBodyStartLine(lines, titles);
  const items = [];
  const used = new Set();
  let current = null;
  let inFence = false;

  const flush = () => {
    if (!current) return;
    const answer = tidyAnswer(current.lines.join("\n"));
    if (answer.replace(/\s+/g, "").length >= 20) {
      items.push({ question: current.question, answer });
    }
    current = null;
  };

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      if (current) current.lines.push(line);
      continue;
    }
    if (inFence) {
      if (current) current.lines.push(line);
      continue;
    }

    if (isQuestionStartLine(trimmed)) {
      const text = stripQuestionMarks(trimmed);
      const num = numberedMatch(trimmed);
      let idx = -1;
      if (text && looksLikeQuestion(text) && !isAnswerStyleTitle(text)) {
        idx = findMatchingToc(titles, text, used);
      }
      if (idx < 0 && num && looksLikeQuestion(text) && !isAnswerStyleTitle(text)) {
        const next = nextUnusedIndex(used, titles.length);
        const prefixOk = next >= 0 && [...used].every((i) => i < next);
        if (prefixOk && Number(num[1]) === next + 1) idx = next;
      }
      if (idx >= 0) {
        flush();
        used.add(idx);
        current = { question: titles[idx], lines: [] };
        continue;
      }
    }
    if (current) current.lines.push(line);
  }
  flush();
  return items;
}

function splitInterleaved(markdown) {
  const lines = markdown.split("\n");
  const items = [];
  let current = null;
  let inFence = false;

  const flush = () => {
    if (!current) return;
    const answer = tidyAnswer(current.lines.join("\n"));
    if (answer.replace(/\s+/g, "").length >= 20) {
      items.push({ question: current.question, answer });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      if (current) current.lines.push(line);
      continue;
    }
    if (inFence) {
      if (current) current.lines.push(line);
      continue;
    }
    if (numberedMatch(trimmed)) {
      const text = stripQuestionMarks(trimmed);
      if (text && looksLikeQuestion(text) && !isAnswerStyleTitle(text) && !isAnswerPoint(trimmed)) {
        flush();
        current = { question: text, lines: [] };
        continue;
      }
    }
    if (current) current.lines.push(line);
  }
  flush();
  return items;
}

function splitByAnswerPoints(markdown, titles) {
  if (titles.length < 2) return [];
  const lines = markdown.split("\n");
  const start = findBodyStartLine(lines, titles);
  const blocks = [];
  let current = [];
  let started = false;
  let inFence = false;
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      if (started) current.push(lines[i]);
      continue;
    }
    if (inFence) {
      if (started) current.push(lines[i]);
      continue;
    }
    if (isAnswerPoint(trimmed) || isAnswerBoundary(trimmed)) {
      if (started) blocks.push(current);
      current = [];
      started = true;
      continue;
    }
    if (started) current.push(lines[i]);
  }
  if (started) blocks.push(current);

  if (blocks.length < 5) return [];
  if (blocks.length < titles.length * 0.45) return [];
  const count = Math.min(titles.length, blocks.length);
  const items = [];
  for (let i = 0; i < count; i++) {
    const answer = tidyAnswer(blocks[i].join("\n"));
    if (answer.replace(/\s+/g, "").length < 20) continue;
    items.push({ question: titles[i], answer });
  }
  return items;
}

function scoreItems(items) {
  if (items.length < 5) return 0;
  const avg =
    items.reduce((sum, item) => sum + item.answer.replace(/\s+/g, "").length, 0) / items.length;
  const weak = items.filter((item) => {
    const q = item.question;
    return q.length < 20 && !/[？?]/.test(q) && !/^(请|简述|谈谈|如何|什么|手写|介绍|解释)/.test(q);
  }).length;
  const thinAnswers = items.filter((item) => {
    const compactAnswer = item.answer.replace(/\s+/g, "");
    const first = item.answer.replace(/\s+/g, " ").trim().slice(0, 80);
    return compactAnswer.length < 120 && looksLikeQuestion(first);
  }).length;
  let score = items.length * Math.min(avg, 500);
  if (weak / items.length > 0.12) score *= 0.35;
  if (thinAnswers / items.length > 0.4) score *= 0.2;
  return score;
}

function extractItems(markdown) {
  const text = markdown
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
  if ((text.match(/[\u4e00-\u9fff]/g) || []).length < 80) {
    return { items: [], reason: "中文过少，可能解析失败" };
  }
  const titles = collectToc(text);
  const interleaved = splitInterleaved(text);
  const byToc = titles.length >= 2 && titles.length <= 80 ? splitBodyByToc(text, titles) : [];
  const byPoints = titles.length >= 2 && titles.length <= 80 ? splitByAnswerPoints(text, titles) : [];
  const candidates = [interleaved, byToc, byPoints];
  let items = candidates.reduce((best, cur) => (scoreItems(cur) > scoreItems(best) ? cur : best), []);
  if (
    titles.length >= 8 &&
    byToc.length >= titles.length * 0.8 &&
    byToc.length <= titles.length + 3 &&
    scoreItems(byToc) > 0 &&
    scoreItems(interleaved) <= scoreItems(byToc) * 1.25
  ) {
    items = scoreItems(byPoints) > scoreItems(byToc) * 1.15 ? byPoints : byToc;
  }
  if (items.length < 5 || scoreItems(items) < items.length * 50) {
    if (titles.length > 80) {
      return { items: [], reason: `目录切分不可靠（${titles.length} 条），整份不收录` };
    }
    if (titles.length < 2) return { items: [], reason: "识别不到题干目录" };
    return { items: [], reason: `题干对不上原文或缺少参考答案（识别 ${titles.length} 题）` };
  }
  const expected = titles.length >= 5 && titles.length <= 80 ? titles.length : items.length;
  return {
    items,
    reason:
      expected > items.length
        ? `目录 ${expected} 题，对齐 ${items.length} 题，其余原文无对应解答`
        : "",
  };
}

function yamlEscape(s) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function toMarkdown({ title, section, order, items, notes }) {
  const notesLine = notes ? `notes: ${yamlEscape(notes)}\n` : "";
  const body = items
    .map((item) => {
      const q = item.question.replace(/^#+\s*/, "");
      const a = item.answer.replace(/^### /gm, "#### ");
      return `### ${q}\n\n${a}\n`;
    })
    .join("\n");
  return `---
title: ${yamlEscape(title)}
category: bigtech
topic: packs
section: ${yamlEscape(section)}
difficulty: medium
order: ${order}
kind: qa-pack
tags: ["大厂面试题", ${yamlEscape(section)}]
sources: []
createdAt: "2026-09-14"
${notesLine}---

${body}
`;
}

function listSourcePdfs(pilot) {
  const names = readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".pdf") && !SKIP_NAMES.has(f))
    .sort((a, b) => a.localeCompare(b, "zh-Hans"));
  if (!pilot) return names;
  return PILOT_NAMES.filter((name) => names.includes(name));
}

loadEnv();
const pilot = process.argv.includes("--pilot");
const files = listSourcePdfs(pilot);
mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

await parseWithMinerU(files);

if (pilot) {
  for (const file of files) removePackFiles(file.replace(/\.pdf$/i, ""));
} else {
  for (const name of readdirSync(OUT_DIR)) {
    if (name.endsWith(".md")) rmSync(path.join(OUT_DIR, name));
  }
}

const usedSlugs = new Set(
  readdirSync(OUT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, "")),
);
const report = [];
let order = usedSlugs.size + 1;

for (const file of files) {
  const title = file.replace(/\.pdf$/i, "");
  const md = cachedMarkdown(dataIdOf(file));
  if (!md) {
    report.push({ file, status: "skip", reason: "MinerU 无 full.md", count: 0 });
    continue;
  }
  const { items, reason } = extractItems(md);
  if (items.length < 5) {
    report.push({ file, status: "skip", reason: reason || "题目不足", count: 0 });
    continue;
  }
  const slug = slugify(title, usedSlugs);
  writeFileSync(
    path.join(OUT_DIR, `${slug}.md`),
    toMarkdown({
      title,
      section: yearOf(title),
      order,
      items,
      notes: reason || undefined,
    }),
  );
  order += 1;
  report.push({ file, status: "ok", reason: reason || "", count: items.length, slug });
}

const ok = report.filter((r) => r.status === "ok");
const skip = report.filter((r) => r.status === "skip");
console.log(
  `\nok ${ok.length} 份 / skip ${skip.length} 份 / questions ${ok.reduce((s, r) => s + r.count, 0)}`,
);
for (const r of ok) {
  console.log(`  ${String(r.count).padStart(3)}  ${r.file}${r.reason ? `  (${r.reason})` : ""}`);
}
if (skip.length) {
  console.log("\n未收录:");
  for (const r of skip) console.log(`  - ${r.file}  ${r.reason}`);
}
writeFileSync(
  path.join(process.cwd(), "scripts/extract-bigtech-report.json"),
  JSON.stringify(report, null, 2),
);
