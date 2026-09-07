import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Composer",
  description: "Local-first resume content library and composer"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><I18nProvider>{children}</I18nProvider></body></html>;
}
