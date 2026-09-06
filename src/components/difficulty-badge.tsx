import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/questions/types";
import { cn } from "@/lib/utils";

const styles: Record<Difficulty, string> = {
  easy: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hard: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(styles[difficulty], className)}>
      {DIFFICULTY_LABEL[difficulty]}
    </Badge>
  );
}
