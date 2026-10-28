'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // State Form Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // State Form Register Wali Murid
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNis, setRegNis] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handler Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail || !loginPassword) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }

      const destination = redirectTarget || data.redirectUrl || '/wali/dashboard';
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  // Handler Register Wali Murid
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regNama.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage('Kata sandi harus minimal 8 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: regNama.trim(),
          email: regEmail.trim(),
          password: regPassword,
          nis: regNis.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mendaftarkan akun.');
      }

      setSuccessMessage(data.message || 'Akun berhasil dibuat! Mengalihkan ke dashboard...');
      
      setTimeout(() => {
        const destination = redirectTarget || data.redirectUrl || '/wali/dashboard';
        router.push(destination);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftar akun.');
      setLoading(false);
    }
  };

  return (
    <div className={`${jakarta.className} min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-teal-50/40 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#02677f] selection:text-white`}>
      
      {/* TOMBOL KEMBALI */}
      <div className="max-w-md w-full mx-auto mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-[#02677f] transition-colors py-1.5 px-3 rounded-full hover:bg-white/80 border border-transparent hover:border-slate-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* HEADER BRANDING */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#02677f] to-sky-500 text-white flex items-center justify-center mx-auto shadow-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A48.357 48.357 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.583V21" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-[#02677f] bg-sky-100/60 px-3 py-1 rounded-full">
              PORTAL AKADEMIK TERPADU
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
              TK CAHAYA HATI
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Akses informasi perkembangan anak didik dan portal sekolah
            </p>
          </div>
        </div>

        {/* TAB SWITCHER: MASUK ATAU DAFTAR WALI */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/70 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-[#02677f] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-[#02677f] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Wali Murid
          </button>
        </div>

        {/* PESAN NOTIFIKASI ERROR / SUCCESS */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. TAB FORM LOGIN (MASUK AKUN) */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Alamat Email
              </label>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="nama@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showLoginPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showLoginPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#02677f] hover:bg-[#005468] text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <span>Masuk ke Portal</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Belum memiliki akun Wali Murid?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage('');
                  }}
                  className="font-extrabold text-[#02677f] hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. TAB FORM REGISTER (PENDAFTARAN WALI MURID) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Nama Lengkap Orang Tua / Wali
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="misal: Bunda Aisyah / Ayah Rizky"
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Alamat Email Aktif
              </label>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="wali@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex justify-between items-center">
                <span>Nomor Induk Siswa (NIS) Ananda</span>
                <span className="text-[9px] font-normal text-slate-400">Opsional</span>
              </label>
              <input
                type="text"
                disabled={loading}
                placeholder="misal: 202601"
                value={regNis}
                onChange={(e) => setRegNis(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
              />
              <p className="text-[9px] text-slate-400 font-medium">
                Jika diisi, akun akan otomatis terhubung dengan ananda Anda di database sekolah.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Kata Sandi Baru (Min. 8 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="Minimal 8 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showRegPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                Ulangi Kata Sandi
              </label>
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="Ketik ulang kata sandi"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50/40 focus:bg-white outline-none focus:border-[#02677f] focus:ring-2 focus:ring-[#02677f]/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#02677f] hover:bg-[#005468] text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <span>Daftar Akun Wali Murid</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMessage('');
                  }}
                  className="font-extrabold text-[#02677f] hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          </form>
        )}

        {/* INFO FOOTER */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
            Butuh bantuan kredensial login? Hubungi Master Admin atau Wali Kelas TK CAHAYA HATI.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#02677f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
