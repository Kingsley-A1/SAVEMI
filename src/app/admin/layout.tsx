import { auth } from "../../../auth";
import { isSuperAdminEmail } from "../../lib/admin-permissions";
import AdminShell from "../../components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <AdminShell
      userName={session?.user?.name ?? "SAVEMI Admin"}
      userEmail={session?.user?.email ?? ""}
      isAuthenticated={Boolean(session)}
      isSuperAdmin={isSuperAdminEmail(session?.user?.email)}
    >
      {children}
    </AdminShell>
  );
}
