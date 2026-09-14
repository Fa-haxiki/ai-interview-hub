import type { Code, Html, Root, Table } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";
import * as estree from "prettier/plugins/estree";
import * as htmlPlugin from "prettier/plugins/html";
import * as postcss from "prettier/plugins/postcss";
import * as typescript from "prettier/plugins/typescript";

const PRETTIER_PLUGINS = [estree, babel, typescript, htmlPlugin, postcss];

const JS_START =
  /^\s*(?:(?:export|import|async|function|const|let|var|class|interface|type|enum|if|for|while|switch|return)\b|\/\*|\/\/)/m;

export function remarkFormatCode() {
  return async (tree: Root) => {
    mergeCodeLeftovers(tree);
    const blocks: Code[] = [];
    walk(tree, (node) => {
      if (isCode(node)) blocks.push(node);
    });
    await Promise.all(
      blocks.map(async (node) => {
        node.value = await formatCodeValue(node.value, node.lang);
      }),
    );
  };
}

export async function formatCodeValue(source: string, lang?: string | null) {
  const stripped = stripLineNumbers(source);
  const unglued = unglueStatements(stripped);
  const balanced = balanceBraces(unglued, lang);
  const parser = parserFor(lang, balanced);
  if (parser) {
    try {
      return (
        await prettier.format(balanced, {
          parser,
          plugins: PRETTIER_PLUGINS,
          semi: true,
          singleQuote: false,
          trailingComma: "none",
          tabWidth: 2,
          printWidth: 88,
        })
      ).replace(/\n$/, "");
    } catch {
      // PDF 抽出来的片段经常缺括号，退回按花括号缩进
    }
  }
  return indentByBraces(balanced);
}

function mergeCodeLeftovers(tree: Root) {
  walkParent(tree, (parent) => {
    for (let i = 0; i < parent.length; i++) {
      const node = parent[i];
      if (node.type !== "code") continue;
      while (i + 1 < parent.length) {
        const extra = leftoverSource(parent[i + 1]);
        if (extra == null) break;
        node.value = `${node.value.replace(/\s*$/, "")}\n${extra}`;
        parent.splice(i + 1, 1);
      }
    }
  });
}

function leftoverSource(node: Root["children"][number]): string | null {
  if (node.type === "code") {
    return isNumberedOrCloserLeftover(node.value) ? stripLineNumbers(node.value).trim() : null;
  }
  if (node.type === "html") return htmlTableToLeftover(node);
  if (node.type === "table") return gfmTableToLeftover(node);
  return null;
}

function isNumberedOrCloserLeftover(value: string) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0 || lines.length > 12) return false;
  const numbered =
    lines.filter((line) => /^\d+[ \t]/.test(line) || /^\d+$/.test(line)).length >= lines.length * 0.6;
  if (!numbered) return false;
  return lines
    .map((line) => line.replace(/^\d+[ \t]?/, "").trim())
    .every(
      (line) =>
        /^[})\];]+/.test(line) ||
        /^(return|break|continue)\b/.test(line) ||
        !/^(function|const|let|var|class|import|export)\b/.test(line),
    );
}

function stripLineNumbers(code: string) {
  const lines = code.split("\n");
  const nonempty = lines.filter((line) => line.trim());
  if (nonempty.length === 0) return code;
  const numbered = nonempty.filter((line) => /^\d+[ \t]/.test(line) || /^\d+$/.test(line.trim()));
  if (numbered.length < nonempty.length * 0.6) return code;
  return lines.map((line) => line.replace(/^\d+[ \t]?/, "")).join("\n");
}

function unglueStatements(code: string) {
  return code
    .replace(/\*\/(?=\s*(?:function|const|let|var|class|export|import)\b)/g, "*/\n")
    .replace(/\}(?=\s*(?:function|const|let|var|class|export|import|return)\b)/g, "}\n")
    .replace(/;(?=\s*(?:function|const|let|var|class|export|import|return|if|for|while)\b)/g, ";\n")
    .replace(/(\/\/[^\n]*?)(?=\/\/)/g, "$1\n")
    .replace(/(\/\/[^\n]*?)(?=\b(?:function|const|let|var|class|return|if|for|while)\b)/g, "$1\n");
}

function balanceBraces(code: string, lang?: string | null) {
  if (!parserFor(lang, code) && !looksLikeJs(code)) return code;
  const opens = (code.match(/{/g) ?? []).length;
  const closes = (code.match(/}/g) ?? []).length;
  if (opens <= closes) return code;
  return `${code.replace(/\s*$/, "")}\n${"}".repeat(opens - closes)}`;
}

function indentByBraces(code: string) {
  let depth = 0;
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    const leadingCloses = /^}+/.exec(line)?.[0].length ?? 0;
    const indent = Math.max(0, depth - leadingCloses);
    out.push(`${"  ".repeat(indent)}${line}`);
    depth = Math.max(0, depth + (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length);
  }
  return out.join("\n");
}

function parserFor(lang: string | null | undefined, code: string) {
  const l = (lang ?? "").toLowerCase();
  if (l === "ts" || l === "typescript" || l === "tsx") return "typescript";
  if (l === "js" || l === "javascript" || l === "jsx") {
    return /<[A-Z]|:\s*[A-Za-z_$]/.test(code) ? "typescript" : "babel";
  }
  if (l === "json") return "json";
  if (l === "css" || l === "scss") return l;
  if (l === "less") return "css";
  if (l === "html") return "html";
  if (!l || l === "txt" || l === "text") {
    if (!looksLikeJs(code)) return null;
    return /(?:interface|type|enum)\s+\w+|:\s*[A-Za-z_$]/.test(code) ? "typescript" : "babel";
  }
  return null;
}

function looksLikeJs(code: string) {
  return JS_START.test(code) || /=>/.test(code);
}

function htmlTableToLeftover(node: Html) {
  if (!/<table[\s>]/i.test(node.value)) return null;
  const rows = [
    ...node.value.matchAll(
      /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi,
    ),
  ];
  if (rows.length === 0) return null;
  const lines: string[] = [];
  for (const row of rows) {
    const index = decodeEntities(row[1]).trim();
    if (!/^\d+$/.test(index)) return null;
    lines.push(decodeEntities(row[2]).trim());
  }
  return lines.join("\n");
}

function gfmTableToLeftover(node: Table) {
  if (node.children.length === 0) return null;
  const lines: string[] = [];
  for (const row of node.children) {
    if (row.children.length !== 2) return null;
    const index = mdastToString(row.children[0]).trim();
    if (!/^\d+$/.test(index)) return null;
    lines.push(mdastToString(row.children[1]).trim());
  }
  return lines.join("\n");
}

function decodeEntities(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"');
}

function isCode(node: { type: string }): node is Code {
  return node.type === "code";
}

function walk(
  node: { type: string; children?: Root["children"] },
  visit: (node: { type: string; children?: Root["children"] }) => void,
) {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child as { type: string; children?: Root["children"] }, visit);
  }
}

function walkParent(
  node: { type: string; children?: Root["children"] },
  visit: (children: Root["children"]) => void,
) {
  if (node.children) {
    visit(node.children);
    for (const child of node.children) {
      walkParent(child as { type: string; children?: Root["children"] }, visit);
    }
  }
}
