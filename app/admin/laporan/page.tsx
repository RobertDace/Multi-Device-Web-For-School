'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ReportPhoto {
  id: string;
  dataUrl: string;
  namaFile: string;
}

interface ReportActivity {
  id: string;
  tanggal: string; // YYYY-MM-DD
  displayTanggal: string;
  keterangan: string;
  fotoList: ReportPhoto[];
}

interface SavedReportMeta {
  id: string;
  judul: string;
  subjudul: string;
  activityCount: number;
  dataJson: ReportActivity[];
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_PRESETS = [
  {
    label: '-- Pilih Template Keterangan Cepat --',
    text: '',
  },
  {
    label: 'Kegiatan Belajar & Sentra Kreativitas Anak',
    text: 'Kegiatan pembelajaran dan eksplorasi sentra seni/kreativitas anak didik.\nAnanda aktif berpartisipasi dalam melatih daya imajinasi dan fokus.',
  },
  {
    label: 'Pembelajaran Motorik Kasar & Senam Pagi',
    text: 'Kegiatan senam pagi ceria dan latihan fisik motorik kasar di halaman sekolah.\nAnak-anak bergerak aktif dengan riang gembira bersama guru kelas.',
  },
  {
    label: 'Pemberian Makanan Sehat Bersama (PMT)',
    text: 'Program Pemberian Makanan Tambahan (PMT) bergizi dan edukasi mencuci tangan serta adab makan bersama.',
  },
  {
    label: 'Pengenalan Literasi & Numerasi Dini',
    text: 'Kegiatan pengenalan fonik huruf dan konsep angka melalui permainan balok dan kartu bergambar edukatif.',
  },
  {
    label: 'Praktik Ibadah & Pembiasaan Doa Harian',
    text: 'Latihan salat berjamaah, hafalan doa sehari-hari, dan penanaman karakter akhlak mulia sejak dini.',
  },
  {
    label: 'Kunjungan Edukatif / Belajar di Luar Kelas',
    text: 'Kegiatan observasi lingkungan dan field trip edukatif untuk memperluas wawasan sosial anak didik.',
  },
  {
    label: 'Foto Sarana Prasarana & Ruang Kelas',
    text: 'Dokumentasi kondisi sarana prasarana, kebersihan, dan penataan alat permainan edukatif (APE) di ruang belajar.',
  },
  {
    label: 'Foto Gedung & Bangunan Sekolah Tampak Depan',
    text: 'Dokumentasi kondisi fisik gedung TK CAHAYA HATI tampak depan dalam keadaan terawat dan aman.',
  },
  {
    label: 'Foto Peralatan / Media Ajar yang Dibeli :',
    text: 'Dokumentasi penerimaan dan pengadaan peralatan/media pembelajaran:\n1. Balok geometri edukatif (2 set)\n2. Buku cerita bergambar anak (10 eksemplar)\n3. Karpet puzzle busa bermain (4 set)',
  },
  {
    label: 'Foto Material / Perbaikan yang Dibeli :',
    text: 'Dokumentasi pembelanjaan material pemeliharaan sarana:\n1. Cat tembok warna ramah anak (2 pail)\n2. Kuas & amplas (3 buah)\n3. Paku & engsel pintu (1 set)',
  },
];

export default function LaporanKegiatanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftFileRef = useRef<HTMLInputElement>(null);

  // Metadata Laporan
  const [judulLaporan, setJudulLaporan] = useState('LAPORAN DOKUMENTASI KEGIATAN');
  const [subjudulLaporan, setSubjudulLaporan] = useState('TK CAHAYA HATI — TAHUN AJARAN 2026/2027');

