"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { collectVersionNames, versionTone } from "@/lib/versionNames";
import { useResumeStore } from "@/store/useResumeStore";
import { VersionAddMenu, VersionManageMenu } from "@/components/VersionAddMenu";
import type { Experience, ExperienceCategory, ExperienceVersion } from "@/types/resume";

type LibraryExperienceType = "internship-project" | "leadership" | "award";

function libraryTypeFromCategory(category: ExperienceCategory): LibraryExperienceType {
  if (category === "award") return "award";
  if (category === "activity") return "leadership";
  return "internship-project";
}

function categoryFromLibraryType(type: LibraryExperienceType): ExperienceCategory {
  if (type === "award") return "award";
  if (type === "leadership") return "activity";
  return "project";
}

const autoTagRules = [
  { tag: "AI", pattern: /AI|AIGC|LLM|Agent|Prompt|模型|算法|智能/i },
  { tag: "产品", pattern: /产品|PRD|原型|需求|上线|用户/i },
  { tag: "数据分析", pattern: /数据|SQL|Python|Tableau|指标|漏斗|A\/B/i },
  { tag: "运营", pattern: /运营|增长|留存|转化|社媒|社区|Campaign/i },
  { tag: "游戏", pattern: /游戏|角色|卡牌|桌游|玩法/i },
  { tag: "医疗", pattern: /医疗|影像|CT|肺炎|临床|生物/i }
];

