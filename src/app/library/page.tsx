import { AppShell } from "@/components/AppShell";
import { ExperienceLibrary } from "@/components/ExperienceLibrary";
import { ProfilePanel } from "@/components/ProfilePanel";

export default function LibraryPage() {
  return (
    <AppShell>
      <div className="libraryWorkspace">
        <ProfilePanel />
        <ExperienceLibrary />
      </div>
    </AppShell>
  );
}
