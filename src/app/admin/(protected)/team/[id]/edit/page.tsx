import { notFound } from "next/navigation";
import { prisma, isDatabaseConfigured } from "../../../../../../lib/db";
import { resolveAssetUrl } from "../../../../../../lib/r2";
import { isTeamRole } from "../../../../../../lib/team";
import TeamMemberForm, {
  type TeamMemberFormValues,
} from "../../TeamMemberForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Team Member | SAVEMI Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamMemberPage({ params }: PageProps) {
  const { id } = await params;

  if (!isDatabaseConfigured()) notFound();

  const record = await prisma.teamMember
    .findUnique({ where: { id } })
    .catch(() => null);

  if (!record) notFound();

  const initial: TeamMemberFormValues = {
    id: record.id,
    name: record.name,
    title: record.title,
    role: isTeamRole(record.role) ? record.role : "MEMBER",
    status: record.status as TeamMemberFormValues["status"],
    sortOrder: record.sortOrder,
    bio: record.bio ?? "",
    photoKey: record.photoKey ?? "",
    photoUrl: (await resolveAssetUrl(record.photoKey)) ?? "",
    email: record.email ?? "",
    phone: record.phone ?? "",
    facebookUrl: record.facebookUrl ?? "",
    youtubeUrl: record.youtubeUrl ?? "",
    whatsappNumber: record.whatsappNumber ?? "",
    scriptureVerse: record.scriptureVerse ?? "",
    scriptureReference: record.scriptureReference ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Team Member</h1>
        <p className="text-brand-muted mt-1 text-sm">{record.name}</p>
      </div>

      <TeamMemberForm mode="edit" initial={initial} />
    </div>
  );
}
