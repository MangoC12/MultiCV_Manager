export type ExperienceCategory =
  | "education"
  | "work"
  | "project"
  | "research"
  | "activity"
  | "award"
  | "custom";

export interface ExperienceVersion {
  id: string;
  name: string;
  tags: string[];
  bullets: { id: string; text: string }[];
}

export interface Experience {
  id: string;
  category: ExperienceCategory;
  organization: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  versions: ExperienceVersion[];
}

export interface PhotoSettings {
  widthMm: number;
  topMm: number;
  rightMm: number;
  objectX: number;
  objectY: number;
}

export type ProfileFieldKey =
  | "name"
  | "gender"
  | "birthDate"
  | "politicalStatus"
  | "phone"
  | "email"
  | "github";

export interface CandidateProfile {
  name: string;
  gender?: string;
  birthDate?: string;
  politicalStatus?: string;
  phone?: string;
  email?: string;
  github?: string;
  location?: string;
  website?: string;
  summary?: string;
  summaryVisible?: boolean;
  summaryVersions?: { id: string; name: string; text: string }[];
  photoDataUrl?: string;
  photoSettings?: PhotoSettings;
  fieldVisibility?: Partial<Record<ProfileFieldKey, boolean>>;
}

export interface ImportedExperienceDraft {
  id: string;
  sourceFileName: string;
  category: ExperienceCategory;
  organization: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  tags: string[];
  bullets: { id: string; text: string }[];
  rawText: string;
}

export interface ImportSessionDraft {
  id: string;
  sourceFileName: string;
  profile: CandidateProfile;
  rawText: string;
}

export interface ResumeItem {
  id: string;
  experienceId: string;
  versionId: string;
  visible: boolean;
}

export interface ResumeSection {
  id: string;
  title: string;
  category: ExperienceCategory;
  sortMode: "date" | "manual";
  items: ResumeItem[];
}

export interface ResumeDocument {
  id: string;
  name: string;
  targetRoles: string[];
  sections: ResumeSection[];
}

export interface ResumeStyleSettings {
  fontFamily: string;
  fontSizeScale: number;
  lineHeight: number;
}

export type ResumeTemplateId = "modern" | "chinese-compact";

export interface SavedResumeConfiguration {
  id: string;
  name: string;
  resume: ResumeDocument;
  resumeTemplateId: ResumeTemplateId;
  resumeStyle: ResumeStyleSettings;
  photoSettings?: PhotoSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TargetedVersionSelection {
  experienceId: string;
  sourceVersionId: string;
  include: boolean;
  bullets: { sourceBulletId: string; text: string }[];
}