function parseParagraphToBullets(text: string) {
  return text
    .split(/\n+/)
    .map((line) =>
      line
        .trim()
        .replace(/^(\d+[\.)、]|[（(]\d+[）)]|[-*•·])\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function bulletsToParagraph(version: ExperienceVersion) {
  return version.bullets.map((bullet, index) => `${index + 1}. ${bullet.text}`).join("\n");
}

function experienceDateRank(experience: Experience) {
  const value = experience.endDate || experience.startDate || "";
  if (/至今|现在|present|current/i.test(value)) return Number.MAX_SAFE_INTEGER;
  const match = value.match(/(\d{4})(?:\D+(\d{1,2}))?/);
  return match ? Number(match[1]) * 100 + Number(match[2] ?? 12) : 0;
}

function isReadyForAutoSort(experience: Experience) {
  if (libraryTypeFromCategory(experience.category) === "award") {
    return Boolean(experience.startDate?.trim());
  }
  return Boolean(experience.startDate?.trim() && experience.endDate?.trim());
}

function isSkillsExperience(experience: Experience) {
  const text = `${experience.organization} ${experience.title} ${experience.versions
    .flatMap((version) => [version.name, ...version.tags])
    .join(" ")}`;
  return experience.category === "custom" || /技能|语言|skills?|language/i.test(text);
}

function BulletRow({
  experienceId,
  version,
  bullet,
  index
}: {
  experienceId: string;
  version: ExperienceVersion;
  bullet: ExperienceVersion["bullets"][number];
  index: number;
}) {
  const { t } = useI18n();
  const { ref: setNodeRef, handleRef: setHandleRef, isDragging } = useSortable({
    id: bullet.id,
    index,
    group: version.id
  });
  const updateBullet = useResumeStore((s) => s.updateBullet);
  const deleteBullet = useResumeStore((s) => s.deleteBullet);

  return (
    <div ref={setNodeRef} className={`bulletRow libraryBulletRow ${isDragging ? "dragging" : ""}`}>
      <button ref={setHandleRef} className="dragHandle" aria-label={t.dragBulletLabel}>
        ⋮⋮
      </button>
      <textarea
        value={bullet.text}
        onChange={(event) => updateBullet(experienceId, version.id, bullet.id, event.target.value)}
        rows={2}
      />
      <button className="ghostButton danger" onClick={() => deleteBullet(experienceId, version.id, bullet.id)}>
        {t.delete}
      </button>
    </div>
  );
}

function ExperienceFields({ experience, compact = false }: { experience: Experience; compact?: boolean }) {
  const { t } = useI18n();
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const libraryType = libraryTypeFromCategory(experience.category);
  const isAward = libraryType === "award";

  return (
    <div className={`fieldGrid ${compact ? "compactFieldGrid" : ""} ${isAward ? "awardFieldGrid" : ""}`}>
      <label>
        <span>{t.category}</span>
        <select
          value={libraryType}
          onChange={(event) => updateExperience(experience.id, {
            category: categoryFromLibraryType(event.target.value as LibraryExperienceType),
            endDate: event.target.value === "award" ? undefined : experience.endDate ?? ""
          })}
        >
          <option value="internship-project">{t.internshipProject}</option>
          <option value="leadership">{t.leadershipExperience}</option>
          <option value="award">{t.awardHonor}</option>
        </select>
      </label>
      <label>
        <span>{isAward ? t.awardName : t.organization}</span>
        <input value={experience.organization} onChange={(event) => updateExperience(experience.id, { organization: event.target.value })} />
      </label>
      <label>
        <span>{isAward ? t.responsibilityRole : t.role}</span>
        <input value={experience.title} onChange={(event) => updateExperience(experience.id, { title: event.target.value })} />
      </label>
      <label>
        <span>{isAward ? t.awardYear : t.start}</span>
        <input placeholder={isAward ? "YYYY" : "YYYY.MM"} value={experience.startDate ?? ""} onChange={(event) => updateExperience(experience.id, { startDate: event.target.value })} />
      </label>
      {!isAward ? (
        <label>
          <span>{t.end}</span>
          <input placeholder="YYYY.MM / Present" value={experience.endDate ?? ""} onChange={(event) => updateExperience(experience.id, { endDate: event.target.value })} />
        </label>
      ) : null}
      {!compact ? (
        <label>
          <span>{t.location}</span>
          <input value={experience.location ?? ""} onChange={(event) => updateExperience(experience.id, { location: event.target.value })} />
        </label>
      ) : null}
    </div>
  );
}

function TagEditor({ experience, version }: { experience: Experience; version: ExperienceVersion }) {
  const { t } = useI18n();
  const [tagInput, setTagInput] = useState("");
  const addTag = useResumeStore((s) => s.addTag);
  const deleteTag = useResumeStore((s) => s.deleteTag);

  const submitTag = () => {
    addTag(experience.id, version.id, tagInput);
    setTagInput("");
  };

  const addAutoTags = () => {
    const text = `${experience.organization} ${experience.title} ${version.name} ${version.bullets.map((b) => b.text).join(" ")}`;
    autoTagRules.forEach((rule) => {
      if (rule.pattern.test(text)) addTag(experience.id, version.id, rule.tag);
    });
  };

  return (
    <div className="tagEditor libraryTagEditor">
      <strong className="libraryTagLabel">{t.tags}</strong>
      <div className="tags">
        {version.tags.map((tag) => (
          <button key={tag} className="tagButton" onClick={() => deleteTag(experience.id, version.id, tag)}>
            {tag} ×
          </button>
        ))}
      </div>
      <div className="tagInputRow">
        <input
          className="inlineInput"
          placeholder={t.newTag}
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTag();
            }
          }}
        />
        <button className="ghostButton" onClick={submitTag}>
          {t.add}
        </button>
        <button className="ghostButton" onClick={addAutoTags}>
          {t.autoTag}
        </button>
      </div>
    </div>
  );
}

