"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { extractTextFromFile, parseResumeTextToImportResult } from "@/lib/importParser";
import { useResumeStore } from "@/store/useResumeStore";
import type { CandidateProfile, ExperienceCategory, ImportedExperienceDraft, ImportSessionDraft } from "@/types/resume";

type ParseStatus =
  | { type: "idle" }
  | { type: "parsing" }
  | { type: "created"; count: number }
  | { type: "error"; message?: string };

const categoryValues: ExperienceCategory[] = [
  "work",
  "project",
  "education",
  "research",
  "activity",
  "award",
  "custom"
];

function ProfileDraftCard({ session }: { session: ImportSessionDraft }) {
  const { t } = useI18n();
  const updateImportSession = useResumeStore((s) => s.updateImportSession);
  const deleteImportSession = useResumeStore((s) => s.deleteImportSession);
  const commitImportSession = useResumeStore((s) => s.commitImportSession);

  const updateProfile = (patch: Partial<CandidateProfile>) => {
    updateImportSession(session.id, { profile: { ...session.profile, ...patch } });
  };

  return (
    <article className="draftCard profileDraftCard">
      <div className="draftCardHeader">
        <div>
          <div className="draftMeta">{session.sourceFileName}</div>
          <h3>{t.profileCard}</h3>
        </div>
        <div className="draftActions">
          <button className="ghostButton danger" onClick={() => deleteImportSession(session.id)}>{t.discard}</button>
          <button className="primaryButton" onClick={() => commitImportSession(session.id)}>{t.commitProfile}</button>
        </div>
      </div>
      <div className="fieldGrid">
        <label>
          <span>{t.candidateName}</span>
          <input value={session.profile.name} onChange={(event) => updateProfile({ name: event.target.value })} />
        </label>
        <label>
          <span>{t.gender}</span>
          <input value={session.profile.gender ?? ""} onChange={(event) => updateProfile({ gender: event.target.value })} />
        </label>
        <label>
          <span>{t.birthDate}</span>
          <input value={session.profile.birthDate ?? ""} onChange={(event) => updateProfile({ birthDate: event.target.value })} />
        </label>
        <label>
          <span>{t.phone}</span>
          <input value={session.profile.phone ?? ""} onChange={(event) => updateProfile({ phone: event.target.value })} />
        </label>
        <label>
          <span>{t.email}</span>
          <input value={session.profile.email ?? ""} onChange={(event) => updateProfile({ email: event.target.value })} />
        </label>
        <label>
          <span>{t.location}</span>
          <input value={session.profile.location ?? ""} onChange={(event) => updateProfile({ location: event.target.value })} />
        </label>
        <label>
          <span>{t.website}</span>
          <input value={session.profile.website ?? ""} onChange={(event) => updateProfile({ website: event.target.value })} />
        </label>
        <label>
          <span>{t.summary}</span>
          <input value={session.profile.summary ?? ""} onChange={(event) => updateProfile({ summary: event.target.value })} />
        </label>
      </div>
    </article>
  );
}

