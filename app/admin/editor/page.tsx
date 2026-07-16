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

export default function AdminEditorLandingPage() {
  const [search, setSearch] = useState('');
  const [aktivitasList, setAktivitasList] = useState<AktivitasItem[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  
  // State Modal Controls & Active Tab Switcher ('artikel' | 'hero')
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'artikel' | 'hero'>('artikel');
  const [selectedArtikel, setSelectedArtikel] = useState<AktivitasItem | null>(null);

  // State Image Upload Engine (Supabase Storage)
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // State Form Errors Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State Toast & Confirm Dialog
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  // State Hero Section Data (Re-branded TK CAHAYA HATI)
  const [heroData, setHeroData] = useState({
    headline: 'Bermain Bersama, Belajar Ceria di TK CAHAYA HATI',
    subDescription: 'Membentuk karakter anak didik yang kreatif, berakhlak mulia, dan siap menyongsong masa depan cerah dengan pendekatan pembelajaran interaktif.'
  });

  // State Form Canvas Data Artikel
  const [canvasData, setCanvasData] = useState<Omit<AktivitasItem, 'id'>>({
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

  const formatTanggalSidebar = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const fetchKontenSidebar = async () => {
    setLoadingSidebar(true);
    try {
      const { data, error } = await supabase
        .from('aktivitas')
        .select('*')
        .order('tanggal', { ascending: false });

      if (error) throw error;
      if (data) setAktivitasList(data);
    } catch (err: any) {
      console.error('Gagal memuat konten:', err.message);
    } finally {
      setLoadingSidebar(false);
    }
  };

  useEffect(() => {
    fetchKontenSidebar();
  }, []);

  const handleSaveHeroText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showToast('Teks beranda utama (Hero Section) berhasil diperbarui!', 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Gagal memperbarui teks Hero Section.', 'error');
    }
  };

  const handleCanvasImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap masukkan berkas gambar yang valid (JPG, PNG, WEBP).', 'warning');
      return;
    }

    setIsUploadingImage(true);
    setUploadingFileName(file.name);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);

    try {
      const fileExtension = file.name.split('.').pop();
      const cleanFileName = `${Date.now()}_canvas_${Math.floor(100 + Math.random() * 900)}.${fileExtension}`;
      const filePath = `public/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('aktivitas-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage.from('aktivitas-images').getPublicUrl(filePath);

      setTimeout(() => {
        setCanvasData((prev: Omit<AktivitasItem, 'id'>) => ({ ...prev, gambar_url: data.publicUrl }));
        setIsUploadingImage(false);
        showToast('Gambar sampul artikel berhasil diunggah!', 'success');
      }, 400);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingImage(false);
      showToast(`Gagal mengunggah gambar: ${err.message}`, 'error');
    }
  };

  const handleOpenNewModal = (tab: 'artikel' | 'hero' = 'artikel') => {
    setSelectedArtikel(null);
    setErrors({});
    setActiveModalTab(tab);
    setCanvasData({ judul: '', kategori: 'Kegiatan', tanggal: '', gambar_url: '', deskripsi: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditCanvas = (item: AktivitasItem) => {
    setSelectedArtikel(item);
    setErrors({});
    setActiveModalTab('artikel');
    setCanvasData({
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal,
      gambar_url: item.gambar_url || '',
      deskripsi: item.deskripsi
    });
    setIsModalOpen(true);
  };

  const validateCanvasForm = (): boolean => {
    const canvasErrors: Record<string, string> = {};
    if (!canvasData.judul.trim()) canvasErrors.judul = 'Judul liputan kegiatan wajib diisi.';
    if (!canvasData.tanggal) canvasErrors.tanggal = 'Tentukan tanggal pelaksanaan kegiatan.';
    if (!canvasData.deskripsi.trim()) canvasErrors.deskripsi = 'Tulis isi materi liputan berita.';
    setErrors(canvasErrors);
    return Object.keys(canvasErrors).length === 0;
  };

  const handlePublishCanvasArtikel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCanvasForm()) {
      showToast('Periksa kembali! Ada bidang kanvas wajib yang masih kosong.', 'warning');
      return;
    }

    try {
      if (selectedArtikel) {
        const { error } = await supabase
          .from('aktivitas')
          .update({
            judul: canvasData.judul.trim(),
            tanggal: canvasData.tanggal,
            gambar_url: canvasData.gambar_url,
            deskripsi: canvasData.deskripsi.trim()
          })
          .eq('id', selectedArtikel.id);

        if (error) throw error;
        showToast('Liputan artikel kegiatan sukses diperbarui!', 'success');
      } else {
        const { error } = await supabase
          .from('aktivitas')
          .insert([canvasData]);

        if (error) throw error;
        showToast('Liputan artikel baru berhasil diterbitkan ke website!', 'success');
      }

      fetchKontenSidebar();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal menyimpan artikel: ${err.message}`, 'error');
    }
  };

  const triggerDeleteArtikel = (item: AktivitasItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin menghapus liputan artikel "${item.judul}" secara permanen?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('aktivitas')
            .delete()
            .eq('id', item.id);

          if (error) throw error;
          fetchKontenSidebar();
          showToast('Artikel kegiatan sukses dihapus.', 'success');
        } catch (err: any) {
          showToast(`Gagal menghapus liputan: ${err.message}`, 'error');
        } finally {
          setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const filteredList = aktivitasList.filter((item) => {
    const keyword = search.toLowerCase();
    return (
      item.judul?.toLowerCase().includes(keyword) ||
      item.deskripsi?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="pb-28 font-sans">
      {/* HEADER UTAMA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Konten Web</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola informasi Hero Section dan publikasi berita landing page TK CAHAYA HATI.</p>
        </div>
        {/* Tombol Aksi Multi-Fungsi Desktop */}
        <button 
          onClick={() => handleOpenNewModal('artikel')} 
          className="hidden md:flex bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kelola Konten Web
        </button>
      </header>

      {/* COMPACT HERO STATUS BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-3xs mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5 truncate max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Status Beranda Utama (Hero Section)</span>
          </div>
          <h3 className="text-xs font-bold truncate text-slate-100">{heroData.headline}</h3>
        </div>
        <button 
          onClick={() => handleOpenNewModal('hero')}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-[11px] font-bold transition-all shrink-0 inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Hero Section
        </button>
      </div>

      {/* SLEEK SEARCH BAR */}
      <div className="relative max-w-md w-full mt-4">
        <input 
          type="text" 
          placeholder="Cari berita atau artikel kegiatan..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-[#02677f] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-3xs" 
        />
        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* LIST KONTEN BENTO CARDS */}
      <div className="mt-5 space-y-3">
        <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase pl-1">Daftar Kegiatan & Berita Aktif Website</h3>

        {loadingSidebar ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke arsip konten website...</div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs font-medium text-slate-400 italic">
            Belum ada konten berita yang diterbitkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((artikel) => (
              <div key={artikel.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between shadow-3xs hover:shadow-xs transition-all group animate-fadeIn space-y-3">
                <div className="space-y-2.5">
                  <div className="flex gap-3 items-center">
                    {/* Thumbnail Cover Render */}
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                      {artikel.gambar_url ? (
                        <img src={artikel.gambar_url} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>

                    <div className="truncate space-y-0.5">
                      <span className="block text-[9px] font-mono font-bold text-[#02677f] uppercase">
                        {formatTanggalSidebar(artikel.tanggal)}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-xs truncate tracking-tight leading-snug">
                        {artikel.judul}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {artikel.deskripsi}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => handleOpenEditCanvas(artikel)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#02677f] hover:bg-sky-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => triggerDeleteArtikel(artikel)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FLOATING THUMB-ACTION BUTTON FOR MOBILE */}
      <div className="fixed bottom-[92px] right-4 left-4 md:hidden z-40">
        <button 
          onClick={() => handleOpenNewModal('artikel')} 
          className="w-full bg-[#02677f] hover:bg-[#005468] text-white py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kelola Konten Web
        </button>
      </div>

      {/* ================= SMART UNIFIED MODAL COMPONENT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg w-full shadow-xl my-8 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                {selectedArtikel ? 'Modifikasi Artikel' : 'Pusat Editor Konten'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* TAB SELECTOR CHOOSER (PURE INLINE SVG ONLY) */}
            {!selectedArtikel && (
              <div className="flex border-b border-slate-100 text-[11px] font-bold text-slate-400 mb-4">
                <button 
                  type="button" 
                  onClick={() => setActiveModalTab('artikel')} 
                  className={`pb-2 px-3 flex-1 border-b-2 transition-all flex items-center justify-center gap-1.5 ${activeModalTab === 'artikel' ? 'border-[#02677f] text-[#02677f]' : 'border-transparent text-slate-500'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span>Tambah Kegiatan / Artikel</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveModalTab('hero')} 
                  className={`pb-2 px-3 flex-1 border-b-2 transition-all flex items-center justify-center gap-1.5 ${activeModalTab === 'hero' ? 'border-[#02677f] text-[#02677f]' : 'border-transparent text-slate-500'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  <span>Teks Hero Section</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT 1: FORM INPUT ARTIKEL / KEGIATAN */}
            {activeModalTab === 'artikel' && (
              <form onSubmit={handlePublishCanvasArtikel} noValidate className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Artikel Kegiatan</label>
                    <input 
                      type="text" 
                      placeholder="Ketik judul liputan acara..." 
                      value={canvasData.judul}
                      onChange={(e) => {
                        setCanvasData({ ...canvasData, judul: e.target.value });
                        if (errors.judul) setErrors((prev) => { const { judul, ...r } = prev; return r; });
                      }}
                      className={`w-full p-2.5 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                        errors.judul ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                      }`}
                    />
                    {errors.judul && (
                      <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {errors.judul}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Publikasi Berita</label>
                    <input 
                      type="date" 
                      value={canvasData.tanggal}
                      onChange={(e) => {
                        setCanvasData({ ...canvasData, tanggal: e.target.value });
                        if (errors.tanggal) setErrors((prev) => { const { tanggal, ...r } = prev; return r; });
                      }}
                      className={`w-full p-2.5 border rounded-xl text-xs font-bold text-slate-900 outline-none transition-all ${
                        errors.tanggal ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                      }`}
                    />
                    {errors.tanggal && (
                      <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {errors.tanggal}
                      </p>
                    )}
                  </div>
                </div>

                {/* DRAG & DROP IMAGE UPLOADER */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Gambar Sampul Berita</label>
                  {isUploadingImage ? (
                    <div className="border border-slate-200 bg-slate-50/50 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="truncate max-w-[200px] font-medium">{uploadingFileName}</span>
                        <span className="font-mono text-[#02677f]">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#02677f] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : canvasData.gambar_url ? (
                    <div className="border border-slate-200 bg-white p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs">
                      <div className="flex items-center gap-3 truncate">
                        <img src={canvasData.gambar_url} alt="Cover Preview" className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0" />
                        <div className="truncate">
                          <span className="block text-xs font-bold text-slate-800 truncate">sampul_artikel.png</span>
                          <span className="block text-[9px] font-bold text-emerald-600">Gambar terlampir</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCanvasData(prev => ({ ...prev, gambar_url: '' }))} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2">Copot</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-[#02677f] rounded-xl p-4 text-center bg-slate-50/20 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" onChange={handleCanvasImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="text-xs font-bold text-slate-400 group-hover:text-[#02677f] flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Klik Untuk Unggah Gambar Sampul
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Isi / Ulasan Ringkasan Kegiatan</label>
                  <textarea 
                    rows={4} 
                    placeholder="Tulis kronologi liputan atau pengumuman secara substantif di sini..."
                    value={canvasData.deskripsi}
                    onChange={(e) => {
                      setCanvasData({ ...canvasData, deskripsi: e.target.value });
                      if (errors.deskripsi) setErrors((prev) => { const { deskripsi, ...r } = prev; return r; });
                    }}
                    className={`w-full p-2.5 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 leading-relaxed resize-none outline-none transition-all ${
                      errors.deskripsi ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]'
                    }`}
                  />
                  {errors.deskripsi && (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {errors.deskripsi}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50">Batal</button>
                  <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5">
                    {selectedArtikel ? 'Perbarui Artikel' : 'Terbitkan Artikel'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 2: FORM EDIT HERO SECTION */}
            {activeModalTab === 'hero' && (
              <form onSubmit={handleSaveHeroText} noValidate className="space-y-4 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Judul Utama Sekolah (Headline)</label>
                  <input 
                    type="text" 
                    value={heroData.headline}
                    onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/30 focus:bg-white outline-none focus:border-[#02677f] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sub-Deskripsi Pendukung</label>
                  <textarea 
                    rows={3} 
                    value={heroData.subDescription}
                    onChange={(e) => setHeroData({ ...heroData, subDescription: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/30 focus:bg-white leading-relaxed resize-none outline-none focus:border-[#02677f] transition-all"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50">Batal</button>
                  <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all">
                    Simpan Teks Beranda
                  </button>
                </div>
              </form>
            )}

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
                Hapus Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}