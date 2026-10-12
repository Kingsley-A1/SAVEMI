"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

/** One tap to put a hidden member on the public team page. */
export default function PublishMemberButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function publish() {
    setBusy(true);
    setFailed(false);
    const response = await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "PUBLISHED" }),
    }).catch(() => null);
    setBusy(false);

    if (!response?.ok) {
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={publish}
      disabled={busy}
      className="button-primary inline-flex shrink-0 items-center gap-1 px-2.5 py-1 text-xs"
      title={failed ? "Could not publish — try again" : undefined}
    >
      <Eye size={13} />
      {busy ? "Publishing…" : failed ? "Retry" : "Publish"}
    </button>
  );
}