function DraftCard({ draft }: { draft: ImportedExperienceDraft }) {
  const { t } = useI18n();
  const updateImportDraft = useResumeStore((s) => s.updateImportDraft);
  const deleteImportDraft = useResumeStore((s) => s.deleteImportDraft);
  const commitImportDraft = useResumeStore((s) => s.commitImportDraft);

  const updateBullet = (bulletId: string, text: string) => {
    updateImportDraft(draft.id, {
      bullets: draft.bullets.map((bullet) => (bullet.id === bulletId ? { ...bullet, text } : bullet))
    });
  };

  const deleteBullet = (bulletId: string) => {
    updateImportDraft(draft.id, {
      bullets: draft.bullets.filter((bullet) => bullet.id !== bulletId)
    });
  };

  const addBullet = () => {
    updateImportDraft(draft.id, {
      bullets: [...draft.bullets, { id: `draft-bullet-${Date.now()}`, text: t.importedBullet }]
    });
  };

  return (
    <article className="draftCard">
      <div className="draftMeta">{draft.sourceFileName}</div>
      <div className="fieldGrid">
        <label>
          <span>{t.category}</span>
          <select
            value={draft.category}
            onChange={(event) => updateImportDraft(draft.id, { category: event.target.value as ExperienceCategory })}
          >
            {categoryValues.map((category) => (
              <option key={category} value={category}>{t.categories[category]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t.organization}</span>
          <input value={draft.organization} onChange={(event) => updateImportDraft(draft.id, { organization: event.target.value })} />
        </label>
        <label>
          <span>{t.role}</span>
          <input value={draft.title} onChange={(event) => updateImportDraft(draft.id, { title: event.target.value })} />
        </label>
        <label>
          <span>{t.location}</span>
          <input value={draft.location ?? ""} onChange={(event) => updateImportDraft(draft.id, { location: event.target.value })} />
        </label>
        <label>
          <span>{t.start}</span>
          <input value={draft.startDate ?? ""} onChange={(event) => updateImportDraft(draft.id, { startDate: event.target.value })} />
        </label>
        <label>
          <span>{t.end}</span>
          <input value={draft.endDate ?? ""} onChange={(event) => updateImportDraft(draft.id, { endDate: event.target.value })} />
        </label>
      </div>
      <div className="draftBullets">
        {draft.bullets.map((bullet) => (
          <div className="draftBulletRow" key={bullet.id}>
            <textarea value={bullet.text} rows={2} onChange={(event) => updateBullet(bullet.id, event.target.value)} />
            <button className="ghostButton danger" onClick={() => deleteBullet(bullet.id)}>{t.delete}</button>
          </div>
        ))}
        {draft.bullets.length === 0 ? <div className="emptyState">{t.draftNoBullets}</div> : null}
      </div>
      <div className="editorActions">
        <button className="ghostButton" onClick={addBullet}>{t.draftAddBullet}</button>
        <div className="draftActions">
          <button className="ghostButton danger" onClick={() => deleteImportDraft(draft.id)}>{t.discard}</button>
          <button className="primaryButton" onClick={() => commitImportDraft(draft.id)}>{t.commitDraft}</button>
        </div>
      </div>
      <details className="rawText">
        <summary>{t.rawText}</summary>
        <pre>{draft.rawText}</pre>
      </details>
    </article>
  );
}

export function ImportPanel() {
  const { t } = useI18n();
  const sessions = useResumeStore((s) => s.importSessions);
  const drafts = useResumeStore((s) => s.importDrafts);
  const addImportSession = useResumeStore((s) => s.addImportSession);
  const addImportDrafts = useResumeStore((s) => s.addImportDrafts);
  const commitAllImportSessions = useResumeStore((s) => s.commitAllImportSessions);
  const commitAllImportDrafts = useResumeStore((s) => s.commitAllImportDrafts);
  const [useOcrFallback, setUseOcrFallback] = useState(true);
  const [status, setStatus] = useState<ParseStatus>({ type: "idle" });
  const [isParsing, setIsParsing] = useState(false);

  const statusText =
    status.type === "parsing"
      ? t.importParsing
      : status.type === "created"
        ? t.importCreated(status.count)
        : status.type === "error"
          ? status.message || t.importFailed
          : t.importIdle;

  const parseFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsParsing(true);
    setStatus({ type: "parsing" });

    try {
      const allDrafts = [];
      for (const file of Array.from(files)) {
        const text = await extractTextFromFile(file, useOcrFallback);
        const parsed = parseResumeTextToImportResult(text, file.name);
        addImportSession(parsed.session);
        allDrafts.push(...parsed.drafts);
      }
      addImportDrafts(allDrafts);
      setStatus({ type: "created", count: allDrafts.length });
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : undefined });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <section className="importPanel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">IMPORT</span>
          <h2>{t.importTitle}</h2>
        </div>
        {drafts.length > 0 || sessions.length > 0 ? (
          <button
            className="primaryButton"
            onClick={() => {
              commitAllImportSessions();
              commitAllImportDrafts();
            }}
          >
            {t.importAll}
          </button>
        ) : null}
      </div>
      <label className="dropZone">
        <input
          type="file"
          accept=".md,.markdown,.txt,.docx,.pdf"
          multiple
          disabled={isParsing}
          onChange={(event) => parseFiles(event.target.files)}
        />
        <strong>{isParsing ? t.importChooseBusy : t.importChoose}</strong>
        <span>{t.importHint}</span>
      </label>
      <label className="toggleRow">
        <input
          type="checkbox"
          checked={useOcrFallback}
          onChange={(event) => setUseOcrFallback(event.target.checked)}
        />
        <span>{t.importOcr}</span>
      </label>
      <div className="importStatus">{statusText}</div>
      <div className="draftStack">
        {sessions.length > 0 ? <h3 className="draftGroupTitle">{t.importedCards}</h3> : null}
        {sessions.map((session) => <ProfileDraftCard key={session.id} session={session} />)}
        {drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)}
        {drafts.length === 0 && sessions.length === 0 ? <div className="emptyState">{t.importEmpty}</div> : null}
      </div>
    </section>
  );
}
