'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PenggunaItem {
  id: string;
  nama: string;
  email: string;
  level_akses: string;
  status_akun?: string;
  created_at?: string;
}

export default function AdminUsersManagementPage() {
  const [search, setSearch] = useState('');
  const [userList, setUserList] = useState<PenggunaItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PenggunaItem | null>(null);

  // Custom Dropdown Engine State (Anti-Bleeding for Mobile UI)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleOptions = ['GURU & ADMIN', 'WALI MURID', 'STAFF OPERASIONAL'];

  // Validation & Dynamic States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  // Form Input State
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    level_akses: 'GURU & ADMIN',
    password: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const fetchUsersFromSupabase = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedData: PenggunaItem[] = data.map((item: any) => ({
          id: item.id,
          nama: item.nama || item.full_name || 'Pengguna Tanpa Nama',
          email: item.email || '-',
          level_akses: item.level_akses || item.role || 'GURU & ADMIN',
          status_akun: item.status_akun || 'Aktif',
          created_at: item.created_at
        }));
        setUserList(mappedData);
      }
    } catch (err: any) {
      console.error('Gagal memuat daftar akun:', err.message);
      showToast('Koneksi ke database otorisasi terganggu.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchUsersFromSupabase();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setErrors({});
    setIsRoleDropdownOpen(false);
    setFormData({
      nama: '',
      email: '',
      level_akses: 'GURU & ADMIN',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: PenggunaItem) => {
    setEditingUser(user);
    setErrors({});
    setIsRoleDropdownOpen(false);
    setFormData({
      nama: user.nama,
      email: user.email,
      level_akses: user.level_akses,
      password: ''
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama.trim()) newErrors.nama = 'Nama lengkap akun wajib diisi.';
    if (!formData.email.trim()) newErrors.email = 'Alamat email aktif wajib diisi.';
    if (!editingUser && !formData.password.trim()) newErrors.password = 'Kata sandi awal wajib ditentukan.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // HANDLER SIMPAN USER (HANYA GUNAKAN status_akun)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Periksa kembali kolom inputan yang masih kosong!', 'warning');
      return;
    }

    try {
      if (editingUser) {
        // Mode Update Hak Akses
        const { error } = await supabase
          .from('pengguna')
          .update({
            nama: formData.nama.trim(),
            email: formData.email.trim(),
            level_akses: formData.level_akses,
            status_akun: 'Aktif'
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        showToast('Hak akses otoritas akun berhasil diperbarui!', 'success');
      } else {
        // Mode Registrasi Akun Baru
        let validUserId = crypto.randomUUID();
        let wasRateLimited = false;

        // 1. Coba daftarkan akun via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password.trim(),
          options: {
            data: {
              full_name: formData.nama.trim(),
              role: formData.level_akses
            }
          }
        });

        if (authData?.user?.id) {
          validUserId = authData.user.id;
        }

        if (authError) {
          if (authError.message.toLowerCase().includes('rate limit') || authError.status === 429) {
            wasRateLimited = true;
          } else {
            throw authError;
          }
        }

        // 2. Simpan profil ke tabel 'pengguna' (HANYA status_akun)
        const { error: dbError } = await supabase
          .from('pengguna')
          .insert([
            {
              id: validUserId,
              nama: formData.nama.trim(),
              email: formData.email.trim(),
              level_akses: formData.level_akses,
              status_akun: 'Aktif'
            }
          ]);

        if (dbError) throw dbError;

        if (wasRateLimited) {
          showToast('Akun berhasil dibuat di pangkalan data! (Email Auth rate-limited).', 'warning');
        } else {
          showToast('Pendaftaran akun pengguna baru berhasil!', 'success');
        }
      }

      fetchUsersFromSupabase();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal memproses otorisasi akun: ${err.message}`, 'error');
    }
  };

  const triggerDeleteUser = (user: PenggunaItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin mencabut dan menghapus otorisasi akun milik "${user.nama}" (${user.email}) secara permanen?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('pengguna')
            .delete()
            .eq('id', user.id);

          if (error) throw error;
          fetchUsersFromSupabase();
          showToast('Otorisasi akun berhasil dicabut secara permanen.', 'success');
        } catch (err: any) {
          showToast(`Gagal mencabut otorisasi: ${err.message}`, 'error');
        } finally {
          setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredUsers = userList.filter((u) => {
    const keyword = search.toLowerCase();
    return (
      u.nama?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.level_akses?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="pb-28 font-sans">
      {/* HEADER UTAMA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Hak Akses Akun</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Otorisasi pendaftaran email, berikan status khusus Guru/Admin, atau cabut hak akses akun yang disalahgunakan.</p>
        </div>
        {/* Tombol Akses Utama Desktop Mode */}
        <button 
          onClick={handleOpenAdd} 
          className="hidden md:flex bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tambah Akun Baru
        </button>
      </header>

      {/* SLEEK PRECISE TOP SEARCH BAR */}
      <div className="relative max-w-md w-full mt-4">
        <input 
          type="text" 
          placeholder="Cari nama atau email akun..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-[#02677f] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-3xs" 
        />
        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {loadingData ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke server pangkalan akun Supabase...</div>
      ) : (
        <>
          {/* VIEW MOBILE LAYAR HP */}
          <div className="grid grid-cols-1 gap-4 md:hidden mt-5">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-3xs animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div className="truncate pr-2">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight truncate">{u.nama}</h4>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5 truncate">{u.email}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-extrabold tracking-wide bg-sky-50 text-[#02677f] border border-sky-100 uppercase shrink-0">
                    {u.level_akses}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Status: {u.status_akun || 'Aktif'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(u)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#02677f] hover:bg-sky-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => triggerDeleteUser(u)} 
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Cabut</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW DESKTOP MODE */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Nama & Identitas Akun</th>
                  <th className="p-4">Alamat Email</th>
                  <th className="p-4">Level Otoritas</th>
                  <th className="p-4 text-right pr-6">Aksi & Otoritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-sm">{u.nama}</div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide bg-sky-50 text-[#02677f] border border-sky-100 uppercase">
                        {u.level_akses}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(u)} 
                        className="border border-slate-200 hover:border-[#02677f] hover:bg-sky-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1.5 bg-white shadow-3xs transition-all"
                      >
                        <svg className="w-3.5 h-3.5 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Akses
                      </button>
                      <button 
                        onClick={() => triggerDeleteUser(u)} 
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white p-8 border border-slate-200 rounded-2xl text-center font-bold text-slate-300 text-xs mt-4">
              Data pengguna tidak ditemukan atau pangkalan otorisasi kosong.
            </div>
          )}
        </>
      )}

      {/* FLOATING THUMB-ACTION BUTTON FOR MOBILE */}
      <div className="fixed bottom-[92px] right-4 left-4 md:hidden z-40">
        <button 
          onClick={handleOpenAdd} 
          className="w-full bg-[#02677f] hover:bg-[#005468] text-white py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tambah Akun Baru
        </button>
      </div>

      {/* MODAL DIALOG REGISTRASI / EDIT OTORITAS AKUN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {editingUser ? 'Modifikasi Otoritas Akun' : 'Registrasi Akun Baru'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setIsRoleDropdownOpen(false); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4" noValidate>
              {/* INPUT NAMA LENGKAP */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Nama Lengkap Pengguna</label>
                <input 
                  type="text" 
                  placeholder="Masukkan nama lengkap..." 
                  value={formData.nama} 
                  onChange={(e) => {
                    setFormData({ ...formData, nama: e.target.value });
                    if (errors.nama) setErrors((prev) => { const { nama, ...r } = prev; return r; });
                  }} 
                  className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.nama ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                  }`} 
                />
                {errors.nama && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errors.nama}
                  </p>
                )}
              </div>

              {/* INPUT ALAMAT EMAIL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Alamat Email Resmi</label>
                <input 
                  type="email" 
                  placeholder="contoh@domain.com" 
                  value={formData.email} 
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors((prev) => { const { email, ...r } = prev; return r; });
                  }} 
                  className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.email ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                  }`} 
                />
                {errors.email && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* CUSTOM DROPDOWN ENGINE */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Level Otoritas Akun</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-slate-50/50 outline-none text-left flex justify-between items-center transition-all focus:bg-white focus:border-[#02677f]"
                  >
                    <span>{formData.level_akses}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[46px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn max-w-full">
                      {roleOptions.map((role) => (
                        <div
                          key={role}
                          onClick={() => {
                            setFormData({ ...formData, level_akses: role });
                            setIsRoleDropdownOpen(false);
                          }}
                          className="p-3 text-xs font-bold text-slate-900 hover:bg-sky-50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <span>{role}</span>
                          {formData.level_akses === role && (
                            <svg className="w-3.5 h-3.5 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* INPUT PASSWORD */}
              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Kata Sandi Awal</label>
                  <input 
                    type="password" 
                    placeholder="Masukkan kata sandi..." 
                    value={formData.password} 
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors((prev) => { const { password, ...r } = prev; return r; });
                    }} 
                    className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                      errors.password ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                    }`} 
                  />
                  {errors.password && (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {errors.password}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setIsRoleDropdownOpen(false); }} 
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-[#02677f] hover:bg-[#005468] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI */}
      {toast.isOpen && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2.5 bg-white ${
            toast.type === 'success' ? 'border-emerald-100 text-emerald-700' :
            toast.type === 'warning' ? 'border-amber-100 text-amber-700' : 'border-rose-100 text-rose-600'
          }`}>
            {toast.type === 'success' && <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === 'error' && <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            {toast.type === 'warning' && <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            {toast.message}
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG PENCABUTAN AKUN */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Pencabutan Akun</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button 
                type="button" 
                onClick={() => setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }))} 
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={confirmDialog.onConfirm} 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-colors"
              >
                Cabut Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}