import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/data/auth";
import { getPrefs } from "@/lib/prefs/server";
import { Logo } from "./Logo";
import { PrefToggles } from "./PrefToggles";

const link = "rounded-full px-2.5 py-2 text-sm font-bold text-muted hover:bg-surface-2 hover:text-fg sm:px-3";

export async function Header() {
  const [{ t }, user] = await Promise.all([getPrefs(), getCurrentUser()]);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur sm:px-4">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        {t("nav.skipToFeed")}
      </a>
      <Link href="/" aria-label="Loopapp" className="rounded-xl">
        <Logo size={34} />
      </Link>
      <nav className="flex items-center gap-1" aria-label="Principal">
        <Link href="/" className={`${link} hidden sm:inline-flex`}>{t("nav.feed")}</Link>
        <Link href="/guardados" className={link}>{t("nav.saved")}</Link>
        {user?.isAdmin && <Link href="/admin" className={link}>{t("nav.admin")}</Link>}
        <PrefToggles />
        {user ? (
          <form action={signOut}>
            <button type="submit" className={link} title={user.email ?? undefined}>
              {t("nav.logout")}
            </button>
          </form>
        ) : (
          <Link href="/ingresar" className="ml-1 inline-flex h-10 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-extrabold text-on-accent">
            {t("nav.login")}
          </Link>
        )}
      </nav>
    </header>
  );
}
