"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import AuthSheet from "./AuthSheet";
import type { CommentView, EngagementSummary } from "../../lib/comments";
import type { ContentKind } from "../../lib/engagement";

const COLLAPSED_COUNT = 3;

type Pending = () => Promise<void>;
interface Deferred {
  action: Pending;
  /** Settles the caller's promise once the action ran — or was abandoned. */
  settle: () => void;
}

/* ── Small pieces ───────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "•";
}

function LikeToggle({
  liked,
  count,
  onToggle,
  size = "sm",
  label,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  size?: "sm" | "md";
  label: string;
}) {
  const icon = size === "md" ? 18 : 14;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={liked}
      aria-label={liked ? `Unlike ${label}` : `Like ${label}`}
      className={`inline-flex items-center gap-1.5 rounded-full transition-colors ${
        size === "md" ? "px-3 py-1.5 text-sm" : "text-xs"
      } ${liked ? "" : "text-brand-muted hover:text-brand-primary"}`}
      style={{
        ...(liked ? { color: "#c2410c" } : {}),
        ...(size === "md" ? { border: "1px solid var(--brand-border)" } : {}),
      }}
    >
      <Heart size={icon} className={liked ? "fill-current" : ""} />
      {count > 0 ? <span className="tabular-nums">{count}</span> : size === "md" ? "Like" : null}
    </button>
  );
}

function Composer({
  placeholder,
  initial = "",
  autoFocus,
  onSubmit,
  onCancel,
  compact,
}: {
  placeholder: string;
  initial?: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<boolean>;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const active = body.trim().length > 0;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!active) return;
        setBusy(true);
        const ok = await onSubmit(body.trim());
        setBusy(false);
        if (ok) setBody("");
      }}
    >
      <textarea
        className="field-input resize-none"
        rows={active || !compact ? 2 : 1}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={1500}
        autoFocus={autoFocus}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {active || onCancel ? (
        <div className="mt-2 flex justify-end gap-2">
          {onCancel ? (
            <button type="button" onClick={onCancel} className="text-brand-muted px-2 text-xs hover:text-brand-primary">
              Cancel
            </button>
          ) : null}
          <button type="submit" disabled={busy || !active} className="button-primary px-3 py-1.5 text-xs">
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

/* ── One comment ────────────────────────────────────────────── */

