import type { CandidateProfile, Experience } from "@/types/resume";

export function collectVersionNames(profile: CandidateProfile, experiences: Experience[]) {
  const names = [
    ...(profile.summaryVersions ?? []).map((version) => version.name),
    ...experiences.flatMap((experience) => experience.versions.map((version) => version.name))
  ];
  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)));
}

export function versionTone(name: string, knownNames: string[]) {
  const index = knownNames.indexOf(name);
  return (Math.max(index, 0) % 7) + 1;
}
