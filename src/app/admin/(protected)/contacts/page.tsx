import { prisma, isDatabaseConfigured } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  let contacts: Awaited<ReturnType<typeof prisma.contactSubmission.findMany>> =
    [];
  if (isDatabaseConfigured()) {
    try {
      contacts = await prisma.contactSubmission.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      contacts = [];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact Submissions</h1>
        <p className="text-brand-muted mt-1 text-sm">
          {contacts.length} submission{contacts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="site-panel overflow-hidden">
        {contacts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">
              No contact submissions yet.
            </p>
          </div>
        ) : (
          <div
            className="divide-y"
            style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}
          >
            {contacts.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-brand-muted text-xs">{c.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-xs text-brand-muted">
                      {new Date(c.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {c.respondedAt ? (
                      <span
                        className="inline-block rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background: "rgba(22,163,74,0.08)",
                          color: "#15803d",
                        }}
                      >
                        Responded
                      </span>
                    ) : (
                      <span
                        className="inline-block rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{
                          background: "rgba(217,119,6,0.08)",
                          color: "#b45309",
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-5 text-brand-muted">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
