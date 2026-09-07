import type {
  CandidateProfile,
  Experience,
  ImportedExperienceDraft,
  ImportSessionDraft,
  ResumeDocument,
  SavedResumeConfiguration,
  ResumeStyleSettings,
  ResumeTemplateId
} from "@/types/resume";

export interface WorkspaceData {
  demoLocale?: "zh" | "en";
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
}

export interface WorkspaceFileV1 {
  format: "multicv-workspace";
  schemaVersion: 1;
  exportedAt: string;
  data: WorkspaceData;
}