function VersionBody({ experience, version }: { experience: Experience; version: ExperienceVersion }) {
  const { t } = useI18n();
  const addBullet = useResumeStore((s) => s.addBullet);
  const reorderBullets = useResumeStore((s) => s.reorderBullets);
  const replaceVersionBullets = useResumeStore((s) => s.replaceVersionBullets);
  const [viewMode, setViewMode] = useState<"bullet" | "paragraph">("bullet");
  const [paragraphText, setParagraphText] = useState(() => bulletsToParagraph(version));

  const commitParagraph = () => {
    const parsed = parseParagraphToBullets(paragraphText);
    if (parsed.length > 0) replaceVersionBullets(experience.id, version.id, parsed);
  };

  const switchToParagraph = () => {
    setParagraphText(bulletsToParagraph(version));
    setViewMode("paragraph");
  };

  return (
    <div className="libraryVersionBody">
      <div className="libraryContentHeader">
        <strong>{libraryTypeFromCategory(experience.category) === "award" ? t.awardHighlight : t.experienceContent}</strong>
        <div className="builderViewSwitcher libraryViewSwitcher">
          <button className={viewMode === "bullet" ? "active" : ""} onClick={() => setViewMode("bullet")}>
            {t.bulletView}
          </button>
          <button className={viewMode === "paragraph" ? "active" : ""} onClick={switchToParagraph}>
            {t.paragraphView}
          </button>
        </div>
      </div>
      {viewMode === "bullet" ? (
        <>
          <DragDropProvider onDragEnd={(event) => {
            if (event.canceled) return;
            const source = event.operation.source;
            const target = event.operation.target;
            if (!source || !target || !isSortable(source) || !isSortable(target)) return;
            const sourceGroup = source.initialGroup ?? source.group;
            if (sourceGroup !== version.id || target.group !== version.id || source.initialIndex === target.index) return;
            reorderBullets(experience.id, version.id, source.initialIndex, target.index);
          }}>
            <div className="bulletStack libraryCardBulletStack">
              {version.bullets.map((bullet, index) => (
                <BulletRow key={bullet.id} experienceId={experience.id} version={version} bullet={bullet} index={index} />
              ))}
              {version.bullets.length === 0 ? <div className="emptyState">{t.noBullets}</div> : null}
            </div>
          </DragDropProvider>
          <button className="addLineButton" onClick={() => addBullet(experience.id, version.id)}>
            {t.addBullet}
          </button>
        </>
      ) : (
        <textarea
          className="libraryParagraphEditor"
          value={paragraphText}
          onChange={(event) => setParagraphText(event.target.value)}
          onBlur={commitParagraph}
          rows={6}
        />
      )}
    </div>
  );
}

