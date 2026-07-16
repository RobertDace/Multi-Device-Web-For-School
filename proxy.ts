import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('sb-access-token');
  const path = request.nextUrl.pathname;

  // 💡 Daftar email yang diberi hak akses sebagai ADMIN super
  const ADMIN_WHITELIST = ['robit.noreen@gmail.com', 'admin.ceria@gmail.com']; 
  // (Silakan ganti dengan email Google asli yang kamu pakai buat testing login kemarin)

  // Ambil data user/email dari jwt cookie jika memungkinkan, 
  // atau biarkan client-side check melengkapinya.
  if (path.startsWith('/admin')) {
    // Proteksi dasar rute admin
    // Jika dideploy, kita bisa membaca payload email dari cookie secara instan
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/wali/:path*'],
};