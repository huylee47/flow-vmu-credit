'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Nếu nhập mã sinh viên (không có @), tự động ghép đuôi email
      const finalEmail = email.includes('@') ? email : `${email}@student.vmu.edu.vn`

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: finalEmail, newPassword }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Đã có lỗi xảy ra')
      } else {
        setSuccess('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.')
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
      }
    } catch (err) {
      setError('Lỗi kết nối tới server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
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
              KHÔI PHỤC MẬT KHẨU
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-medium">
              Nhập email của bạn và mật khẩu mới
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">Mã sinh viên / Email đã đăng ký</label>
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
            <label htmlFor="newPassword" className="text-sm font-medium">Mật khẩu mới</label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-500 font-medium" role="alert">
              {success}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 text-base bg-blue-500 hover:bg-blue-600 text-white transition-colors mt-2">
            {loading ? 'Vui lòng chờ...' : 'ĐỔI MẬT KHẨU'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-8">
          Đã nhớ lại mật khẩu? <Link href="/sign-in" className="text-blue-500 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </Card>
    </main>
  )
}
