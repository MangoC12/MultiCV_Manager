import type { WorkspaceData } from "@/types/workspace";

export const blankWorkspaceData: WorkspaceData = {
  profile: {
    name: "",
    summary: "",
    summaryVersions: [{ id: "blank-summary-default", name: "默认版本", text: "" }],
    fieldVisibility: {}
  },
  experiences: [
    {
      id: "blank-skills-experience",
      category: "custom",
      organization: "技能与语言",
      title: "",
      versions: [
        {
          id: "blank-skills-default",
          name: "默认版本",
          tags: ["技能"],
          bullets: [{ id: "blank-skills-bullet-1", text: "" }]
        }
      ]
    }
  ],
  importSessions: [],
  importDrafts: [],
  resume: {
    id: "blank-resume",
    name: "Untitled Resume",
    targetRoles: [],
    sections: [
      { id: "blank-education", title: "教育背景", category: "education", sortMode: "date", items: [] },
      { id: "blank-experience", title: "实习经历", category: "work", sortMode: "date", items: [] },
      { id: "blank-project", title: "项目经历", category: "project", sortMode: "date", items: [] },
      {
        id: "blank-skills",
        title: "技能与语言",
        category: "custom",
        sortMode: "manual",
        items: [
          {
            id: "blank-skills-item",
            experienceId: "blank-skills-experience",
            versionId: "blank-skills-default",
            visible: true
          }
        ]
      }
    ]
  },
  resumeTemplateId: "chinese-compact",
  resumeStyle: {
    fontFamily: "SimSun, Songti SC, Noto Serif CJK SC, serif",
    fontSizeScale: 1,
    lineHeight: 1.23
  },
  savedResumeConfigurations: []
};
