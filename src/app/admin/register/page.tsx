import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import AdminRegisterForm from "./RegisterAdminForm";

export const dynamic = "force-dynamic";

async function canBootstrapAdmin(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return true;
  }

  try {
    const adminCount = await prisma.adminUser.count();
    return adminCount === 0;
  } catch {
    return false;
  }
}

export default async function AdminRegisterPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.email);

  if (!isAuthenticated && !(await canBootstrapAdmin())) {
    redirect("/admin/login");
  }

  return (
    <AdminRegisterForm autoSignInAfterRegister={!isAuthenticated} />
  );
}
