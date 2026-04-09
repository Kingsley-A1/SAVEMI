import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div className="flex min-h-screen" style={{ background: '#f3efe4' }}>
      <AdminSidebar userName={session.user?.name ?? 'Admin'} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
