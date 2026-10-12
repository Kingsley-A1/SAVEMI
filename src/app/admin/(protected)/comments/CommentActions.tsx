"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Show / Hide / Delete for one comment — works on live comments too. */
export default function CommentActions({
  id,
  status,
}: {
  id: string;
  status: "VISIBLE" | "HELD" | "HIDDEN";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(init: RequestInit, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/comments/${id}`, init).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      alert("That didn't work. Please try again.");
      return;
    }
    router.refresh();
  }

  const patch = (next: "VISIBLE" | "HIDDEN") =>
    run({
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status !== "VISIBLE" ? (
        <button type="button" disabled={busy} onClick={() => patch("VISIBLE")} className="button-primary px-2.5 py-1 text-xs">
          {status === "HELD" ? "Approve" : "Show"}
        </button>
      ) : null}
      {status !== "HIDDEN" ? (
        <button type="button" disabled={busy} onClick={() => patch("HIDDEN")} className="button-tertiary px-2.5 py-1 text-xs">
          Hide
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => run({ method: "DELETE" }, "Delete this comment and its replies permanently?")}
        className="px-1.5 text-xs"
        style={{ color: "var(--state-attention)" }}
      >
        Delete
      </button>
    </div>
  );
}
