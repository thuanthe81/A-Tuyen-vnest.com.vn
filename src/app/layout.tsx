import type { Metadata } from "next";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { bodyFont } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: env.siteUrl,
  title: { default: site.name, template: `%s | ${site.name}` },
  // Mock-backed builds and previews stay out of search engines.
  // This is not access protection: anyone with the URL can still open the site.
  robots: env.indexable ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.defaultLocale} className={bodyFont.variable}>
      <body>{children}</body>
    </html>
  );
}
