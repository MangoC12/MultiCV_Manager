import type { CandidateProfile, Experience, ResumeDocument, SavedResumeConfiguration } from "@/types/resume";
import type { WorkspaceData } from "@/types/workspace";

export const DEMO_REVISION = 2;

const profile: CandidateProfile = {
  name: "Cynthia Wang",
  gender: "女",
  birthDate: "2026.08",
  phone: "（86）187-0000-0000",
  email: "cynthia.wang@example.com",
  github: "github.com/cynthia-demo",
  summary: "数据科学背景，具备数据分析、产品分析与用户研究经验。",
  summaryVersions: [
    { id: "demo-summary-data", name: "数据分析版", text: "数据科学背景，熟悉 SQL、Python 与数据可视化，能够从业务数据中识别问题并形成分析建议。" },
    { id: "demo-summary-product", name: "产品版", text: "具备数据科学与产品分析背景，能够结合用户需求和数据证据推动产品功能优化。" }
  ]
};

const experiences: Experience[] = [
  {
    id: "demo-edu-bb",
    category: "education",
    organization: "AA大学",
    title: "数据科学｜硕士",
    startDate: "2023.09",
    endDate: "2025.06",
    versions: [{ id: "demo-edu-bb-default", name: "默认版本", tags: [], bullets: [{ id: "demo-edu-bb-b1", text: "学习数据分析、机器学习与数据可视化相关课程。" }] }]
  },
  {
    id: "demo-edu-aa",
    category: "education",
    organization: "BB大学",
    title: "生物信息学｜本科",
    startDate: "2019.09",
    endDate: "2023.06",
    versions: [{ id: "demo-edu-aa-default", name: "默认版本", tags: [], bullets: [{ id: "demo-edu-aa-b1", text: "学习生物信息学、统计学与编程基础课程。" }] }]
  },
  {
    id: "demo-work-cc",
    category: "work",
    organization: "DD公司",
    title: "产品实习生",
    startDate: "2024.03",
    endDate: "2024.05",
    versions: [
      { id: "demo-cc-product", name: "产品版", tags: ["产品", "用户研究"], bullets: [{ id: "demo-cc-product-b1", text: "参与用户需求整理与产品功能优化，协助推动一个核心功能上线。" }] },
      { id: "demo-cc-data", name: "数据分析版", tags: ["数据分析", "产品分析"], bullets: [{ id: "demo-cc-data-b1", text: "分析用户行为数据，为产品功能优化提供数据支持。" }] }
    ]
  },
  {
    id: "demo-work-dd",
    category: "work",
    organization: "CC公司",
    title: "数据分析师实习生",
    startDate: "2024.07",
    endDate: "2024.10",
    versions: [
      { id: "demo-dd-data", name: "数据分析版", tags: ["数据分析", "SQL"], bullets: [{ id: "demo-dd-data-b1", text: "使用 SQL 完成业务数据分析，并输出周期性数据报告。" }] },
      { id: "demo-dd-product", name: "产品版", tags: ["产品分析", "用户增长"], bullets: [{ id: "demo-dd-product-b1", text: "通过数据分析识别用户转化问题，并提出产品优化建议。" }] }
    ]
  },
  {
    id: "demo-activity-tea",
    category: "activity",
    organization: "“明天喝乌龙茶”小红书账号",
    title: "账号运营",
    startDate: "2022.01",
    endDate: "2022.12",
    versions: [
      { id: "demo-tea-content", name: "产品版", tags: ["内容运营", "社交媒体"], bullets: [{ id: "demo-tea-content-b1", text: "负责账号选题与内容发布，一年内累计获得 5,000+ 粉丝。" }] },
      { id: "demo-tea-data", name: "数据分析版", tags: ["数据运营", "用户增长"], bullets: [{ id: "demo-tea-data-b1", text: "根据内容数据持续优化选题方向，使账号平均互动率提升约 30%。" }] }
    ]
  },
  {
    id: "demo-skills",
    category: "custom",
    organization: "技能与语言",
    title: "",
    versions: [
      {
        id: "demo-skills-data",
        name: "数据分析版",
        tags: ["技能"],
        bullets: [
          { id: "demo-skills-data-b1", text: "Python、SQL、Excel、Tableau" },
          { id: "demo-skills-data-b2", text: "数据分析、产品分析、基础机器学习" },
          { id: "demo-skills-data-b3", text: "中文：母语；英语：熟练" }
        ]
      },
      {
        id: "demo-skills-product",
        name: "产品版",
        tags: ["技能"],
        bullets: [
          { id: "demo-skills-product-b1", text: "Excel、SQL、Tableau、Python" },
          { id: "demo-skills-product-b2", text: "产品分析、用户研究、数据分析" },
          { id: "demo-skills-product-b3", text: "中文：母语；英语：熟练" }
        ]
      }
    ]
  }
];

