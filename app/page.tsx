import { CreditCalculatorV2 } from '@/components/credit-calculator-v2';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tính Toán GPA Thủ công</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name || session.user.email}</span>
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
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
      <CreditCalculatorV2 />
    </div>
  );
}
