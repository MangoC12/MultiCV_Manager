"use client";

/* eslint-disable @next/next/no-img-element */

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { defaultPhotoSettings } from "@/lib/photoSettings";
import { useEditorUiStore } from "@/store/useEditorUiStore";
import { useResumeStore } from "@/store/useResumeStore";
import type { ProfileFieldKey, ResumeTemplateId } from "@/types/resume";

const formatChineseName = (name: string) => {
  const trimmed = name.trim();
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(trimmed)) return trimmed.split("").join("　");
  return trimmed || "Resume";
};

const templateOptions: { id: ResumeTemplateId; labelKey: "templateModern" | "templateChineseCompact" }[] = [
  { id: "modern", labelKey: "templateModern" },
  { id: "chinese-compact", labelKey: "templateChineseCompact" }
];

function SavedResumeMenu() {
  const { t } = useI18n();
  const configurations = useResumeStore((s) => s.savedResumeConfigurations);
  const activeId = useResumeStore((s) => s.activeSavedResumeConfigurationId);
  const loadConfiguration = useResumeStore((s) => s.loadResumeConfiguration);
  const deleteConfiguration = useResumeStore((s) => s.deleteResumeConfiguration);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeConfiguration = configurations.find((configuration) => configuration.id === activeId);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const removeConfiguration = (configurationId: string) => {
    if (!window.confirm(t.deleteSavedVersionConfirm)) return;
    deleteConfiguration(configurationId);
    if (configurations.length <= 1) setOpen(false);
  };

  return (
    <div className="savedResumeMenu" ref={rootRef}>
      <button
        className={`quickVersionButton ${open ? "active" : ""}`}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{activeConfiguration?.name ?? t.quickSelectVersion}</span>
        <span className="quickVersionChevron" aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="savedResumeDropdown" role="menu">
          {configurations.length === 0 ? (
            <div className="savedResumeEmpty">{t.noSavedVersions}</div>
          ) : configurations.map((configuration) => (
            <div
              className={`savedResumeOption ${configuration.id === activeId ? "active" : ""}`}
              key={configuration.id}
            >
              <button
                className="savedResumeLoadButton"
                type="button"
                role="menuitem"
                onClick={() => {
                  loadConfiguration(configuration.id);
                  setOpen(false);
                }}
              >
                {configuration.name}
              </button>
              <button
                className="savedResumeDeleteButton"
                type="button"
                aria-label={`${t.deleteSavedVersion}：${configuration.name}`}
                title={t.deleteSavedVersion}
                onClick={() => removeConfiguration(configuration.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ResumePreview() {
  const { t } = useI18n();
  const profile = useResumeStore((s) => s.profile);
  const resume = useResumeStore((s) => s.resume);
  const resumeStyle = useResumeStore((s) => s.resumeStyle);
  const experiences = useResumeStore((s) => s.experiences);
  const resumeTemplateId = useResumeStore((s) => s.resumeTemplateId);
  const setResumeTemplate = useResumeStore((s) => s.setResumeTemplate);
  const savedResumeConfigurations = useResumeStore((s) => s.savedResumeConfigurations);
  const saveResumeConfiguration = useResumeStore((s) => s.saveResumeConfiguration);
  const draftPhotoSettings = useEditorUiStore((s) => s.draftPhotoSettings);
  const savedPhotoSettings = profile.photoSettings ?? defaultPhotoSettings;
  const activePhotoSettings = draftPhotoSettings ?? savedPhotoSettings;
  const isFieldVisible = (field: ProfileFieldKey) => profile.fieldVisibility?.[field] !== false;
  const contact = [
    { field: "gender" as const, label: t.gender, value: profile.gender },
    { field: "birthDate" as const, label: t.birthDate, value: profile.birthDate },
    { field: "politicalStatus" as const, label: t.politicalStatus, value: profile.politicalStatus },
    { field: "phone" as const, label: t.phone, value: profile.phone },
    { field: "email" as const, label: t.email, value: profile.email },
    { field: "github" as const, label: t.github, value: profile.github ?? profile.website }
  ]
    .filter((item) => isFieldVisible(item.field) && item.value?.trim())
    .map((item) => item.value?.trim())
    .join(" | ");
  const showName = isFieldVisible("name") && profile.name.trim().length > 0;
  const photoHeightMm = Number((activePhotoSettings.widthMm * 1.4).toFixed(1));
  const exportPdf = () => {
    const originalTitle = document.title;
    document.title = (resume.name.trim() || "resume").replace(/[\\/:*?"<>|]/g, "_");
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle, { once: true });
    window.print();
    window.setTimeout(restoreTitle, 1000);
  };
  const saveNewVersion = () => {
    const name = resume.name.trim();
    if (!name) {
      window.alert(t.resumeNameRequired);
      return;
    }
    const exists = savedResumeConfigurations.some(
      (configuration) => configuration.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (exists && !window.confirm(t.overwriteSavedVersionConfirm)) return;
    saveResumeConfiguration(name, exists);
  };

  return (
    <aside className="previewPanel">
      <div className="previewToolbar">
        <div><span className="eyebrow">{t.livePreview}</span><strong>A4 · 100%</strong></div>
        <label className="templatePicker">
          <span>{t.templateLabel}</span>
          <select
            value={resumeTemplateId}
            onChange={(event) => setResumeTemplate(event.target.value as ResumeTemplateId)}
          >
            {templateOptions.map((option) => (
              <option key={option.id} value={option.id}>{t[option.labelKey]}</option>
            ))}
          </select>
        </label>
        <div className="previewToolbarActions">
          <SavedResumeMenu />
          <button className="saveResumeButton" type="button" onClick={saveNewVersion}>{t.saveNewVersion}</button>
          <button className="exportButton" type="button" onClick={exportPdf}>{t.exportPdf}</button>
        </div>
      </div>
      <div className="paperWrap">
        <article
          className={`paper ${resumeTemplateId === "chinese-compact" ? "paperChineseCompact" : ""}`}
          id="resume-paper"
          style={{
            fontFamily: resumeStyle.fontFamily,
            "--resume-font-scale": resumeStyle.fontSizeScale,
            "--resume-line-height": resumeStyle.lineHeight
          } as CSSProperties}
        >
          {resumeTemplateId === "chinese-compact" ? (
            <header className={`resumeHeader chineseHeader ${profile.photoDataUrl ? "withPhoto" : ""}`}>
              <div className="chineseHeaderText">
                {showName ? <h1>{formatChineseName(profile.name)}</h1> : null}
                {contact ? <div className="contactLine">{contact}</div> : null}
              </div>
              {profile.photoDataUrl ? (
                <img
                  className="resumePhoto"
                  src={profile.photoDataUrl}
                  alt={profile.name || t.photo}
                  style={{
                    right: `${activePhotoSettings.rightMm}mm`,
                    top: `${activePhotoSettings.topMm}mm`,
                    width: `${activePhotoSettings.widthMm}mm`,
                    height: `${photoHeightMm}mm`,
                    objectPosition: `${activePhotoSettings.objectX}% ${activePhotoSettings.objectY}%`
                  }}
                />
              ) : null}
            </header>
          ) : (
            <header className="resumeHeader">
              {showName ? <h1>{profile.name}</h1> : null}
              {profile.summaryVisible !== false ? <p>{profile.summary || resume.targetRoles.join(" · ")}</p> : null}
              {contact ? <div className="contactLine">{contact}</div> : null}
            </header>
          )}
          {resume.sections.map((section) => {
            const visibleItems = section.items.filter((item) => item.visible);
            const isSkillsSection = section.category === "custom";
            if (isSkillsSection && visibleItems.length === 0) return null;

            return (
              <section key={section.id} className="resumeSection">
                <h3>{section.title}</h3>
                {visibleItems.map((item, index) => {
                const exp = experiences.find((x) => x.id === item.experienceId);
                const version = exp?.versions.find((x) => x.id === item.versionId);
                if (!exp || !version) return null;
                return (
                  <div className={`resumeEntry ${isSkillsSection ? "skillsResumeEntry" : ""}`} key={item.id}>
                    {!isSkillsSection ? (
                      <div className="entryHeading">
                        <div><strong>{exp.organization}</strong><span>{exp.title}</span></div>
                        <div className="entryDate">{exp.startDate} — {exp.endDate}</div>
                      </div>
                    ) : null}
                    <ul>{version.bullets.map((bullet) => (
                      <li key={bullet.id} dangerouslySetInnerHTML={{ __html: bullet.text }} />
                    ))}</ul>
                    {resumeTemplateId === "chinese-compact" && section.category === "project" && index < visibleItems.length - 1 ? (
                      <div className="projectDivider" />
                    ) : null}
                  </div>
                );
                })}
              </section>
            );
          })}
        </article>
      </div>
    </aside>
  );
}
