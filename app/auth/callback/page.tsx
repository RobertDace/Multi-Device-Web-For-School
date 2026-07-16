'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Menghubungkan sesi Google ke pangkalan data...');

  useEffect(() => {
    async function processAuth() {
      // 💡 Mengambil session yang otomatis ditangkap oleh Supabase Client dari URL Hash (#) di browser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Sesi tidak ditemukan atau kedaluwarsa:", sessionError);
        window.location.href = '/login?error=auth-failed';
        return;
      }

      // 💡 SUNTIK COOKIES MANUAL VIA CLIENT AGAR TERDTEKSI AMAN OLEH proxy.ts
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax`;

      const user = session.user;
      const userEmail = user.email?.toLowerCase();
      
      // Daftar email VIP yang otomatis lolos sebagai Admin Utama
      const INTERNAL_ADMINS = [
        'alfiantu@gmail.com',
        'admin.ceria@gmail.com',
        'admin@ceesgank.com'
      ];
      
      const isUserAdmin = user.user_metadata?.is_approved_admin || 
                          (userEmail && INTERNAL_ADMINS.includes(userEmail));

      if (isUserAdmin) {
        setStatus('Akses Otoritas Admin Terverifikasi! Mengalihkan...');
        window.location.href = '/admin/rapor';
      } else {
        setStatus('Akses Wali Murid Terverifikasi! Mengalihkan...');
        window.location.href = '/wali/dashboard';
      }
    }

    // Beri jeda 400ms agar engine internal Supabase selesai membaca token di address bar
    const timer = setTimeout(() => {
      processAuth();
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 text-center font-sans">
      <div className="space-y-4 bg-white p-8 rounded-3xl border border-slate-200 max-w-xs shadow-xs">
        <div className="w-9 h-9 border-4 border-[#02677f] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-600 leading-relaxed">{status}</p>
      </div>
    </div>
  );
}