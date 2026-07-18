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

      // 💡 SUNTIK COOKIES MANUAL VIA CLIENT AGAR TERDETEKSI AMAN OLEH proxy.ts
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax`;

      const user = session.user;
      const userEmail = user.email?.toLowerCase() || '';
      
      // Daftar email VIP yang otomatis lolos sebagai Admin Utama
      const INTERNAL_ADMINS = [
        'alfiantu@gmail.com',
        'admin.ceria@gmail.com',
        'admin@ceesgank.com'
      ];
      
      let dbRole = '';
      let isUserRegistered = false;

      try {
        // Cek apakah email Google ini sudah didaftarkan perorangan oleh admin di database
        const { data: penggunaData } = await supabase
          .from('pengguna')
          .select('id, level_akses, role')
          .ilike('email', userEmail)
          .maybeSingle();
        
        if (penggunaData) {
          isUserRegistered = true;
          dbRole = penggunaData.level_akses || penggunaData.role || '';
          
          // Sinkronkan UUID Auth ke tabel pengguna jika admin mendaftarkannya manual lewat entry data
          if (penggunaData.id !== user.id) {
            await supabase
              .from('pengguna')
              .update({ id: user.id })
              .ilike('email', userEmail);
          }
        }
      } catch (dbErr) {
        console.error("Gagal melakukan verifikasi database sekolah:", dbErr);
      }
      
      // Tentukan apakah user punya hak akses admin internal
      const isVipAdmin = INTERNAL_ADMINS.includes(userEmail) || user.user_metadata?.is_approved_admin;

      // 🛑 PROTEKSI UTAMA: Jika email tidak terdaftar di DB DAN bukan Admin VIP, langsung BLOKIR
      if (!isUserRegistered && !isVipAdmin) {
        setStatus('Email Anda belum terdaftar sebagai Wali Murid resmi. Mengalihkan...');
        
        // Sign out dari auth session agar tidak menyangkut
        await supabase.auth.signOut();
        
        setTimeout(() => {
          window.location.href = '/login?error=not-registered';
        }, 2000);
        return;
      }
      
      const isUserAdmin = dbRole === 'GURU & ADMIN' || 
                          dbRole === 'ADMIN' || 
                          isVipAdmin;

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