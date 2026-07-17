'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// Inisialisasi Font Plus Jakarta Sans secara Global
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

interface UserProfile {
  id?: string;
  nama: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // State Profile Status
  const [currentUser, setCurrentProfile] = useState<UserProfile>({
    nama: 'Admin TK',
    email: 'admin@cahayahati.sch.id',
    role: 'GURU & ADMIN',
    avatar_url: ''
  });

  // State Modal Edit Profil & Logout State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: ''
  });

  // State Upload Avatar Engine
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State Toast Notifikasi
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  // Fetch Session Profile Aktif dari Supabase
  const loadActiveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('pengguna')
          .select('*')
          .eq('email', user.email)
          .single();

        if (data) {
          const profile = {
            id: data.id,
            nama: data.nama || 'Alfian Robit',
            email: data.email || user.email || '',
            role: data.level_akses || 'GURU & ADMIN',
            avatar_url: data.avatar_url || ''
          };
          setCurrentProfile(profile);
          setFormData({ nama: profile.nama, email: profile.email, password: '' });
        }
      }
    } catch {
      console.log('Menggunakan profil default offline mode');
    }
  };

  useEffect(() => {
    loadActiveProfile();
  }, []);

  const handleOpenProfileModal = () => {
    setFormData({
      nama: currentUser.nama,
      email: currentUser.email,
      password: ''
    });
    setIsProfileModalOpen(true);
  };

  // FUNGSIONALITAS LOGOUT KELUAR PORTAL ADMIN
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      showToast('Berhasil keluar dari Portal Admin.', 'success');
      setTimeout(() => {
        setIsProfileModalOpen(false);
        router.push('/login');
      }, 500);
    } catch (err: any) {
      setIsLoggingOut(false);
      showToast(`Gagal keluar akun: ${err.message}`, 'error');
    }
  };

  // Upload Avatar ke Supabase Storage Bucket 'aktivitas-images' (Pasti Ada & Aktif)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar (JPG, PNG, WEBP).', 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    setUploadProgress(15);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev >= 90 ? 90 : prev + 15));
    }, 120);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${currentUser.id || Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Menggunakan bucket 'aktivitas-images' yang terbukti aktif
      const { error: uploadError } = await supabase.storage
        .from('aktivitas-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage.from('aktivitas-images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update URL foto profil ke database pengguna jika ID tersedia
      if (currentUser.id) {
        await supabase
          .from('pengguna')
          .update({ avatar_url: publicUrl })
          .eq('id', currentUser.id);
      }

      setCurrentProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setIsUploadingAvatar(false);
      showToast('Foto profil baru berhasil diunggah!', 'success');
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingAvatar(false);
      showToast(`Gagal mengunggah foto profil: ${err.message}`, 'error');
    }
  };

  // Save Profile Text Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'warning');
      return;
    }

    try {
      if (currentUser.id) {
        const { error } = await supabase
          .from('pengguna')
          .update({
            nama: formData.nama.trim(),
            email: formData.email.trim()
          })
          .eq('id', currentUser.id);

        if (error) throw error;
      }

      setCurrentProfile(prev => ({
        ...prev,
        nama: formData.nama.trim(),
        email: formData.email.trim()
      }));

      showToast('Profil akun Anda berhasil disimpan!', 'success');
      setIsProfileModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal memperbarui profil: ${err.message}`, 'error');
    }
  };

  const navItems = [
    {
      name: 'Siswa',
      href: '/admin/siswa',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    },
    {
      name: 'Rapor',
      href: '/admin/rapor',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      )
    },
    {
      name: 'Kalender',
      href: '/admin/kalender',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      )
    },
    {
      name: 'Landing',
      href: '/admin/editor',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      )
    },
    {
      name: 'Akun',
      href: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.942 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`${jakarta.variable} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-[#02677f] selection:text-white`}>
      
      {/* GLOBAL TOP NAVBAR HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* SISI KIRI: LOGO RESMI KEMENDIKBUD + RE-BRANDING TK CAHAYA HATI */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/80 shadow-2xs p-1 shrink-0">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                alt="Logo Kemendikbud" 
                className="w-full h-full object-contain shrink-0" 
              />
            </div>

            <div>
              <h2 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight leading-none">
                TK CAHAYA HATI
              </h2>
              <span className="text-[10px] font-mono font-extrabold text-[#02677f] uppercase tracking-wider block mt-0.5">
                Portal Admin Pusat
              </span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION BAR */}
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

          {/* SISI KANAN: TOMBOL INTERAKTIF EDIT PROFIL AKUN (FOTO CUSTOM & NAMA) */}
          <button
            onClick={handleOpenProfileModal}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all group focus:outline-none focus:ring-2 focus:ring-[#02677f]/20"
            title="Klik untuk ubah profil & foto akun"
          >
            {/* AVATAR RENDER: TAMPILKAN FOTO CUSTOM JIKA ADA, ATAU INITIAL NAMA */}
            <div className="w-8 h-8 rounded-xl bg-[#02677f] text-white flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden border border-white/50 shrink-0 relative">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser.nama.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="hidden sm:block text-left pr-1">
              <span className="block text-xs font-extrabold text-slate-900 leading-tight group-hover:text-[#02677f] transition-colors">
                {currentUser.nama}
              </span>
              <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase">
                {currentUser.role}
              </span>
            </div>

            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

        </div>
      </header>

      {/* MAIN PAGE BODY CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* MOBILE BOTTOM DOCK NAVBAR (Sempurna dekat jempol di HP) */}
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

      {/* ================= MODAL EDIT PROFIL AKUN SAYA ================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Pengaturan Profil Saya</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">TK CAHAYA HATI Administrator Account</p>
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

            {/* BAGIAN UPLOAD FOTO PROFIL CUSTOM */}
            <div className="flex flex-col items-center justify-center space-y-3 bg-slate-50/70 p-4 border border-slate-200/80 rounded-2xl">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#02677f] text-white flex items-center justify-center text-2xl font-extrabold shadow-md overflow-hidden border-2 border-white ring-2 ring-sky-100">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.nama.charAt(0).toUpperCase()}</span>
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

            {/* FORM INPUT UBAH IDENTITAS */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Anda</label>
                <input 
                  type="text" 
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  placeholder="Ketik nama lengkap..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email Login</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  placeholder="contoh@cahayahati.sch.id"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kata Sandi Baru (Opsional)</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                />
              </div>

              {/* ACTION BUTTONS SIMPAN, BATAL, & TOMBOL LOGOUT UTAMA */}
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
                    Simpan Perubahan
                  </button>
                </div>

                {/* TOMBOL LOGOUT ADMIN */}
                <button 
                  type="button" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full mt-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                  </svg>
                  <span>{isLoggingOut ? 'Mengeluarkan...' : 'Keluar dari Portal Admin (Logout)'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* GLOBAL TOAST NOTIFICATION */}
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