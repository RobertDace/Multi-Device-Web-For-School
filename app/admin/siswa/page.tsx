'use client';

import { useState, useEffect } from 'react';

interface SiswaItem {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  status: string;
  nama_wali?: string;
  jurnal_hari_ini?: string;
  foto_jurnal?: string;
}

export default function AdminSiswaPage() {
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);

  // Form State Siswa
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas: 'Kelompok A',
    status: 'Aktif',
  });

  // Form State Jurnal Harian
  const [jurnalData, setJurnalData] = useState({
    jurnal_hari_ini: '',
    foto_jurnal: '',
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  const fetchSiswa = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/siswa');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSiswaList(json.data);
      }
    } catch {
      showToast('Gagal memuat data siswa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  // Buka Modal Tambah / Edit Siswa
  const handleOpenModal = (siswa: SiswaItem | null = null) => {
    setSelectedSiswa(siswa);
    if (siswa) {
      setFormData({
        nis: siswa.nis,
        nama: siswa.nama,
        kelas: siswa.kelas,
        status: siswa.status,
      });
    } else {
      setFormData({
        nis: '',
        nama: '',
        kelas: 'Kelompok A',
        status: 'Aktif',
      });
    }
    setIsModalOpen(true);
  };

  // Buka Modal Edit Jurnal
  const handleOpenJurnalModal = (siswa: SiswaItem) => {
    setSelectedSiswa(siswa);
    setJurnalData({
      jurnal_hari_ini: siswa.jurnal_hari_ini || '',
      foto_jurnal: siswa.foto_jurnal || '',
    });
    setIsJurnalModalOpen(true);
  };

  // Upload Foto Jurnal Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar yang valid.', 'warning');
      return;
    }

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setJurnalData((prev) => ({ ...prev, foto_jurnal: reader.result as string }));
      setIsUploadingPhoto(false);
      showToast('Foto jurnal berhasil diunggah!', 'success');
    };
    reader.onerror = () => {
      setIsUploadingPhoto(false);
      showToast('Gagal memproses gambar.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Simpan Data Siswa
  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis.trim() || !formData.nama.trim()) {
      showToast('NIS dan Nama Murid wajib diisi!', 'warning');
      return;
    }

    try {
      if (selectedSiswa) {
        const res = await fetch(`/api/siswa/${selectedSiswa.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Data murid berhasil diperbarui!', 'success');
      } else {
        const res = await fetch('/api/siswa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Murid baru berhasil ditambahkan!', 'success');
      }

      fetchSiswa();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data murid.', 'error');
    }
  };

  // Simpan Jurnal Harian
  const handleSaveJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) return;

    try {
      const res = await fetch(`/api/siswa/${selectedSiswa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jurnalData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      showToast('Jurnal & observasi harian murid berhasil disimpan!', 'success');
      fetchSiswa();
      setIsJurnalModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui jurnal.', 'error');
    }
  };

  // Hapus Siswa
  const handleDeleteSiswa = (siswa: SiswaItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Hapus murid "${siswa.nama}" (NIS: ${siswa.nis}) secara permanen? Data rapor terkait juga akan terhapus.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/siswa/${siswa.id}`, { method: 'DELETE' });
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.message);

          fetchSiswa();
          showToast('Data murid berhasil dihapus.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Gagal menghapus murid.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredSiswa = siswaList.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.toLowerCase().includes(search.toLowerCase());
    const matchKelas = filterKelas === 'Semua' || s.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Data Murid</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Kelola data induk anak didik dan catatan jurnal observasi harian.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Murid Baru
        </button>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari murid berdasarkan nama atau nomor NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] transition-all shadow-3xs"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        <div className="flex gap-2">
          {['Semua', 'Kelompok A', 'Kelompok B', 'Playgroup'].map((cls) => (
            <button
              key={cls}
              onClick={() => setFilterKelas(cls)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
                filterKelas === cls
                  ? 'bg-[#02677f] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* TABEL DATA SISWA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
            Memuat daftar data murid dari Neon PostgreSQL...
          </div>
        ) : filteredSiswa.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400">
            Tidak ada data murid yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">NIS</th>
                  <th className="py-3.5 px-5">Nama Murid</th>
                  <th className="py-3.5 px-5">Kelompok</th>
                  <th className="py-3.5 px-5">Wali Terhubung</th>
                  <th className="py-3.5 px-5">Observasi Hari Ini</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5 font-mono text-[#02677f] font-extrabold">{siswa.nis}</td>
                    <td className="py-4 px-5">
                      <span className="text-slate-900 font-extrabold block">{siswa.nama}</span>
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-md mt-0.5 ${
                        siswa.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {siswa.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">{siswa.kelas}</td>
                    <td className="py-4 px-5 text-slate-500">{siswa.nama_wali || '-'}</td>
                    <td className="py-4 px-5 max-w-xs">
                      {siswa.jurnal_hari_ini ? (
                        <p className="line-clamp-1 text-[11px] text-slate-600 font-medium">{siswa.jurnal_hari_ini}</p>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">Belum ada catatan hari ini</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenJurnalModal(siswa)}
                          className="px-2.5 py-1.5 bg-sky-50 text-[#02677f] hover:bg-sky-100 rounded-xl text-[11px] font-extrabold transition-colors"
                          title="Input Jurnal Harian"
                        >
                          Jurnal
                        </button>
                        <button
                          onClick={() => handleOpenModal(siswa)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                          title="Edit Murid"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSiswa(siswa)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title="Hapus Murid"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT SISWA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {selectedSiswa ? 'Edit Data Murid' : 'Tambah Murid Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Induk Siswa (NIS)</label>
                <input
                  type="text"
                  placeholder="Contoh: 202601001"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Murid</label>
                <input
                  type="text"
                  placeholder="Ketik nama lengkap anak didik..."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kelompok Belajar</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  >
                    <option value="Kelompok A">Kelompok A</option>
                    <option value="Kelompok B">Kelompok B</option>
                    <option value="Playgroup">Playgroup</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status Murid</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Lulus">Lulus</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white rounded-xl text-xs font-bold shadow-xs">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JURNAL HARIAN OBSERVASi */}
      {isJurnalModalOpen && selectedSiswa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Jurnal Harian Murid</h3>
                <p className="text-[11px] text-[#02677f] font-bold">{selectedSiswa.nama} ({selectedSiswa.nis})</p>
              </div>
              <button onClick={() => setIsJurnalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveJurnal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Aktivitas & Observasi Guru</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan perkembangan sikap, keaktifan belajar, atau catatan khusus murid hari ini..."
                  value={jurnalData.jurnal_hari_ini}
                  onChange={(e) => setJurnalData({ ...jurnalData, jurnal_hari_ini: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Foto Dokumentasi Hari Ini</label>
                {jurnalData.foto_jurnal ? (
                  <div className="border border-slate-200 bg-white p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs">
                    <img src={jurnalData.foto_jurnal} alt="Preview Jurnal" className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100" />
                    <button
                      type="button"
                      onClick={() => setJurnalData({ ...jurnalData, foto_jurnal: '' })}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Hapus Foto
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-[#02677f] rounded-xl p-4 text-center bg-slate-50/20 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <span className="text-xs font-bold text-slate-400">
                      {isUploadingPhoto ? 'Memproses gambar...' : 'Klik untuk unggah foto dokumentasi'}
                    </span>
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsJurnalModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white rounded-xl text-xs font-bold shadow-xs">
                  Simpan Jurnal
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
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Hapus Murid</h3>
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