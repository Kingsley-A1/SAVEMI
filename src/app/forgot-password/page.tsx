import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Reset the password on your SAVEMI account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const session = await auth();

  // Already signed in: the profile page is the place to change a password.
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/account");
  }

  return <ForgotPasswordForm />;
}
