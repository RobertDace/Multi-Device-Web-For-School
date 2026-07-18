'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  // Mode Form: 'login' | 'register'
  const [isRegister, setIsRegister] = useState(false);

  // Form State
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation & Error States
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  // 1. HANDLER LOGIN EMAIL & PASSWORD
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Alamat email dan kata sandi wajib diisi!');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email atau kata sandi yang Anda masukkan salah.');
        }
        throw authError;
      }

      showToast('Login berhasil! Memeriksa otoritas akun...', 'success');

      if (authData.user) {
        const { data: penggunaData } = await supabase
          .from('pengguna')
          .select('level_akses, role')
          .eq('email', authData.user.email)
          .single();

        const role = penggunaData?.level_akses || penggunaData?.role || '';

        setTimeout(() => {
          if (role === 'GURU & ADMIN' || role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/wali/dashboard');
          }
        }, 800);
      } else {
        router.push('/wali/dashboard');
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk akun. Periksa koneksi internet Anda.');
      showToast(err.message || 'Gagal masuk akun.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLER MENDAFTAR AKUN BARU (SIGN UP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Semua kolom pendaftaran wajib diisi!');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      // Create account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: nama.trim(),
            role: 'WALI MURID',
          }
        }
      });

      if (authError) throw authError;

      // Insert profile data to 'pengguna' table
      if (authData.user) {
        await supabase.from('pengguna').insert([
          {
            id: authData.user.id,
            nama: nama.trim(),
            email: email.trim(),
            level_akses: 'WALI MURID',
            role: 'WALI MURID'
          }
        ]);
      }

      showToast('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.', 'success');
      setIsRegister(false);
      setPassword('');

    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar akun baru.');
      showToast(err.message || 'Gagal mendaftar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. HANDLER LOGIN VIA GOOGLE OAUTH
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 💡 DIALIHKAN KE FOLDER CALLBACK AGAR MELEWATI FILTER ROLE DI DATABASE
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk dengan Google.');
      showToast('Gagal menghubungkan ke layanan Google.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col justify-between p-4 selection:bg-[#02677f] selection:text-white antialiased">
      
      {/* HEADER TOP LOGO */}
      <div className="max-w-md w-full mx-auto pt-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-2xs p-1 shrink-0 group-hover:scale-105 transition-transform">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
              alt="Logo Kemendikbud" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none group-hover:text-[#02677f] transition-colors">
              TK CAHAYA HATI
            </h1>
            <span className="text-[9px] font-mono font-bold text-[#02677f] uppercase tracking-wider block mt-0.5">
              Portal Otorisasi Akun
            </span>
          </div>
        </Link>

        <Link 
          href="/" 
          className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <span>Kembali</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </div>

      {/* MAIN AUTH CARD CONTAINER */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
        
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xl space-y-6 animate-fadeIn">
          
          <div className="space-y-1.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#02677f] mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isRegister ? 'Mendaftar Akun Baru' : 'User Login Portal'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isRegister 
                ? 'Lengkapi data diri Anda untuk membuat akun Wali Murid baru.' 
                : 'Masukkan email & kata sandi terdaftar untuk mengakses portal.'}
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* DYNAMIC FORM (LOGIN OR REGISTER) */}
          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4" noValidate>
            
            {/* INPUT NAMA LENGKAP (KHUSUS REGISTER) */}
            {isRegister && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Contoh: Alfian Robit"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#02677f] rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
              </div>
            )}

            {/* EMAIL INPUT */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="contoh@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#02677f] rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Kata Sandi
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#02677f] rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                </svg>

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.07-3.291 4.2-5.625 7.964-5.625s6.894 2.334 7.964 5.625c-1.07 3.291-4.2 5.625-7.964 5.625S3.106 15.291 2.036 12z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#02677f] hover:bg-[#005468] text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>{isRegister ? 'Memproses Pendaftaran...' : 'Verifikasi Kredensial...'}</span>
                </>
              ) : (
                <span>{isRegister ? 'Daftar Akun Baru' : 'Masuk Akun Sekarang'}</span>
              )}
            </button>

          </form>

          {/* DIVIDER ATAU MASUK DENGAN */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="shrink-0 mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Atau lanjutkan dengan
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* GOOGLE LOGIN OAUTH BUTTON */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-extrabold py-3 rounded-2xl text-xs shadow-3xs transition-all flex items-center justify-center gap-3 active:scale-98"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.37 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.23 0 10.06 0 12s.47 3.77 1.29 5.39l3.99-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          {/* TOGGLE FORM MASUK VS MENDAFTAR */}
          <div className="text-center pt-2 border-t border-slate-100">
            {isRegister ? (
              <p className="text-xs text-slate-500 font-medium">
                Sudah memiliki akun terdaftar?{' '}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                  className="font-extrabold text-[#02677f] hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                Belum memiliki akun Wali Murid?{' '}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                  className="font-extrabold text-[#02677f] hover:underline"
                >
                  Daftar Sekarang
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <div className="max-w-md w-full mx-auto text-center pb-2">
        <p className="text-[11px] text-slate-400 font-medium">
          © 2026 TK CAHAYA HATI. All rights reserved.
        </p>
      </div>

      {/* TOAST NOTIFIKASI */}
      {toast.isOpen && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2.5 bg-white ${
            toast.type === 'success' ? 'border-emerald-100 text-emerald-700' : 'border-rose-100 text-rose-600'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}