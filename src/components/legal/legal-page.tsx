import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Shield } from "lucide-react";

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/data-deletion", label: "Data Deletion" },
];

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-300 font-sans selection:bg-purple-500/30 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white hover:text-pink-400 transition-colors"
            href="/"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 p-[1.5px]">
              <div className="w-full h-full bg-[#0d121f] rounded-[6px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            IgHouse
          </Link>
          <div className="flex items-center gap-4">
            <nav aria-label="Legal pages" className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  className="text-xs sm:text-sm font-medium text-slate-400 transition hover:text-white"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 border-b border-white/10 pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-pink-400">
            IgHouse Trust &amp; Compliance Hub
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            {description}
          </p>
          <p className="mt-3 text-xs text-slate-500 font-medium">Last updated: October 2026</p>
        </div>

        <article className="space-y-9 text-[15px] leading-7 text-slate-300 [&_a]:font-medium [&_a]:text-pink-400 [&_a]:underline [&_a]:decoration-pink-500/30 [&_a]:underline-offset-4 [&_a:hover]:text-pink-300 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-slate-100 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </article>

        <footer className="mt-14 border-t border-white/10 pt-6 text-xs leading-6 text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Questions about these policies? Contact{" "}
            <a className="font-medium text-pink-400 underline underline-offset-4 hover:text-pink-300" href="mailto:info@ighouse.com">
              info@ighouse.com
            </a>
          </span>
          <span className="text-slate-600">&copy; {new Date().getFullYear()} IgHouse Inc.</span>
        </footer>
      </main>
    </div>
  );
}
