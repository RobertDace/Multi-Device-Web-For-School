'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useClerk } from '@clerk/nextjs';

interface AktivitasItem {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar_url?: string;
  deskripsi: string;
}

export default function AktivitasPage() {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [aktivitasList, setAktivitasList] = useState<AktivitasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [selectedItem, setSelectedItem] = useState<AktivitasItem | null>(null);

  // Profile Dropdown & Modal States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getDate()} ${namaBulanIndo[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAktivitas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/aktivitas');
      const json = await res.json();
      const data: AktivitasItem[] = json.success ? json.data : (Array.isArray(json) ? json : []);
      setAktivitasList(data);
    } catch (err) {
      console.error('Gagal memuat aktivitas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAktivitas();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      showToast('Berhasil keluar akun.', 'success');
      setTimeout(() => {
        router.push('/sign-in');
      }, 500);
    } catch (err: any) {
      setIsLoggingOut(false);
      showToast(`Gagal logout: ${err.message}`, 'error');
    }
  };

  const displayName = isLoaded ? (user?.fullName || user?.firstName || 'Wali Murid') : 'Memuat...';
  const displayAvatar = user?.imageUrl || '';

  const filteredList = aktivitasList.filter((item) => {
    const matchSearch =
      item.judul?.toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi?.toLowerCase().includes(search.toLowerCase());
    const matchKategori = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#02677f] selection:text-white antialiased pb-28">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/80 shadow-2xs p-1 shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                alt="Logo Kemendikbud" 
                className="w-full h-full object-contain shrink-0" 
              />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight leading-none group-hover:text-[#02677f] transition-colors">
                TK CAHAYA HATI
              </h2>
              <span className="text-[10px] font-mono font-extrabold text-[#02677f] uppercase tracking-wider block mt-0.5">
                {isSignedIn ? 'Portal Resmi Wali Murid' : 'Bermain & Belajar Ceria'}
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          {isSignedIn ? (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-600">
              <Link
                href="/wali/dashboard"
                className="px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/aktivitas"
                className="px-4 py-1.5 rounded-xl bg-white text-[#02677f] shadow-2xs font-extrabold transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Aktivitas</span>
              </Link>
              <Link
                href="/"
                className="px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span>Beranda Website</span>
              </Link>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-600">
              <Link href="/" className="px-3.5 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Home</Link>
              <Link href="/#kalender" className="px-3.5 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Kalender</Link>
              <Link href="/aktivitas" className="px-3.5 py-1.5 rounded-xl bg-white text-[#02677f] shadow-2xs font-extrabold transition-all">Aktivitas</Link>
              <Link href="/#rapor" className="px-3.5 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Cek Rapor</Link>
            </nav>
          )}

          {/* PROFILE / LOGIN */}
          {isLoaded && isSignedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all group focus:outline-none focus:ring-2 focus:ring-[#02677f]/20"
              >
                <div className="w-8 h-8 rounded-xl bg-[#02677f] text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden border border-white/50 shrink-0 relative">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="hidden sm:block text-left pr-1">
                  <span className="block text-xs font-extrabold text-slate-900 leading-tight group-hover:text-[#02677f] transition-colors">
                    {displayName}
                  </span>
                  <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase">
                    Wali Murid
                  </span>
                </div>

                <svg className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-fadeIn">
                  <Link 
                    href="/wali/dashboard" 
                    onClick={() => setIsDropdownOpen(false)} 
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    <span>Dashboard Wali</span>
                  </Link>

                  <Link 
                    href="/admin/siswa" 
                    onClick={() => setIsDropdownOpen(false)} 
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 border-b border-slate-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 2.714Z" />
                    </svg>
                    <span>Portal Guru & Admin</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                    </svg>
                    <span>{isLoggingOut ? 'Mengeluarkan...' : 'Keluar Akun (Logout)'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/sign-in" 
              className="bg-[#02677f] hover:bg-[#005468] text-white px-5 py-2 rounded-full text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>Login</span>
            </Link>
          )}

        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        
        {/* HEADER TITLE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Dokumentasi & Berita Resmi
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Album dokumentasi kegiatan belajar mengajar dan pengumuman terpadu TK CAHAYA HATI.
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari liputan kegiatan, acara, atau berita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] transition-all shadow-3xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['Semua', 'Akademik', 'Kegiatan', 'Fasilitas'].map((kat) => (
              <button
                key={kat}
                onClick={() => setKategoriFilter(kat)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  kategoriFilter === kat
                    ? 'bg-[#02677f] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {kat}
              </button>
            ))}
          </div>
        </div>

        {/* GRID LIST */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
            Memuat arsip aktivitas dari database Neon...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
            Tidak ada dokumentasi liputan yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-3xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                    {item.gambar_url ? (
                      <img 
                        src={item.gambar_url} 
                        alt={item.judul} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#02677f] font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-xs uppercase">
                      {item.kategori}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      {formatTanggalIndo(item.tanggal)}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-[#02677f] transition-colors leading-snug">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-1 text-[11px] font-bold text-[#02677f] flex items-center gap-1">
                  <span>Baca Selengkapnya</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden px-3 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {isSignedIn ? (
            <>
              <Link
                href="/wali/dashboard"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-slate-400 font-bold hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="text-[10px] tracking-tight">Dashboard</span>
              </Link>

              <Link
                href="/aktivitas"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-[#02677f] bg-sky-50 font-extrabold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="text-[10px] tracking-tight">Aktivitas</span>
              </Link>

              <Link
                href="/"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-slate-400 font-bold hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span className="text-[10px] tracking-tight">Beranda</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-slate-400 font-bold hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="text-[10px] tracking-tight">Home</span>
              </Link>

              <Link
                href="/#kalender"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-slate-400 font-bold hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span className="text-[10px] tracking-tight">Kalender</span>
              </Link>

              <Link
                href="/aktivitas"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-[#02677f] bg-sky-50 font-extrabold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span className="text-[10px] tracking-tight">Aktivitas</span>
              </Link>

              <Link
                href="/#rapor"
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all text-slate-400 font-bold hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="text-[10px] tracking-tight">Rapor</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 4. MODAL PREVIEW DETAIL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#02677f] uppercase block">{selectedItem.kategori}</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedItem.judul}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {selectedItem.gambar_url && (
              <div className="w-full h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={selectedItem.gambar_url} alt={selectedItem.judul} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold block">{formatTanggalIndo(selectedItem.tanggal)}</span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                {selectedItem.deskripsi}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedItem(null)} className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white font-bold rounded-xl text-xs shadow-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}