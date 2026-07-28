import TeamMemberForm, { emptyTeamMember } from "../TeamMemberForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Team Member | SAVEMI Admin",
};

export default function NewTeamMemberPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Team Member</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Add someone serving in the ministry. Choose their role band to place
          them in the hierarchy on the public team page.
        </p>
      </div>

      <TeamMemberForm mode="create" initial={emptyTeamMember()} />
    </div>
  );
}
