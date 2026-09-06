import { getCategoryName, getTopicName, questions } from "@/lib/questions";
import type { SearchDoc } from "@/lib/search/types";

export const dynamic = "force-static";

const BODY_MAX_LENGTH = 3000;

export async function GET() {
  const all = await questions.listAllFull();
  const docs: SearchDoc[] = all.map((q) => ({
    url: q.url,
    title: q.title,
    category: q.category,
    categoryName: getCategoryName(q.category),
    topic: q.topic,
    topicName: getTopicName(q.category, q.topic),
    section: q.section,
    difficulty: q.difficulty,
    tags: q.tags,
    summary: q.summary,
    headings: q.toc.map((t) => t.text),
    body: q.plainText.slice(0, BODY_MAX_LENGTH),
  }));
  return Response.json(docs);
}
