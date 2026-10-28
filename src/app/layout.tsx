import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { PrefsProvider } from "@/components/PrefsProvider";
import { Toaster } from "@/components/Toaster";
import { getPrefs } from "@/lib/prefs/server";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin"], weight: ["700", "800"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPrefs();
  return {
    title: { default: `Loopapp — ${t("brand.tagline")}`, template: "%s · Loopapp" },
    description: t("brand.tagline"),
    applicationName: "Loopapp",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0d16" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang, theme } = await getPrefs();
  return (
    <html lang={lang} data-theme={theme} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <PrefsProvider lang={lang} theme={theme}>
          <Header />
          <main id="main">{children}</main>
          <Toaster />
        </PrefsProvider>
      </body>
    </html>
  );
}
