"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { useI18n } from "@/lib/i18n";
import { useResumeStore } from "@/store/useResumeStore";
import type { ExperienceVersion, ResumeItem } from "@/types/resume";

const stripHtml = (value: string) => {
  if (typeof document === "undefined") return value.replace(/<[^>]*>/g, "");
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent ?? "";
};

const hasRichTextContent = (value: string) =>
  stripHtml(value).replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").trim().length > 0;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildExperienceParagraphText = (
  organization: string,
  title: string,
  startDate?: string,
  endDate?: string,
  bullets: { text: string }[] = []
) => {
  const date = [startDate, endDate].filter(Boolean).join(" - ");
  const heading = [organization, title, date].filter(Boolean).join(" | ");
  const body = bullets
    .map((bullet, bulletIndex) => {
      const text = stripHtml(bullet.text).trim();
      return text ? `${bulletIndex + 1}. ${text}` : "";
    })
    .filter(Boolean)
    .join("\n");
  return [heading, body].filter(Boolean).join("\n");
};

function ExperienceParagraph({
  heading,
  bullets,
  onBulletChange
}: {
  heading: string;
  bullets: ExperienceVersion["bullets"];
  onBulletChange: (bulletId: string, text: string) => void;
}) {
  return (
    <div className="paragraphText">
      {heading ? <p className="paragraphHeading">{heading}</p> : null}
      {bullets.map((bullet, bulletIndex) => (
        <p key={bullet.id}>
          <span className="paragraphIndex">{bulletIndex + 1}. </span>
          <span
            className="paragraphEditable"
            contentEditable
            data-rich-editor="true"
            dangerouslySetInnerHTML={{ __html: bullet.text }}
            onInput={(event) => onBulletChange(bullet.id, event.currentTarget.innerHTML)}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text/plain");
              document.execCommand("insertText", false, text);
              onBulletChange(bullet.id, event.currentTarget.innerHTML);
            }}
            suppressContentEditableWarning
          />
        </p>
      ))}
    </div>
  );
}

function RichTextBulletEditor({
  value,
  visible,
  onChange,
  onToggleVisibility,
  onDelete
}: {
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const editorRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`richBulletEditor ${visible ? "" : "bulletHidden"}`}>
      <button
        className={`fieldVisibilityButton bulletVisibilityButton ${visible ? "visible" : "hidden"}`}
        type="button"
        aria-label={`${visible ? t.hideInPreview : t.showInPreview} Bullet`}
        title={visible ? t.hideInPreview : t.showInPreview}
        onClick={onToggleVisibility}
      >
        <span className="eyeIcon" aria-hidden="true" />
      </button>
      <div
        ref={editorRef}
        className="richBulletInput"
        contentEditable
        data-rich-editor="true"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          onChange(event.currentTarget.innerHTML);
        }}
        suppressContentEditableWarning
      />
      <button
        className="bulletDeleteButton"
        type="button"
        aria-label={`${t.delete} Bullet`}
        title={`${t.delete} Bullet`}
        onClick={onDelete}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