const makeItem = (id: string, experienceId: string, versionId: string) => ({ id, experienceId, versionId, visible: true });

const dataResume: ResumeDocument = {
  id: "demo-resume-data",
  name: "Cynthia Wang - 数据分析简历",
  targetRoles: ["数据分析师"],
  sections: [
    { id: "demo-data-education", title: "教育背景", category: "education", sortMode: "date", items: [makeItem("demo-data-bb", "demo-edu-bb", "demo-edu-bb-default"), makeItem("demo-data-aa", "demo-edu-aa", "demo-edu-aa-default")] },
    { id: "demo-data-experience", title: "实习经历", category: "work", sortMode: "date", items: [makeItem("demo-data-dd", "demo-work-dd", "demo-dd-data"), makeItem("demo-data-cc", "demo-work-cc", "demo-cc-data")] },
    { id: "demo-data-campus", title: "校园经历", category: "activity", sortMode: "date", items: [makeItem("demo-data-tea", "demo-activity-tea", "demo-tea-data")] },
    { id: "demo-data-skills", title: "技能与语言", category: "custom", sortMode: "manual", items: [makeItem("demo-data-skills-item", "demo-skills", "demo-skills-data")] }
  ]
};

const productResume: ResumeDocument = {
  id: "demo-resume-product",
  name: "Cynthia Wang - 产品简历",
  targetRoles: ["产品分析师", "产品经理"],
  sections: [
    { id: "demo-product-education", title: "教育背景", category: "education", sortMode: "date", items: [makeItem("demo-product-bb", "demo-edu-bb", "demo-edu-bb-default"), makeItem("demo-product-aa", "demo-edu-aa", "demo-edu-aa-default")] },
    { id: "demo-product-experience", title: "实习经历", category: "work", sortMode: "date", items: [makeItem("demo-product-dd", "demo-work-dd", "demo-dd-product"), makeItem("demo-product-cc", "demo-work-cc", "demo-cc-product")] },
    { id: "demo-product-campus", title: "校园经历", category: "activity", sortMode: "date", items: [makeItem("demo-product-tea", "demo-activity-tea", "demo-tea-content")] },
    { id: "demo-product-skills", title: "技能与语言", category: "custom", sortMode: "manual", items: [makeItem("demo-product-skills-item", "demo-skills", "demo-skills-product")] }
  ]
};

const savedAt = "2026-09-06T00:00:00.000Z";
const savedResumeConfigurations: SavedResumeConfiguration[] = [
  { id: "demo-config-data", name: "数据分析简历", resume: dataResume, resumeTemplateId: "chinese-compact", resumeStyle: { fontFamily: "SimSun, Songti SC, Noto Serif CJK SC, serif", fontSizeScale: 1, lineHeight: 1.23 }, createdAt: savedAt, updatedAt: savedAt },
  { id: "demo-config-product", name: "产品简历", resume: productResume, resumeTemplateId: "chinese-compact", resumeStyle: { fontFamily: "SimSun, Songti SC, Noto Serif CJK SC, serif", fontSizeScale: 1, lineHeight: 1.23 }, createdAt: savedAt, updatedAt: savedAt }
];

const chineseDemoWorkspaceData: WorkspaceData = {
  demoLocale: "zh",
  demoRevision: DEMO_REVISION,
  profile,
  experiences,
  importSessions: [],
  importDrafts: [],
  resume: dataResume,
  resumeTemplateId: "chinese-compact",
  resumeStyle: { fontFamily: "SimSun, Songti SC, Noto Serif CJK SC, serif", fontSizeScale: 1, lineHeight: 1.23 },
  savedResumeConfigurations,
  activeSavedResumeConfigurationId: "demo-config-data"
};

export type DemoLocale = "zh" | "en";

