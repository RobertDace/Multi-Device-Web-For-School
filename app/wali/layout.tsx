'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { supabase } from '@/lib/supabase';

// Inisialisasi Font Plus Jakarta Sans secara Global untuk Portal Wali
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

interface WaliProfile {
  id?: string;
  nama: string;
  email: string;
  nama_anak: string;
  role: string;
  avatar_url?: string;
}

export default function WaliLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // State Profile Wali Murid
  const [currentUser, setCurrentProfile] = useState<WaliProfile>({
    nama: 'Wali Murid',
    email: 'wali@cahayahati.sch.id',
    nama_anak: 'Ananda',
    role: 'WALI MURID',
    avatar_url: ''
  });

  // State Modal Edit Profil
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  // Fetch Data Profil Wali Murid dari Supabase
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
            nama: data.nama || 'Wali Murid',
            email: data.email || user.email || '',
            nama_anak: 'Ananda',
            role: 'WALI MURID',
            avatar_url: data.avatar_url || ''
          };
          setCurrentProfile(profile);
          setFormData({ nama: profile.nama, email: profile.email, password: '' });
        }
      }
    } catch (err) {
      console.log('Menggunakan mode profil wali default');
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

  // Upload Avatar Wali ke Bucket 'aktivitas-images'
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
      const fileName = `avatar_wali_${currentUser.id || Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('aktivitas-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage.from('aktivitas-images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      if (currentUser.id) {
        await supabase
          .from('pengguna')
          .update({ avatar_url: publicUrl })
          .eq('id', currentUser.id);
      }

      setCurrentProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setIsUploadingAvatar(false);
      showToast('Foto profil wali berhasil diperbarui!', 'success');
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingAvatar(false);
      showToast(`Gagal mengunggah foto profil: ${err.message}`, 'error');
    }
  };

  // Simpan Perubahan Profil Text
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

      showToast('Profil akun wali berhasil disimpan!', 'success');
      setIsProfileModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal memperbarui profil: ${err.message}`, 'error');
    }
  };

  return (
    <div className={`${jakarta.variable} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-[#02677f] selection:text-white`}>
      
      {/* HEADER NAVBAR UTAMA WALI MURID */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* SISI KIRI: LOGO RESMI SVG KEMENDIKBUD + RE-BRANDING TK CAHAYA HATI */}
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
                Portal Resmi Wali Murid
              </span>
            </div>
          </div>

          {/* SISI KANAN: TOMBOL INTERAKTIF PROFIL WALI */}
          <button
            onClick={handleOpenProfileModal}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all group focus:outline-none focus:ring-2 focus:ring-[#02677f]/20"
            title="Klik untuk ubah profil Wali Murid"
          >
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
                Wali Murid
              </span>
            </div>

            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

        </div>
      </header>

      {/* MAIN CONTAINER CONTENT BODY */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-12">
        {children}
      </main>

      {/* MODAL EDIT PROFIL WALI MURID */}
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

            {/* UPLOAD FOTO PROFIL */}
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

            {/* FORM IDENTITAS */}
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Email Login</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  placeholder="contoh@gmail.com"
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

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
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
            </form>

          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI GLOBAL */}
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