import Link from "next/link";
import { SkyHillsBackground } from "./SkyHillsBackground";
import { OliveLogo } from "./OliveLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SkyHillsBackground />
      <header className="relative z-10 px-6 pt-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-olive-deep"
          >
            <OliveLogo className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight">
              Olive Quiz Studio
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium text-olive-deep/70">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 hover:bg-white/60"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10 flex-1 px-6 pb-16 pt-6">{children}</main>
    </div>
  );
}
