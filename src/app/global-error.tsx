"use client";

/**
 * Last line of defence: an error thrown by the root layout itself.
 *
 * This replaces the whole document, so it renders its own <html>/<body> and
 * cannot rely on the app's stylesheet — the layout that loads it is exactly
 * what failed. Everything here is inline and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f6f2e8",
          color: "#16352b",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: "28rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0a4f3c",
            }}
          >
            SAVEMI
          </p>

          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "24px",
              lineHeight: 1.25,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            The site could not be loaded
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: "15px",
              lineHeight: 1.65,
              color: "#5a7268",
            }}
          >
            Something went wrong before the page could start. Reloading usually
            resolves it. If it keeps happening, please let the ministry know.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "28px",
              padding: "12px 26px",
              border: 0,
              cursor: "pointer",
              background: "#0a4f3c",
              color: "#f1e7c9",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Reload the page
          </button>

          {error.digest ? (
            <p
              style={{
                margin: "24px 0 0",
                fontSize: "12px",
                color: "#5a7268",
              }}
            >
              Reference code:{" "}
              <code style={{ fontWeight: 600 }}>{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
