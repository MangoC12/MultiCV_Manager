"use client";

import { ResumeBuilder } from "@/components/ResumeBuilder";
import { ResumePreview } from "@/components/ResumePreview";

export function BuilderWorkspace() {
  return (
    <div className="builderWorkspace">
      <ResumeBuilder />
      <ResumePreview />
    </div>
  );
}
