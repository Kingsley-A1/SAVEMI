import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "../../../auth";
import { prisma, isDatabaseConfigured } from "../../lib/db";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your SAVEMI account.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  // Admins keep their own office; this page is for public members.
  if (session.user.role === "admin") {
    return (
      <section className="space-y-4">
        <div className="site-panel p-5 sm:p-7">
          <p className="eyebrow text-brand-primary">Account</p>
          <h1 className="section-title mt-2">You are signed in as an admin</h1>
          <p className="section-copy mt-2">
            Admin accounts are managed from the ministry office.
          </p>
          <Link
            href="/admin"
            className="button-primary mt-5 inline-flex items-center gap-1.5"
          >
            <ShieldCheck size={15} />
            Go to the admin office
          </Link>
        </div>
      </section>
    );
  }

  const member = isDatabaseConfigured()
    ? await prisma.siteUser
        .findUnique({
          where: { id: session.user.id },
          select: { email: true, name: true, createdAt: true },
        })
        .catch(() => null)
    : null;

  if (!member) {
    redirect("/login?callbackUrl=/account");
  }

  const joined = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  }).format(member.createdAt);

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="site-panel p-5 sm:p-7">
        <p className="eyebrow text-brand-primary">My account</p>
        <h1 className="section-title mt-2">Welcome, {member.name}</h1>
        <p className="section-copy mt-2">
          Member since {joined}. Grace and peace be with you.
        </p>
      </div>

      <ProfileForm initialName={member.name} email={member.email} />
    </section>
  );
}
