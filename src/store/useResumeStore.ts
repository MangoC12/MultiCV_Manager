"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/helpers";
import {
  seedActiveSavedResumeConfigurationId,
  seedExperiences,
  seedProfile,
  seedResume,
  seedSavedResumeConfigurations
} from "@/data/seed";
import { blankWorkspaceData } from "@/data/blankWorkspace";
import { createDemoWorkspaceData, DEMO_REVISION, type DemoLocale } from "@/data/demo/workspace";
import { dateRank } from "@/lib/date";
import { ensureWorkspaceEssentials } from "@/lib/workspace";
import type {
  CandidateProfile,
  Experience,
  ExperienceCategory,
  ExperienceVersion,
  ImportedExperienceDraft,
  ImportSessionDraft,
  ResumeDocument,
  SavedResumeConfiguration,
  ResumeStyleSettings,
  ResumeTemplateId,
  TargetedVersionSelection
} from "@/types/resume";
import type { WorkspaceData } from "@/types/workspace";

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const emptyVersion = (name = "默认版本", bulletText = "补充这一版本的核心成果。"): ExperienceVersion => ({
  id: createId("version"),
  name,
  tags: [],
  bullets: [{ id: createId("bullet"), text: bulletText }]
});

type Store = {
  demoLocale?: DemoLocale;
  demoRevision?: number;
  profile: CandidateProfile;
  experiences: Experience[];
  importSessions: ImportSessionDraft[];
  importDrafts: ImportedExperienceDraft[];
  resume: ResumeDocument;
  resumeTemplateId: ResumeTemplateId;
  resumeStyle: ResumeStyleSettings;
  savedResumeConfigurations: SavedResumeConfiguration[];
  activeSavedResumeConfigurationId?: string;
  selectedExperienceId?: string;
  selectExperience: (id?: string) => void;
  addExperience: (category?: ExperienceCategory) => void;
  addEducation: () => void;
  updateExperience: (experienceId: string, patch: Partial<Omit<Experience, "id" | "versions">>) => void;
  deleteExperience: (experienceId: string) => void;
  updateProfile: (patch: Partial<CandidateProfile>) => void;
  replaceWorkspace: (workspace: WorkspaceData) => void;
  loadDemoWorkspace: (locale?: DemoLocale) => void;
  localizeDemoWorkspace: (locale: DemoLocale) => void;
  loadBlankWorkspace: () => void;
  addImportSession: (session: Omit<ImportSessionDraft, "id">) => void;
  updateImportSession: (sessionId: string, patch: Partial<Omit<ImportSessionDraft, "id">>) => void;
  deleteImportSession: (sessionId: string) => void;
  commitImportSession: (sessionId: string) => void;
  commitAllImportSessions: () => void;
  addImportDrafts: (drafts: Omit<ImportedExperienceDraft, "id">[]) => void;
  updateImportDraft: (draftId: string, patch: Partial<Omit<ImportedExperienceDraft, "id">>) => void;
  deleteImportDraft: (draftId: string) => void;
  commitImportDraft: (draftId: string) => void;
  commitAllImportDrafts: () => void;
  addVersion: (experienceId: string, name?: string) => string;
  renameVersion: (experienceId: string, versionId: string, name: string, overwrite?: boolean) => string | undefined;
  duplicateVersion: (experienceId: string, versionId: string, name: string) => string | undefined;
  updateVersion: (
    experienceId: string,
    versionId: string,
    patch: Partial<Omit<ExperienceVersion, "id" | "bullets">>
  ) => void;
  deleteVersion: (experienceId: string, versionId: string) => void;
  addTag: (experienceId: string, versionId: string, tag: string) => void;
  deleteTag: (experienceId: string, versionId: string, tag: string) => void;
  addBullet: (experienceId: string, versionId: string) => void;
  updateBullet: (experienceId: string, versionId: string, bulletId: string, text: string) => void;
  deleteBullet: (experienceId: string, versionId: string, bulletId: string) => void;
  replaceVersionBullets: (experienceId: string, versionId: string, texts: string[]) => void;
  reorderExperiences: (scopeIds: string[], from: number, to: number) => void;
  reorderVersions: (experienceId: string, from: number, to: number) => void;
  reorderBullets: (experienceId: string, versionId: string, from: number, to: number) => void;
  setVersion: (sectionId: string, itemId: string, versionId: string) => void;
  toggleResumeItem: (sectionId: string, itemId: string) => void;
  toggleResumeItemBullet: (sectionId: string, itemId: string, bulletId: string) => void;
  removeResumeItem: (sectionId: string, itemId: string) => void;
  setResumeTemplate: (templateId: ResumeTemplateId) => void;
  setResumeStyle: (patch: Partial<ResumeStyleSettings>) => void;
  saveResumeConfiguration: (name: string, overwrite?: boolean) => "created" | "overwritten" | "exists" | "invalid";
  loadResumeConfiguration: (configurationId: string) => void;
  deleteResumeConfiguration: (configurationId: string) => void;
  updateResumeName: (name: string) => void;
  addSection: () => void;
  addItemToSection: (sectionId: string, experienceId: string, versionId: string) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  moveSection: (sectionId: string, direction: "up" | "down") => void;
  reorderItems: (sectionId: string, from: number, to: number) => void;
  moveResumeItem: (sourceSectionId: string, targetSectionId: string, itemId: string, targetIndex: number) => void;
  sortSectionByDate: (sectionId: string) => void;
  createTargetedResumeConfiguration: (
    name: string,
    roleTitle: string,
    profileSummary: string,
    selections: TargetedVersionSelection[],
    overwrite?: boolean
  ) => "created" | "overwritten" | "exists" | "invalid";
  undo: () => boolean;
  redo: () => boolean;
};

