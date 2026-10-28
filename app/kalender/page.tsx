'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';

interface KalenderItem {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar_url?: string;
  deskripsi: string;
}

export default function KalenderPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const [events, setEvents] = useState<KalenderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Kalender State
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 7, 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const namaHariIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const formatTanggalIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getDate()} ${namaBulanIndo[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    fetch('/api/kalender')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setEvents(res.data);
          if (res.data.length > 0 && res.data[0].tanggal) {
            const raw = res.data[0].tanggal.split('T')[0];
            setSelectedDateStr(raw);
            const d = new Date(res.data[0].tanggal);
            if (!isNaN(d.getTime())) {
              setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
            }
          }
        }
      })
      .catch((err) => console.error('Gagal memuat kalender:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let day = 1; day <= totalDaysInMonth; day++) {
    daysGrid.push(day);
  }

  const formatISO = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const eventsForSelectedDate = events.filter((item) => {
    if (!item.tanggal) return false;
    return item.tanggal.split('T')[0] === selectedDateStr;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#02677f] selection:text-white antialiased">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/80 shadow-2xs p-1 shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg"
                alt="Logo Kemendikbud"
                className="w-full h-full object-contain shrink-0"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight leading-none group-hover:text-[#02677f] transition-colors">
                TK CAHAYA HATI
              </h2>
              <span className="text-[10px] font-mono font-extrabold text-[#02677f] uppercase tracking-wider block mt-0.5">
                Bermain & Belajar Ceria
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-600">
            <Link href="/" className="px-4 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 transition-all">
              Beranda
            </Link>
            <Link href="/aktivitas" className="px-4 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 transition-all">
              Aktivitas
            </Link>
            <Link href="/kalender" className="px-4 py-1.5 rounded-xl bg-white text-[#02677f] shadow-2xs font-extrabold transition-all">
              Kalender
            </Link>
            <Link href="/wali/dashboard" className="px-4 py-1.5 rounded-xl hover:bg-white hover:text-slate-900 transition-all">
              Portal Rapor
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isLoaded && isSignedIn ? (
              <Link
                href={user?.levelAkses?.toUpperCase().includes('GURU') ? '/admin/siswa' : '/wali/dashboard'}
                className="bg-sky-50 text-[#02677f] hover:bg-sky-100 border border-sky-200 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all"
              >
                {user?.levelAkses?.toUpperCase().includes('GURU') ? 'Portal Admin' : 'Dashboard'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Masuk Akun
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* HERO TITLE */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#02677f] rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-2">
          <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest block">
            Jadwal Resmi Akademik
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kalender Kegiatan & Agenda Sekolah</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Pantau seluruh agenda belajar, libur nasional, rapat wali murid, dan pentas seni anak didik TK CAHAYA HATI tahun ajaran aktif.
          </p>
        </div>

        {/* BENTO GRID: KALENDER + AGENDA LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SISI KIRI: KALENDER INTERAKTIF */}
          <div className="lg:col-span-8 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-3xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {namaBulanIndo[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Klik tanggal untuk melihat agenda terkait</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Bulan sebelumnya"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Bulan berikutnya"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>

            {/* GRID NAMA HARI */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-slate-400 uppercase">
              {namaHariIndo.map((h, i) => (
                <div key={h} className={i === 0 ? 'text-rose-500' : ''}>
                  {h}
                </div>
              ))}
            </div>

            {/* GRID HARI BULAN */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
              {daysGrid.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="p-3" />;
                }

                const isoStr = formatISO(day);
                const isSelected = selectedDateStr === isoStr;
                const hasEvent = events.some((ev) => ev.tanggal && ev.tanggal.split('T')[0] === isoStr);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDateStr(isoStr)}
                    className={`relative p-3 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 group ${
                      isSelected
                        ? 'bg-[#02677f] text-white shadow-xs font-extrabold scale-105'
                        : hasEvent
                        ? 'bg-sky-50 text-[#02677f] border border-sky-100 hover:bg-sky-100'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-cyan-300' : 'bg-[#02677f]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* AGENDA PADA TANGGAL YANG DIPILIH */}
            {selectedDateStr && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Agenda pada {formatTanggalIndo(selectedDateStr)}:
                </h4>
                {eventsForSelectedDate.length > 0 ? (
                  <div className="space-y-2.5">
                    {eventsForSelectedDate.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5 animate-fadeIn"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[#02677f] uppercase">
                            {ev.kategori}
                          </span>
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-900">{ev.judul}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{ev.deskripsi}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tidak ada agenda kegiatan khusus pada tanggal ini.</p>
                )}
              </div>
            )}
          </div>

          {/* SISI KANAN: DAFTAR SEMUA AGENDA MENDATANG */}
          <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Semua Agenda Sekolah</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Tahun Pelajaran 2026/2027</p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                Memuat data agenda...
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-slate-400">
                Belum ada agenda kegiatan yang diterbitkan.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.tanggal) {
                        const d = ev.tanggal.split('T')[0];
                        setSelectedDateStr(d);
                        const parsed = new Date(ev.tanggal);
                        if (!isNaN(parsed.getTime())) {
                          setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
                        }
                      }
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-sky-50/50 rounded-2xl border border-slate-200/80 cursor-pointer transition-colors space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-[#02677f]">
                        {formatTanggalIndo(ev.tanggal)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold uppercase text-slate-600">
                        {ev.kategori}
                      </span>
                    </div>
                    <h5 className="text-xs font-extrabold text-slate-900">{ev.judul}</h5>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                      {ev.deskripsi}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
