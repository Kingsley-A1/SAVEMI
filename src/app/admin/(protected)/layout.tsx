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

  return <>{children}</>;
}
