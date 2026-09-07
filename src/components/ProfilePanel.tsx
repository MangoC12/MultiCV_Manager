"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useResumeStore } from "@/store/useResumeStore";
import { PhotoCropper } from "@/components/PhotoCropper";
import { ImportPanel } from "@/components/ImportPanel";
import { VersionAddMenu, VersionManageMenu } from "@/components/VersionAddMenu";
import { collectVersionNames, versionTone } from "@/lib/versionNames";
import type { Experience, ExperienceVersion, ProfileFieldKey } from "@/types/resume";

function ProfileField({
  label,
  value,
  visible,
  wide,
  onChange,
  onToggle,
  showLabel,
  hideLabel
}: {
  label: string;
  value: string;
  visible: boolean;
  wide?: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}) {
  return (
    <label className={wide ? "identityWide" : undefined}>
      <span>{label}</span>
      <div className="profileFieldControl">
        <input value={value} onChange={(event) => onChange(event.target.value)} />
        <button
          type="button"
          className={`fieldVisibilityButton ${visible ? "visible" : "hidden"}`}
          onClick={onToggle}
          aria-label={visible ? hideLabel : showLabel}
          title={visible ? hideLabel : showLabel}
        >
          <span className="eyeIcon" aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}

function VersionTabs({
  versions,
  activeId,
  onSelect,
  knownNames,
  onRename,
  onCopy,
  onDelete,
  onReorder
}: {
  versions: { id: string; name: string }[];
  activeId?: string;
  onSelect: (id: string) => void;
  knownNames: string[];
  onRename: (id: string, name: string) => boolean;
  onCopy: (id: string, name: string) => boolean;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [managingId, setManagingId] = useState<string>();
  const [draggedIndex, setDraggedIndex] = useState<number>();
  return (
    <div className="profileVersionTabs">
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
            className={`versionBookmark bookmarkTone${versionTone(version.name, knownNames)} ${activeId === version.id ? "active" : ""}`}
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

function ProfileBulletRow({
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
    <div ref={setNodeRef} className={`profileBulletRow ${isDragging ? "dragging" : ""}`}>
      <button ref={setHandleRef} className="dragHandle" aria-label={t.dragBulletLabel}>
        ⋮⋮
      </button>
      <textarea value={bullet.text} rows={2} onChange={(event) => updateBullet(experienceId, version.id, bullet.id, event.target.value)} />
      <button className="profileTinyDelete" onClick={() => deleteBullet(experienceId, version.id, bullet.id)} aria-label={t.delete}>
        ×
      </button>
    </div>
  );
}

function SkillsBlock({ skills, knownVersionNames }: { skills?: Experience; knownVersionNames: string[] }) {
  const { t } = useI18n();
  const addVersion = useResumeStore((s) => s.addVersion);
  const renameVersion = useResumeStore((s) => s.renameVersion);
  const duplicateVersion = useResumeStore((s) => s.duplicateVersion);
  const deleteVersion = useResumeStore((s) => s.deleteVersion);
  const reorderVersions = useResumeStore((s) => s.reorderVersions);
  const addBullet = useResumeStore((s) => s.addBullet);
  const resume = useResumeStore((s) => s.resume);
  const setVersion = useResumeStore((s) => s.setVersion);
  const toggleResumeItem = useResumeStore((s) => s.toggleResumeItem);
  const versions = useMemo(() => skills?.versions ?? [], [skills]);
  const [localActiveVersionId, setLocalActiveVersionId] = useState<string | undefined>(versions[0]?.id);
  const skillsSection = skills
    ? resume.sections.find((section) => section.items.some((item) => item.experienceId === skills.id))
    : undefined;
  const resumeItem = skillsSection?.items.find((item) => item.experienceId === skills?.id);
  const activeVersionId = resumeItem?.versionId ?? localActiveVersionId;
  const activeVersion = versions.find((version) => version.id === activeVersionId) ?? versions[0];
  const skillsVisible = resumeItem?.visible !== false;

  const selectVersion = (versionId: string) => {
    setLocalActiveVersionId(versionId);
    if (skillsSection && resumeItem) setVersion(skillsSection.id, resumeItem.id, versionId);
  };

  const addSkillsVersion = (name: string) => {
    if (!skills) return;
    const versionId = addVersion(skills.id, name);
    setLocalActiveVersionId(versionId);
    if (skillsSection && resumeItem) setVersion(skillsSection.id, resumeItem.id, versionId);
  };

  const renameSkillsVersion = (versionId: string, name: string) => {
    if (!skills) return false;
    const hasTarget = versions.some((version) => version.id !== versionId && version.name.trim() === name);
    if (hasTarget && !window.confirm(t.overwriteVersionConfirm)) return false;
    const nextId = renameVersion(skills.id, versionId, name, hasTarget);
    if (!nextId) return false;
    selectVersion(nextId);
    return true;
  };

  const copySkillsVersion = (versionId: string, name: string) => {
    if (!skills) return false;
    const nextId = duplicateVersion(skills.id, versionId, name);
    if (!nextId) return false;
    selectVersion(nextId);
    return true;
  };

  const deleteSkillsVersion = (versionId: string) => {
    if (!skills) return;
    const fallbackId = versions.find((version) => version.id !== versionId)?.id;
    deleteVersion(skills.id, versionId);
    setLocalActiveVersionId(fallbackId);
  };

  if (!skills) return null;

  return (
    <section className="profileSubsection">
      <div className="profileSubsectionHeader">
        <div className="profileSubsectionTitle">
          <h3>{t.skillsLanguageLibrary}</h3>
          {skillsSection && resumeItem ? (
            <button
              type="button"
              className={`fieldVisibilityButton moduleVisibilityButton ${skillsVisible ? "visible" : "hidden"}`}
              onClick={() => toggleResumeItem(skillsSection.id, resumeItem.id)}
              aria-label={skillsVisible ? t.hideInPreview : t.showInPreview}
              title={skillsVisible ? t.hideInPreview : t.showInPreview}
            >
              <span className="eyeIcon" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="profileVersionActions">
          <VersionTabs
            versions={versions}
            activeId={activeVersion?.id}
            onSelect={selectVersion}
            knownNames={knownVersionNames}
            onRename={renameSkillsVersion}
            onCopy={copySkillsVersion}
            onDelete={deleteSkillsVersion}
            onReorder={(from, to) => reorderVersions(skills.id, from, to)}
          />
          <VersionAddMenu
            knownNames={knownVersionNames}
            usedNames={versions.map((version) => version.name)}
            onAdd={addSkillsVersion}
          />
        </div>
      </div>
      {activeVersion ? (
        <div className="profileBulletStack">
          {activeVersion.bullets.map((bullet, index) => (
            <ProfileBulletRow key={bullet.id} experienceId={skills.id} version={activeVersion} bullet={bullet} index={index} />
          ))}
          <button className="addLineButton compactAddLine" onClick={() => addBullet(skills.id, activeVersion.id)}>
            {t.addBullet}
          </button>
        </div>
      ) : (
        <button className="addLineButton compactAddLine" onClick={() => addVersion(skills.id)}>
          {t.firstVersion}
        </button>
      )}
    </section>
  );
}

function EducationCard({ education, index }: { education: Experience; index: number }) {
  const { t } = useI18n();
  const { ref: setNodeRef, handleRef: setHandleRef, isDragging } = useSortable({
    id: education.id,
    index,
    group: "profile-education"
  });
  const updateExperience = useResumeStore((s) => s.updateExperience);
  const updateBullet = useResumeStore((s) => s.updateBullet);
  const replaceVersionBullets = useResumeStore((s) => s.replaceVersionBullets);
  const deleteExperience = useResumeStore((s) => s.deleteExperience);
  const version = education.versions[0];
  const description = version?.bullets[0];

  return (
    <article ref={setNodeRef} className={`profileEducationCard ${isDragging ? "dragging" : ""}`}>
      <button ref={setHandleRef} className="dragHandle profileEducationDrag" aria-label={t.dragBulletLabel}>
        ⋮⋮
      </button>
      <button className="profileTinyDelete educationDelete" onClick={() => deleteExperience(education.id)} aria-label={t.delete}>
        ×
      </button>
      <label className="educationSchool">
        <span>{t.school}</span>
        <input value={education.organization} onChange={(event) => updateExperience(education.id, { organization: event.target.value })} />
      </label>
      <label className="educationMajor">
        <span>{t.major}</span>
        <input value={education.title} onChange={(event) => updateExperience(education.id, { title: event.target.value })} />
      </label>
      <label>
        <span>{t.start}</span>
        <input value={education.startDate ?? ""} onChange={(event) => updateExperience(education.id, { startDate: event.target.value })} />
      </label>
      <label>
        <span>{t.end}</span>
        <input value={education.endDate ?? ""} onChange={(event) => updateExperience(education.id, { endDate: event.target.value })} />
      </label>
      <label className="educationDescription">
        <span>{t.description}</span>
        <textarea
          rows={2}
          value={description?.text ?? ""}
          onChange={(event) => {
            if (!version) return;
            if (description) updateBullet(education.id, version.id, description.id, event.target.value);
            else replaceVersionBullets(education.id, version.id, [event.target.value]);
          }}
        />
      </label>
    </article>
  );
}

export function ProfilePanel() {
  const { t } = useI18n();
  const profile = useResumeStore((s) => s.profile);
  const experiences = useResumeStore((s) => s.experiences);
  const updateProfile = useResumeStore((s) => s.updateProfile);
  const addEducation = useResumeStore((s) => s.addEducation);
  const reorderBullets = useResumeStore((s) => s.reorderBullets);
  const reorderExperiences = useResumeStore((s) => s.reorderExperiences);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const summaryVersions = profile.summaryVersions?.length
    ? profile.summaryVersions
    : [
        { id: "summary-default", name: "xx版", text: profile.summary ?? "" },
        { id: "summary-alt-2", name: "yy版", text: "" },
        { id: "summary-alt-3", name: "zz版", text: "" }
      ];
  const [activeSummaryId, setActiveSummaryId] = useState(summaryVersions[0]?.id);
  const activeSummary = summaryVersions.find((version) => version.id === activeSummaryId) ?? summaryVersions[0];
  const educationItems = experiences.filter((experience) => experience.category === "education");
  const skills = experiences.find((experience) => experience.category === "custom");
  const knownVersionNames = useMemo(() => collectVersionNames(profile, experiences), [profile, experiences]);
  const isFieldVisible = (field: ProfileFieldKey) => profile.fieldVisibility?.[field] !== false;
  const toggleFieldVisibility = (field: ProfileFieldKey) => {
    updateProfile({
      fieldVisibility: {
        ...profile.fieldVisibility,
        [field]: !isFieldVisible(field)
      }
    });
  };

  const updateSummaryVersion = (text: string) => {
    if (!activeSummary) return;
    updateProfile({
      summary: text,
      summaryVersions: summaryVersions.map((version) => (version.id === activeSummary.id ? { ...version, text } : version))
    });
  };

  const switchSummary = (id: string) => {
    const next = summaryVersions.find((version) => version.id === id);
    setActiveSummaryId(id);
    if (next) updateProfile({ summary: next.text });
  };

  const addSummaryVersion = (name: string) => {
    const version = { id: `summary-${Date.now().toString(36)}`, name, text: "" };
    updateProfile({ summary: "", summaryVersions: [...summaryVersions, version] });
    setActiveSummaryId(version.id);
  };

  const renameSummaryVersion = (versionId: string, name: string) => {
    const source = summaryVersions.find((version) => version.id === versionId);
    if (!source || !name.trim()) return false;
    const target = summaryVersions.find((version) => version.id !== versionId && version.name.trim() === name.trim());
    if (target && !window.confirm(t.overwriteVersionConfirm)) return false;
    if (target) {
      const next = summaryVersions
        .filter((version) => version.id !== versionId)
        .map((version) => version.id === target.id ? { ...version, text: source.text } : version);
      updateProfile({ summary: source.text, summaryVersions: next });
      setActiveSummaryId(target.id);
      return true;
    }
    updateProfile({
      summaryVersions: summaryVersions.map((version) =>
        version.id === versionId ? { ...version, name: name.trim() } : version
      )
    });
    return true;
  };

  const copySummaryVersion = (versionId: string, name: string) => {
    const normalized = name.trim();
    const source = summaryVersions.find((version) => version.id === versionId);
    if (!source || !normalized || summaryVersions.some((version) => version.name.trim() === normalized)) return false;
    const duplicate = { id: `summary-${Date.now().toString(36)}`, name: normalized, text: source.text };
    updateProfile({ summary: duplicate.text, summaryVersions: [...summaryVersions, duplicate] });
    setActiveSummaryId(duplicate.id);
    return true;
  };

  const deleteSummaryVersion = (versionId: string) => {
    const remaining = summaryVersions.filter((version) => version.id !== versionId);
    const next = remaining[0];
    updateProfile({ summary: next?.text ?? "", summaryVersions: remaining });
    setActiveSummaryId(next?.id);
  };

  return (
    <section className="profilePanel profilePrototypePanel">
      <div className="panelHeader compactHeader profileMainHeader">
        <div>
          <span className="eyebrow">PROFILE</span>
          <h2>{t.profileCard}</h2>
        </div>
        <button className="ghostButton importTriggerButton" onClick={() => setIsImportOpen(true)}>
          {t.importFileButton}
        </button>
      </div>
      <div className="profilePrototypeGrid">
        <div className="profilePhotoSection prototypePhoto">
          <PhotoCropper photoDataUrl={profile.photoDataUrl} onChange={(photoDataUrl) => updateProfile({ photoDataUrl })} />
        </div>
        <div className="profileIdentityGrid">
          <ProfileField label={t.candidateName} value={profile.name} visible={isFieldVisible("name")} onChange={(name) => updateProfile({ name })} onToggle={() => toggleFieldVisibility("name")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField label={t.gender} value={profile.gender ?? ""} visible={isFieldVisible("gender")} onChange={(gender) => updateProfile({ gender })} onToggle={() => toggleFieldVisibility("gender")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField label={t.birthDate} value={profile.birthDate ?? ""} visible={isFieldVisible("birthDate")} onChange={(birthDate) => updateProfile({ birthDate })} onToggle={() => toggleFieldVisibility("birthDate")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField label={t.politicalStatus} value={profile.politicalStatus ?? ""} visible={isFieldVisible("politicalStatus")} onChange={(politicalStatus) => updateProfile({ politicalStatus })} onToggle={() => toggleFieldVisibility("politicalStatus")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField wide label={t.phone} value={profile.phone ?? ""} visible={isFieldVisible("phone")} onChange={(phone) => updateProfile({ phone })} onToggle={() => toggleFieldVisibility("phone")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField wide label={t.email} value={profile.email ?? ""} visible={isFieldVisible("email")} onChange={(email) => updateProfile({ email })} onToggle={() => toggleFieldVisibility("email")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
          <ProfileField wide label={t.github} value={profile.github ?? profile.website ?? ""} visible={isFieldVisible("github")} onChange={(github) => updateProfile({ github, website: github })} onToggle={() => toggleFieldVisibility("github")} showLabel={t.showInPreview} hideLabel={t.hideInPreview} />
        </div>
      </div>

      <section className="profileSubsection">
        <div className="profileSubsectionHeader">
          <div className="profileSubsectionTitle">
            <h3>{t.selfEvaluation}</h3>
            <button
              type="button"
              className={`fieldVisibilityButton moduleVisibilityButton ${profile.summaryVisible !== false ? "visible" : "hidden"}`}
              onClick={() => updateProfile({ summaryVisible: profile.summaryVisible === false })}
              aria-label={profile.summaryVisible !== false ? t.hideInPreview : t.showInPreview}
              title={profile.summaryVisible !== false ? t.hideInPreview : t.showInPreview}
            >
              <span className="eyeIcon" aria-hidden="true" />
            </button>
          </div>
          <div className="profileVersionActions">
            <VersionTabs
              versions={summaryVersions}
              activeId={activeSummary?.id}
              onSelect={switchSummary}
              knownNames={knownVersionNames}
              onRename={renameSummaryVersion}
              onCopy={copySummaryVersion}
              onDelete={deleteSummaryVersion}
              onReorder={(from, to) => {
                const reordered = [...summaryVersions];
                const [moved] = reordered.splice(from, 1);
                if (!moved) return;
                reordered.splice(to, 0, moved);
                updateProfile({ summaryVersions: reordered });
              }}
            />
            <VersionAddMenu
              knownNames={knownVersionNames}
              usedNames={summaryVersions.map((version) => version.name)}
              onAdd={addSummaryVersion}
            />
          </div>
        </div>
        <textarea className="profileParagraphBox" rows={3} value={activeSummary?.text ?? ""} onChange={(event) => updateSummaryVersion(event.target.value)} />
      </section>

      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const source = event.operation.source;
          const target = event.operation.target;
          if (!source || !target || !isSortable(source) || !isSortable(target)) return;
          if (source.group !== target.group || source.index === target.index) return;
          if (source.group === "profile-education") {
            reorderExperiences(educationItems.map((item) => item.id), source.index, target.index);
            return;
          }
          const experience = experiences.find((item) => item.versions.some((version) => version.id === source.group));
          if (experience) reorderBullets(experience.id, String(source.group), source.index, target.index);
        }}
      >
        <SkillsBlock skills={skills} knownVersionNames={knownVersionNames} />
        <section className="profileSubsection educationProfileSection">
          <div className="profileSubsectionHeader">
            <h3>{t.educationBackgroundLibrary}</h3>
            <button className="ghostButton" onClick={addEducation}>
              {t.add}
            </button>
          </div>
          <div className="profileEducationStack">
            {educationItems.map((education, index) => (
              <EducationCard key={education.id} education={education} index={index} />
            ))}
          </div>
        </section>
      </DragDropProvider>

      {isImportOpen ? (
        <div className="modalBackdrop" onMouseDown={() => setIsImportOpen(false)}>
          <div className="importModal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modalCloseButton" aria-label={t.close} onClick={() => setIsImportOpen(false)}>
              ×
            </button>
            <ImportPanel />
          </div>
        </div>
      ) : null}
    </section>
  );
}
