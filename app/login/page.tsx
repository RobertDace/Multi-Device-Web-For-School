'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'wali' | 'admin'>('wali');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false); // Toggle Masuk vs Daftar Akun
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Alur Google OAuth (Umum)
  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal terhubung ke layanan Google.');
    }
  };

  // 2. Alur Formulir Email & Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = email.trim().toLowerCase();

    try {
      if (isRegisterMode) {
        // ================= MODE DAFTAR AKUN BARU (UMUM) =================
        const { error } = await supabase.auth.signUp({
          email: targetEmail,
          password,
        });

        if (error) throw error;
        
        setSuccessMsg('Pendaftaran akun berhasil! Silakan ubah ke mode Masuk untuk mengakses portal.');
        setIsRegisterMode(false);
      } else {
        // ================= MODE MASUK AKUN (LOGIN) =================
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (error) throw error;

        if (activeTab === 'admin') {
          // Hak akses admin di cek dari metadata yang diurus oleh admin via database
          const isUserAdmin = data.user?.user_metadata?.is_approved_admin || 
                             ['robit.noreen@gmail.com', 'admin@ceesgank.com'].includes(targetEmail);
          
          if (!isUserAdmin) {
            await supabase.auth.signOut();
            throw new Error('Akun Anda belum diberi hak akses sebagai Guru/Admin oleh pengelola pusat.');
          }
          window.location.href = '/admin/rapor';
        } else {
          localStorage.setItem('user_session', JSON.stringify({ email: data.user?.email }));
          window.location.href = '/wali/dashboard';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-xs space-y-5">
        
        {/* BRANDING DINGIN */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#02677f] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-sm">C</div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 mt-2">
            {isRegisterMode ? 'Pendaftaran Akun Baru' : 'Portal Akses Akademik'}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {isRegisterMode ? 'Buat akun Anda untuk mulai menggunakan layanan portal sekolah.' : 'Silakan pilih peran akses tujuan Anda.'}
          </p>
        </div>

        {/* TAB SELECTOR (HANYA MUNCUL SAAT MODE MASUK / LOGIN) */}
        {!isRegisterMode && (
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200/50">
            <button
              type="button"
              onClick={() => { setActiveTab('wali'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'wali' ? 'bg-white text-[#02677f] shadow-2xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4C14.2091 4 16 5.79086 16 8C16 10.2091 14.2091 12 12 12C9.79086 12 8 10.2091 8 8C8 5.79086 9.79086 4 12 4Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Wali Murid
            </button>
            
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin' ? 'bg-white text-[#02677f] shadow-2xs' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="6" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 11H21" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Guru & Admin
            </button>
          </div>
        )}

        {/* NOTIFIKASI ERROR / SUKSES */}
        {errorMsg && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">{errorMsg}</div>}
        {successMsg && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl text-center">{successMsg}</div>}

        {/* OAUTH GOOGLE BUTTON */}
        <button
          onClick={handleGoogleAuth}
          type="button"
          className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2.5 shadow-3xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.96 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isRegisterMode ? 'Daftar dengan Akun Google' : activeTab === 'admin' ? 'Masuk Admin via Google' : 'Masuk Wali via Google'}
        </button>

        <div className="flex items-center gap-3 text-slate-300">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">atau formulir</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* KREDENSIAL FORM */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#02677f] hover:bg-[#005468] text-white font-bold py-3.5 rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50">
            {loading ? 'Memproses...' : isRegisterMode ? 'Daftar Akun Baru' : `Masuk Sebagai ${activeTab === 'admin' ? 'Guru' : 'Wali Murid'}`}
          </button>
        </form>

        {/* TOGGLE MASUK VS DAFTAR */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-xs font-bold text-slate-400 hover:text-[#02677f] transition-colors underline"
          >
            {isRegisterMode ? 'Sudah memiliki akun? Masuk di sini' : 'Belum memiliki akun? Daftar di sini'}
          </button>
        </div>

      </div>
    </div>
  );
}