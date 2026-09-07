"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { createWorkspaceFile, parseWorkspaceFile, workspaceDownloadName } from "@/lib/workspace";
import { useResumeStore } from "@/store/useResumeStore";
import type { WorkspaceData } from "@/types/workspace";

const currentWorkspaceData = (): WorkspaceData => {
  const state = useResumeStore.getState();
  return {
    demoLocale: state.demoLocale,
    demoRevision: state.demoRevision,
    profile: state.profile,
    experiences: state.experiences,
    importSessions: state.importSessions,
    importDrafts: state.importDrafts,
    resume: state.resume,
    resumeTemplateId: state.resumeTemplateId,
    resumeStyle: state.resumeStyle,
    savedResumeConfigurations: state.savedResumeConfigurations,
    activeSavedResumeConfigurationId: state.activeSavedResumeConfigurationId
  };
};

export function WorkspaceMenu() {
  const { locale, t } = useI18n();
  const replaceWorkspace = useResumeStore((state) => state.replaceWorkspace);
  const loadDemoWorkspace = useResumeStore((state) => state.loadDemoWorkspace);
  const loadBlankWorkspace = useResumeStore((state) => state.loadBlankWorkspace);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const exportWorkspace = () => {
    const data = currentWorkspaceData();
    const file = createWorkspaceFile(data);
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = workspaceDownloadName(data.resume.name);
    anchor.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const importWorkspace = async (file?: File) => {
    if (!file) return;
    try {
      const workspace = parseWorkspaceFile(JSON.parse(await file.text()));
      if (!window.confirm(t.workspaceImportConfirm)) return;
      replaceWorkspace(workspace.data);
      setOpen(false);
      window.alert(t.workspaceImportSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`${t.workspaceImportFailed}：${message}`);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="workspaceMenu" ref={rootRef}>
      <button
        className={`workspaceMenuButton ${open ? "active" : ""}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {t.workspace}
      </button>
      {open ? (
        <div className="workspaceMenuPopover" role="menu">
          <strong>{t.workspace}</strong>
          <p>{t.workspaceHint}</p>
          <button type="button" role="menuitem" onClick={exportWorkspace}>{t.exportWorkspace}</button>
          <button type="button" role="menuitem" onClick={() => inputRef.current?.click()}>{t.importWorkspace}</button>
          <div className="workspaceMenuDivider" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              if (!window.confirm(t.workspaceResetDemoConfirm)) return;
              loadDemoWorkspace(locale);
              setOpen(false);
            }}
          >
            {t.loadDemoWorkspace}
          </button>
          <button
            className="workspaceDangerAction"
            type="button"
            role="menuitem"
            onClick={() => {
              if (!window.confirm(t.workspaceResetBlankConfirm)) return;
              loadBlankWorkspace();
              setOpen(false);
            }}
          >
            {t.createBlankWorkspace}
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        className="workspaceFileInput"
        type="file"
        accept=".json,application/json"
        onChange={(event) => void importWorkspace(event.target.files?.[0])}
      />
    </div>
  );
}
