import Link from "next/link";
import { getPrefs } from "@/lib/prefs/server";

export default async function NotFound() {
  const { t } = await getPrefs();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold">{t("notFound.title")}</h1>
      <Link href="/" className="rounded-full bg-accent px-5 py-3 font-extrabold text-on-accent">
        {t("app.backToFeed")}
      </Link>
    </div>
  );
}