function SectionItemMenu({ sectionId, selectedExperienceIds }: { sectionId: string; selectedExperienceIds: string[] }) {
  const { t } = useI18n();
  const experiences = useResumeStore((state) => state.experiences);
  const addItemToSection = useResumeStore((state) => state.addItemToSection);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [experienceId, setExperienceId] = useState(experiences[0]?.id ?? "");
  const selectedExperience = experiences.find((experience) => experience.id === experienceId) ?? experiences[0];
  const [versionId, setVersionId] = useState(selectedExperience?.versions[0]?.id ?? "");

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const chooseExperience = (nextExperienceId: string) => {
    const nextExperience = experiences.find((experience) => experience.id === nextExperienceId);
    setExperienceId(nextExperienceId);
    setVersionId(nextExperience?.versions[0]?.id ?? "");
  };

  const addSelected = () => {
    if (!selectedExperience || !versionId) return;
    addItemToSection(sectionId, selectedExperience.id, versionId);
    setOpen(false);
  };

  return (
    <div className="sectionItemMenu" ref={rootRef}>
      <button className="sortButton sectionAddItemButton" type="button" onClick={() => setOpen((value) => !value)}>
        ＋ {t.addItemToSection}
      </button>
      {open ? (
        <div className="sectionItemPopover">
          <label>
            <span>{t.selectExperience}</span>
            <select value={selectedExperience?.id ?? ""} onChange={(event) => chooseExperience(event.target.value)}>
              {experiences.map((experience) => {
                const isSelected = selectedExperienceIds.includes(experience.id);
                return (
                  <option key={experience.id} value={experience.id} className={isSelected ? "alreadySelectedOption" : ""}>
                    {isSelected ? `（${t.selectedMarker}）` : ""}{experience.organization} · {experience.title}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span>{t.selectVersion}</span>
            <select value={versionId} onChange={(event) => setVersionId(event.target.value)}>
              {(selectedExperience?.versions ?? []).map((version) => (
                <option key={version.id} value={version.id}>{version.name}</option>
              ))}
            </select>
          </label>
          <button className="primaryButton" type="button" disabled={!selectedExperience || !versionId} onClick={addSelected}>
            {t.addSelectedItem}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SortableItem({
  sectionId,
  item,
  index,
  isEducation,
  isSkills
}: {
  sectionId: string;
  item: ResumeItem;
  index: number;
  isEducation: boolean;
  isSkills: boolean;
}) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"bullets" | "paragraph">("bullets");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const { ref: setNodeRef, handleRef: setHandleRef, isDragging } = useSortable({
    id: item.id,
    index,
    group: sectionId
  });
  const exp = useResumeStore((s) => s.experiences.find((x) => x.id === item.experienceId));
  const setVersion = useResumeStore((s) => s.setVersion);
  const toggleResumeItem = useResumeStore((s) => s.toggleResumeItem);
  const removeResumeItem = useResumeStore((s) => s.removeResumeItem);
  const updateBullet = useResumeStore((s) => s.updateBullet);
  const addBullet = useResumeStore((s) => s.addBullet);
  const deleteBullet = useResumeStore((s) => s.deleteBullet);
  const toggleResumeItemBullet = useResumeStore((s) => s.toggleResumeItemBullet);
  if (!exp) return null;
  const selectedVersion = exp.versions.find((version) => version.id === item.versionId) ?? exp.versions[0];
  const date = [exp.startDate, exp.endDate].filter(Boolean).join(" - ");
  const paragraphHeading = [exp.organization, exp.title, date].filter(Boolean).join(" | ");
  const visibleBullets = selectedVersion?.bullets.filter(
    (bullet) => !(item.hiddenBulletIds ?? []).includes(bullet.id) && hasRichTextContent(bullet.text)
  ) ?? [];
  const paragraphText = selectedVersion
    ? buildExperienceParagraphText(exp.organization, exp.title, exp.startDate, exp.endDate, visibleBullets)
    : "";
  const copyParagraph = async () => {
    if (!paragraphText) return;
    if (selectedVersion && typeof ClipboardItem !== "undefined") {
      const paragraphHtml = `
        <div>
          ${paragraphHeading ? `<p><strong>${escapeHtml(paragraphHeading)}</strong></p>` : ""}
          ${visibleBullets.map((bullet, bulletIndex) => (
            `<p><span>${bulletIndex + 1}. </span><span>${bullet.text}</span></p>`
          )).join("")}
        </div>
      `;
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([paragraphHtml], { type: "text/html" }),
          "text/plain": new Blob([paragraphText], { type: "text/plain" })
        })
      ]);
    } else {
      await navigator.clipboard.writeText(paragraphText);
    }
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1400);
  };

  return (
    <div ref={setNodeRef} className={`builderItem ${isSkills ? "skillsBuilderItem" : ""} ${isDragging ? "dragging" : ""} ${item.visible ? "" : "muted"}`}>
      {!isSkills ? (
        <>
          <button ref={setHandleRef} className="dragHandle" aria-label={t.dragBulletLabel}>⋮⋮</button>
          <div className="builderItemMain">
            <div className="builderItemTitle">{exp.organization}</div>
            <div className="builderItemMeta">{exp.title} · {exp.startDate} — {exp.endDate}</div>
          </div>
          <select value={item.versionId} onChange={(e) => setVersion(sectionId, item.id, e.target.value)}>
            {exp.versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button className="ghostButton" onClick={() => toggleResumeItem(sectionId, item.id)}>
            {item.visible ? t.hide : t.show}
          </button>
          <button className="ghostButton danger" onClick={() => removeResumeItem(sectionId, item.id)}>
            {t.remove}
          </button>
        </>
      ) : null}
      {selectedVersion ? (
        <div className={`builderCardBody ${isSkills ? "skillsBuilderBody" : ""}`}>
          {!isEducation && !isSkills ? (
            <div className="builderViewSwitcher" aria-label={t.cardViewMode}>
              <button
                className={viewMode === "bullets" ? "active" : ""}
                onClick={() => setViewMode("bullets")}
              >
                {t.bulletView}
              </button>
              <button
                className={viewMode === "paragraph" ? "active" : ""}
                onClick={() => setViewMode("paragraph")}
              >
                {t.paragraphView}
              </button>
            </div>
          ) : null}
          {isEducation || viewMode === "bullets" ? (
            <div className="builderRichEdit">
              <div className="builderRichEditHeader">
                <strong>{t.editResumeBullets}</strong>
                <span>{t.richTextHint}</span>
              </div>
              <div className="builderBulletEditors">
                {selectedVersion.bullets.map((bullet) => (
                  <RichTextBulletEditor
                    key={bullet.id}
                    value={bullet.text}
                    visible={!(item.hiddenBulletIds ?? []).includes(bullet.id)}
                    onChange={(text) => updateBullet(exp.id, selectedVersion.id, bullet.id, text)}
                    onToggleVisibility={() => toggleResumeItemBullet(sectionId, item.id, bullet.id)}
                    onDelete={() => deleteBullet(exp.id, selectedVersion.id, bullet.id)}
                  />
                ))}
                {selectedVersion.bullets.length === 0 ? <div className="emptyState">{t.noBullets}</div> : null}
              </div>
              <button className="addLineButton builderAddBulletButton" type="button" onClick={() => addBullet(exp.id, selectedVersion.id)}>
                {t.addBullet}
              </button>
            </div>
          ) : (
            <div className="builderParagraphView">
              <div className="builderRichEditHeader">
                <strong>{t.fullParagraph}</strong>
                <button className="ghostButton" onClick={copyParagraph}>
                  {copyState === "copied" ? t.copied : t.copyParagraph}
                </button>
              </div>
              <ExperienceParagraph
                heading={paragraphHeading}
                bullets={visibleBullets}
                onBulletChange={(bulletId, text) => updateBullet(exp.id, selectedVersion.id, bulletId, text)}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ResumeBuilder({ headerAction }: { headerAction?: ReactNode }) {
  const { t } = useI18n();
  const resume = useResumeStore((s) => s.resume);
  const reorder = useResumeStore((s) => s.reorderItems);
  const sortByDate = useResumeStore((s) => s.sortSectionByDate);
  const updateSectionTitle = useResumeStore((s) => s.updateSectionTitle);
  const moveSection = useResumeStore((s) => s.moveSection);
  const updateResumeName = useResumeStore((s) => s.updateResumeName);
  const addSection = useResumeStore((s) => s.addSection);
  const visibleSections = resume.sections.filter(
    (section) => section.category !== "custom" || section.items.some((item) => item.visible)
  );

  return (
    <main className="panel builder">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">{t.resumeBuilder}</span>
          <input
            className="resumeNameInput"
            aria-label={t.resumeName}
            value={resume.name}
            onChange={(event) => updateResumeName(event.target.value)}
          />
        </div>
        <div className="builderHeaderActions">
          <span className="rolePill">{resume.targetRoles.join(" · ")}</span>
          {headerAction}
        </div>
      </div>

      <DragDropProvider onDragEnd={(event) => {
        if (event.canceled) return;
        const source = event.operation.source;
        const target = event.operation.target;
        if (!source || !target || !isSortable(source) || !isSortable(target)) return;
        if (source.group !== target.group || source.index === target.index) return;
        reorder(String(source.group), source.index, target.index);
      }}>
        <div className="sectionStack">
          {visibleSections.map((section, sectionIndex) => (
            <section key={section.id} className="builderSection">
              <div className="sectionHeader">
                <div className="sectionTitleEditor">
                  <span className="sectionDrag">⠿</span>
                  <input
                    aria-label={t.sectionTitle}
                    value={section.title}
                    onChange={(event) => updateSectionTitle(section.id, event.target.value)}
                  />
                  <div className="sectionMoveButtons">
                    <button
                      aria-label={t.moveSectionUp}
                      disabled={sectionIndex === 0}
                      onClick={() => moveSection(section.id, "up")}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={t.moveSectionDown}
                      disabled={sectionIndex === visibleSections.length - 1}
                      onClick={() => moveSection(section.id, "down")}
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="sectionHeaderActions">
                  <SectionItemMenu
                    sectionId={section.id}
                    selectedExperienceIds={section.items.map((item) => item.experienceId)}
                  />
                  <button className="sortButton" onClick={() => sortByDate(section.id)}>
                    {section.sortMode === "date" ? t.sortByDateActive : t.sortByDate}
                  </button>
                </div>
              </div>
              <div className="builderItems">
                {section.items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    sectionId={section.id}
                    item={item}
                    index={index}
                    isEducation={section.category === "education"}
                    isSkills={section.category === "custom"}
                  />
                ))}
                {section.items.length === 0 ? <div className="emptyState">{t.builderEmpty}</div> : null}
              </div>
            </section>
          ))}
          <button className="addSectionButton" type="button" onClick={addSection}>
            ＋ {t.addSection}
          </button>
        </div>
      </DragDropProvider>
    </main>
  );
}