function createEnglishDemoWorkspace(): WorkspaceData {
  const workspace = structuredClone(chineseDemoWorkspaceData);
  workspace.demoLocale = "en";
  workspace.profile = {
    ...workspace.profile,
    gender: "Female",
    summary: "Data science background with experience in data analysis, product analysis, and user research.",
    summaryVersions: [
      {
        id: "demo-summary-data",
        name: "Data Version",
        text: "Data science graduate skilled in SQL, Python, and data visualization, with experience turning business data into actionable recommendations."
      },
      {
        id: "demo-summary-product",
        name: "Product Version",
        text: "Data science and product analysis background with experience combining user needs and evidence to improve product features."
      }
    ]
  };

  const localizedExperiences: Record<string, Partial<Experience>> = {
    "demo-edu-bb": { organization: "AA University", title: "M.S. in Data Science" },
    "demo-edu-aa": { organization: "BB University", title: "B.S. in Bioinformatics" },
    "demo-work-cc": { organization: "DD Company", title: "Product Intern" },
    "demo-work-dd": { organization: "CC Company", title: "Data Analyst Intern" },
    "demo-activity-tea": { organization: "Tomorrow Oolong Tea - Xiaohongshu Account", title: "Content Operations" },
    "demo-skills": { organization: "Skills & Languages", title: "" }
  };
  const localizedVersions: Record<string, { name: string; tags: string[]; bullets: string[] }> = {
    "demo-edu-bb-default": { name: "Default Version", tags: [], bullets: ["Completed coursework in data analysis, machine learning, and data visualization."] },
    "demo-edu-aa-default": { name: "Default Version", tags: [], bullets: ["Completed foundational coursework in bioinformatics, statistics, and programming."] },
    "demo-cc-product": { name: "Product Version", tags: ["Product", "User Research"], bullets: ["Synthesized user requirements and supported product improvements, helping launch a core feature."] },
    "demo-cc-data": { name: "Data Version", tags: ["Data Analysis", "Product Analytics"], bullets: ["Analyzed user behavior data to provide evidence for product feature improvements."] },
    "demo-dd-data": { name: "Data Version", tags: ["Data Analysis", "SQL"], bullets: ["Used SQL to analyze business data and produced recurring performance reports."] },
    "demo-dd-product": { name: "Product Version", tags: ["Product Analytics", "User Growth"], bullets: ["Identified user conversion issues through data analysis and proposed product optimization opportunities."] },
    "demo-tea-content": { name: "Product Version", tags: ["Content Operations", "Social Media"], bullets: ["Owned content planning and publishing, growing the account to more than 5,000 followers within one year."] },
    "demo-tea-data": { name: "Data Version", tags: ["Data Operations", "User Growth"], bullets: ["Optimized content topics using performance data, increasing average engagement by approximately 30%."] },
    "demo-skills-data": { name: "Data Version", tags: ["Skills"], bullets: ["Python, SQL, Excel, Tableau", "Data analysis, product analytics, foundational machine learning", "Chinese: Native; English: Professional proficiency"] },
    "demo-skills-product": { name: "Product Version", tags: ["Skills"], bullets: ["Excel, SQL, Tableau, Python", "Product analytics, user research, data analysis", "Chinese: Native; English: Professional proficiency"] }
  };

  workspace.experiences = workspace.experiences.map((experience) => ({
    ...experience,
    ...localizedExperiences[experience.id],
    versions: experience.versions.map((version) => {
      const localized = localizedVersions[version.id];
      return localized
        ? {
            ...version,
            name: localized.name,
            tags: localized.tags,
            bullets: version.bullets.map((bullet, index) => ({
              ...bullet,
              text: localized.bullets[index] ?? ""
            }))
          }
        : version;
    })
  }));

  const localizeResume = (resume: ResumeDocument) => ({
    ...resume,
    name: resume.id === "demo-resume-data" ? "Cynthia Wang - Data Analyst Resume" : "Cynthia Wang - Product Resume",
    targetRoles: resume.id === "demo-resume-data" ? ["Data Analyst"] : ["Product Analyst", "Product Manager"],
    sections: resume.sections.map((section) => ({
      ...section,
      title: section.category === "education"
        ? "Education"
        : section.category === "work"
          ? "Internship Experience"
          : section.category === "activity"
            ? "Campus Experience"
            : section.category === "custom"
              ? "Skills & Languages"
              : section.title
    }))
  });

  workspace.resume = localizeResume(workspace.resume);
  workspace.savedResumeConfigurations = workspace.savedResumeConfigurations.map((configuration) => ({
    ...configuration,
    name: configuration.id === "demo-config-data" ? "Data Analyst Resume" : "Product Resume",
    resume: localizeResume(configuration.resume)
  }));
  return workspace;
}

export function createDemoWorkspaceData(locale: DemoLocale = "zh"): WorkspaceData {
  return locale === "en"
    ? createEnglishDemoWorkspace()
    : structuredClone(chineseDemoWorkspaceData);
}

export const demoWorkspaceData = createDemoWorkspaceData("zh");
