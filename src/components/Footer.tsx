export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--brand-surface-strong)',
        borderTop: '1px solid var(--brand-border)',
      }}
    >
      <div className="site-container py-5">
        <div className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-brand-primary font-semibold">SAVEMI Ministry</p>
            <p className="text-brand-muted mt-0.5">
              Sabbath Vesper Ministry — Repose · Renewal · Restoration
            </p>
          </div>
          <p className="text-brand-muted">
            &copy; {new Date().getFullYear()} SAVEMI Ministry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
