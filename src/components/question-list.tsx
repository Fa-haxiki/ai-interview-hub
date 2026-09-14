import Link from "next/link";

import { CheckinCount } from "@/components/checkin-count";
import { DifficultyBadge } from "@/components/difficulty-badge";
import type { QuestionMeta } from "@/lib/questions";

export function QuestionRow({
  question,
  showTopic,
  topicName,
}: {
  question: QuestionMeta;
  showTopic?: boolean;
  topicName?: string;
}) {
  return (
    <li>
      <Link
        href={question.url}
        className="group -mx-2 flex flex-col gap-1.5 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 sm:-mx-3 sm:px-3"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-medium leading-snug text-foreground group-hover:text-brand sm:text-base">
            {question.title}
            {question.kind !== "qa-pack" && <CheckinCount checkinKey={question.url} />}
          </h3>
          <DifficultyBadge difficulty={question.difficulty} className="mt-0.5 shrink-0" />
        </div>
        {question.summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {question.summary}
          </p>
        )}
        {(question.tags.length > 0 || showTopic) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {showTopic && topicName && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-foreground/80">{topicName}</span>
            )}
            {question.tags.slice(0, 4).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}

export function QuestionList({ questions }: { questions: QuestionMeta[] }) {
  return (
    <ul className="flex flex-col divide-y">
      {questions.map((q) => (
        <QuestionRow key={q.url} question={q} />
      ))}
    </ul>
  );
}
