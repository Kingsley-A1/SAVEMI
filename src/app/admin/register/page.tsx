import { auth } from "../../../../auth";
import AdminRegisterForm from "./RegisterAdminForm";

export const dynamic = "force-dynamic";

export default async function AdminRegisterPage() {
  // Any email on the approved admin list (ADMIN_ALLOWED_EMAILS) may register
  // with the shared access code. The API route enforces the allow-list, so the
  // page itself no longer blocks unauthenticated visitors — that old gate was
  // what redirected genuine new admins back to the login screen.
  const session = await auth().catch(() => null);
  const isAuthenticated = Boolean(session?.user?.email);

  return <AdminRegisterForm autoSignInAfterRegister={!isAuthenticated} />;
}
