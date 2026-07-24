'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Nếu người dùng nhập mã sinh viên (không có @), tự động thêm hậu tố email
    const finalEmail = email.includes('@') ? email : `${email}@student.vmu.edu.vn`

    const { error } = isSignUp
      ? await authClient.signUp.email({ email: finalEmail, password, name })
      : await authClient.signIn.email({ email: finalEmail, password })

    setLoading(false)

    if (error) {
      let errorMsg = error.message ?? 'Đã có lỗi xảy ra'
      
      // Dịch các lỗi phổ biến từ Better Auth
      if (errorMsg.includes('Invalid email or password')) {
        errorMsg = 'Mã sinh viên / Email hoặc mật khẩu không chính xác'
      } else if (errorMsg.includes('User already exists')) {
        errorMsg = 'Tài khoản này đã tồn tại'
      } else if (errorMsg.includes('Password must be at least')) {
        errorMsg = 'Mật khẩu phải dài ít nhất 8 ký tự'
      }

      setError(errorMsg)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Optional: Add some subtle background decoration here if needed */}
      <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-900/[0.04]" />
      
      <Card className="w-full max-w-md p-8 border-none shadow-none sm:shadow-xl sm:border-solid sm:border-border/50 bg-background/50 sm:bg-card/50 dark:bg-white/[0.03] dark:sm:bg-white/[0.05] dark:sm:border-white/10 backdrop-blur-md z-10">
        <div className="flex flex-col items-center mb-8 text-center space-y-4">
          <Image 
            src="/logo.webp" 
            alt="VMU Logo" 
            width={100} 
            height={100} 
            className="mb-2"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground uppercase">
              TRƯỜNG ĐẠI HỌC HÀNG HẢI VIỆT NAM
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
              Hệ thống theo dõi điểm & học phí sinh viên
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Họ tên</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">Mã sinh viên / Email</label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: 93321 hoặc email@gmail.com"
              required
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 text-base bg-blue-500 hover:bg-blue-600 text-white transition-colors mt-2">
            {loading
              ? 'Vui lòng chờ...'
              : isSignUp
                ? 'Tạo tài khoản'
                : 'ĐĂNG NHẬP'}
          </Button>
        </form>

        {!isSignUp && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Quên mật khẩu, thực hiện <Link href="/forgot-password" className="text-destructive hover:underline font-medium">tại đây</Link>
          </p>
        )}

        <p className="text-sm text-muted-foreground text-center mt-4">
          {isSignUp ? 'Đã có tài khoản? ' : "Chưa có tài khoản? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Đăng nhập' : 'Đăng ký'}
          </Link>
        </p>
      </Card>
    </main>
  )
}
