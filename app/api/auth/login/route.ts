import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { verifyPassword, signSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await db.pengguna.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Akun dengan email tersebut tidak ditemukan.' },
        { status: 401 }
      );
    }

    // Verifikasi password
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Buat session token
    const token = signSession({
      id: user.id,
      email: user.email,
      nama: user.nama,
      levelAkses: user.levelAkses,
      avatarUrl: user.avatarUrl,
    });

    const role = (user.levelAkses || '').toUpperCase();
    const isMaster = role.includes('MASTER');
    const isTeacherOrAdmin = role.includes('GURU') || role.includes('ADMIN');
    const redirectUrl = isMaster ? '/admin/users' : isTeacherOrAdmin ? '/admin/siswa' : '/wali/dashboard';

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil masuk ke portal.',
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        levelAkses: user.levelAkses,
        avatarUrl: user.avatarUrl,
      },
      redirectUrl,
    });

    // Pasang cookie HTTP-Only
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error: any) {
    console.error('Error saat login:', error);
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan: ${error.message}` },
      { status: 500 }
    );
  }
}

