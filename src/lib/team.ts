/**
 * Ministry team data access.
 *
 * The public /team page is ordered by role hierarchy, then by the manual
 * sortOrder inside each band, then by name. ANCHOR is the head of the
 * ministry and is rendered as the lead card; everyone else follows in the
 * order declared by TEAM_ROLE_ORDER.
 */

import { isDatabaseConfigured, prisma } from "./db";
import { resolveAssetUrl } from "./r2";

export type TeamRole =
  | "ANCHOR"
  | "PASTOR"
  | "ELDER"
  | "COORDINATOR"
  | "MEDIA"
  | "MEMBER";

export type TeamStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Hierarchy, most senior first. This array is the single source of order. */
export const TEAM_ROLE_ORDER: readonly TeamRole[] = [
  "ANCHOR",
  "PASTOR",
  "ELDER",
  "COORDINATOR",
  "MEDIA",
  "MEMBER",
];

/** Singular label for a person holding the role. */
export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  ANCHOR: "Ministry Anchor",
  PASTOR: "Pastoral Team",
  ELDER: "Elder",
  COORDINATOR: "Coordinator",
  MEDIA: "Media & Production",
  MEMBER: "Ministry Team",
};

/** Heading used for the group section on the public page. */
export const TEAM_ROLE_GROUP_HEADING: Record<TeamRole, string> = {
  ANCHOR: "Ministry Anchor",
  PASTOR: "Pastoral Team",
  ELDER: "Elders",
  COORDINATOR: "Ministry Coordinators",
  MEDIA: "Media & Production",
  MEMBER: "Ministry Team",
};

export function isTeamRole(value: unknown): value is TeamRole {
  return (
    typeof value === "string" && TEAM_ROLE_ORDER.includes(value as TeamRole)
  );
}

export function teamRoleRank(role: TeamRole): number {
  const index = TEAM_ROLE_ORDER.indexOf(role);
  return index === -1 ? TEAM_ROLE_ORDER.length : index;
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: TeamRole;
  title: string;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
  scriptureVerse: string | null;
  scriptureReference: string | null;
  sortOrder: number;
  status: TeamStatus;
}

export interface TeamGroup {
  role: TeamRole;
  heading: string;
  members: TeamMember[];
}

interface TeamMemberRecord {
  id: string;
  slug: string;
  name: string;
  role: TeamRole;
  title: string;
  bio: string | null;
  photoKey: string | null;
  email: string | null;
  phone: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  whatsappNumber: string | null;
  scriptureVerse: string | null;
  scriptureReference: string | null;
  sortOrder: number;
  status: TeamStatus;
}

/** Accept either a full wa.me link or a bare number with country code. */
function toWhatsAppUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

async function toTeamMember(record: TeamMemberRecord): Promise<TeamMember> {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    role: record.role,
    title: record.title,
    bio: record.bio,
    photoUrl: await resolveAssetUrl(record.photoKey),
    email: record.email,
    phone: record.phone,
    facebookUrl: record.facebookUrl,
    youtubeUrl: record.youtubeUrl,
    whatsappUrl: toWhatsAppUrl(record.whatsappNumber),
    scriptureVerse: record.scriptureVerse,
    scriptureReference: record.scriptureReference,
    sortOrder: record.sortOrder,
    status: record.status,
  };
}

const teamSelect = {
  id: true,
  slug: true,
  name: true,
  role: true,
  title: true,
  bio: true,
  photoKey: true,
  email: true,
  phone: true,
  facebookUrl: true,
  youtubeUrl: true,
  whatsappNumber: true,
  scriptureVerse: true,
  scriptureReference: true,
  sortOrder: true,
  status: true,
} as const;

/**
 * Published members, ordered by hierarchy. Role ordering is applied in code
 * rather than SQL because the enum's declaration order is the hierarchy and
 * we want that intent to live in TEAM_ROLE_ORDER, not in a database detail.
 */
export async function getPublishedTeam(): Promise<TeamMember[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const records = await prisma.teamMember.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: teamSelect,
    });

    const members = await Promise.all(
      (records as TeamMemberRecord[]).map(toTeamMember),
    );

    return members.sort(
      (a, b) =>
        teamRoleRank(a.role) - teamRoleRank(b.role) ||
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );
  } catch {
    // A team outage must never take the public site down.
    return [];
  }
}

/** Published members grouped into role bands, empty bands omitted. */
export async function getTeamGroups(): Promise<TeamGroup[]> {
  const members = await getPublishedTeam();

  return TEAM_ROLE_ORDER.map((role) => ({
    role,
    heading: TEAM_ROLE_GROUP_HEADING[role],
    members: members.filter((member) => member.role === role),
  })).filter((group) => group.members.length > 0);
}

/** Every member regardless of status — for the admin office. */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const records = await prisma.teamMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: teamSelect,
    });

    const members = await Promise.all(
      (records as TeamMemberRecord[]).map(toTeamMember),
    );

    return members.sort(
      (a, b) =>
        teamRoleRank(a.role) - teamRoleRank(b.role) ||
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name),
    );
  } catch {
    return [];
  }
}

export async function getTeamMemberById(
  id: string,
): Promise<TeamMember | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const record = await prisma.teamMember.findUnique({
      where: { id },
      select: teamSelect,
    });

    return record ? toTeamMember(record as TeamMemberRecord) : null;
  } catch {
    return null;
  }
}

/** Initials used when a member has no photo. */
export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => /[a-z]/i.test(part));

  if (parts.length === 0) return "SV";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

  return (first + last).toUpperCase();
}
