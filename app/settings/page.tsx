import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SettingsPanel } from '@/components/settings-panel';
import { LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "group")}
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">{session.user.email}</span>
            </div>
            <form
              action={async () => {
                'use server';
                await auth.api.signOut({ headers: await headers() });
                redirect('/sign-in');
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="group relative overflow-hidden text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-300"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="hidden sm:inline">Đăng Xuất</span>
              </Button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <SettingsPanel />
    </div>
  );
}
