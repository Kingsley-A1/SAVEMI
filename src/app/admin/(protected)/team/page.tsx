import Link from "next/link";
import Image from "next/image";
import { Edit2, ExternalLink, PlusCircle, Users } from "lucide-react";
import PublishMemberButton from "./PublishMemberButton";
import {
  getAllTeamMembers,
  getInitials,
  TEAM_ROLE_LABEL,
  TEAM_ROLE_ORDER,
  type TeamMember,
} from "../../../../lib/team";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Team | SAVEMI Admin",
  description: "Manage the ministry team shown on the public team page.",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Public",
  DRAFT: "Hidden · Draft",
  ARCHIVED: "Hidden · Archived",
};

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  PUBLISHED: { background: "rgba(22,163,74,0.1)", color: "#15803d" },
  DRAFT: { background: "rgba(217,119,6,0.1)", color: "#b45309" },
  ARCHIVED: { background: "rgba(100,116,139,0.1)", color: "#475569" },
};

function Avatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  if (member.photoUrl) {
    return (
      <Image
        src={member.photoUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{
        width: size,
        height: size,
        background: "rgba(10,79,60,0.09)",
        color: "var(--brand-primary)",
      }}
      aria-hidden="true"
    >
      {getInitials(member.name)}
    </span>
  );
}

export default async function AdminTeamPage() {
  const members = await getAllTeamMembers();
  const hiddenCount = members.filter((m) => m.status !== "PUBLISHED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {members.length} {members.length === 1 ? "member" : "members"}
            {hiddenCount > 0 ? (
              <span style={{ color: "var(--state-attention)" }}>
                {" "}· {hiddenCount} hidden from the public page
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/team"
            target="_blank"
            className="button-tertiary flex items-center gap-1.5"
          >
            <ExternalLink size={14} /> View public page
          </Link>
          <Link
            href="/admin/team/new"
            className="button-primary flex items-center gap-1.5"
          >
            <PlusCircle size={14} /> New Member
          </Link>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="site-panel px-6 py-12 text-center">
          <Users
            size={28}
            className="mx-auto opacity-40"
            style={{ color: "var(--brand-primary)" }}
          />
          <p className="text-brand-muted mt-3 text-sm">
            No team members yet.
          </p>
          <Link
            href="/admin/team/new"
            className="button-primary mt-4 inline-flex items-center gap-1.5"
          >
            <PlusCircle size={14} /> Add the first member
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {TEAM_ROLE_ORDER.map((role) => {
            const band = members.filter((member) => member.role === role);
            if (band.length === 0) return null;

            return (
              <section key={role} className="site-panel overflow-hidden">
                <div
                  className="border-b px-5 py-3"
                  style={{ borderColor: "var(--brand-border)" }}
                >
                  <h2 className="text-sm font-semibold">
                    {TEAM_ROLE_LABEL[role]}
                  </h2>
                  <p className="text-brand-muted mt-0.5 text-xs">
                    {band.length} {band.length === 1 ? "person" : "people"}
                  </p>
                </div>

                <ul
                  className="divide-y"
                  style={{ borderColor: "var(--brand-border)" }}
                >
                  {band.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 px-4 py-3 sm:px-5"
                    >
                      <Avatar member={member} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {member.name}
                        </p>
                        <p className="text-brand-muted truncate text-xs">
                          {member.title}
                        </p>
                      </div>

                      {member.status === "PUBLISHED" ? (
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
                          style={STATUS_STYLE.PUBLISHED}
                        >
                          {STATUS_LABEL.PUBLISHED}
                        </span>
                      ) : (
                        <>
                          <span
                            className="hidden shrink-0 rounded px-2 py-0.5 text-xs font-semibold sm:inline-block"
                            style={STATUS_STYLE[member.status]}
                          >
                            {STATUS_LABEL[member.status]}
                          </span>
                          <PublishMemberButton id={member.id} />
                        </>
                      )}

                      <span className="text-brand-muted hidden shrink-0 text-xs sm:inline">
                        #{member.sortOrder}
                      </span>

                      <Link
                        href={`/admin/team/${member.id}/edit`}
                        className="text-brand-muted hover:text-brand-primary inline-flex shrink-0 items-center gap-1 text-xs"
                      >
                        <Edit2 size={13} /> Edit
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
