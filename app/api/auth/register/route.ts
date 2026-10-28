import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { hashPassword, signSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nama = (body.nama || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const nis = (body.nis || '').trim();

    if (!nama || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama lengkap, email, dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Kata sandi minimal harus 8 karakter.' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await db.pengguna.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email tersebut sudah terdaftar di sistem. Silakan langsung masuk (login).' },
        { status: 400 }
      );
    }

    // Hash kata sandi
    const hashedPassword = hashPassword(password);

    // Buat akun wali murid baru
    const newUser = await db.pengguna.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        levelAkses: 'WALI MURID',
      },
    });

    let linkedStudentName = null;

    // Jika NIS ananda diinput, tautkan langsung ke data siswa
    if (nis) {
      const siswa = await db.siswa.findUnique({
        where: { nis },
      });

      if (siswa) {
        await db.siswa.update({
          where: { id: siswa.id },
          data: { waliId: newUser.id },
        });
        linkedStudentName = siswa.nama;
      }
    }

    // Buat session token
    const token = signSession({
      id: newUser.id,
      email: newUser.email,
      nama: newUser.nama,
      levelAkses: newUser.levelAkses,
      avatarUrl: newUser.avatarUrl,
    });

    const successMessage = linkedStudentName
      ? `Akun berhasil didaftarkan dan terhubung dengan ananda ${linkedStudentName}!`
      : 'Akun wali murid berhasil didaftarkan!';

    const response = NextResponse.json({
      success: true,
      message: successMessage,
      data: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        levelAkses: newUser.levelAkses,
      },
      redirectUrl: '/wali/dashboard',
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
    console.error('Error saat registrasi wali murid:', error);
    return NextResponse.json(
      { success: false, message: `Gagal membuat akun: ${error.message}` },
      { status: 500 }
    );
  }
}

