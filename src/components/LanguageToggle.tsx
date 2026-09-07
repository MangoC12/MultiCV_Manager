"use client";

import { useEffect } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import { useResumeStore } from "@/store/useResumeStore";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const localizeDemoWorkspace = useResumeStore((state) => state.localizeDemoWorkspace);

  useEffect(() => {
    localizeDemoWorkspace(locale);
  }, [locale, localizeDemoWorkspace]);

  const switchLocale = (nextLocale: Locale) => {
    if (locale !== nextLocale) {
      localizeDemoWorkspace(nextLocale);
      setLocale(nextLocale);
    }
  };

  return (
    <div className="languageToggle" aria-label="Language">
      <button className={locale === "zh" ? "active" : ""} onClick={() => switchLocale("zh")}>
        中文
      </button>
      <button className={locale === "en" ? "active" : ""} onClick={() => switchLocale("en")}>
        English
      </button>
    </div>
  );
}
