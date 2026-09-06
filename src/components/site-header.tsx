import { BookOpenTextIcon } from "lucide-react";
import Link from "next/link";

import { GitHubIcon } from "@/components/icons";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { SiteSearch } from "@/components/search/site-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCategoriesWithCounts } from "@/lib/questions";
import { siteConfig } from "@/lib/site";

export async function SiteHeader() {
  const categories = await getCategoriesWithCounts();
  const navItems = categories.map((c) => ({
    href: c.url,
    label: c.name,
    count: c.count,
  }));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 pt-safe backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:gap-4">
        <MobileNav categories={categories} />

        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <BookOpenTextIcon className="size-5 text-brand" />
          <span>{siteConfig.name}</span>
        </Link>

        <MainNav items={navItems} />

        <div className="ml-auto flex items-center gap-1">
          <SiteSearch />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-lg"
            className="hidden size-9 sm:inline-flex"
            asChild
          >
            <a
              href={siteConfig.repo}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub 仓库"
            >
              <GitHubIcon className="size-[18px]" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
