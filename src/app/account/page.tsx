import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "../../../auth";
import { prisma, isDatabaseConfigured } from "../../lib/db";
import ProfileForm from "./ProfileForm";
import SignOutButton from "../../components/SignOutButton";

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

  // A cookie issued before roles existed carries no role claim and defaults to
  // "user". Confirm against the admin table so those sessions are recognised
  // rather than being told to sign out.
  const adminRecord =
    session.user.role !== "admin" && isDatabaseConfigured()
      ? await prisma.adminUser
          .findUnique({
            where: { id: session.user.id },
            select: { id: true },
          })
          .catch(() => null)
      : null;

  // Admins keep their own office; this page is for public members.
  if (session.user.role === "admin" || adminRecord) {
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

  // A signed-in session with no member record behind it — most often a cookie
  // issued before the roles existed, or an account since removed.
  //
  // This must NOT redirect to /login: that page bounces any signed-in visitor
  // straight back here, and the two would ping-pong forever (the page appeared
  // to "shake"). Signing the stale session out is what actually resolves it.
  if (!member) {
    return (
      <section className="mx-auto max-w-md py-6 text-center">
        <div className="site-panel p-6 sm:p-8">
          <p className="eyebrow text-brand-primary">Session</p>
          <h1 className="mt-2 text-xl font-semibold">
            Your session needs refreshing
          </h1>
          <p className="text-brand-muted mt-2 text-sm leading-6">
            We couldn&apos;t load your profile with this sign-in. Sign out and
            sign in again to continue.
          </p>
          <div className="mt-5 flex justify-center">
            <SignOutButton label="Sign out and start again" callbackUrl="/login" />
          </div>
        </div>
      </section>
    );
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
