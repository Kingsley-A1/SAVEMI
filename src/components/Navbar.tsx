import Image from 'next/image';
import Link from 'next/link';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/messages', label: 'Messages' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-sm"
      style={{
        background: 'var(--brand-surface-strong)',
        borderBottom: '1px solid var(--brand-border)',
      }}
    >
      <div className="site-container">
        <nav
          className="flex h-14 items-center justify-between"
          aria-label="Primary navigation"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.jpg"
              alt="SAVEMI logo"
              width={30}
              height={30}
              className="rounded object-contain"
            />
            <span className="text-brand-primary text-sm font-semibold tracking-tight">
              SAVEMI
            </span>
          </Link>

          <ul className="flex items-center gap-0.5">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-brand-muted hover:text-brand-primary rounded px-3 py-1.5 text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
