/**
 * Shape of the admin team-member form.
 *
 * This lives outside `TeamMemberForm.tsx` on purpose. That file is a
 * `"use client"` module, so every value it exports becomes a client reference
 * when a server component imports it — calling one on the server throws
 * ("Attempted to call emptyTeamMember() from the server"). The server pages
 * that build the form's initial values need a plain module, and this is it.
 */

import type { TeamRole, TeamStatus } from "./team";

export interface TeamMemberFormValues {
  id?: string;
  name: string;
  title: string;
  role: TeamRole;
  status: TeamStatus;
  sortOrder: number;
  bio: string;
  photoKey: string;
  photoUrl: string;
  email: string;
  phone: string;
  facebookUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  scriptureVerse: string;
  scriptureReference: string;
}

/** A blank member: the starting point for "Add team member". */
export function emptyTeamMember(): TeamMemberFormValues {
  return {
    name: "",
    title: "",
    role: "MEMBER",
    status: "DRAFT",
    sortOrder: 0,
    bio: "",
    photoKey: "",
    photoUrl: "",
    email: "",
    phone: "",
    facebookUrl: "",
    youtubeUrl: "",
    whatsappNumber: "",
    scriptureVerse: "",
    scriptureReference: "",
  };
}
