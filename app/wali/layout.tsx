'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { useUser, useClerk } from '@clerk/nextjs';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export default function WaliLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
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

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        nama: user.fullName || user.firstName || 'Wali Murid',
        email: user.primaryEmailAddress?.emailAddress || '',
      });
    }
  }, [user]);

  const handleOpenProfileModal = () => {
    if (user) {
      setFormData({
        nama: user.fullName || user.firstName || 'Wali Murid',
        email: user.primaryEmailAddress?.emailAddress || '',
      });
    }
    setIsProfileModalOpen(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      showToast('Berhasil keluar dari Portal Wali Murid.', 'success');
      setTimeout(() => {
        setIsProfileModalOpen(false);
        router.push('/sign-in');
      }, 500);
    } catch (err: any) {
      setIsLoggingOut(false);
      showToast(`Gagal keluar akun: ${err.message}`, 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar (JPG, PNG, WEBP).', 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    setUploadProgress(30);

    try {
      await user.setProfileImage({ file });
      setUploadProgress(100);
      showToast('Foto profil wali berhasil diperbarui!', 'success');
    } catch (err: any) {
      showToast(`Gagal mengunggah foto profil: ${err.message}`, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !user) {
      showToast('Nama lengkap tidak boleh kosong.', 'warning');
      return;
    }

    try {
      const nameParts = formData.nama.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await user.update({
        firstName,
        lastName: lastName || undefined,
      });

      showToast('Profil akun wali berhasil disimpan!', 'success');
      setIsProfileModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal memperbarui profil: ${err.message}`, 'error');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/wali/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    {
      name: 'Aktivitas',
      href: '/aktivitas',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v12a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    },
    {
      name: 'Beranda Website',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      )
    }
  ];

  const displayName = isLoaded ? (user?.fullName || user?.firstName || 'Wali Murid') : 'Memuat...';
  const displayAvatar = user?.imageUrl || '';

  return (
    <div className={`${jakarta.variable} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-[#02677f] selection:text-white`}>
      
      {/* HEADER NAVBAR UTAMA */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
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
                Portal Resmi Wali Murid
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-[#02677f] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* PROFIL DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all group focus:outline-none focus:ring-2 focus:ring-[#02677f]/20"
              title="Menu akun"
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
                    handleOpenProfileModal();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span>Edit Profil Saya</span>
                </button>

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

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden px-3 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-[#02677f] bg-sky-50 font-extrabold'
                    : 'text-slate-400 font-bold hover:text-slate-600'
                }`}
              >
                {item.icon}
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MODAL EDIT PROFIL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Pengaturan Profil Saya</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Wali Murid TK CAHAYA HATI</p>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* AVATAR */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-slate-50/70 p-4 border border-slate-200/80 rounded-2xl">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#02677f] text-white flex items-center justify-center text-2xl font-extrabold shadow-md overflow-hidden border-2 border-white ring-2 ring-sky-100">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <label className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-[#02677f] text-white p-2 rounded-xl shadow-md cursor-pointer transition-colors border border-white">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </label>
              </div>

              {isUploadingAvatar ? (
                <div className="w-full max-w-[200px] space-y-1">
                  <div className="flex justify-between text-[10px] font-extrabold text-[#02677f]">
                    <span>Mengunggah Foto...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#02677f] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-slate-400">Klik ikon kamera untuk ganti foto profil</span>
              )}
            </div>

            {/* FORM */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Wali Murid</label>
                <input 
                  type="text" 
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  placeholder="Ketik nama lengkap..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email Login (Clerk)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-400 bg-slate-100 cursor-not-allowed outline-none"
                />
                <p className="text-[9px] text-slate-400 font-medium">Email dikelola langsung melalui akun Clerk.</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    Simpan Profil
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full mt-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                  </svg>
                  <span>{isLoggingOut ? 'Mengecek Sesi Keluar...' : 'Keluar dari Portal Wali (Logout)'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.isOpen && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2.5 bg-white ${
            toast.type === 'success' ? 'border-emerald-100 text-emerald-700' :
            toast.type === 'warning' ? 'border-amber-100 text-amber-700' : 'border-rose-100 text-rose-600'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}