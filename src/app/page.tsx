"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/lib/i18n";
import { parseWorkspaceFile } from "@/lib/workspace";
import { useResumeStore } from "@/store/useResumeStore";

export default function Home() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const replaceWorkspace = useResumeStore((state) => state.replaceWorkspace);
  const loadDemoWorkspace = useResumeStore((state) => state.loadDemoWorkspace);
  const loadBlankWorkspace = useResumeStore((state) => state.loadBlankWorkspace);

  const openLibrary = () => router.push("/library");
  const importWorkspace = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const workspace = parseWorkspaceFile(JSON.parse(await file.text()));
      if (!window.confirm(t.workspaceImportConfirm)) return;
      replaceWorkspace(workspace.data);
      openLibrary();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(`${t.workspaceImportFailed}：${message}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <main className="welcomePage">
      <div className="welcomeLanguage">
        <LanguageToggle />
      </div>
      <section className="welcomeWorkspace">
        <header className="welcomeIntro">
          <div className="brandMark welcomeMark">RC</div>
          <div>
            <span className="eyebrow">{t.welcomeKicker}</span>
            <h1>{t.welcomeTitle}</h1>
            <p>{t.welcomeBody}</p>
          </div>
        </header>
        <div className="welcomeConcept">
          <span>{t.welcomeFeatureLibrary}</span>
          <span>{t.welcomeFeatureVersions}</span>
          <span>{t.welcomeFeaturePreview}</span>
        </div>
        <div className="workspaceChooser">
          <div className="workspaceChooserHeader">
            <h2>{t.welcomeChooseTitle}</h2>
            <p>{t.welcomeChooseHint}</p>
          </div>
          <div className="workspaceChoiceGrid">
            <button type="button" className="workspaceChoice primaryChoice" onClick={openLibrary}>
              <strong>{t.continueWorkspace}</strong>
              <span>{t.continueWorkspaceHint}</span>
            </button>
            <button type="button" className="workspaceChoice" onClick={() => {
              if (!window.confirm(t.workspaceResetDemoConfirm)) return;
              loadDemoWorkspace(locale);
              openLibrary();
            }}>
              <strong>{t.loadDemoWorkspace}</strong>
              <span>{t.demoWorkspaceHint}</span>
            </button>
            <button type="button" className="workspaceChoice" onClick={() => {
              if (!window.confirm(t.workspaceResetBlankConfirm)) return;
              loadBlankWorkspace();
              openLibrary();
            }}>
              <strong>{t.createBlankWorkspace}</strong>
              <span>{t.blankWorkspaceHint}</span>
            </button>
            <button type="button" className="workspaceChoice" onClick={() => inputRef.current?.click()}>
              <strong>{t.importWorkspace}</strong>
              <span>{t.importWorkspaceHint}</span>
            </button>
          </div>
          {error ? <p className="welcomeWorkspaceError" role="alert">{error}</p> : null}
        </div>
        <input
          ref={inputRef}
          className="workspaceFileInput"
          type="file"
          accept=".json,application/json"
          onChange={(event) => void importWorkspace(event.target.files?.[0])}
        />
      </section>
    </main>
  );
}
