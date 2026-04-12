import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import AppShell from "../components/AppShell";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "SAVEMI Ministry",
  description:
    "Sabbath Vesper Ministry sharing repose, renewal, and restoration through reflective worship.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell header={<Navbar />} footer={<Footer />}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
