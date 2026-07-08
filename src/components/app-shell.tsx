import Link from "next/link";
import { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  links: Array<{ href: string; label: string }>;
  children: ReactNode;
  logoUrl?: string | null;
};

export function AppShell({ title, subtitle, links, children, logoUrl }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Kundenlogo" className="h-10 w-auto rounded" />
            ) : (
              <div className="h-10 w-10 rounded bg-brand-orange text-white flex items-center justify-center font-semibold">R</div>
            )}
            <div>
              <h1 className="text-2xl leading-tight">{title}</h1>
              {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="border border-border bg-white rounded-lg px-3 py-2 text-sm">
              Logout
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <nav className="flex gap-4 mb-6 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="underline-offset-2 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
      <footer className="border-t border-border text-center text-xs text-muted p-4">Powered by RAIS</footer>
    </div>
  );
}
