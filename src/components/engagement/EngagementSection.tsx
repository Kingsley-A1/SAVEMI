import Engagement from "./Engagement";
import { getCommentThread, getEngagementSummary } from "../../lib/comments";
import { getActiveMember } from "../../lib/member-session";
import type { ContentKind } from "../../lib/engagement";

/** Likes and comments for one published item, loaded for this viewer. */
export default async function EngagementSection({
  kind,
  targetId,
  title,
}: {
  kind: ContentKind;
  targetId: string;
  title: string;
}) {
  const member = await getActiveMember();
  const viewerId = member?.id ?? null;
  const [summary, thread] = await Promise.all([
    getEngagementSummary(kind, targetId, viewerId),
    getCommentThread(kind, targetId, viewerId),
  ]);

  return (
    <Engagement
      kind={kind}
      targetId={targetId}
      title={title}
      signedIn={Boolean(member)}
      summary={summary}
      thread={thread}
    />
  );
}
