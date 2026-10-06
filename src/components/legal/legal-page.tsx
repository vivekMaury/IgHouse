import Link from "next/link";
import type { ReactNode } from "react";

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms-of-service", label: "Terms" },
  { href: "/data-deletion", label: "Data deletion" },
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            className="text-xl font-bold tracking-tight text-slate-950"
            href="/"
          >
            IgHouse
          </Link>
          <nav aria-label="Legal pages" className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 border-b border-slate-200 pb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">
            IgHouse legal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>
          <p className="mt-4 text-sm text-slate-500">Last updated: October 7, 2026</p>
        </div>

        <article className="space-y-9 text-[15px] leading-7 text-slate-700 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:decoration-blue-200 [&_a]:underline-offset-4 [&_a:hover]:text-blue-900 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-slate-900 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </article>

        <footer className="mt-14 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
          Questions about these pages? Contact{" "}
          <a className="font-medium text-blue-700 underline underline-offset-4" href="mailto:info@ighouse.app">
            info@ighouse.app
          </a>
          .
        </footer>
      </main>
    </div>
  );
}
