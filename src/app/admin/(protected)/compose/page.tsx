import { isEmailConfigured } from "../../../../lib/email";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import ComposeEmailForm from "./ComposeEmailForm";
import EmailHistoryList, { type SentEmailRow } from "./EmailHistoryList";

export const dynamic = "force-dynamic";

async function getHistory(): Promise<SentEmailRow[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const rows = await prisma.sentEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      bodyText: row.bodyText,
      scriptureReference: row.scriptureReference,
      recipients: row.recipients,
      sentCount: row.sentCount,
      failedCount: row.failedCount,
      sentByName: row.sentByName,
      sentByEmail: row.sentByEmail,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    // If the migration has not been applied yet, compose still works.
    return [];
  }
}

export default async function ComposeEmailPage() {
  const emailReady = isEmailConfigured();
  const history = await getHistory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compose Email</h1>
        <p className="text-brand-muted mt-1 text-sm">
          Send a clean, Scripture-backed message in the SAVEMI template. Every
          email carries a verse and a hopeful tone.
        </p>
      </div>

      {!emailReady ? (
        <div
          className="rounded px-4 py-3 text-sm"
          style={{
            background: "rgba(217,119,6,0.08)",
            color: "#92400e",
            border: "1px solid rgba(217,119,6,0.2)",
          }}
        >
          Email delivery is not configured yet. Add{" "}
          <code>RESEND_API_KEY</code> and <code>EMAIL_FROM</code> to your
          environment to enable sending.
        </div>
      ) : null}

      <ComposeEmailForm emailReady={emailReady} />

      <EmailHistoryList history={history} />
    </div>
  );
}
