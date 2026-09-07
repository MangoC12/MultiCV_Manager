import type { CandidateProfile, ExperienceCategory, ImportedExperienceDraft, ImportSessionDraft } from "@/types/resume";

type DraftInput = Omit<ImportedExperienceDraft, "id">;
type SessionInput = Omit<ImportSessionDraft, "id">;

const bulletPattern = /^(\s*[-*•·]\s+|\s*\d+[.)]\s+)/;
const datePattern = /((?:19|20)\d{2}(?:[./-](?:0?[1-9]|1[0-2]))?)\s*(?:-|—|–|至|到|~)\s*((?:19|20)\d{2}(?:[./-](?:0?[1-9]|1[0-2]))?|Present|Now|至今|现在)/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?86[-\s]?)?(?:1[3-9]\d{9}|\d{3,4}[-\s]?\d{7,8})/;
const sectionHeadingPattern = /^(个人信息|基本信息|求职意向|教育背景|教育经历|工作经历|实习经历|项目经历|研究经历|校园经历|社团经历|获奖经历|荣誉奖项|技能|自我评价|profile|summary|education|work experience|experience|employment|projects?|research|awards?|skills)$/i;

const normalizeDate = (value?: string) =>
  value?.replace(/\./g, "-").replace(/\//g, "-").replace(/至今|现在|Now/i, "Present").trim();

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

const inferCategory = (block: string): ExperienceCategory => {
  const text = block.toLowerCase();
  if (/教育|大学|学院|bachelor|master|phd|university|college/.test(text)) return "education";
  if (/论文|研究|research|publication|实验室|lab/.test(text)) return "research";
  if (/奖|award|honor|scholarship/.test(text)) return "award";
  if (/项目|project|workflow|系统|平台/.test(text)) return "project";
  if (/实习|intern|工作|任职|公司|company|corporation|technology/.test(text)) return "work";
  return "custom";
};

const cleanLine = (line: string) => line.replace(bulletPattern, "").replace(/\s+/g, " ").trim();

const pickValue = (text: string, labels: string[]) => {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:：]?\\s*([^\\n|｜,，;；]{1,60})`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return "";
};

const extractProfile = (text: string): CandidateProfile => {
  const firstLines = text.split("\n").filter(Boolean).slice(0, 12);
  const nameFromLabel = pickValue(text, ["姓名", "Name"]);
  const nameFromTop = firstLines.find(
    (line) =>
      !sectionHeadingPattern.test(line) &&
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      !datePattern.test(line) &&
      /^[\u4e00-\u9fa5A-Za-z·.\s]{2,32}$/.test(line)
  );

  const gender =
    pickValue(text, ["性别", "Gender"]) ||
    (/(^|[|｜,，\s])男($|[|｜,，\s])/.test(text) ? "男" : "") ||
    (/(^|[|｜,，\s])女($|[|｜,，\s])/.test(text) ? "女" : "");
  const birthDate =
    pickValue(text, ["出生年月", "出生日期", "生日", "Birth"]) ||
    text.match(/(?:19|20)\d{2}[./-](?:0?[1-9]|1[0-2])(?:[./-](?:0?[1-9]|[12]\d|3[01]))?/)?.[0] ||
    "";

  return {
    name: nameFromLabel || nameFromTop || "",
    gender,
    birthDate: normalizeDate(birthDate),
    phone: text.match(phonePattern)?.[0]?.trim() || "",
    email: text.match(emailPattern)?.[0] || "",
    location: pickValue(text, ["所在地", "现居", "城市", "Location"]),
    website: text.match(/https?:\/\/\S+|github\.com\/\S+|linkedin\.com\/\S+/i)?.[0] || "",
    summary: pickValue(text, ["自我评价", "个人总结", "Summary", "Profile"])
  };
};

const sectionCategory = (heading: string): ExperienceCategory | undefined => {
  if (/教育|education/i.test(heading)) return "education";
  if (/项目|project/i.test(heading)) return "project";
  if (/研究|research/i.test(heading)) return "research";
  if (/校园|社团|activity/i.test(heading)) return "activity";
  if (/获奖|荣誉|award|honor/i.test(heading)) return "award";
  if (/工作|实习|employment|experience/i.test(heading)) return "work";
  return undefined;
};

const splitSections = (text: string) => {
  const sections: { heading: string; lines: string[]; category?: ExperienceCategory }[] = [];
  let current: { heading: string; lines: string[]; category?: ExperienceCategory } = {
    heading: "Resume",
    lines: [],
    category: undefined
  };

  text.split("\n").forEach((line) => {
    if (sectionHeadingPattern.test(line)) {
      sections.push(current);
      current = { heading: line, lines: [], category: sectionCategory(line) };
      return;
    }
    current.lines.push(line);
  });
  sections.push(current);

  return sections.filter((section) => section.lines.join(" ").trim().length > 0);
};

const splitExperienceBlocks = (text: string) => {
  const lines = normalizeText(text).split("\n").filter(Boolean);

  const blocks: string[][] = [];
  let current: string[] = [];

  lines.forEach((line, index) => {
    const hasDate = datePattern.test(line);
    const nextIsBullet = Boolean(lines[index + 1]?.match(bulletPattern));
    const looksLikeHeading = !bulletPattern.test(line) && (hasDate || nextIsBullet);

    if (looksLikeHeading && current.length > 0) {
      blocks.push(current);
      current = [line];
      return;
    }

    current.push(line);
  });

  if (current.length > 0) blocks.push(current);
  return blocks.filter((block) => block.join(" ").length > 12);
};

const parseBlocksToDrafts = (text: string, sourceFileName: string, fallbackCategory?: ExperienceCategory): DraftInput[] => {
  const blocks = splitExperienceBlocks(text);
  const fallbackBlocks = blocks.length > 0 ? blocks : [[text.trim()]];

  return fallbackBlocks.map((block, index) => {
    const heading = block.find((line) => !bulletPattern.test(line)) ?? `导入经历 ${index + 1}`;
    const dateMatch = block.join(" ").match(datePattern);
    const bullets = block
      .filter((line) => bulletPattern.test(line))
      .map((line, bulletIndex) => ({
        id: `imported-bullet-${index}-${bulletIndex}`,
        text: cleanLine(line)
      }))
      .filter((bullet) => bullet.text.length > 0);

    const headingWithoutDate = heading.replace(datePattern, "").trim();
    const titleParts = headingWithoutDate
      .split(/\s{2,}|\s[|｜]\s|,|，/)
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      sourceFileName,
      category: fallbackCategory ?? inferCategory(block.join(" ")),
      organization: titleParts[0] || headingWithoutDate || `导入经历 ${index + 1}`,
      title: titleParts.slice(1).join(" / ") || "待补充角色",
      location: "",
      startDate: normalizeDate(dateMatch?.[1]) ?? "",
      endDate: normalizeDate(dateMatch?.[2]) ?? "",
      tags: ["导入"],
      bullets: bullets.length > 0 ? bullets : [{ id: `imported-bullet-${index}-0`, text: cleanLine(block.slice(1).join(" ")) }],
      rawText: block.join("\n")
    };
  });
};

export const parseResumeTextToDrafts = (text: string, sourceFileName: string): DraftInput[] => {
  const normalized = normalizeText(text);
  const sections = splitSections(normalized);
  const sectionDrafts = sections.flatMap((section) => {
    if (!section.category) return [];
    return parseBlocksToDrafts(section.lines.join("\n"), sourceFileName, section.category);
  });

  return sectionDrafts.length > 0 ? sectionDrafts : parseBlocksToDrafts(normalized, sourceFileName);
};

export const parseResumeTextToImportResult = (
  text: string,
  sourceFileName: string
): { session: SessionInput; drafts: DraftInput[] } => {
  const normalized = normalizeText(text);
  return {
    session: {
      sourceFileName,
      profile: extractProfile(normalized),
      rawText: normalized
    },
    drafts: parseResumeTextToDrafts(normalized, sourceFileName)
  };
};

const extractTextFromDocx = async (file: File) => {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
};

const extractTextFromPdf = async (file: File, useOcrFallback: boolean) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    pages.push(pageText);
  }

  const extracted = pages.join("\n").trim();
  if (extracted || !useOcrFallback) return extracted;

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng+chi_sim");
  const ocrPages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      ocrPages.push(result.data.text);
    }
  } finally {
    await worker.terminate();
  }

  return ocrPages.join("\n").trim();
};

export const extractTextFromFile = async (file: File, useOcrFallback: boolean) => {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".md") || lowerName.endsWith(".markdown") || lowerName.endsWith(".txt")) {
    return file.text();
  }
  if (lowerName.endsWith(".docx")) return extractTextFromDocx(file);
  if (lowerName.endsWith(".pdf")) return extractTextFromPdf(file, useOcrFallback);
  throw new Error("暂时支持 Markdown、TXT、DOCX 和 PDF 文件。");
};