type UndoSnapshot = Pick<
  Store,
  | "demoLocale"
  | "demoRevision"
  | "profile"
  | "experiences"
  | "importSessions"
  | "importDrafts"
  | "resume"
  | "resumeTemplateId"
  | "resumeStyle"
  | "savedResumeConfigurations"
  | "activeSavedResumeConfigurationId"
  | "selectedExperienceId"
>;

const undoHistory: UndoSnapshot[] = [];
const redoHistory: UndoSnapshot[] = [];
let isRestoringHistory = false;

const takeUndoSnapshot = (state: Store): UndoSnapshot => ({
  demoLocale: state.demoLocale,
  demoRevision: state.demoRevision,
  profile: structuredClone(state.profile),
  experiences: structuredClone(state.experiences),
  importSessions: structuredClone(state.importSessions),
  importDrafts: structuredClone(state.importDrafts),
  resume: structuredClone(state.resume),
  resumeTemplateId: state.resumeTemplateId,
  resumeStyle: structuredClone(state.resumeStyle),
  savedResumeConfigurations: structuredClone(state.savedResumeConfigurations),
  activeSavedResumeConfigurationId: state.activeSavedResumeConfigurationId,
  selectedExperienceId: state.selectedExperienceId
});

export const useResumeStore = create<Store>()(
  persist(
    (set, get) => ({
      demoLocale: "zh",
      demoRevision: undefined,
      profile: seedProfile,
      experiences: seedExperiences,
      importSessions: [],
      importDrafts: [],
      resume: seedResume,
      resumeTemplateId: "chinese-compact",
      resumeStyle: {
        fontFamily: "SimSun, Songti SC, Noto Serif CJK SC, serif",
        fontSizeScale: 1,
        lineHeight: 1.23
      },
      savedResumeConfigurations: seedSavedResumeConfigurations,
      activeSavedResumeConfigurationId: seedActiveSavedResumeConfigurationId,
      selectExperience: (id) => set({ selectedExperienceId: id }),
      addExperience: (category = "project") => {
        const id = createId("exp");
        const isAward = category === "award";
        set((state) => ({
          selectedExperienceId: id,
          experiences: [
            {
              id,
              category,
              organization: "",
              title: "",
              location: "",
              startDate: "",
              endDate: isAward ? undefined : "",
              versions: [
                emptyVersion(
                  "默认版本",
                  isAward ? "补充获奖理由、创新点或获奖高光。" : "补充这一版本的核心成果。"
                )
              ]
            },
            ...state.experiences
          ]
        }));
      },
      addEducation: () => {
        const id = createId("edu");
        set((state) => ({
          selectedExperienceId: id,
          experiences: [
            ...state.experiences,
            {
              id,
              category: "education",
              organization: "学校",
              title: "专业",
              startDate: "",
              endDate: "",
              versions: [
                {
                  id: createId("version"),
                  name: "教育背景",
                  tags: ["教育背景"],
                  bullets: [{ id: createId("bullet"), text: "补充教育背景描述。" }]
                }
              ]
            }
          ]
        }));
      },
      updateExperience: (experienceId, patch) =>
        set((state) => {
          const current = state.experiences.find((experience) => experience.id === experienceId);
          const targetSection = patch.category
            ? state.resume.sections.find((section) => section.category === patch.category)
            : undefined;
          const shouldMoveItems = Boolean(patch.category && targetSection && current?.category !== patch.category);
          const movedItems = shouldMoveItems
            ? state.resume.sections.flatMap((section) =>
                section.items.filter((item) => item.experienceId === experienceId)
              )
            : [];

          return {
            experiences: state.experiences.map((experience) =>
              experience.id === experienceId ? { ...experience, ...patch } : experience
            ),
            resume: shouldMoveItems
              ? {
                  ...state.resume,
                  sections: state.resume.sections.map((section) => {
                    const keptItems = section.items.filter((item) => item.experienceId !== experienceId);
                    return section.id === targetSection?.id
                      ? { ...section, items: [...keptItems, ...movedItems] }
                      : { ...section, items: keptItems };
                  })
                }
              : state.resume
          };
        }),
      deleteExperience: (experienceId) =>
        set((state) => ({
          selectedExperienceId:
            state.selectedExperienceId === experienceId ? undefined : state.selectedExperienceId,
          experiences: state.experiences.filter((experience) => experience.id !== experienceId),
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) => ({
              ...section,
              items: section.items.filter((item) => item.experienceId !== experienceId)
            }))
          }
        })),
      updateProfile: (patch) =>
        set((state) => ({
          profile: { ...state.profile, ...patch }
        })),
      replaceWorkspace: (workspace) =>
        set({
          ...ensureWorkspaceEssentials(workspace),
          demoLocale: workspace.demoLocale,
          demoRevision: workspace.demoRevision,
          selectedExperienceId: undefined
        }),
      loadDemoWorkspace: (locale = "zh") =>
        set({
          ...createDemoWorkspaceData(locale),
          selectedExperienceId: undefined
        }),
      localizeDemoWorkspace: (locale) => {
        const state = get();
        if (!state.experiences.some((experience) => experience.id === "demo-work-cc")) return;
        if (state.demoLocale === locale && state.demoRevision === DEMO_REVISION) return;
        const localized = createDemoWorkspaceData(locale);
        const activeConfigurationId = localized.savedResumeConfigurations.some(
          (configuration) => configuration.id === state.activeSavedResumeConfigurationId
        )
          ? state.activeSavedResumeConfigurationId
          : localized.activeSavedResumeConfigurationId;
        const activeConfiguration = localized.savedResumeConfigurations.find(
          (configuration) => configuration.id === activeConfigurationId
        );
        set({
          ...localized,
          resume: activeConfiguration?.resume ?? localized.resume,
          activeSavedResumeConfigurationId: activeConfigurationId,
          selectedExperienceId: undefined
        });
      },
      loadBlankWorkspace: () =>
        set({
          ...structuredClone(blankWorkspaceData),
          demoLocale: undefined,
          demoRevision: undefined,
          selectedExperienceId: undefined
        }),
      addImportSession: (session) =>
        set((state) => ({
          importSessions: [{ ...session, id: createId("session") }, ...state.importSessions]
        })),
      updateImportSession: (sessionId, patch) =>
        set((state) => ({
          importSessions: state.importSessions.map((session) =>
            session.id === sessionId ? { ...session, ...patch } : session
          )
        })),
      deleteImportSession: (sessionId) =>
        set((state) => {
          const session = state.importSessions.find((item) => item.id === sessionId);
          return {
            importSessions: state.importSessions.filter((item) => item.id !== sessionId),
            importDrafts: session
              ? state.importDrafts.filter((draft) => draft.sourceFileName !== session.sourceFileName)
              : state.importDrafts
          };
        }),
      commitImportSession: (sessionId) =>
        set((state) => {
          const session = state.importSessions.find((item) => item.id === sessionId);
          if (!session) return state;

          return {
            profile: { ...state.profile, ...session.profile },
            importSessions: state.importSessions.filter((item) => item.id !== sessionId)
          };
        }),
      commitAllImportSessions: () =>
        set((state) => {
          const profile = state.importSessions.reduce(
            (acc, session) => ({
              ...acc,
              ...Object.fromEntries(
                Object.entries(session.profile).filter(([, value]) => String(value ?? "").trim().length > 0)
              )
            }),
            state.profile
          );

          return {
            profile,
            importSessions: []
          };
        }),
      addImportDrafts: (drafts) =>
        set((state) => ({
          importDrafts: [
            ...drafts.map((draft) => ({
              ...draft,
              id: createId("draft"),
              bullets: draft.bullets.map((bullet) => ({ ...bullet, id: createId("bullet") }))
            })),
            ...state.importDrafts
          ]
        })),
      updateImportDraft: (draftId, patch) =>
        set((state) => ({
          importDrafts: state.importDrafts.map((draft) =>
            draft.id === draftId ? { ...draft, ...patch } : draft
          )
        })),
      deleteImportDraft: (draftId) =>
        set((state) => ({
          importDrafts: state.importDrafts.filter((draft) => draft.id !== draftId)
        })),
      commitImportDraft: (draftId) =>
        set((state) => {
          const draft = state.importDrafts.find((item) => item.id === draftId);
          if (!draft) return state;
          const experienceId = createId("exp");

          return {
            selectedExperienceId: experienceId,
            importDrafts: state.importDrafts.filter((item) => item.id !== draftId),
            experiences: [
              {
                id: experienceId,
                category: draft.category,
                organization: draft.organization.trim() || "未命名经历",
                title: draft.title.trim() || "待补充角色",
                location: draft.location,
                startDate: draft.startDate,
                endDate: draft.endDate,
                versions: [
                  {
                    id: createId("version"),
                    name: "导入版本",
                    tags: draft.tags,
                    bullets: draft.bullets
                  }
                ]
              },
              ...state.experiences
            ]
          };
        }),
      commitAllImportDrafts: () =>
        set((state) => {
          const imported = state.importDrafts.map((draft) => ({
            id: createId("exp"),
            category: draft.category,
            organization: draft.organization.trim() || "未命名经历",
            title: draft.title.trim() || "待补充角色",
            location: draft.location,
            startDate: draft.startDate,
            endDate: draft.endDate,
            versions: [
              {
                id: createId("version"),
                name: "导入版本",
                tags: draft.tags,
                bullets: draft.bullets
              }
            ]
          }));

          return {
            importDrafts: [],
            selectedExperienceId: imported[0]?.id ?? state.selectedExperienceId,
            experiences: [...imported, ...state.experiences]
          };
        }),
      addVersion: (experienceId, name) => {
        const version = emptyVersion(name);
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? { ...experience, versions: [...experience.versions, version] }
              : experience
          )
        }));
        return version.id;
      },
      renameVersion: (experienceId, versionId, name, overwrite = false) => {
        const normalized = name.trim();
        const experience = get().experiences.find((item) => item.id === experienceId);
        const source = experience?.versions.find((version) => version.id === versionId);
        if (!normalized || !experience || !source) return undefined;
        const target = experience.versions.find(
          (version) => version.id !== versionId && version.name.trim() === normalized
        );
        if (target && !overwrite) return undefined;

        if (target) {
          set((state) => ({
            experiences: state.experiences.map((item) =>
              item.id === experienceId
                ? {
                    ...item,
                    versions: item.versions
                      .filter((version) => version.id !== versionId)
                      .map((version) =>
                        version.id === target.id
                          ? {
                              ...version,
                              tags: [...source.tags],
                              bullets: source.bullets.map((bullet) => ({ ...bullet, id: createId("bullet") }))
                            }
                          : version
                      )
                  }
                : item
            ),
            resume: {
              ...state.resume,
              sections: state.resume.sections.map((section) => ({
                ...section,
                items: section.items.map((item) =>
                  item.experienceId === experienceId && item.versionId === versionId
                    ? { ...item, versionId: target.id }
                    : item
                )
              }))
            }
          }));
          return target.id;
        }

        set((state) => ({
          experiences: state.experiences.map((item) =>
            item.id === experienceId
              ? {
                  ...item,
                  versions: item.versions.map((version) =>
                    version.id === versionId ? { ...version, name: normalized } : version
                  )
                }
              : item
          )
        }));
        return versionId;
      },
      duplicateVersion: (experienceId, versionId, name) => {
        const normalized = name.trim();
        const experience = get().experiences.find((item) => item.id === experienceId);
        const source = experience?.versions.find((version) => version.id === versionId);
        if (!normalized || !experience || !source || experience.versions.some((version) => version.name.trim() === normalized)) {
          return undefined;
        }
        const duplicate: ExperienceVersion = {
          ...source,
          id: createId("version"),
          name: normalized,
          tags: [...source.tags],
          bullets: source.bullets.map((bullet) => ({ ...bullet, id: createId("bullet") }))
        };
        set((state) => ({
          experiences: state.experiences.map((item) =>
            item.id === experienceId ? { ...item, versions: [...item.versions, duplicate] } : item
          )
        }));
        return duplicate.id;
      },
      updateVersion: (experienceId, versionId, patch) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId ? { ...version, ...patch } : version
                  )
                }
              : experience
          )
        })),
      deleteVersion: (experienceId, versionId) =>
        set((state) => {
          const experience = state.experiences.find((item) => item.id === experienceId);
          if (!experience) return state;
          const remainingVersions = experience.versions.filter((version) => version.id !== versionId);
          const fallbackVersionId = remainingVersions[0]?.id;

          return {
            experiences: state.experiences.map((item) =>
              item.id === experienceId ? { ...item, versions: remainingVersions } : item
            ),
            resume: {
              ...state.resume,
              sections: state.resume.sections.map((section) => ({
                ...section,
                items: section.items
                  .map((item) =>
                    item.experienceId === experienceId && item.versionId === versionId && fallbackVersionId
                      ? { ...item, versionId: fallbackVersionId }
                      : item
                  )
                  .filter(
                    (item) =>
                      !(item.experienceId === experienceId && item.versionId === versionId && !fallbackVersionId)
                  )
              }))
            }
          };
        }),
      addTag: (experienceId, versionId, tag) => {
        const normalized = tag.trim();
        if (!normalized) return;
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId && !version.tags.includes(normalized)
                      ? { ...version, tags: [...version.tags, normalized] }
                      : version
                  )
                }
              : experience
          )
        }));
      },
      deleteTag: (experienceId, versionId, tag) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? { ...version, tags: version.tags.filter((item) => item !== tag) }
                      : version
                  )
                }
              : experience
          )
        })),
      addBullet: (experienceId, versionId) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? {
                          ...version,
                          bullets: [...version.bullets, { id: createId("bullet"), text: "新增成果描述。" }]
                        }
                      : version
                  )
                }
              : experience
          )
        })),
      updateBullet: (experienceId, versionId, bulletId, text) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? {
                          ...version,
                          bullets: version.bullets.map((bullet) =>
                            bullet.id === bulletId ? { ...bullet, text } : bullet
                          )
                        }
                      : version
                  )
                }
              : experience
          )
        })),
      deleteBullet: (experienceId, versionId, bulletId) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? { ...version, bullets: version.bullets.filter((bullet) => bullet.id !== bulletId) }
                      : version
                  )
                }
              : experience
          )
        })),
      replaceVersionBullets: (experienceId, versionId, texts) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? {
                          ...version,
                          bullets: texts
                            .map((text) => text.trim())
                            .filter(Boolean)
                            .map((text, index) => ({
                              id: version.bullets[index]?.id ?? createId("bullet"),
                              text
                            }))
                        }
                      : version
                  )
                }
              : experience
          )
        })),
      reorderExperiences: (scopeIds, from, to) =>
        set((state) => {
          const movedIds = arrayMove(scopeIds, from, to);
          const scope = new Set(scopeIds);
          const experienceById = new Map(state.experiences.map((experience) => [experience.id, experience]));
          let movedCursor = 0;
          return {
            experiences: state.experiences.map((experience) => {
              if (!scope.has(experience.id)) return experience;
              const movedExperience = experienceById.get(movedIds[movedCursor]);
              movedCursor += 1;
              return movedExperience ?? experience;
            })
          };
        }),
      reorderVersions: (experienceId, from, to) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? { ...experience, versions: arrayMove(experience.versions, from, to) }
              : experience
          )
        })),
      reorderBullets: (experienceId, versionId, from, to) =>
        set((state) => ({
          experiences: state.experiences.map((experience) =>
            experience.id === experienceId
              ? {
                  ...experience,
                  versions: experience.versions.map((version) =>
                    version.id === versionId
                      ? { ...version, bullets: arrayMove(version.bullets, from, to) }
                      : version
                  )
                }
              : experience
          )
        })),
      setVersion: (sectionId, itemId, versionId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    items: section.items.map((item) =>
                      item.id === itemId ? { ...item, versionId, hiddenBulletIds: [] } : item
                    )
                  }
                : section
            )
          }
        })),
      toggleResumeItem: (sectionId, itemId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    items: section.items.map((item) =>
                      item.id === itemId ? { ...item, visible: !item.visible } : item
                    )
                  }
                : section
            )
          }
        })),
      toggleResumeItemBullet: (sectionId, itemId, bulletId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    items: section.items.map((item) => {
                      if (item.id !== itemId) return item;
                      const hiddenBulletIds = item.hiddenBulletIds ?? [];
                      return {
                        ...item,
                        hiddenBulletIds: hiddenBulletIds.includes(bulletId)
                          ? hiddenBulletIds.filter((id) => id !== bulletId)
                          : [...hiddenBulletIds, bulletId]
                      };
                    })
                  }
                : section
            )
          }
        })),
      removeResumeItem: (sectionId, itemId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
                : section
            )
          }
        })),
      setResumeTemplate: (templateId) => set({ resumeTemplateId: templateId }),
      setResumeStyle: (patch) =>
        set((state) => ({
          resumeStyle: { ...state.resumeStyle, ...patch }
        })),
      saveResumeConfiguration: (name, overwrite = false) => {
        const normalizedName = name.trim();
        if (!normalizedName) return "invalid";

        const state = get();
        const existing = state.savedResumeConfigurations.find(
          (configuration) => configuration.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
        );
        if (existing && !overwrite) return "exists";

        const now = new Date().toISOString();
        const configuration: SavedResumeConfiguration = {
          id: existing?.id ?? createId("resume-config"),
          name: normalizedName,
          resume: structuredClone({ ...state.resume, name: normalizedName }),
          resumeTemplateId: state.resumeTemplateId,
          resumeStyle: structuredClone(state.resumeStyle),
          photoSettings: state.profile.photoSettings
            ? structuredClone(state.profile.photoSettings)
            : undefined,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now
        };

        set((current) => ({
          savedResumeConfigurations: existing
            ? current.savedResumeConfigurations.map((item) => item.id === existing.id ? configuration : item)
            : [...current.savedResumeConfigurations, configuration],
          activeSavedResumeConfigurationId: configuration.id
        }));
        return existing ? "overwritten" : "created";
      },
      loadResumeConfiguration: (configurationId) => {
        const configuration = get().savedResumeConfigurations.find((item) => item.id === configurationId);
        if (!configuration) return;
        set((state) => ({
          resume: structuredClone(configuration.resume),
          resumeTemplateId: configuration.resumeTemplateId,
          resumeStyle: structuredClone(configuration.resumeStyle),
          profile: {
            ...state.profile,
            photoSettings: configuration.photoSettings
              ? structuredClone(configuration.photoSettings)
              : undefined
          },
          activeSavedResumeConfigurationId: configuration.id
        }));
      },
      deleteResumeConfiguration: (configurationId) =>
        set((state) => ({
          savedResumeConfigurations: state.savedResumeConfigurations.filter(
            (configuration) => configuration.id !== configurationId
          ),
          activeSavedResumeConfigurationId:
            state.activeSavedResumeConfigurationId === configurationId
              ? undefined
              : state.activeSavedResumeConfigurationId
        })),
      updateResumeName: (name) =>
        set((state) => ({
          resume: { ...state.resume, name }
        })),
      addSection: () =>
        set((state) => {
          const usedNumbers = state.resume.sections
            .map((section) => section.title.match(/^默认标题(\d+)$/)?.[1])
            .filter((value): value is string => Boolean(value))
            .map(Number);
          const nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
          return {
            resume: {
              ...state.resume,
              sections: [
                ...state.resume.sections,
                {
                  id: createId("section"),
                  title: `默认标题${nextNumber}`,
                  category: "project",
                  sortMode: "manual",
                  items: []
                }
              ]
            }
          };
        }),
      addItemToSection: (sectionId, experienceId, versionId) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    sortMode: "manual",
                    items: [
                      ...section.items,
                      {
                        id: createId("resume-item"),
                        experienceId,
                        versionId,
                        visible: true
                      }
                    ]
                  }
                : section
            )
          }
        })),
      updateSectionTitle: (sectionId, title) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId ? { ...section, title } : section
            )
          }
        })),
      moveSection: (sectionId, direction) =>
        set((state) => {
          const currentIndex = state.resume.sections.findIndex((section) => section.id === sectionId);
          if (currentIndex < 0) return state;
          const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
          if (nextIndex < 0 || nextIndex >= state.resume.sections.length) return state;

          return {
            resume: {
              ...state.resume,
              sections: arrayMove(state.resume.sections, currentIndex, nextIndex)
            }
          };
        }),
      reorderItems: (sectionId, from, to) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === sectionId
                ? { ...section, sortMode: "manual", items: arrayMove(section.items, from, to) }
                : section
            )
          }
        })),
      moveResumeItem: (sourceSectionId, targetSectionId, itemId, targetIndex) =>
        set((state) => {
          if (sourceSectionId === targetSectionId) return state;
          const sourceSection = state.resume.sections.find((section) => section.id === sourceSectionId);
          const targetSection = state.resume.sections.find((section) => section.id === targetSectionId);
          const movingItem = sourceSection?.items.find((item) => item.id === itemId);
          if (!sourceSection || !targetSection || !movingItem) return state;

          const insertAt = Math.max(0, Math.min(targetIndex, targetSection.items.length));
          return {
            resume: {
              ...state.resume,
              sections: state.resume.sections.map((section) => {
                if (section.id === sourceSectionId) {
                  return {
                    ...section,
                    sortMode: "manual",
                    items: section.items.filter((item) => item.id !== itemId)
                  };
                }
                if (section.id === targetSectionId) {
                  const items = [...section.items];
                  items.splice(insertAt, 0, movingItem);
                  return { ...section, sortMode: "manual", items };
                }
                return section;
              })
            }
          };
        }),
      sortSectionByDate: (sectionId) => {
        const experiences = get().experiences;
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) => {
              if (section.id !== sectionId) return section;
              const sorted = [...section.items].sort((a, b) => {
                const expA = experiences.find((x) => x.id === a.experienceId);
                const expB = experiences.find((x) => x.id === b.experienceId);
                return dateRank(expB?.endDate) - dateRank(expA?.endDate);
              });
              return { ...section, sortMode: "date", items: sorted };
            })
          }
        }));
      },
      createTargetedResumeConfiguration: (name, roleTitle, profileSummary, selections, overwrite = false) => {
        const normalizedName = name.trim();
        if (!normalizedName || !selections.some((selection) => selection.include && selection.bullets.length)) {
          return "invalid";
        }

        const state = get();
        const existingConfiguration = state.savedResumeConfigurations.find(
          (configuration) => configuration.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
        );
        if (existingConfiguration && !overwrite) return "exists";

        const selectionByExperience = new Map(selections.map((selection) => [selection.experienceId, selection]));
        const includedSelections = selections.filter((selection) => selection.include);
        const versionIdByExperience = new Map<string, string>();
        const nextExperiences = state.experiences.map((experience) => {
          const selection = selectionByExperience.get(experience.id);
          if (!selection?.include) return experience;
          const source = experience.versions.find((version) => version.id === selection.sourceVersionId);
          if (!source) return experience;

          const target = experience.versions.find(
            (version) => version.name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
          );
          const versionId = target?.id ?? createId("version");
          versionIdByExperience.set(experience.id, versionId);
          const bullets = selection.bullets
            .map((bullet) => ({ id: createId("bullet"), text: bullet.text.trim() }))
            .filter((bullet) => bullet.text.length > 0);
          const targetedVersion: ExperienceVersion = {
            id: versionId,
            name: normalizedName,
            tags: [...new Set([...source.tags, roleTitle].filter(Boolean))],
            bullets: bullets.length
              ? bullets
              : source.bullets.map((bullet) => ({ ...bullet, id: createId("bullet") }))
          };

          return {
            ...experience,
            versions: target
              ? experience.versions.map((version) => version.id === target.id ? targetedVersion : version)
              : [...experience.versions, targetedVersion]
          };
        });

        const targetSectionByExperience = new Map<string, string>();
        includedSelections.forEach((selection) => {
          const experience = nextExperiences.find((item) => item.id === selection.experienceId);
          if (!experience) return;
          const exact = state.resume.sections.find((section) => section.category === experience.category);
          const fallback = experience.category === "custom"
            ? state.resume.sections.find((section) => section.category === "custom")
            : state.resume.sections.find((section) => section.category === "project") ??
              state.resume.sections.find((section) => section.category !== "education" && section.category !== "custom");
          const target = exact ?? fallback;
          if (target) targetSectionByExperience.set(experience.id, target.id);
        });

        const nextSections = state.resume.sections.map((section) => {
          const existingExperienceIds = new Set(section.items.map((item) => item.experienceId));
          const updatedItems = section.items.map((item) => {
            const evaluated = selectionByExperience.get(item.experienceId);
            const versionId = versionIdByExperience.get(item.experienceId);
            if (versionId) return { ...item, versionId, visible: true };
            if (evaluated && section.category !== "education" && section.category !== "custom") {
              return { ...item, visible: false };
            }
            return item;
          });
          const addedItems = includedSelections
            .filter((selection) => {
              return targetSectionByExperience.get(selection.experienceId) === section.id &&
                !existingExperienceIds.has(selection.experienceId);
            })
            .map((selection) => ({
              id: createId("resume-item"),
              experienceId: selection.experienceId,
              versionId: versionIdByExperience.get(selection.experienceId) ?? selection.sourceVersionId,
              visible: true
            }));
          return { ...section, sortMode: "manual" as const, items: [...updatedItems, ...addedItems] };
        });

        const nextResume: ResumeDocument = {
          ...state.resume,
          name: normalizedName,
          targetRoles: roleTitle
            ? [roleTitle, ...state.resume.targetRoles.filter((role) => role !== roleTitle)].slice(0, 4)
            : state.resume.targetRoles,
          sections: nextSections
        };
        const nextSummaryVersions = [...(state.profile.summaryVersions ?? [])];
        const existingSummaryIndex = nextSummaryVersions.findIndex(
          (version) => version.name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
        );
        const nextSummary = {
          id: existingSummaryIndex >= 0 ? nextSummaryVersions[existingSummaryIndex].id : createId("summary"),
          name: normalizedName,
          text: profileSummary.trim()
        };
        if (existingSummaryIndex >= 0) nextSummaryVersions[existingSummaryIndex] = nextSummary;
        else nextSummaryVersions.push(nextSummary);

        const now = new Date().toISOString();
        const configuration: SavedResumeConfiguration = {
          id: existingConfiguration?.id ?? createId("resume-config"),
          name: normalizedName,
          resume: structuredClone(nextResume),
          resumeTemplateId: state.resumeTemplateId,
          resumeStyle: structuredClone(state.resumeStyle),
          photoSettings: state.profile.photoSettings
            ? structuredClone(state.profile.photoSettings)
            : undefined,
          createdAt: existingConfiguration?.createdAt ?? now,
          updatedAt: now
        };

        set({
          experiences: nextExperiences,
          profile: {
            ...state.profile,
            summary: nextSummary.text || state.profile.summary,
            summaryVersions: nextSummaryVersions
          },
          resume: nextResume,
          savedResumeConfigurations: existingConfiguration
            ? state.savedResumeConfigurations.map((item) => item.id === existingConfiguration.id ? configuration : item)
            : [...state.savedResumeConfigurations, configuration],
          activeSavedResumeConfigurationId: configuration.id
        });
        return existingConfiguration ? "overwritten" : "created";
      },
      undo: () => {
        const previous = undoHistory.pop();
        if (!previous) return false;
        redoHistory.push(takeUndoSnapshot(get()));
        if (redoHistory.length > 10) redoHistory.shift();
        isRestoringHistory = true;
        set(previous);
        isRestoringHistory = false;
        return true;
      },
      redo: () => {
        const next = redoHistory.pop();
        if (!next) return false;
        undoHistory.push(takeUndoSnapshot(get()));
        if (undoHistory.length > 10) undoHistory.shift();
        isRestoringHistory = true;
        set(next);
        isRestoringHistory = false;
        return true;
      }
    }),
    {
      name: "multicv-manager-workspace-v1",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<Store>;
        const merged = { ...currentState, ...persisted };
        const normalized = ensureWorkspaceEssentials({
          demoLocale: merged.demoLocale,
          demoRevision: merged.demoRevision,
          profile: merged.profile,
          experiences: merged.experiences,
          importSessions: merged.importSessions,
          importDrafts: merged.importDrafts,
          resume: merged.resume,
          resumeTemplateId: merged.resumeTemplateId,
          resumeStyle: merged.resumeStyle,
          savedResumeConfigurations: merged.savedResumeConfigurations,
          activeSavedResumeConfigurationId: merged.activeSavedResumeConfigurationId
        });
        return { ...merged, ...normalized };
      }
    }
  )
);

useResumeStore.subscribe((state, previousState) => {
  if (isRestoringHistory) return;
  const contentChanged =
    state.profile !== previousState.profile ||
    state.experiences !== previousState.experiences ||
    state.importSessions !== previousState.importSessions ||
    state.importDrafts !== previousState.importDrafts ||
    state.resume !== previousState.resume ||
    state.resumeTemplateId !== previousState.resumeTemplateId ||
    state.resumeStyle !== previousState.resumeStyle ||
    state.savedResumeConfigurations !== previousState.savedResumeConfigurations ||
    state.activeSavedResumeConfigurationId !== previousState.activeSavedResumeConfigurationId;
  if (!contentChanged) return;
  undoHistory.push(takeUndoSnapshot(previousState));
  if (undoHistory.length > 10) undoHistory.shift();
  redoHistory.length = 0;
});