  // Database Saved Reports State
  const [savedReportsList, setSavedReportsList] = useState<SavedReportMeta[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  // Form Input
  const todayStr = '2026-10-28';
  const [inputTanggal, setInputTanggal] = useState(todayStr);
  const [inputKeterangan, setInputKeterangan] = useState('');
  const [inputFotos, setInputFotos] = useState<ReportPhoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Daftar Kegiatan Laporan
  const [activities, setActivities] = useState<ReportActivity[]>([]);

  // Preview Image Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Modal Google Docs
  const [isGDocsModalOpen, setIsGDocsModalOpen] = useState(false);

  // Export Loading State
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 4000);
  };

  // Format Tanggal Indonesia
  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()];
      const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ][d.getMonth()];
      return `${hari}, ${d.getDate()} ${bulan} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Ambil daftar laporan tersimpan di Database Neon untuk akun ini
  const fetchSavedReports = async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch('/api/laporan');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedReportsList(json.data);
      }
    } catch {
      console.error('Gagal memuat daftar laporan dari database');
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    setInputTanggal(new Date().toISOString().split('T')[0]);
    fetchSavedReports();
  }, []);

  // Muat draft dari LocalStorage saat pertama kali buka jika belum ada laporan database aktif
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tk_cahaya_hati_laporan_draft');
      if (saved && !currentReportId) {
        const parsed = JSON.parse(saved);
        if (parsed.judul) setJudulLaporan(parsed.judul);
        if (parsed.subjudul) setSubjudulLaporan(parsed.subjudul);
        if (Array.isArray(parsed.activities) && parsed.activities.length > 0) {
          setActivities(parsed.activities);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-backup ke LocalStorage
  useEffect(() => {
    try {
      if (activities.length > 0 || judulLaporan || subjudulLaporan) {
        localStorage.setItem(
          'tk_cahaya_hati_laporan_draft',
          JSON.stringify({
            judul: judulLaporan,
            subjudul: subjudulLaporan,
            activities,
          })
        );
      }
    } catch {
      // ignore
    }
  }, [judulLaporan, subjudulLaporan, activities]);

  // Handler Simpan ke Database Neon (Per Akun)
  const handleSaveToDatabase = async (saveAsNew = false) => {
    if (activities.length === 0) {
      showToast('Tambahkan minimal 1 baris kegiatan sebelum menyimpan ke database.', 'warning');
      return;
    }

    setIsSavingDb(true);
    try {
      if (currentReportId && !saveAsNew) {
        // Update laporan aktif di database
        const res = await fetch(`/api/laporan/${currentReportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judul: judulLaporan,
            subjudul: subjudulLaporan,
            activities,
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        showToast('Laporan kegiatan berhasil diperbarui di database Neon!', 'success');
      } else {
        // Buat laporan baru di database
        const res = await fetch('/api/laporan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judul: judulLaporan,
            subjudul: subjudulLaporan,
            activities,
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);
        setCurrentReportId(result.data.id);
        showToast('Laporan baru berhasil disimpan ke database Neon akun Anda!', 'success');
      }

      fetchSavedReports();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan ke database.', 'error');
    } finally {
      setIsSavingDb(false);
    }
  };

  // Handler Buka Laporan dari Database
  const handleLoadFromDb = (item: SavedReportMeta) => {
    setCurrentReportId(item.id);
    setJudulLaporan(item.judul);
    setSubjudulLaporan(item.subjudul || '');
    setActivities(item.dataJson || []);
    setIsDbModalOpen(false);
    showToast(`Laporan "${item.judul}" berhasil dimuat dari database!`, 'success');
  };

  // Handler Hapus Laporan dari Database
  const handleDeleteFromDb = async (reportId: string, judul: string) => {
    if (!confirm(`Hapus laporan "${judul}" secara permanen dari database akun Anda?`)) return;

    try {
      const res = await fetch(`/api/laporan/${reportId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      if (currentReportId === reportId) {
        setCurrentReportId(null);
      }
      fetchSavedReports();
      showToast('Laporan berhasil dihapus dari database.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan.', 'error');
    }
  };

  // Reset / Buat Baru
  const handleStartNewReport = () => {
    if (activities.length > 0) {
      if (!confirm('Mulai laporan baru? Pastikan laporan saat ini sudah disimpan ke database.')) return;
    }
    setCurrentReportId(null);
    setJudulLaporan('LAPORAN DOKUMENTASI KEGIATAN');
    setSubjudulLaporan('TK CAHAYA HATI — TAHUN AJARAN 2026/2027');
    setActivities([]);
    setInputKeterangan('');
    setInputFotos([]);
    setEditingItemId(null);
    showToast('Kanvas laporan baru siap diisi!', 'success');
  };

  // Handler Preset
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setInputKeterangan(val);
    }
  };

  // Kompresi foto di browser agar ringan dan cepat
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handler Upload Foto Baru
  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    const newPhotos: ReportPhoto[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        const compressedBase64 = await compressImage(file);
        newPhotos.push({
          id: Math.random().toString(36).substring(2, 9),
          dataUrl: compressedBase64,
          namaFile: file.name,
        });
      }

      setInputFotos((prev) => [...prev, ...newPhotos]);
      showToast(`${newPhotos.length} foto berhasil ditambahkan!`, 'success');
    } catch {
      showToast('Sebagian foto gagal diproses.', 'warning');
    } finally {
      setIsProcessingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setInputFotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Tambah atau Update Baris Kegiatan
  const handleAddOrUpdateActivity = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputTanggal) {
      showToast('Harap pilih tanggal kegiatan.', 'warning');
      return;
    }

    if (!inputKeterangan.trim()) {
      showToast('Keterangan kegiatan wajib diisi.', 'warning');
      return;
    }

    if (editingItemId) {
      setActivities((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                tanggal: inputTanggal,
                displayTanggal: formatIndonesianDate(inputTanggal),
                keterangan: inputKeterangan.trim(),
                fotoList: inputFotos,
              }
            : item
        )
      );
      setEditingItemId(null);
      showToast('Baris kegiatan berhasil diperbarui!', 'success');
    } else {
      const newAct: ReportActivity = {
        id: Math.random().toString(36).substring(2, 11),
        tanggal: inputTanggal,
        displayTanggal: formatIndonesianDate(inputTanggal),
        keterangan: inputKeterangan.trim(),
        fotoList: inputFotos,
      };

      setActivities((prev) => [...prev, newAct]);
      showToast('Baris kegiatan ditambahkan ke laporan!', 'success');
    }

    setInputKeterangan('');
    setInputFotos([]);
  };

  const handleEditActivity = (act: ReportActivity) => {
    setEditingItemId(act.id);
    setInputTanggal(act.tanggal);
    setInputKeterangan(act.keterangan);
    setInputFotos(act.fotoList);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((item) => item.id !== id));
    showToast('Baris kegiatan dihapus dari tabel.', 'success');
  };

  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activities.length) return;

    setActivities((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Ekspor ke Word (.docx)
  const handleExportWord = async () => {
    if (activities.length === 0) {
      showToast('Tambahkan minimal 1 baris kegiatan sebelum mengekspor.', 'warning');
      return;
    }

    setIsExportingWord(true);
    try {
      const payload = {
        judul: judulLaporan,
        subjudul: subjudulLaporan,
        items: activities.map((act, idx) => ({
          no: idx + 1,
          tanggal: act.displayTanggal,
          keterangan: act.keterangan,
          fotoList: act.fotoList.map((f) => ({
            dataUrl: f.dataUrl,
            namaFile: f.namaFile,
          })),
        })),
      };

      const res = await fetch('/api/laporan/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal mengekspor file Word.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dokumentasi_Laporan_Kegiatan_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      showToast('Laporan Word (.docx) berhasil diunduh!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat membuat Word.', 'error');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrintOrPdf = () => {
    if (activities.length === 0) {
      showToast('Tambahkan minimal 1 kegiatan sebelum mencetak PDF.', 'warning');
      return;
    }
    window.print();
  };

  const handleOpenGoogleDocs = () => {
    handleExportWord();
    setIsGDocsModalOpen(true);
  };

  // Simpan / Buka Draft File .json Lokal
  const handleSaveJsonDraft = () => {
    const data = {
      judul: judulLaporan,
      subjudul: subjudulLaporan,
      activities,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Draft_Laporan_Kegiatan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File draft (.json) berhasil diunduh ke komputer Anda!', 'success');
  };

  const handleLoadJsonDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.judul) setJudulLaporan(parsed.judul);
        if (parsed.subjudul) setSubjudulLaporan(parsed.subjudul);
        if (Array.isArray(parsed.activities)) {
          setActivities(parsed.activities);
          setCurrentReportId(null);
          showToast(`Berhasil memuat draft (${parsed.activities.length} kegiatan)!`, 'success');
        }
      } catch {
        showToast('Berkas JSON tidak valid atau rusak.', 'error');
      }
    };
    reader.readAsText(file);
    if (draftFileRef.current) draftFileRef.current.value = '';
  };

  return (
    <div className="space-y-6 font-sans pb-24">
      
      {/* HEADER SECTION (NO-PRINT) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-3xs space-y-4">
        
        {/* BARIS ATAS: STATUS DATABASE & TOMBOL UTAMA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#02677f] flex items-center justify-center border border-sky-100 shadow-2xs">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Generator Laporan Dokumentasi Kegiatan
              </h1>
              {currentReportId ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Tersimpan di Database Akun
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                  Draft Belum Disimpan ke Database
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              File JSON dan foto tersimpan aman di database Neon per akun guru/admin, siap diekspor ke Word (.docx), PDF, atau Google Docs.
            </p>
          </div>

          {/* ACTION BUTTONS: DATABASE & EXPORT */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* TOMBOL SIMPAN DATABASE NEON */}
            <button
              type="button"
              onClick={() => handleSaveToDatabase(false)}
              disabled={isSavingDb || activities.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSavingDb ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke DB...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                  <span>{currentReportId ? 'Perbarui di Database' : 'Simpan ke Database'}</span>
                </>
              )}
            </button>

            {/* TOMBOL BUKA DARI DATABASE NEON */}
            <button
              type="button"
              onClick={() => {
                fetchSavedReports();
                setIsDbModalOpen(true);
              }}
              className="bg-sky-50 hover:bg-sky-100 text-[#02677f] border border-sky-200 px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              <span>Laporan Tersimpan</span>
              <span className="bg-[#02677f] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {savedReportsList.length}
              </span>
            </button>

            {/* EXPORT WORD */}
            <button
              type="button"
              onClick={handleExportWord}
              disabled={isExportingWord || activities.length === 0}
              className="bg-[#02677f] hover:bg-[#005468] text-white px-3.5 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-sky-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 7V3.5L18.5 9H15z" />
              </svg>
              <span>Word (.docx)</span>
            </button>

            {/* EXPORT PDF */}
            <button
              type="button"
              onClick={handlePrintOrPdf}
              disabled={activities.length === 0}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.03-.48-2.062-.72-3.093m0 0a3.375 3.375 0 0 1 6.72 0m-6.72 0h6.72m0 0c.24 1.031.48 2.063.72 3.093M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V9a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 2.25 9v8.25A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              <span>PDF</span>
            </button>

            {/* GOOGLE DOCS */}
            <button
              type="button"
              onClick={handleOpenGoogleDocs}
              disabled={activities.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-emerald-100" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <span>Google Docs</span>
            </button>
          </div>
        </div>

        {/* INPUT JUDUL & SUBJUDUL DOKUMEN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Judul Header Dokumen
            </label>
            <input
              type="text"
              value={judulLaporan}
              onChange={(e) => setJudulLaporan(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-[#02677f] outline-none"
              placeholder="Contoh: DOKUMENTASI LAPORAN KEGIATAN"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Subjudul / Keterangan Lembaga
            </label>
            <input
              type="text"
              value={subjudulLaporan}
              onChange={(e) => setSubjudulLaporan(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-[#02677f] outline-none"
              placeholder="Contoh: TK CAHAYA HATI — TAHUN AJARAN 2026/2027"
            />
          </div>
        </div>

        {/* BARIS UTILITY DRAFT & DATABASE OPTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* JIKA ADA LAPORAN DB AKTIF, TAMPILKAN OPSI SIMPAN SEBAGAI LAPORAN BARU */}
            {currentReportId && (
              <button
                type="button"
                onClick={() => handleSaveToDatabase(true)}
                disabled={isSavingDb}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 font-bold hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
              >
                <span>➕ Simpan Sebagai Laporan Baru di DB</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartNewReport}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <span>📄 Buat Laporan Baru</span>
            </button>

            <button
              type="button"
              onClick={handleSaveJsonDraft}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              title="Unduh backup file JSON lokal"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Export JSON Lokal</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition-colors" title="Muat file JSON dari komputer">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span>Import JSON Lokal</span>
              <input
                ref={draftFileRef}
                type="file"
                accept=".json"
                onChange={handleLoadJsonDraft}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {activities.length} Kegiatan Ditambahkan
            </span>
          </div>
        </div>
      </div>

      {/* FORM INPUT KEGIATAN BARU / EDIT (NO-PRINT) */}
      <div className="no-print bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-3xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#02677f] animate-pulse" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {editingItemId ? '✏️ Edit Baris Kegiatan' : '➕ Tambah Baris Kegiatan Baru'}
            </h2>
          </div>
          {editingItemId && (
            <button
              type="button"
              onClick={() => {
                setEditingItemId(null);
                setInputKeterangan('');
                setInputFotos([]);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleAddOrUpdateActivity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PILIH TANGGAL */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                1. Tanggal Kegiatan
              </label>
              <input
                type="date"
                required
                value={inputTanggal}
                onChange={(e) => setInputTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-900 focus:bg-white focus:border-[#02677f] outline-none transition-all"
              />
              <span className="text-[10px] font-bold text-[#02677f] block pl-1">
                📅 {formatIndonesianDate(inputTanggal)}
              </span>
            </div>

            {/* PRESET TEMPLATE CEPAT */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                2. Template Keterangan Cepat (Opsional)
              </label>
              <select
                onChange={handleSelectPreset}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#02677f] outline-none transition-all"
              >
                {TEMPLATE_PRESETS.map((p, idx) => (
                  <option key={idx} value={p.text}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-medium block pl-1">
                Pilih opsi di atas untuk menyisipkan contoh format uraian kegiatan secara instan.
              </span>
            </div>
          </div>

          {/* DESKRIPSI KETERANGAN */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              3. Keterangan / Deskripsi Rincian Kegiatan
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ketik keterangan kegiatan, sudut pengambilan foto bangunan, atau rincian item material/peralatan..."
              value={inputKeterangan}
              onChange={(e) => setInputKeterangan(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#02677f] outline-none transition-all leading-relaxed"
            />
          </div>

          {/* UNGGAH GAMBAR DOKUMENTASI */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                4. Foto Dokumentasi ({inputFotos.length} Foto Dipilih)
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                Dapat memilih lebih dari 1 foto sekaligus (JPG / PNG / WEBP)
              </span>
            </div>

            {/* BUTTON UPLOAD */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhotos}
                className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#02677f] font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span>{isProcessingPhotos ? 'Mengompres Foto...' : '+ Tambah Foto Dokumentasi'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotosUpload}
                className="hidden"
              />

              {inputFotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputFotos([])}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Hapus Semua Foto Form
                </button>
              )}
            </div>

            {/* PREVIEW THUMBNAILS FORM */}
            {inputFotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                {inputFotos.map((foto, fIdx) => (
                  <div
                    key={foto.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-3xs"
                  >
                    <img
                      src={foto.dataUrl}
                      alt={foto.namaFile}
                      onClick={() => setPreviewPhotoUrl(foto.dataUrl)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      #{fIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(foto.id)}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md shadow-xs opacity-90 group-hover:opacity-100 transition-opacity"
                      title="Hapus Foto"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isProcessingPhotos}
              className="bg-[#02677f] hover:bg-[#005468] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>{editingItemId ? 'Simpan Perubahan Baris' : 'Tambahkan Baris Kegiatan ke Tabel'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* PRATINJAU DOKUMEN TABEL 4 KOLOM LANDSCAPE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-8 shadow-3xs space-y-4 print-container">
        
        {/* HEADER DOKUMEN DALAM TABEL */}
        <div className="text-center space-y-1 pb-2 border-b border-slate-200">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-serif uppercase">
            {judulLaporan}
          </h2>
          <p className="text-xs font-extrabold text-[#02677f] uppercase tracking-wider">
            {subjudulLaporan}
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400 space-y-2">
            <svg className="w-10 h-10 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p>Belum ada data kegiatan yang dimasukkan ke dalam laporan.</p>
            <p className="text-[11px] text-slate-400 font-normal">Gunakan formulir di atas untuk menambahkan kegiatan per tanggal beserta foto dokumentasi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs font-sans print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-black font-extrabold text-center">
                  <th className="border border-black py-2.5 px-2 w-[5%]">No.</th>
                  <th className="border border-black py-2.5 px-3 w-[20%] text-left">Tanggal</th>
                  <th className="border border-black py-2.5 px-4 w-[35%] text-left">Keterangan</th>
                  <th className="border border-black py-2.5 px-4 w-[40%] text-center">Dokumentasi</th>
                  <th className="border border-black py-2.5 px-2 w-[8%] text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-slate-900">
                {activities.map((act, index) => (
                  <tr key={act.id} className="align-top hover:bg-slate-50/50 transition-colors">
                    {/* 1. NO */}
                    <td className="border border-black py-3 px-2 text-center font-bold font-mono">
                      {index + 1}.
                    </td>

                    {/* 2. TANGGAL */}
                    <td className="border border-black py-3 px-3 font-semibold text-slate-800">
                      {act.displayTanggal}
                    </td>

                    {/* 3. KETERANGAN */}
                    <td className="border border-black py-3 px-4 leading-relaxed font-medium whitespace-pre-line text-slate-800">
                      {act.keterangan}
                    </td>

                    {/* 4. DOKUMENTASI (FOTO TERSUSUN PROPORSI ~7.5cm) */}
                    <td className="border border-black py-3 px-4 text-center">
                      {act.fotoList.length === 0 ? (
                        <span className="text-slate-400 italic text-[11px] block py-4">
                          (Tidak ada foto)
                        </span>
                      ) : (
                        <div className="space-y-3 flex flex-col items-center">
                          {act.fotoList.map((foto) => (
                            <div
                              key={foto.id}
                              className="w-full max-w-[285px] rounded-lg overflow-hidden border border-slate-300 bg-slate-50 shadow-2xs group relative"
                            >
                              <img
                                src={foto.dataUrl}
                                alt={foto.namaFile}
                                onClick={() => setPreviewPhotoUrl(foto.dataUrl)}
                                className="w-full h-auto max-h-[220px] object-contain mx-auto cursor-pointer group-hover:scale-102 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold pointer-events-none">
                                Klik untuk perbesar
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* 5. AKSI BARIS (NO-PRINT) */}
                    <td className="border border-black py-3 px-2 text-center whitespace-nowrap no-print">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveActivity(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Pindah ke Atas"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveActivity(index, 'down')}
                            disabled={index === activities.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Pindah ke Bawah"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditActivity(act)}
                          className="px-2 py-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act.id)}
                          className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                        >
                          Hapus
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

      {/* MODAL BUKA LAPORAN DARI DATABASE */}
      {isDbModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    📂
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Laporan Tersimpan di Database Akun Anda
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Setiap akun guru & admin memiliki arsip laporan dokumentasi tersendiri.
                </p>
              </div>
              <button
                onClick={() => setIsDbModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* DAFTAR LAPORAN */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {isLoadingDb ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                  Memuat arsip laporan dari database Neon...
                </div>
              ) : savedReportsList.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400 space-y-1">
                  <p>Belum ada laporan kegiatan yang tersimpan di database untuk akun ini.</p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Buat kegiatan lalu klik tombol <strong>"Simpan ke Database"</strong>.
                  </p>
                </div>
              ) : (
                savedReportsList.map((item) => {
                  const isCurrent = currentReportId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                        isCurrent
                          ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
                          : 'border-slate-200 hover:border-indigo-200 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900">{item.judul}</h4>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Sedang Dibuka
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{item.subjudul || '-'}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold pt-0.5">
                          <span>📌 {item.activityCount} Kegiatan</span>
                          <span>🕒 Diperbarui: {mounted ? new Date(item.updatedAt).toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : item.updatedAt.split('T')[0]}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleLoadFromDb(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#02677f] hover:bg-[#005468] text-white text-xs font-bold shadow-3xs transition-all active:scale-95"
                        >
                          Buka Laporan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFromDb(item.id, item.judul)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus dari Database"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">
                Total: {savedReportsList.length} Arsip Laporan
              </span>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ZOOM PREVIEW FOTO */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl p-3 border border-slate-200 shadow-2xl space-y-2">
            <div className="flex justify-between items-center px-2 pt-1">
              <span className="text-xs font-black text-slate-900">Pratinjau Foto Dokumentasi</span>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="w-full max-h-[75vh] overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
              <img src={previewPhotoUrl} alt="Preview" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN GOOGLE DOCS */}
      {isGDocsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Buka Laporan di Google Docs</h3>
              </div>
              <button
                onClick={() => setIsGDocsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              File <strong>.docx</strong> laporan kegiatan telah otomatis diunduh ke komputer Anda. Anda dapat langsung membuka dan mengeditnya secara online di Google Docs:
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">1</span>
                <span>Buka Google Docs / Google Drive di browser Anda.</span>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">2</span>
                <span>Klik <strong>Buka pemilih file</strong> (ikon folder) lalu pilih tab <strong>Upload</strong>.</span>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span>Tarik file Word yang baru diunduh tadi ke Google Docs. Selesai!</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsGDocsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Tutup
              </button>
              <a
                href="https://docs.google.com/document/u/0/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsGDocsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Buka Google Docs</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFIKASI */}
      {toast.isOpen && (
        <div className="fixed top-5 right-5 z-50 animate-fadeIn pointer-events-none no-print">
          <div
            className={`px-4 py-3 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2.5 bg-white ${
              toast.type === 'success'
                ? 'border-emerald-100 text-emerald-700'
                : toast.type === 'warning'
                ? 'border-amber-100 text-amber-700'
                : 'border-rose-100 text-rose-600'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 1.5cm;
          }
          header,
          nav,
          footer,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-table {
            border: 1px solid black !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th,
          .print-table td {
            border: 1px solid black !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
