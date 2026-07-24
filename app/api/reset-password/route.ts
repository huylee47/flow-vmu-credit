import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng điền đủ email và mật khẩu mới' }, { status: 400 });
    }

    // Find the user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản với email này' }, { status: 404 });
    }

    // Find the account linked to this user (we assume credentials provider is used)
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
    });

    if (!account) {
      return NextResponse.json({ error: 'Tài khoản này không đăng nhập bằng email/mật khẩu' }, { status: 400 });
    }

    // Hash the new password using bcrypt (default for better-auth)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // Update the password in the accounts table
    await db.update(accounts)
      .set({ password: hashedPassword })
      .where(eq(accounts.userId, user.id));

    return NextResponse.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Lỗi server, vui lòng thử lại sau' }, { status: 500 });
  }
}
