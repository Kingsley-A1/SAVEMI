import { auth } from "../../../../../auth";
import {
  getConfiguredSuperAdminEmail,
  isSuperAdminEmail,
} from "../../../../lib/admin-permissions";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import AdminUsersManager, { AdminUserRow } from "./AdminUsersManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Users | SAVEMI Admin",
  description: "Manage SAVEMI admin accounts.",
};

async function getAdmins(
  currentUserId: string | undefined,
): Promise<AdminUserRow[]> {
  if (!isDatabaseConfigured()) return [];

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const auditByAdmin = new Map<
    string,
    { count: number; lastAction: string | null; lastActionAt: Date | null }
  >();

  try {
    const auditEvents = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        adminId: true,
        action: true,
        createdAt: true,
      },
    });

    for (const event of auditEvents) {
      const existing = auditByAdmin.get(event.adminId);
      if (existing) {
        existing.count += 1;
        continue;
      }

      auditByAdmin.set(event.adminId, {
        count: 1,
        lastAction: event.action,
        lastActionAt: event.createdAt,
      });
    }
  } catch {
    // If the audit migration has not been applied, admin management still works.
  }

  return admins.map((admin) => {
    const audit = auditByAdmin.get(admin.id);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
      auditCount: audit?.count ?? 0,
      lastAction: audit?.lastAction ?? null,
      lastActionAt: audit?.lastActionAt?.toISOString() ?? null,
      isSuperAdmin: isSuperAdminEmail(admin.email),
      isCurrentUser: admin.id === currentUserId,
    };
  });
}

export default async function AdminUsersPage() {
  const session = await auth();
  const isSuperAdmin = isSuperAdminEmail(session?.user?.email);

  if (!isSuperAdmin) {
    return (
      <div className="site-panel p-6">
        <h1 className="text-2xl font-semibold">Admin Users</h1>
        <p className="text-brand-muted mt-2 text-sm">
          Super admin access is required to manage admin accounts.
        </p>
      </div>
    );
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6">
        <h1 className="text-2xl font-semibold">Admin Users</h1>
        <p className="text-brand-muted mt-2 text-sm">Database not configured.</p>
      </div>
    );
  }

  const admins = await getAdmins(session?.user?.id);
  const superAdminEmail = getConfiguredSuperAdminEmail();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Users</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Create, edit, and remove admin accounts under the configured super
          admin boundary.
        </p>
      </div>

      <AdminUsersManager admins={admins} superAdminEmail={superAdminEmail} />
    </div>
  );
}
