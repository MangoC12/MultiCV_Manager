import { demoWorkspaceData } from "@/data/demo/workspace";

// Source code always starts with public-safe demo data. Personal data belongs in a Workspace file.
export const seedProfile = structuredClone(demoWorkspaceData.profile);
export const seedExperiences = structuredClone(demoWorkspaceData.experiences);
export const seedResume = structuredClone(demoWorkspaceData.resume);
export const seedSavedResumeConfigurations = structuredClone(demoWorkspaceData.savedResumeConfigurations);
export const seedActiveSavedResumeConfigurationId = demoWorkspaceData.activeSavedResumeConfigurationId;
