import Image from "next/image";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Image
        src="/images/logo.jpg"
        alt="SAVEMI"
        width={56}
        height={56}
        className="h-14 w-14 rounded-full object-cover"
        priority
      />
      <div
        className="mt-5 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "rgba(10,79,60,0.08)" }}
      >
        <WifiOff size={18} style={{ color: "var(--brand-primary)" }} />
      </div>
      <h1 className="section-title mt-4">You&apos;re offline</h1>
      <p className="section-copy mt-2 max-w-sm">
        SAVEMI couldn&apos;t reach the network. Reconnect and try again — the
        ministry will be right here waiting.
      </p>
      <a href="/" className="button-primary mt-6">
        Try again
      </a>
    </div>
  );
}
