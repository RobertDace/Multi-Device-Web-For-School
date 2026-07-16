'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AktivitasItem {
  id: string; 
  judul: string;
  kategori: string; 
  tanggal: string;  
  gambar_url?: string;
  deskripsi: string;
}

export default function AdminKalenderPage() {
  const [search, setSearch] = useState('');
  const [agendaList, setAgendaList] = useState<AktivitasItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<AktivitasItem | null>(null);

  // State Controls Custom Category Dropdown (Anti Native OS Select UI)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryOptions = ['Akademik', 'Kegiatan', 'Fasilitas'];

  // State Upload Gambar ke Supabase Storage
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // State Errors Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State Toast & Confirm Dialog
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  // State Form Data
  const [formData, setFormData] = useState<Omit<AktivitasItem, 'id'>>({
    judul: '',
    kategori: 'Akademik',
    tanggal: '',
    gambar_url: '',
    deskripsi: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const formatVisualTanggal = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
      return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const fetchAgendaDariSupabase = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('aktivitas')
        .select('*')
        .order('tanggal', { ascending: true });

      if (error) throw error;
      if (data) setAgendaList(data);
    } catch (err: any) {
      console.error('Gagal memuat data kalender:', err.message);
      showToast('Koneksi database terganggu saat memuat agenda.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAgendaDariSupabase();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Sistem hanya menerima dokumen gambar (JPG, PNG, WEBP).', 'warning');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast('Batas maksimal ukuran cover brosur adalah 4MB.', 'warning');
      return;
    }

    setUploadingFileName(file.name);
    setIsUploadingFile(true);
    setUploadProgress(5);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 92) {
          clearInterval(progressInterval);
          return 92;
        }
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 120);

    try {
      const fileExtension = file.name.split('.').pop();
      const cleanFileName = `${Date.now()}_agenda_${Math.floor(100 + Math.random() * 900)}.${fileExtension}`;
      const filePath = `public/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('aktivitas-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage.from('aktivitas-images').getPublicUrl(filePath);

      setTimeout(() => {
        setFormData((prev: Omit<AktivitasItem, 'id'>) => ({ ...prev, gambar_url: data.publicUrl }));
        setIsUploadingFile(false);
        showToast('Gambar brosur berhasil diunggah ke storage cloud!', 'success');
      }, 350);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingFile(false);
      showToast(`Gagal mengunggah gambar: ${err.message}`, 'error');
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev: Omit<AktivitasItem, 'id'>) => ({ ...prev, gambar_url: '' }));
    showToast('Cover brosur agenda berhasil dicabut.', 'warning');
  };

  const handleOpenAdd = () => {
    setEditingAgenda(null);
    setErrors({});
    setIsCategoryDropdownOpen(false);
    setFormData({ judul: '', kategori: 'Akademik', tanggal: '', gambar_url: '', deskripsi: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AktivitasItem) => {
    setEditingAgenda(item);
    setErrors({});
    setIsCategoryDropdownOpen(false);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.judul.trim()) newErrors.judul = 'Judul agenda kegiatan wajib diisi.';
    if (!formData.tanggal) newErrors.tanggal = 'Tentukan tanggal pelaksanaan kegiatan.';
    if (!formData.deskripsi.trim()) newErrors.deskripsi = 'Berikan rangkuman deskripsi ringkas kegiatan.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Periksa kembali bidang input yang kosong!', 'warning');
      return;
    }

    try {
      if (editingAgenda) {
        const { error } = await supabase
          .from('aktivitas')
          .update({
            judul: formData.judul.trim(),
            kategori: formData.kategori,
            tanggal: formData.tanggal,
            gambar_url: formData.gambar_url?.trim(),
            deskripsi: formData.deskripsi.trim()
          })
          .eq('id', editingAgenda.id);

        if (error) throw error;
        showToast('Rencana agenda berhasil diperbarui!', 'success');
      } else {
        const { error } = await supabase
          .from('aktivitas')
          .insert([formData]);

        if (error) throw error;
        showToast('Agenda kegiatan baru berhasil dijadwalkan!', 'success');
      }

      fetchAgendaDariSupabase();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal menyimpan ke server: ${err.message}`, 'error');
    }
  };

  const triggerDeleteAgenda = (item: AktivitasItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin menghapus jadwal kegiatan "${item.judul}" secara permanen?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('aktivitas')
            .delete()
            .eq('id', item.id);

          if (error) throw error;
          fetchAgendaDariSupabase();
          showToast('Jadwal agenda berhasil dihapus secara permanen.', 'success');
        } catch (err: any) {
          showToast(`Gagal menghapus data: ${err.message}`, 'error');
        } finally {
          setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredAgenda = agendaList.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(keyword) ||
      item.deskripsi?.toLowerCase().includes(keyword) ||
      item.kategori?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="pb-28 font-sans">
      {/* HEADER UTAMA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Kalender & Kegiatan</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Atur jadwal libur nasional, rapat wali murid, dan kegiatan KBM di TK CAHAYA HATI.</p>
        </div>
        {/* Tombol Tambah Desktop */}
        <button 
          onClick={handleOpenAdd} 
          className="hidden md:flex bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tambah Rencana Agenda
        </button>
      </header>

      {/* SLEEK PRECISE SEARCH BAR */}
      <div className="relative max-w-md w-full mt-4">
        <input 
          type="text" 
          placeholder="Cari nama agenda, kegiatan, atau deskripsi..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-[#02677f] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-3xs" 
        />
        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* RENDER GRID CARDS BENTO */}
      {loadingData ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke kalender akademik cloud...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          {filteredAgenda.map((item) => {
            const accentColorClass = 
              item.kategori === 'Akademik' ? 'border-l-cyan-500' :
              item.kategori === 'Kegiatan' ? 'border-l-rose-500' : 'border-l-emerald-500';

            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accentColorClass} p-5 flex flex-col justify-between shadow-3xs hover:shadow-xs transition-all group relative overflow-hidden animate-fadeIn`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                      {formatVisualTanggal(item.tanggal)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase ${
                      item.kategori === 'Akademik' ? 'bg-cyan-50 text-cyan-700' :
                      item.kategori === 'Kegiatan' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.kategori}
                    </span>
                  </div>
                  
                  {/* COVER DOKUMENTASI / BROSUR */}
                  {item.gambar_url && (
                    <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative">
                      <img src={item.gambar_url} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-3">
                      {item.deskripsi || 'Tidak ada deskripsi detail tambahan.'}
                    </p>
                  </div>
                </div>

                {/* ACTION BUTTON CONTROL PANEL */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2 items-center">
                  <button 
                    onClick={() => handleOpenEdit(item)} 
                    className="p-2 rounded-xl text-slate-400 hover:text-[#02677f] hover:bg-sky-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="md:hidden">Edit</span>
                  </button>
                  <button 
                    onClick={() => triggerDeleteAgenda(item)} 
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="md:hidden">Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAgenda.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs font-bold text-slate-300">
              Belum ada susunan rencana kegiatan terjadwal di kalender akademik.
            </div>
          )}
        </div>
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
          Tambah Rencana Agenda
        </button>
      </div>

      {/* MODAL DIALOG EDITOR KALENDER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-xl my-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {editingAgenda ? 'Modifikasi Rencana Agenda' : 'Tambah Rencana Agenda Baru'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setIsCategoryDropdownOpen(false); }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} noValidate className="space-y-4">
              {/* FIELD 1: JUDUL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama / Judul Kegiatan</label>
                <input 
                  type="text" 
                  placeholder="Masukkan nama acara sekolah..."
                  value={formData.judul}
                  onChange={(e) => {
                    setFormData({ ...formData, judul: e.target.value });
                    if (errors.judul) setErrors((prev: any) => { const { judul, ...r } = prev; return r; });
                  }}
                  className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    errors.judul ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                  }`}
                />
                {errors.judul && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errors.judul}
                  </p>
                )}
              </div>

              {/* BARIS: TANGGAL & CUSTOM CATEGORY DROPDOWN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Agenda</label>
                  <input 
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => {
                      setFormData({ ...formData, tanggal: e.target.value });
                      if (errors.tanggal) setErrors((prev: any) => { const { tanggal, ...r } = prev; return r; });
                    }}
                    className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 outline-none transition-all ${
                      errors.tanggal ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                    }`}
                  />
                  {errors.tanggal && (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {errors.tanggal}
                    </p>
                  )}
                </div>

                {/* CUSTOM CATEGORY DROPDOWN */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Klasifikasi Kategori</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-slate-50/50 outline-none text-left flex justify-between items-center transition-all focus:bg-white focus:border-[#02677f]"
                    >
                      <span>{formData.kategori}</span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCategoryDropdownOpen && (
                      <div className="absolute left-0 right-0 top-[46px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn max-w-full">
                        {categoryOptions.map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              setFormData({ ...formData, kategori: option });
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="p-3 text-xs font-bold text-slate-900 hover:bg-sky-50 cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <span>{option}</span>
                            {formData.kategori === option && (
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
              </div>

              {/* HUB DROPZONE LIVE IMAGE UPLOADER */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gambar Brosur / Cover Dokumentasi</label>
                
                {isUploadingFile ? (
                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl space-y-2 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="truncate max-w-[240px] font-medium">{uploadingFileName}</span>
                      <span className="font-mono text-[#02677f]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#02677f] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : formData.gambar_url ? (
                  <div className="border border-slate-200 bg-white p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs animate-fadeIn">
                    <div className="flex items-center gap-3 truncate">
                      <img src={formData.gambar_url} alt="Brosur Preview" className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">brosur_kegiatan.png</span>
                        <span className="block text-[9px] font-bold text-emerald-600 mt-0.5">Selesai terunggah ke cloud</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleRemoveImage} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1">Ganti</button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#02677f] rounded-xl p-4 text-center bg-slate-50/30 transition-colors group cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-xs font-bold text-slate-400 group-hover:text-[#02677f] transition-colors flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Klik / Seret Gambar Brosur ke Sini
                    </div>
                  </div>
                )}
              </div>

              {/* FIELD DESKRIPSI UTAMA */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Rangkuman Acara</label>
                <textarea 
                  rows={3}
                  placeholder="Tulis detail atau tujuan kegiatan singkat di sini..."
                  value={formData.deskripsi}
                  onChange={(e) => {
                    setFormData({ ...formData, deskripsi: e.target.value });
                    if (errors.deskripsi) setErrors((prev: any) => { const { deskripsi, ...r } = prev; return r; });
                  }}
                  className={`w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 leading-relaxed resize-none outline-none transition-all ${
                    errors.deskripsi ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                  }`}
                />
                {errors.deskripsi && (
                  <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1 animate-fadeIn">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {errors.deskripsi}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setIsCategoryDropdownOpen(false); }} 
                  className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-[#02677f] hover:bg-[#005468] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs transition-colors"
                >
                  Simpan Agenda
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
            {toast.message}
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
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Penghapusan</h3>
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
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}