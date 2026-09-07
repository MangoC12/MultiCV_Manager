"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { GlobalFormatToolbar } from "@/components/GlobalFormatToolbar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { WorkspaceMenu } from "@/components/WorkspaceMenu";
import { useI18n } from "@/lib/i18n";
import { useResumeStore } from "@/store/useResumeStore";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);
  const isLibrary = pathname.startsWith("/library") || pathname === "/";
  const isBuilder = pathname.startsWith("/builder");

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [redo, undo]);

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="brandMark">RC</div>
        <div className="brandText">
          <strong>Resume Composer</strong>
          <span>{t.tagline}</span>
        </div>
        <nav>
          <Link className={isLibrary ? "active" : ""} href="/library">{t.navLibrary}</Link>
          <Link className={isBuilder ? "active" : ""} href="/builder">{t.navBuilder}</Link>
        </nav>
        {isBuilder ? <GlobalFormatToolbar /> : <div className="topbarSpacer" />}
        <WorkspaceMenu />
        <button className="undoButton" type="button" onClick={undo} title={t.undoShortcut} aria-label={t.undoShortcut}>
          <span aria-hidden="true">↶</span>
          {t.undo}
        </button>
        <button className="undoButton" type="button" onClick={redo} title={t.redoShortcut} aria-label={t.redoShortcut}>
          <span aria-hidden="true">↷</span>
          {t.redo}
        </button>
        <LanguageToggle />
        <div className="saveState">{t.saved}</div>
      </header>
      {children}
    </div>
  );
}
