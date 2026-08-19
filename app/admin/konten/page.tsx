'use client';

import { useState, useEffect } from 'react';

interface AktivitasItem {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar_url?: string;
  deskripsi: string;
}

export default function AdminKontenPage() {
  const [search, setSearch] = useState('');
  const [kontenList, setKontenList] = useState<AktivitasItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKonten, setEditingKonten] = useState<AktivitasItem | null>(null);

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Kegiatan',
    tanggal: '',
    gambar_url: '',
    deskripsi: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const fetchKonten = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/aktivitas');
      const json = await res.json();
      const data: AktivitasItem[] = json.success ? json.data : (Array.isArray(json) ? json : []);
      setKontenList(data);
    } catch (err: any) {
      showToast('Gagal memuat konten aktivitas.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchKonten();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih berkas gambar yang valid (JPG/PNG).', 'warning');
      return;
    }

    setUploadingFileName(file.name);
    setIsUploadingFile(true);
    setUploadProgress(25);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    reader.onloadend = () => {
      setUploadProgress(100);
      setFormData((prev) => ({ ...prev, gambar_url: reader.result as string }));
      setIsUploadingFile(false);
      showToast('Foto liputan berhasil diproses!', 'success');
    };
    reader.onerror = () => {
      setIsUploadingFile(false);
      showToast('Gagal memproses gambar.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingKonten(null);
    setFormData({
      judul: '',
      kategori: 'Kegiatan',
      tanggal: new Date().toISOString().split('T')[0],
      gambar_url: '',
      deskripsi: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AktivitasItem) => {
    setEditingKonten(item);
    setFormData({
      judul: item.judul,
      kategori: item.kategori || 'Kegiatan',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
      gambar_url: item.gambar_url || '',
      deskripsi: item.deskripsi || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.tanggal) {
      showToast('Judul dan tanggal kegiatan wajib diisi.', 'warning');
      return;
    }

    try {
      if (editingKonten) {
        const res = await fetch(`/api/aktivitas/${editingKonten.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Berita liputan berhasil diperbarui!', 'success');
      } else {
        const res = await fetch('/api/aktivitas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Liputan baru berhasil diterbitkan!', 'success');
      }

      fetchKonten();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan konten.', 'error');
    }
  };

  const handleDelete = (item: AktivitasItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Hapus berita/aktivitas "${item.judul}" secara permanen?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/aktivitas/${item.id}`, { method: 'DELETE' });
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error(result.message);

          fetchKonten();
          showToast('Liputan aktivitas berhasil dihapus.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Gagal menghapus.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredKonten = kontenList.filter(
    (item) =>
      item.judul?.toLowerCase().includes(search.toLowerCase()) ||
      item.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      item.kategori?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Konten & Berita</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Kelola publikasi dokumentasi liputan dan pengumuman sekolah.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Liputan Baru
        </button>
      </div>

      <div className="relative max-w-md w-full">
        <input
          type="text"
          placeholder="Cari liputan kegiatan atau berita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] transition-all shadow-3xs"
        />
        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
        {loadingData ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
            Memuat daftar berita liputan dari database...
          </div>
        ) : filteredKonten.length === 0 ? (
          <div className="p-16 text-center text-xs font-bold text-slate-400">
            Belum ada dokumentasi liputan yang tersedia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Cover</th>
                  <th className="py-3.5 px-5">Judul Berita</th>
                  <th className="py-3.5 px-5">Kategori</th>
                  <th className="py-3.5 px-5">Tanggal</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                {filteredKonten.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {item.gambar_url ? (
                          <img src={item.gambar_url} alt={item.judul} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-slate-400">No Img</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-slate-900 font-extrabold">{item.judul}</td>
                    <td className="py-3 px-5">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-sky-50 text-[#02677f] border border-sky-100">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-500">{item.tanggal ? item.tanggal.split('T')[0] : '-'}</td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-[#02677f] rounded-xl hover:bg-sky-50 transition-colors mr-1"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {editingKonten ? 'Edit Liputan Berita' : 'Terbitkan Liputan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Liputan</label>
                <input
                  type="text"
                  placeholder="Ketik judul kegiatan..."
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Fasilitas">Fasilitas</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Foto Cover</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-[#02677f] hover:file:bg-sky-100" />
                {isUploadingFile && <p className="text-[10px] text-[#02677f] font-bold">Memproses foto: {uploadProgress}%</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Ulasan</label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan ulasan kegiatan..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:border-[#02677f] outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-[#02677f] hover:bg-[#005468] text-white rounded-xl text-xs font-bold shadow-xs">
                  Simpan Liputan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Hapus</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmDialog.onConfirm} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs">Hapus</button>
            </div>
          </div>
        </div>
      )}

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