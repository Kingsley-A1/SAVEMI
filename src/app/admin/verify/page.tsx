import { Suspense } from "react";
import AdminVerifyForm from "./VerifyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Confirm your email | SAVEMI Admin",
  robots: { index: false, follow: false },
};

export default function AdminVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={null}>
        <AdminVerifyForm />
      </Suspense>
    </div>
  );
}
