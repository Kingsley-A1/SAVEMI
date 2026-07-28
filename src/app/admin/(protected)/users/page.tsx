import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import SiteUsersManager, { type SiteUserRow } from "./SiteUsersManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Members | SAVEMI Admin",
  description: "Registered public members of the SAVEMI website.",
};

async function getSiteUsers(): Promise<SiteUserRow[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const users = await prisma.siteUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status as SiteUserRow["status"],
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function AdminSiteUsersPage() {
  const users = await getSiteUsers();
  const active = users.filter((user) => user.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Members</h1>
        <p className="text-brand-muted mt-1 text-sm">
          {users.length} registered {users.length === 1 ? "member" : "members"}
          {users.length > 0 ? ` · ${active} active` : ""}. These are people who
          signed up on the public site — they hold no admin access.
        </p>
      </div>

      <SiteUsersManager users={users} />
    </div>
  );
}
