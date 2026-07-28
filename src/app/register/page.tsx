import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Join the SAVEMI family to keep up with Sabbath messages, reflections, and resources.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/account");
  }

  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
