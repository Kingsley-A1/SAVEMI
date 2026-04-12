import { auth } from "../../../auth";
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
      isAuthenticated={Boolean(session)}
    >
      {children}
    </AdminShell>
  );
}
