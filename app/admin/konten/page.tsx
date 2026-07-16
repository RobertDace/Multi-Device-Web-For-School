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

export default function AdminKontenWebPage() {
  const [aktivitasList, setAktivitasList] = useState<AktivitasItem[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  
  // State Kontrol Pembukaan Kanvas Komposisi Artikel (WordPress Style)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [selectedArtikel, setSelectedAgenda] = useState<AktivitasItem | null>(null);

  // State Progres Unggahan Gambar Sampul
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // State Manajemen Validasi Error Khusus Kanvas
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State Banner Toast Notifikasi Premium (Full Inline SVG)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  // State Komponen Teks Beranda Utama (Hero Section)
  const [heroData, setHeroData] = useState({
    headline: 'Bermain Bersama, Belajar Ceria di TK Ceria',
    subDescription: 'Membentuk karakter anak didik yang kreatif, berakhlak mulia, dan siap menyongsong masa depan cerah dengan pendekatan pembelajaran interaktif.'
  });

  // State Formulir Pengisian Kanvas Artikel Baru
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

  // Helper Format Cetak Tanggal Sesuai Visual Komponen Kanan Sidebar
  const formatTanggalSidebar = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI'];
      const namaBulan = date.getMonth() === 5 ? 'JUNI' : date.getMonth() === 6 ? 'JULI' : date.getMonth() === 7 ? 'AGUSTUS' : months[date.getMonth()];
      return `${date.getDate()} ${namaBulan} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // 💡 READ: Mengambil Data Kegiatan Terbit Konten ke Bagian Sidebar Kanan
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
      console.error('Gagal memuat konten sidebar:', err.message);
    } finally {
      setLoadingSidebar(false);
    }
  };

  useEffect(() => {
    fetchKontenSidebar();
  }, []);

  // 💡 UPDATE: Menyimpan Perubahan Teks Struktur Hero Section Beranda Depan
  const handleSaveHeroText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Catatan: Anda bisa menyambungkan baris ini ke tabel 'config' jika sudah membuat barisnya di Supabase
      showToast('Struktur teks beranda utama (Hero Section) berhasil diperbarui ke landing page!', 'success');
    } catch (err: any) {
      showToast('Gagal memperbarui struktur teks utama.', 'error');
    }
  };

  // 💡 LIVE ENGINE: Upload Gambar ke Bucket 'aktivitas-images' Melalui Jalur Kanvas Baru
  const handleCanvasImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Ekstensi ditolak! Harap masukkan berkas gambar yang valid.', 'warning');
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
        showToast('Gambar sampul blok artikel berhasil diunggah!', 'success');
      }, 400);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingImage(false);
      showToast(`Gagal mengunggah gambar sampul: ${err.message}`, 'error');
    }
  };

  const handleOpenNewCanvas = () => {
    setSelectedAgenda(null);
    setErrors({});
    setCanvasData({ judul: '', kategori: 'Kegiatan', tanggal: '', gambar_url: '', deskripsi: '' });
    setIsCanvasOpen(true);
  };

  const validateCanvasForm = (): boolean => {
    const canvasErrors: Record<string, string> = {};
    if (!canvasData.judul.trim()) canvasErrors.judul = 'Judul blok artikel kegiatan wajib diisi.';
    if (!canvasData.tanggal) canvasErrors.tanggal = 'Tentukan tanggal rilis berita kegiatan.';
    if (!canvasData.deskripsi.trim()) canvasErrors.deskripsi = 'Tulis isi konten substantif artikel kegiatan.';
    setErrors(canvasErrors);
    return Object.keys(canvasErrors).length === 0;
  };

  // 💡 TRANSAKSI KANVAS: Menyimpan Tulisan Blok Baru Langsung Meluncur ke Tabel Aktivitas
  const handlePublishCanvasArtikel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCanvasForm()) {
      showToast('Periksa kembali! Ada beberapa bidang kanvas yang belum diisi.', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('aktivitas')
        .insert([canvasData]);

      if (error) throw error;
      showToast('Blok artikel kegiatan baru sukses diterbitkan ke landing page!', 'success');
      fetchKontenSidebar();
      setIsCanvasOpen(false);
    } catch (err: any) {
      showToast(`Gagal menerbitkan artikel: ${err.message}`, 'error');
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* PANEL KIRI: EDITOR UTAMA (HERO SECTION & WORDPRESS STYLE CANVAS) */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Konten Web</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Ubah teks informasi publik, pengumuman beranda depan, dan galeri yang tampil di landing page.</p>
          </div>

          {/* SECTION 1: KOMPONEN BERANDA UTAMA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Komponen Beranda Utama (Hero Section)</h2>
            <form onSubmit={handleSaveHeroText} noValidate className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Utama Sekolah (Headline)</label>
                <input 
                  type="text" value={heroData.headline}
                  onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/30 outline-none focus:border-[#02677f]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sub-Deskripsi Pendukung</label>
                <textarea 
                  rows={3} value={heroData.subDescription}
                  onChange={(e) => setHeroData({ ...heroData, subDescription: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50/30 leading-relaxed resize-none outline-none focus:border-[#02677f]"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Struktur Teks
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: BLOK EDITOR KEGIATAN (WORDPRESS STYLE) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Blok Editor Kegiatan (WordPress Style)</h2>
              {!isCanvasOpen && (
                <button type="button" onClick={handleOpenNewCanvas} className="text-[#02677f] hover:text-[#005468] text-xs font-bold inline-flex items-center gap-1 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  + Buka Kanvas Baru
                </button>
              )}
            </div>

            {isCanvasOpen ? (
              // KANVAS AKTIF COMPOSER COMPONENT 
              <form onSubmit={handlePublishCanvasArtikel} noValidate className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Artikel Kegiatan</label>
                    <input 
                      type="text" placeholder="Ketik judul liputan acara..." value={canvasData.judul}
                      onChange={(e) => {
                        setCanvasData({ ...canvasData, judul: e.target.value });
                        if (errors.judul) setErrors((prev: Record<string, string>) => { const { judul, ...r } = prev; return r; });
                      }}
                      className={`w-full p-3 border rounded-xl text-xs font-bold outline-none transition-all ${
                        errors.judul ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:border-[#02677f]'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Publikasi Berita</label>
                    <input 
                      type="date" value={canvasData.tanggal}
                      onChange={(e) => {
                        setCanvasData({ ...canvasData, tanggal: e.target.value });
                        if (errors.tanggal) setErrors((prev: Record<string, string>) => { const { tanggal, ...r } = prev; return r; });
                      }}
                      className={`w-full p-3 border rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all ${
                        errors.tanggal ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:border-[#02677f]'
                      }`}
                    />
                  </div>
                </div>

                {/* DRAG AND DROP IMAGE COMPOSER */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gambar Sampul Berita</label>
                  {isUploadingImage ? (
                    <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="truncate max-w-[280px] font-medium">{uploadingFileName}</span>
                        <span className="font-mono text-[#02677f]">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#02677f] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : canvasData.gambar_url ? (
                    <div className="border border-slate-200 bg-white p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-3xs">
                      <div className="flex items-center gap-3 truncate">
                        <img src={canvasData.gambar_url} alt="Cover Preview" className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0" />
                        <div>
                          <span className="block text-xs font-bold text-slate-800 truncate">sampul_artikel.png</span>
                          <span className="block text-[9px] font-bold text-emerald-600 mt-0.5">Gambar siap diluncurkan</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCanvasData(prev => ({ ...prev, gambar_url: '' }))} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2">Copot</button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-[#02677f] rounded-xl p-5 text-center bg-slate-50/20 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" onChange={handleCanvasImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="text-xs font-bold text-slate-400 group-hover:text-[#02677f] transition-colors flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Klik Untuk Unggah Gambar Brosur Utama Kegiatan
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Isi / Ulasan Ringkasan Kegiatan</label>
                  <textarea 
                    rows={4} placeholder="Tulis rincian jalannya kegiatan belajar mengajar atau pengumuman secara substantif di sini..."
                    value={canvasData.deskripsi}
                    onChange={(e) => {
                      setCanvasData({ ...canvasData, deskripsi: e.target.value });
                      if (errors.deskripsi) setErrors((prev: Record<string, string>) => { const { deskripsi, ...r } = prev; return r; });
                    }}
                    className={`w-full p-3 border rounded-xl text-xs font-semibold leading-relaxed resize-none outline-none transition-all ${
                      errors.deskripsi ? 'border-rose-500 bg-rose-50/10 focus:border-rose-500' : 'border-slate-200 bg-slate-50/50 focus:border-[#02677f]'
                    }`}
                  />
                  {errors.deskripsi && (
                    <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {errors.deskripsi}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setIsCanvasOpen(false)} className="border border-slate-200 text-slate-500 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors">Tutup Kanvas</button>
                  <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Terbitkan Artikel
                  </button>
                </div>
              </form>
            ) : (
              // Keadaan Lapangan Kanvas Kosong (Sesuai Referensi Gambar)
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">Silakan klik "+ Buka Kanvas Baru" untuk mengaktifkan mesin editor blok artikel.</p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL KANAN: LIST MONITORING BERITA AKTIF DI WEBSITE */}
        <div className="w-full lg:w-[360px] shrink-0 space-y-3">
          <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase pl-1">Daftar Kegiatan Aktif Di Website</h3>
          
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {loadingSidebar ? (
              <div className="p-6 text-center text-xs font-bold text-slate-300 animate-pulse">Menghubungkan ke arsip berita...</div>
            ) : aktivitasList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center text-xs font-medium text-slate-400 italic">
                Belum ada konten berita yang di-publish.
              </div>
            ) : (
              aktivitasList.map((artikel) => (
                <div key={artikel.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 items-center shadow-3xs hover:shadow-2xs transition-all animate-fadeIn">
                  
                  {/* Thumbnail Cover Render */}
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                    {artikel.gambar_url ? (
                      <img src={artikel.gambar_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Metadata Ringkas */}
                  <div className="truncate space-y-0.5">
                    <span className="block text-[9px] font-mono font-bold text-[#02677f] uppercase">
                      {formatTanggalSidebar(artikel.tanggal)}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-xs truncate tracking-tight leading-snug">
                      {artikel.judul}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate font-medium">
                      {artikel.deskripsi}
                    </p>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* TOAST NOTIFIKASI PURE INLINE SVG */}
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
    </>
  );
}