function VersionBookmarks({
  versions,
  activeVersionId,
  onSelect,
  knownNames,
  onRename,
  onCopy,
  onDelete,
  onReorder
}: {
  versions: ExperienceVersion[];
  activeVersionId?: string;
  onSelect: (versionId: string) => void;
  knownNames: string[];
  onRename: (versionId: string, name: string) => boolean;
  onCopy: (versionId: string, name: string) => boolean;
  onDelete: (versionId: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [managingId, setManagingId] = useState<string>();
  const [draggedIndex, setDraggedIndex] = useState<number>();
  return (
    <div className="versionBookmarks" aria-label="versions">
      {versions.map((version, index) => (
        <div
          className={`versionBookmarkWrap ${draggedIndex === index ? "dragging" : ""}`}
          key={version.id}
          draggable
          onDragStart={(event) => {
            setDraggedIndex(index);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", version.id);
          }}
          onDragOver={(event) => {
            if (draggedIndex === undefined || draggedIndex === index) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedIndex !== undefined && draggedIndex !== index) onReorder(draggedIndex, index);
            setDraggedIndex(undefined);
          }}
          onDragEnd={() => setDraggedIndex(undefined)}
        >
          <button
            className={`versionBookmark bookmarkTone${versionTone(version.name, knownNames)} ${activeVersionId === version.id ? "active" : ""}`}
            onClick={() => onSelect(version.id)}
            onDoubleClick={() => setManagingId(version.id)}
            title={version.name}
          >
            {version.name}
          </button>
          {managingId === version.id ? (
            <VersionManageMenu
              currentName={version.name}
              knownNames={knownNames}
              onRename={(name) => onRename(version.id, name)}
              onCopy={(name) => onCopy(version.id, name)}
              onDelete={() => onDelete(version.id)}
              onClose={() => setManagingId(undefined)}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function VersionedExperienceCard({ experience, knownVersionNames }: { experience: Experience; knownVersionNames: string[] }) {
  const { t } = useI18n();
  const addVersion = useResumeStore((s) => s.addVersion);
  const renameVersion = useResumeStore((s) => s.renameVersion);
  const duplicateVersion = useResumeStore((s) => s.duplicateVersion);
  const deleteVersion = useResumeStore((s) => s.deleteVersion);
  const reorderVersions = useResumeStore((s) => s.reorderVersions);
  const deleteExperience = useResumeStore((s) => s.deleteExperience);
  const versions = experience.versions;
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(versions[0]?.id);
  const activeVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const libraryType = libraryTypeFromCategory(experience.category);
  const libraryTypeLabel = libraryType === "award"
    ? t.awardHonor
    : libraryType === "leadership"
      ? t.leadershipExperience
      : t.internshipProject;
  const addNamedVersion = (name: string) => {
    const versionId = addVersion(experience.id, name);
    setSelectedVersionId(versionId);
  };
  const renameNamedVersion = (versionId: string, name: string) => {
    const hasTarget = versions.some((version) => version.id !== versionId && version.name.trim() === name);
    if (hasTarget && !window.confirm(t.overwriteVersionConfirm)) return false;
    const nextId = renameVersion(experience.id, versionId, name, hasTarget);
    if (!nextId) return false;
    setSelectedVersionId(nextId);
    return true;
  };
  const copyNamedVersion = (versionId: string, name: string) => {
    const nextId = duplicateVersion(experience.id, versionId, name);
    if (!nextId) return false;
    setSelectedVersionId(nextId);
    return true;
  };
  const deleteNamedVersion = (versionId: string) => {
    const fallbackId = versions.find((version) => version.id !== versionId)?.id;
    deleteVersion(experience.id, versionId);
    setSelectedVersionId(fallbackId);
  };

  return (
    <article className="libraryColumnCard versionedLibraryCard">
      <button
        className="profileTinyDelete experienceCardDelete"
        onClick={() => deleteExperience(experience.id)}
        aria-label={t.deleteExperience}
        title={t.deleteExperience}
      >
        ×
      </button>
      <div className="libraryCardTop">
        <div className="libraryCardHeaderText">
          <div className="libraryCardTitleLine">
            <strong>{experience.organization || (libraryType === "award" ? t.awardName : t.organization)}</strong>
            <span className="experienceTypeBadge">{libraryTypeLabel}</span>
          </div>
          <span>
            {experience.title || (libraryType === "award" ? t.responsibilityRole : t.role)} · {[experience.startDate, experience.endDate].filter(Boolean).join(" — ")}
          </span>
        </div>
        <div className="cardVersionActions">
          <VersionBookmarks
            versions={versions}
            activeVersionId={activeVersion?.id}
            onSelect={setSelectedVersionId}
            knownNames={knownVersionNames}
            onRename={renameNamedVersion}
            onCopy={copyNamedVersion}
            onDelete={deleteNamedVersion}
            onReorder={(from, to) => reorderVersions(experience.id, from, to)}
          />
          <VersionAddMenu
            knownNames={knownVersionNames}
            usedNames={versions.map((version) => version.name)}
            onAdd={addNamedVersion}
          />
        </div>
      </div>
      <ExperienceFields experience={experience} compact />
      {activeVersion ? (
        <section className="activeVersionEditor">
          <div className="versionEditorHeader">
            <strong className="versionTitleLabel">{activeVersion.name}</strong>
            {versions.length > 1 ? (
              <button className="ghostButton danger" onClick={() => deleteVersion(experience.id, activeVersion.id)}>
                {t.deleteVersion}
              </button>
            ) : null}
          </div>
          <TagEditor experience={experience} version={activeVersion} />
          <VersionBody experience={experience} version={activeVersion} />
        </section>
      ) : (
        <button className="addLineButton" onClick={() => addVersion(experience.id)}>
          {t.firstVersion}
        </button>
      )}
    </article>
  );
}

function SortableExperienceCard({
  experience,
  index,
  knownVersionNames
}: {
  experience: Experience;
  index: number;
  knownVersionNames: string[];
}) {
  const { t } = useI18n();
  const { ref: setNodeRef, handleRef: setHandleRef, isDragging } = useSortable({
    id: experience.id,
    index,
    group: "content-experiences"
  });

  return (
    <div ref={setNodeRef} className={`contentExperienceShell ${isDragging ? "dragging" : ""}`}>
      <button ref={setHandleRef} className="dragHandle contentExperienceDrag" aria-label={t.dragExperienceLabel}>
        ⋮⋮
      </button>
      <VersionedExperienceCard experience={experience} knownVersionNames={knownVersionNames} />
    </div>
  );
}

function NewExperienceMenu() {
  const { t } = useI18n();
  const addExperience = useResumeStore((s) => s.addExperience);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const createExperience = (type: LibraryExperienceType) => {
    addExperience(categoryFromLibraryType(type));
    setOpen(false);
  };

  return (
    <div className="newExperienceMenu" ref={rootRef}>
      <button
        className="iconButton"
        type="button"
        aria-label={t.addExperienceLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ＋
      </button>
      {open ? (
        <div className="newExperiencePopover" role="menu">
          <strong>{t.chooseExperienceType}</strong>
          <button type="button" role="menuitem" onClick={() => createExperience("internship-project")}>{t.internshipProject}</button>
          <button type="button" role="menuitem" onClick={() => createExperience("leadership")}>{t.leadershipExperience}</button>
          <button type="button" role="menuitem" onClick={() => createExperience("award")}>{t.awardHonor}</button>
        </div>
      ) : null}
    </div>
  );
}

export function ExperienceLibrary() {
  const { t } = useI18n();
  const experiences = useResumeStore((s) => s.experiences);
  const profile = useResumeStore((s) => s.profile);
  const reorderExperiences = useResumeStore((s) => s.reorderExperiences);
  const [query, setQuery] = useState("");
  const [isAutoSorted, setIsAutoSorted] = useState(true);
  const knownVersionNames = useMemo(() => collectVersionNames(profile, experiences), [profile, experiences]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return experiences;
    return experiences.filter((exp) =>
      [exp.organization, exp.title, ...exp.versions.flatMap((v) => [v.name, ...v.tags, ...v.bullets.map((b) => b.text)])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [experiences, query]);

  const projects = useMemo(() => {
    const contentExperiences = filtered.filter(
      (experience) => experience.category !== "education" && !isSkillsExperience(experience)
    );
    if (!isAutoSorted) return contentExperiences;
    return [...contentExperiences].sort((a, b) => {
      const aReady = isReadyForAutoSort(a);
      const bReady = isReadyForAutoSort(b);
      if (aReady !== bReady) return aReady ? 1 : -1;
      return experienceDateRank(b) - experienceDateRank(a);
    });
  }, [filtered, isAutoSorted]);

  return (
    <aside className="panel library libraryMainPanel">
      <div className="panelHeader libraryMainHeader">
        <div>
          <span className="eyebrow">CONTENT LIBRARY</span>
          <h2>{t.contentLibrary}</h2>
        </div>
        <div className="libraryHeaderActions">
          <button
            className={`libraryAutoSortButton ${isAutoSorted ? "active" : ""}`}
            type="button"
            onClick={() => setIsAutoSorted(true)}
          >
            {isAutoSorted ? t.autoSortActive : t.autoSort}
          </button>
          <NewExperienceMenu />
        </div>
      </div>
      <input className="search" placeholder={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const source = event.operation.source;
          const target = event.operation.target;
          if (!source || !target || !isSortable(source) || !isSortable(target)) return;
          const sourceGroup = source.initialGroup ?? source.group;
          if (sourceGroup !== "content-experiences" || target.group !== "content-experiences") return;
          if (source.initialIndex !== target.index) {
            setIsAutoSorted(false);
            reorderExperiences(projects.map((item) => item.id), source.initialIndex, target.index);
          }
        }}
      >
        <div className="contentExperienceList">
          {projects.length === 0 ? <div className="emptyState">{t.emptyLibraryGroup}</div> : null}
          {projects.map((experience, index) => (
            <SortableExperienceCard
              key={experience.id}
              experience={experience}
              index={index}
              knownVersionNames={knownVersionNames}
            />
          ))}
        </div>
      </DragDropProvider>
    </aside>
  );
}