function CommentItem({
  comment,
  isReply,
  onLike,
  onReply,
  onDelete,
  onReport,
  children,
}: {
  comment: CommentView;
  isReply?: boolean;
  onLike: (c: CommentView) => void;
  onReply?: (c: CommentView) => void;
  onDelete: (c: CommentView) => void;
  onReport: (c: CommentView) => void;
  children?: React.ReactNode;
}) {
  const [reported, setReported] = useState(false);

  return (
    <li className="flex gap-3">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${
          isReply ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"
        }`}
        style={{ background: "rgba(10,79,60,0.09)", color: "var(--brand-primary)" }}
        aria-hidden="true"
      >
        {initials(comment.authorName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs">
          <span className="font-semibold">{comment.authorName}</span>
          <span className="text-brand-muted"> · {timeAgo(comment.createdAt)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-6">{comment.body}</p>

        {comment.pending ? (
          <p className="text-brand-muted mt-1 text-xs italic">Awaiting review — only you can see this.</p>
        ) : (
          <div className="mt-1 flex items-center gap-4">
            <LikeToggle liked={comment.liked} count={comment.likeCount} onToggle={() => onLike(comment)} label="comment" />
            {onReply ? (
              <button type="button" onClick={() => onReply(comment)} className="text-brand-muted text-xs hover:text-brand-primary">
                Reply
              </button>
            ) : null}
            {comment.isMine ? (
              <button type="button" onClick={() => onDelete(comment)} className="text-brand-muted text-xs hover:text-brand-primary">
                Delete
              </button>
            ) : reported ? (
              <span className="text-brand-muted text-xs">Reported</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setReported(true);
                  onReport(comment);
                }}
                className="text-brand-muted text-xs opacity-70 hover:text-brand-primary hover:opacity-100"
              >
                Report
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </li>
  );
}

/* ── The panel ──────────────────────────────────────────────── */

export default function Engagement({
  kind,
  targetId,
  title,
  signedIn: initiallySignedIn,
  summary,
  thread: initialThread,
}: {
  kind: ContentKind;
  targetId: string;
  title: string;
  signedIn: boolean;
  summary: EngagementSummary;
  thread: CommentView[];
}) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(initiallySignedIn);
  const [liked, setLiked] = useState(summary.liked);
  const [likeCount, setLikeCount] = useState(summary.likeCount);
  const [thread, setThread] = useState(initialThread);
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [sheet, setSheet] = useState<{ open: boolean; reason: string }>({ open: false, reason: "" });
  const pending = useRef<Deferred | null>(null);
  const commentsRef = useRef<HTMLElement>(null);

  const visibleCount = thread.reduce(
    (n, c) => n + (c.pending ? 0 : 1) + c.replies.filter((r) => !r.pending).length,
    0,
  );

  /** Run an action now if signed in; otherwise after the quick sign-in. */
  const requireMember = useCallback(
    async (reason: string, action: Pending) => {
      if (signedIn) {
        await action();
        return;
      }
      await new Promise<void>((settle) => {
        pending.current = { action, settle };
        setSheet({ open: true, reason });
      });
    },
    [signedIn],
  );

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/comments?kind=${kind}&id=${encodeURIComponent(targetId)}`, {
      cache: "no-store",
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { data?: CommentView[] } | null;
    if (data?.data) setThread(data.data);
  }, [kind, targetId]);

  async function call(url: string, init: RequestInit): Promise<Response | null> {
    const response = await fetch(url, init).catch(() => null);
    if (response?.status === 401) {
      setSignedIn(false);
      setSheet({ open: true, reason: "Your session ended. Sign in again to continue." });
      return null;
    }
    return response;
  }

  async function toggleLike(targetKind: string, id: string): Promise<{ liked: boolean; count: number } | null> {
    const response = await call("/api/likes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: targetKind, id }),
    });
    if (!response?.ok) return null;
    return (await response.json()) as { liked: boolean; count: number };
  }

  const likeContent = () =>
    requireMember("Sign in to like this — it takes a few seconds.", async () => {
      // Optimistic, then reconciled with the server's count.
      setLiked((v) => !v);
      setLikeCount((n) => n + (liked ? -1 : 1));
      const result = await toggleLike(kind, targetId);
      if (result) {
        setLiked(result.liked);
        setLikeCount(result.count);
      }
    });

  const likeComment = (comment: CommentView) =>
    requireMember("Sign in to like comments.", async () => {
      const result = await toggleLike("COMMENT", comment.id);
      if (!result) return;
      const apply = (c: CommentView): CommentView =>
        c.id === comment.id
          ? { ...c, liked: result.liked, likeCount: result.count }
          : { ...c, replies: c.replies.map(apply) };
      setThread((t) => t.map(apply));
    });

  async function post(body: string, parentId?: string): Promise<boolean> {
    let ok = false;
    await requireMember("Sign in to share your thoughts — no password needed.", async () => {
      const response = await call("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id: targetId, body, parentId }),
      });
      if (!response) return;
      const data = (await response.json().catch(() => null)) as { pending?: boolean; error?: string } | null;
      if (!response.ok) {
        setNotice(data?.error ?? "Your comment couldn't be posted. Please try again.");
        return;
      }
      setNotice(data?.pending ? "Thanks — your comment will appear once it's reviewed." : "");
      setReplyTo(null);
      setExpanded(true);
      ok = true;
      await refresh();
    });
    return ok;
  }

  async function remove(comment: CommentView) {
    if (!confirm("Delete your comment?")) return;
    const response = await call(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (response?.ok) await refresh();
  }

  async function report(comment: CommentView) {
    await requireMember("Sign in to report a comment.", async () => {
      await call(`/api/comments/${comment.id}/report`, { method: "POST" });
    });
  }

  const shown = expanded ? thread : thread.slice(0, COLLAPSED_COUNT);

  return (
    <>
      <div className="flex items-center gap-2">
        <LikeToggle liked={liked} count={likeCount} onToggle={likeContent} size="md" label={title} />
        <button
          type="button"
          onClick={() => commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="text-brand-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:text-brand-primary"
          style={{ border: "1px solid var(--brand-border)" }}
        >
          <MessageCircle size={18} />
          {visibleCount > 0 ? <span className="tabular-nums">{visibleCount}</span> : "Comment"}
        </button>
      </div>

      <section
        ref={commentsRef}
        aria-labelledby="comments-heading"
        className="site-panel mt-4 scroll-mt-24 p-4 sm:p-6"
      >
        <h2 id="comments-heading" className="text-base font-semibold">
          Comments{visibleCount > 0 ? <span className="text-brand-muted font-normal"> · {visibleCount}</span> : null}
        </h2>

        <div className="mt-3">
          <Composer placeholder="Share a thought…" compact onSubmit={(body) => post(body)} />
          {notice ? <p className="text-brand-muted mt-2 text-xs" role="status">{notice}</p> : null}
        </div>

        {thread.length > 0 ? (
          <ul className="mt-5 space-y-5">
            {shown.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={likeComment}
                onReply={(c) => setReplyTo((current) => (current === c.id ? null : c.id))}
                onDelete={remove}
                onReport={report}
              >
                {comment.replies.length > 0 ? (
                  <ul className="mt-3 space-y-3 border-l pl-3" style={{ borderColor: "var(--brand-border)" }}>
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        onLike={likeComment}
                        onDelete={remove}
                        onReport={report}
                      />
                    ))}
                  </ul>
                ) : null}
                {replyTo === comment.id ? (
                  <div className="mt-3">
                    <Composer
                      placeholder={`Reply to ${comment.authorName}…`}
                      autoFocus
                      onSubmit={(body) => post(body, comment.id)}
                      onCancel={() => setReplyTo(null)}
                    />
                  </div>
                ) : null}
              </CommentItem>
            ))}
          </ul>
        ) : (
          <p className="text-brand-muted mt-4 text-sm">Be the first to share a thought.</p>
        )}

        {!expanded && thread.length > COLLAPSED_COUNT ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-brand-primary mt-4 text-sm font-medium"
          >
            Show all {thread.length} comments
          </button>
        ) : null}
      </section>

      <AuthSheet
        open={sheet.open}
        reason={sheet.reason}
        onClose={() => {
          pending.current?.settle();
          pending.current = null;
          setSheet({ open: false, reason: "" });
        }}
        onSignedIn={async () => {
          setSheet({ open: false, reason: "" });
          setSignedIn(true);
          const deferred = pending.current;
          pending.current = null;
          // The session cookie is set; carry on with what they were doing.
          if (deferred) {
            await deferred.action();
            deferred.settle();
          }
          await refresh();
          router.refresh();
        }}
      />
    </>
  );
}
