import type { WorkspaceData, WorkspaceFileV1 } from "@/types/workspace";

export const WORKSPACE_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function ensureWorkspaceEssentials(data: WorkspaceData): WorkspaceData {
  const workspace = structuredClone(data);

  if (!workspace.profile.summaryVersions?.length) {
    workspace.profile.summaryVersions = [
      {
        id: "workspace-summary-default",
        name: "默认版本",
        text: workspace.profile.summary ?? ""
      }
    ];
  }

  let skills = workspace.experiences.find((experience) => experience.category === "custom");
  if (!skills) {
    skills = {
      id: "workspace-skills-experience",
      category: "custom",
      organization: "技能与语言",
      title: "",
      versions: []
    };
    workspace.experiences.push(skills);
  }

  if (!skills.versions.length) {
    skills.versions.push({
      id: "workspace-skills-default",
      name: "默认版本",
      tags: ["技能"],
      bullets: [{ id: "workspace-skills-bullet-1", text: "" }]
    });
  }

  let skillsSection = workspace.resume.sections.find((section) => section.category === "custom");
  if (!skillsSection) {
    skillsSection = {
      id: "workspace-skills-section",
      title: "技能与语言",
      category: "custom",
      sortMode: "manual",
      items: []
    };
    workspace.resume.sections.push(skillsSection);
  }

  if (!skillsSection.items.some((item) => item.experienceId === skills.id)) {
    skillsSection.items.push({
      id: "workspace-skills-item",
      experienceId: skills.id,
      versionId: skills.versions[0].id,
      visible: true
    });
  }

  return workspace;
}

export function createWorkspaceFile(data: WorkspaceData): WorkspaceFileV1 {
  return {
    format: "multicv-workspace",
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: structuredClone(data)
  };
}

export function parseWorkspaceFile(value: unknown): WorkspaceFileV1 {
  if (!isRecord(value) || value.format !== "multicv-workspace") {
    throw new Error("这不是有效的 MultiCV Workspace 文件。");
  }
  if (value.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    throw new Error(`暂不支持 Workspace schema v${String(value.schemaVersion)}。`);
  }
  if (!isRecord(value.data)) throw new Error("Workspace 数据缺失。");

  const data = value.data;
  if (!isRecord(data.profile) || typeof data.profile.name !== "string") {
    throw new Error("Workspace 中的基础信息格式不正确。");
  }
  if (!Array.isArray(data.experiences) || !data.experiences.every((item) =>
    isRecord(item) && typeof item.id === "string" && Array.isArray(item.versions)
  )) {
    throw new Error("Workspace 中的经历数据格式不正确。");
  }
  if (!isRecord(data.resume) || !Array.isArray(data.resume.sections)) {
    throw new Error("Workspace 中的简历配置格式不正确。");
  }
  if (data.resumeTemplateId !== "modern" && data.resumeTemplateId !== "chinese-compact") {
    throw new Error("Workspace 使用了未知的简历模板。");
  }
  if (!isRecord(data.resumeStyle) || typeof data.resumeStyle.fontFamily !== "string") {
    throw new Error("Workspace 中的样式设置格式不正确。");
  }
  if (!Array.isArray(data.savedResumeConfigurations)) {
    throw new Error("Workspace 中的已保存简历配置格式不正确。");
  }

  const workspaceFile = structuredClone(value) as unknown as WorkspaceFileV1;
  workspaceFile.data = ensureWorkspaceEssentials(workspaceFile.data);
  return workspaceFile;
}

export function workspaceDownloadName(resumeName: string) {
  const safeName = resumeName.trim().replace(/[\\/:*?"<>|]/g, "-") || "multicv-workspace";
  return `${safeName}.multicv.json`;
}
