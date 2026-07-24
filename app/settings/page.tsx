import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SettingsPanel } from '@/components/settings-panel';

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <form
              action={async () => {
                'use server';
                await auth.api.signOut({ headers: await headers() });
                redirect('/sign-in');
              }}
            >
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
      <SettingsPanel />
    </div>
  );
}
