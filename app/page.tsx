import { CreditCalculatorV2 } from '@/components/credit-calculator-v2';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Settings, LogOut, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tính Toán GPA Thủ công</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">{session.user.name || session.user.email}</span>
            </div>
            
            {session.user.role === 'admin' && (
              <Link 
                href="/settings" 
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }), 
                  "relative group overflow-hidden border-primary/20 hover:border-primary/50 bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center gap-2"
                )}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform duration-500" />
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-700 ease-out text-primary" />
                <span className="relative font-semibold">Cài Đặt</span>
              </Link>
            )}
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
      <CreditCalculatorV2 />
    </div>
  );
}
