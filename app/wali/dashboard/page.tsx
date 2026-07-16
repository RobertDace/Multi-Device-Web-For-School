'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SiswaData {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  nama_wali: string;
  status: string;
  jurnal_hari_ini?: string;
  foto_jurnal?: string;
  foto_name?: string;
}

interface RaporData {
  id: string;
  nis: string;
  nama_siswa: string;
  kelas: string;
  status: string;
  soft_skills_score: number;
  soft_skills_desc: string;
  academic_score: number;
  academic_desc: string;
  hadir: number;
  izin: number;
  alfa: number;
  catatan_guru: string;
  pdf_url?: string;
  pdf_name?: string;
}

interface AgendaData {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar_url?: string;
  deskripsi: string;
}

export default function WaliDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [siswa, setSiswa] = useState<SiswaData | null>(null);
  const [rapor, setRapor] = useState<RaporData | null>(null);
  const [agendaList, setAgendaList] = useState<AgendaData[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // State Toast Notifikasi
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const fetchWaliDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch data profil siswa dari Supabase
      const { data: siswaData, error: siswaErr } = await supabase
        .from('siswa')
        .select('*')
        .limit(1)
        .single();

      if (siswaErr && siswaErr.code !== 'PGRST116') throw siswaErr;

      if (siswaData) {
        setSiswa(siswaData);

        // 2. Fetch data Rapor siswa yang berstatus 'Published'
        const { data: raporData } = await supabase
          .from('rapor')
          .select('*')
          .eq('nis', siswaData.nis)
          .eq('status', 'Published')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (raporData) setRapor(raporData);
      }

      // 3. Fetch Agenda Kegiatan Sekolah Terdekat
      const { data: agendaData } = await supabase
        .from('aktivitas')
        .select('*')
        .order('tanggal', { ascending: true })
        .limit(6);

      if (agendaData) setAgendaList(agendaData);

    } catch (err: any) {
      console.error('Gagal memuat dashboard wali murid:', err.message);
      showToast('Koneksi ke server cloud Supabase terganggu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaliDashboardData();
  }, []);

  return (
    <div className="pb-28 font-sans space-y-6">
      
      {/* HEADER UTAMA PORTAL WALI */}
      <header className="border-b border-slate-200/80 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Portal Wali Murid</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Pantau perkembangan anak didik & informasi resmi TK CAHAYA HATI.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 px-3.5 py-1.5 rounded-2xl shadow-3xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#02677f] animate-pulse" />
          <span className="text-xs font-extrabold text-[#02677f]">Tahun Ajaran 2026/2027</span>
        </div>
      </header>

      {loading ? (
        <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
          Memuat informasi perkembangan ananda dari server TK CAHAYA HATI...
        </div>
      ) : (
        <div className="space-y-6">

          {/* 1. BANNER PROFIL ANANDA (FULL WIDTH DESKTOP BANNER) */}
          {siswa ? (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#02677f] rounded-3xl p-5 md:p-6 text-white shadow-md space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-extrabold text-white shrink-0 shadow-inner">
                    {siswa.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest block">
                      NIS: {siswa.nis}
                    </span>
                    <h2 className="text-lg md:text-xl font-extrabold text-white leading-tight">
                      {siswa.nama}
                    </h2>
                    <span className="text-xs text-slate-300 font-medium block mt-0.5">
                      Wali Murid: <strong className="text-white font-bold">{siswa.nama_wali || '-'}</strong>
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-2xl text-left sm:text-right shrink-0">
                  <span className="text-[9px] font-bold text-slate-300 uppercase block tracking-wider">Kelompok Belajar</span>
                  <span className="text-xs font-extrabold text-cyan-300 uppercase">{siswa.kelas}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs font-bold text-slate-400">
              Data murid belum terhubung dengan akun Anda.
            </div>
          )}

          {/* 2. MAIN BENTO GRID SYSTEM FOR PC (2 BALANCED COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* SISI KIRI (2 KOLOM LAPTOP): JURNAL + AGENDA MENDATANG */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* KARTU JURNAL HARIAN */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#02677f]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Jurnal Aktivitas Harian Ananda</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Laporan observasi guru kelas hari ini</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold text-[#02677f] bg-sky-50 border border-sky-100 px-3 py-1 rounded-xl">
                    Update Terbaru
                  </span>
                </div>

                {/* TEKS NARASI JURNAL HARIAN */}
                <div className="space-y-3.5">
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Aktivitas Belajar & Bermain</span>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">
                      {siswa?.jurnal_hari_ini || 'Belum ada pembaharuan catatan harian dari guru kelas.'}
                    </p>
                  </div>

                  {/* FOTO DOKUMENTASI JURNAL HARIAN */}
                  {siswa?.foto_jurnal && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dokumentasi Foto Hari Ini</span>
                      <div 
                        onClick={() => setSelectedImage(siswa.foto_jurnal || null)}
                        className="w-full h-52 md:h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative group cursor-pointer shadow-3xs"
                      >
                        <img 
                          src={siswa.foto_jurnal} 
                          alt="Dokumentasi Jurnal" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                          </svg>
                          Klik Untuk Memperbesar
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* KARTU AGENDA KEGIATAN MENDATANG (MASUK KE KOLOM KIRI SUPAYA TIDAK ADA RUANG KOSONG) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Agenda & Kegiatan Sekolah Mendatang</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">Jadwal acara penting TK CAHAYA HATI</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {agendaList.map((item) => (
                    <div key={item.id} className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 space-y-2 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-[#02677f]">
                          {formatTanggal(item.tanggal)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-white border border-slate-200 text-slate-700 uppercase">
                          {item.kategori}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs">{item.judul}</h4>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {item.deskripsi}
                      </p>
                    </div>
                  ))}

                  {agendaList.length === 0 && (
                    <div className="col-span-full text-center text-xs font-bold text-slate-300 py-6">
                      Belum ada agenda kegiatan baru yang dijadwalkan.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* SISI KANAN (1 KOLOM LAPTOP): RAPOR DIGITAL + PUSAT INFORMASI */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* KARTU RAPOR DIGITAL TERBIT */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-3xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Rapor Digital Terbit</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Capaian hasil belajar resmi</p>
                  </div>
                </div>

                {rapor ? (
                  <div className="space-y-3.5 animate-fadeIn">
                    
                    {/* STATS SKOR MINI */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sosial Emosional</span>
                        <div className="text-sm font-extrabold text-[#02677f]">Skor: {rapor.soft_skills_score}/4</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Kognitif/Akademik</span>
                        <div className="text-sm font-extrabold text-[#02677f]">Skor: {rapor.academic_score}/3</div>
                      </div>
                    </div>

                    {/* KEHADIRAN */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center text-xs font-bold">
                      <span className="text-[10px] text-slate-400 uppercase">Kehadiran (H/I/A):</span>
                      <div className="font-mono text-slate-900">
                        <span className="text-emerald-600">{rapor.hadir} Hadir</span> / <span className="text-amber-500">{rapor.izin} Izin</span> / <span className="text-rose-500">{rapor.alfa} Alfa</span>
                      </div>
                    </div>

                    {/* CATATAN GURU */}
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Ulasan Wali Kelas</span>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed line-clamp-4">
                        {rapor.catatan_guru}
                      </p>
                    </div>

                    {/* TOMBOL UNDUH PDF */}
                    {rapor.pdf_url && (
                      <a 
                        href={rapor.pdf_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full bg-[#02677f] hover:bg-[#005468] text-white py-3 rounded-2xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Unduh Lembar PDF Rapor
                      </a>
                    )}

                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-1 border border-slate-100">
                    <span className="text-xs font-extrabold text-slate-700 block">Belum Ada Rapor Terbit</span>
                    <p className="text-[11px] text-slate-400 font-medium">Laporan hasil belajar periode ini masih dalam tahap penyusunan guru.</p>
                  </div>
                )}
              </div>

              {/* KARTU PUSAT INFORMASI & KONTAK SEKOLAH (PENYEIMBANG KOLOM KANAN) */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-3xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Layanan Informasi Wali</span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-100 leading-snug">
                  Butuh Konsultasi Perkembangan Ananda?
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Hubungi staf administrasi atau wali kelas TK CAHAYA HATI pada jam kerja KBM (07.30 - 14.00 WITA).
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODAL PREVIEW FOTO DOKUMENTASI */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-3 border border-slate-200 shadow-2xl animate-fadeIn space-y-3">
            <div className="flex justify-between items-center px-2 pt-1">
              <span className="text-xs font-extrabold text-slate-900">Dokumentasi Kegiatan Ananda</span>
              <button 
                onClick={() => setSelectedImage(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
              <img src={selectedImage} alt="Preview Dokumentasi" className="w-full h-full object-contain" />
            </div>
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

    </div>
  );
}