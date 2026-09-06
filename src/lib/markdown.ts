import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import type { Root as HastRoot, Element } from "hast";
import type { Root as MdastRoot, Heading } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { TocItem } from "@/lib/questions/types";

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
  plainText: string;
  summary: string;
}

/** 给表格套一层可横向滚动的容器，避免在手机上撑破布局 */
function rehypeWrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrapper"] },
        children: [node],
      };
      parent.children[index] = wrapper;
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: "wrap",
    properties: { className: ["heading-anchor"] },
  })
  .use(rehypeWrapTables)
  .use(rehypeShiki, {
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    fallbackLanguage: "text",
  })
  .use(rehypeStringify);

function extractToc(tree: MdastRoot): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  visit(tree, "heading", (node: Heading) => {
    const text = mdastToString(node).trim();
    // rehype-slug 也用 github-slugger，对每个标题依次 slug 化，这里保持同样的顺序以得到一致的 id
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      toc.push({ id, text, depth: node.depth });
    }
  });
  return toc;
}

function extractSummary(tree: MdastRoot, maxLength = 120): string {
  for (const node of tree.children) {
    if (node.type === "paragraph") {
      const text = mdastToString(node).replace(/\s+/g, " ").trim();
      if (text) {
        return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
      }
    }
  }
  return "";
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const mdast = processor.parse(markdown) as MdastRoot;
  const toc = extractToc(mdast);
  const summary = extractSummary(mdast);
  const plainText = mdastToString(mdast).replace(/\s+/g, " ").trim();
  const hast = await processor.run(mdast);
  const html = processor.stringify(hast as HastRoot);
  return { html: String(html), toc, plainText, summary };
}

/** 按中文阅读速度估算（约 400 字/分钟） */
export function estimateReadingMinutes(plainText: string): number {
  return Math.max(1, Math.round(plainText.length / 400));
}
