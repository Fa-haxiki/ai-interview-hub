"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CategoryWithCount } from "@/lib/questions";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MobileNav({ categories }: { categories: CategoryWithCount[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 点击抽屉内任意链接后关闭抽屉
  const closeOnLinkClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="-ml-2 size-10 md:hidden"
          aria-label="打开导航菜单"
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-xs gap-0 overflow-y-auto pb-safe"
        onClick={closeOnLinkClick}
      >
        <SheetHeader className="border-b">
          <SheetTitle asChild>
            <Link href="/" className="text-base font-semibold">
              {siteConfig.name}
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">站点分类与主题导航</SheetDescription>
        </SheetHeader>

        <nav aria-label="移动端导航" className="flex flex-col gap-5 p-4">
          {categories.map((category) => {
            const categoryActive = pathname.startsWith(category.url);
            return (
              <div key={category.id}>
                <Link
                  href={category.url}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-md px-2 text-[15px] font-semibold",
                    categoryActive ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  <span>{category.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {category.count} 题
                  </span>
                </Link>
                <ul className="mt-1 flex flex-col">
                  {category.topics.map((topic) => {
                    const active = pathname.startsWith(topic.url);
                    return (
                      <li key={topic.id}>
                        <Link
                          href={topic.url}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center justify-between rounded-md px-2 pl-4 text-sm",
                            active
                              ? "bg-muted font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <span className="truncate">{topic.name}</span>
                          <span className="ml-3 shrink-0 text-xs">
                            {topic.count > 0 ? topic.count : "筹备中"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
