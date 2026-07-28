import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your SAVEMI account.",
  alternates: { canonical: "/login" },
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/account");
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
