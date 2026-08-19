'use client';

import { useState, useEffect } from 'react';

interface PenggunaItem {
  id: string;
  nama: string;
  email: string;
  level_akses: string;
  avatar_url?: string;
  nama_anak?: string;
}

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<PenggunaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PenggunaItem | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    level_akses: 'GURU & ADMIN',
    avatar_url: '',
  });

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success',
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {},
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsersList(json.data);
      }
    } catch {
      showToast('Gagal memuat daftar pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user: PenggunaItem | null = null) => {
    setSelectedUser(user);
    setShowPassword(false);
    if (user) {
      setFormData({
        nama: user.nama,
        email: user.email,
        password: '',
        level_akses: user.level_akses,
        avatar_url: user.avatar_url || '',
      });
    } else {
      setFormData({
        nama: '',
        email: '',
        password: '',
        level_akses: 'GURU & ADMIN',
        avatar_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.email.trim()) {
      showToast('Nama lengkap dan email wajib diisi.', 'warning');
      return;
    }

    if (!selectedUser && (!formData.password || formData.password.length < 8)) {
      showToast('Kata sandi wajib diisi minimal 8 karakter.', 'warning');
      return;
    }

    try {
      if (selectedUser) {
        const res = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Data akun berhasil diperbarui!', 'success');
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Akun pengguna berhasil dibuat di Clerk & Database!', 'success');
      }

      fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan akun pengguna.', 'error');
    }
  };

  const handleDeleteUser = (user: PenggunaItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Hapus akun "${user.nama}" (${user.email}) secara permanen?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.message);

          fetchUsers();
          showToast('Akun pengguna berhasil dihapus.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Gagal menghapus akun.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'Semua' || u.level_akses === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 font-sans pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Hak Akses & Akun</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Kelola kredensial guru, staf admin, dan akun portal wali murid.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Akun Pengguna
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari akun berdasarkan nama atau email login..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] transition-all shadow-3xs"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        <div className="flex gap-2">
          {['Semua', 'GURU & ADMIN', 'WALI MURID'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                filterRole === role
                  ? 'bg-[#02677f] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL PENGGUNA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
            Memuat daftar akun pengguna dari database Neon...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400">
            Belum ada akun pengguna yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nama Pengguna</th>
                  <th className="py-3.5 px-5">Email Terdaftar</th>
                  <th className="py-3.5 px-5">Peran / Hak Akses</th>
                  <th className="py-3.5 px-5">Anak Didik Terhubung</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#02677f] flex items-center justify-center font-extrabold text-xs shrink-0 border border-slate-200">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.nama} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            u.nama.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-slate-900 font-extrabold">{u.nama}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-600">{u.email}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                        u.level_akses === 'GURU & ADMIN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-sky-50 text-[#02677f] border border-sky-100'
                      }`}>
                        {u.level_akses}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500">{u.nama_anak || '-'}</td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="p-1.5 text-slate-400 hover:text-[#02677f] rounded-xl hover:bg-sky-50 transition-colors mr-1"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM BUAT / EDIT AKUN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {selectedUser ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Ketik nama lengkap..."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat Email</label>
                <input
                  type="email"
                  placeholder="contoh@cahayahati.sch.id"
                  value={formData.email}
                  disabled={!!selectedUser}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* KOLOM PASSWORD / KATA SANDI */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                  <span>Kata Sandi (Password)</span>
                  {selectedUser && <span className="text-slate-400 text-[9px] font-normal">Kosongkan jika tidak diubah</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={selectedUser ? 'Ketik untuk ganti kata sandi...' : 'Minimal 8 karakter...'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Peran / Level Akses</label>
                <select
                  value={formData.level_akses}
                  onChange={(e) => setFormData({ ...formData, level_akses: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                >
                  <option value="GURU & ADMIN">GURU & ADMIN</option>
                  <option value="WALI MURID">WALI MURID</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white rounded-xl text-xs font-bold shadow-xs">
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Hapus Akun</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}
                className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-colors"
              >
                Hapus
              </button>
            </div>
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