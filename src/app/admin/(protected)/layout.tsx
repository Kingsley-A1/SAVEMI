import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  // Public members share the session but hold no admin rights.
  if (session.user.role !== "admin") {
    redirect("/account");
  }

  return <>{children}</>;
}
