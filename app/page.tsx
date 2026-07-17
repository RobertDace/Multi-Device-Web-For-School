'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface AktivitasItem {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  gambar_url?: string;
  deskripsi: string;
}

// COMPONENT WRAPPER UNTUK ANIMASI MUNCUL/HILANG SAAT SCROLL (SCROLL-DRIVEN ANIMATION)
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Mengatur status visible saat masuk/keluar dari viewport (Animasi Muncul & Hilang)
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [aktivitasList, setAktivitasList] = useState<AktivitasItem[]>([]);
  const [kalenderList, setKalenderList] = useState<AktivitasItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab for Mobile Bottom Navigation
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'kalender' | 'aktivitas' | 'rapor'>('home');

  // State Modal Detail Reading Aktivitas
  const [selectedAktivitas, setSelectedAktivitas] = useState<AktivitasItem | null>(null);

  // State Quick Rapor Status Lookup
  const [searchNis, setSearchNis] = useState('');
  const [searchResult, setSearchResult] = useState<{ found: boolean; message: string } | null>(null);
  const [isSearchingRapor, setIsSearchingRapor] = useState(false);

  // ================= STATE ENGINE KALENDER VISUAL =================
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date(2026, 6, 1)); // Default Juli 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const namaBulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const namaHariIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Pengaturan Smooth Scroll Behavior & Scroll-Spy secara Global
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';

    // Scroll-Spy untuk otomatis mengubah tab aktif bottom bar berdasarkan section layar
    const handleScroll = () => {
      const sections = ['hero', 'kalender', 'aktivitas', 'rapor'];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveNavTab(sectionId === 'hero' ? 'home' : (sectionId as any));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Live Data dari Supabase
  const fetchLandingData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Aktivitas Terbaru untuk Berita/Galeri
      const { data: dataAktivitas } = await supabase
        .from('aktivitas')
        .select('*')
        .order('tanggal', { ascending: false })
        .limit(6);

      if (dataAktivitas) setAktivitasList(dataAktivitas);

      // 2. Fetch Seluruh Agenda Kalender
      const { data: dataAgenda } = await supabase
        .from('aktivitas')
        .select('*')
        .order('tanggal', { ascending: true });

      if (dataAgenda) {
        setKalenderList(dataAgenda);
        if (dataAgenda.length > 0 && dataAgenda[0].tanggal) {
          setSelectedDateStr(dataAgenda[0].tanggal);
          const firstDate = new Date(dataAgenda[0].tanggal);
          if (!isNaN(firstDate.getTime())) {
            setCalendarViewDate(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
          }
        }
      }

    } catch (err: any) {
      console.error('Gagal memuat data landing page:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
  }, []);

  // Handler Cek Quick Status Rapor Digital
  const handleCheckRapor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNis.trim()) return;

    setIsSearchingRapor(true);
    setSearchResult(null);

    try {
      const { data } = await supabase
        .from('rapor')
        .select('status, nama_siswa')
        .eq('nis', searchNis.trim())
        .single();

      if (data) {
        setSearchResult({
          found: true,
          message: `Rapor Ananda ${data.nama_siswa} (${data.status === 'Published' ? 'Sudah Terbit' : 'Dalam Proses Guru'})`
        });
      } else {
        setSearchResult({
          found: false,
          message: 'Nomor NIS tidak ditemukan dalam pangkalan rapor.'
        });
      }
    } catch {
      setSearchResult({
        found: false,
        message: 'Nomor NIS tidak terdaftar atau belum diterbitkan.'
      });
    } finally {
      setIsSearchingRapor(false);
    }
  };

  // Navigasi Bulan Kalender
  const handlePrevMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Kalkulasi Grid Tanggal Bulanan
  const currentYear = calendarViewDate.getFullYear();
  const currentMonth = calendarViewDate.getMonth();

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

  // Filter agenda untuk tanggal yang sedang dipilih
  const eventsForSelectedDate = kalenderList.filter(item => item.tanggal === selectedDateStr);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#02677f] selection:text-white antialiased overflow-x-hidden pt-16 lg:pt-20 pb-24 lg:pb-0 scroll-smooth">
      
      {/* 1. TOP NAVBAR HEADER (ALWAYS STICKY ON TOP - FIXED POSITIONING) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-12 py-3 transition-all shadow-3xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LOGO KEMENDIKBUD + TK CAHAYA HATI */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-200/70 shadow-2xs p-1 shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg" 
                alt="Logo Kemendikbud" 
                className="w-full h-full object-contain shrink-0" 
              />
            </div>

            <div>
              <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight leading-none group-hover:text-[#02677f] transition-colors">
                TK CAHAYA HATI
              </h1>
              <span className="text-[10px] font-mono font-extrabold text-[#02677f] uppercase tracking-wider block mt-0.5">
                Bermain & Belajar Ceria
              </span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/60 text-xs font-bold text-slate-600">
            <a href="#hero" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Home</a>
            <a href="#kalender" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Kalender</a>
            <a href="#aktivitas" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Aktivitas</a>
            <a href="#rapor" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Cek Rapor</a>
            <a href="#keunggulan" className="px-4 py-1.5 rounded-full hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all">Keunggulan</a>
          </nav>

          {/* ALWAYS VISIBLE LOGIN BUTTON (POJOK KANAN ATAS) */}
          <div className="flex items-center">
            <Link 
              href="/login" 
              className="bg-[#02677f] hover:bg-[#005468] text-white px-5 py-2 rounded-full text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>Login</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION WITH SCROLL ANIMATION */}
      <section id="hero" className="max-w-7xl mx-auto px-4 lg:px-12 py-8 md:py-16 relative">
        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 px-4 py-1.5 rounded-full shadow-3xs animate-bounce">
                <span className="w-2.5 h-2.5 rounded-full bg-[#02677f] animate-pulse" />
                <span className="text-xs font-extrabold text-[#02677f]">Pendaftaran Ajaran 2026/2027 Dibuka!</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Bermain dan Belajar dengan <span className="bg-gradient-to-r from-[#02677f] to-sky-500 bg-clip-text text-transparent">Riang Gembira!</span>
              </h2>

              <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Membangun karakter mulia, kecerdasan emosional, dan kreativitas si kecil melalui metode pembelajaran interaktif yang aman dan penuh kasih sayang di TK CAHAYA HATI.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <a 
                  href="#rapor" 
                  className="w-full sm:w-auto bg-[#02677f] hover:bg-[#005468] text-white px-7 py-3.5 rounded-full text-xs font-extrabold shadow-md hover:shadow-lg transition-all text-center hover:-translate-y-0.5 active:scale-98"
                >
                  Cek Rapor Digital
                </a>
                <a 
                  href="#kalender" 
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3.5 rounded-full text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-3xs hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>Lihat Kalender Akademik</span>
                </a>
              </div>
            </div>

            <div className="relative mx-auto max-w-md lg:max-w-none w-full">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 bg-slate-100 group">
                <img 
                  src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=1000&auto=format&fit=crop" 
                  alt="Belajar TK CAHAYA HATI" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="absolute -bottom-5 -left-3 sm:left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#02677f]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                  </svg>
                </div>
                <div>
                  <span className="block font-extrabold text-slate-900 text-sm leading-none">500+</span>
                  <span className="block text-[10px] font-bold text-slate-400 mt-0.5">Siswa Ceria & Berprestasi</span>
                </div>
              </div>
            </div>

          </div>
        </AnimatedSection>
      </section>

      {/* 3. SECTION 1: KALENDER AKADEMIK INTERAKTIF WITH SCROLL ANIMATION */}
      <section id="kalender" className="bg-slate-100/70 py-16 border-y border-slate-200/60 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-8">
          
          <AnimatedSection>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#02677f] uppercase tracking-wider block">Agenda Resmi Sekolah</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Kalender Akademik Terpadu
                </h3>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-3xs">
                Tahun Ajaran 2026/2027
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* VISUAL MONTHLY CALENDAR GRID */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-3xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      {namaBulanIndo[currentMonth]} {currentYear}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Pilih tanggal untuk melihat agenda acara</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Bulan Sebelumnya"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    <button 
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Bulan Selanjutnya"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* WEEKDAY HEADERS */}
                <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2">
                  {namaHariIndo.map((hari, idx) => (
                    <span key={hari} className={`text-[11px] font-extrabold uppercase ${idx === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {hari}
                    </span>
                  ))}
                </div>

                {/* TANGGAL GRID CELLS */}
                <div className="grid grid-cols-7 gap-1.5">
                  {daysGrid.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-10 rounded-xl bg-slate-50/40" />;
                    }

                    const isoStr = formatISO(day);
                    const isSelected = isoStr === selectedDateStr;
                    const hasEvents = kalenderList.some(item => item.tanggal === isoStr);

                    return (
                      <button
                        key={isoStr}
                        onClick={() => setSelectedDateStr(isoStr)}
                        className={`h-10 rounded-2xl text-xs font-extrabold transition-all relative flex flex-col items-center justify-center ${
                          isSelected 
                            ? 'bg-[#02677f] text-white shadow-md scale-105' 
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border border-slate-100'
                        }`}
                      >
                        <span>{day}</span>
                        {hasEvents && (
                          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                            isSelected ? 'bg-amber-300' : 'bg-[#02677f]'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* DETAIL PANEL AGENDA */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-3xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#02677f] uppercase block">
                      Agenda Terjadwal
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {selectedDateStr ? selectedDateStr : 'Pilih Tanggal di Kalender'}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-sky-50 text-[#02677f] rounded-lg border border-sky-100">
                    {eventsForSelectedDate.length} Acara
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {eventsForSelectedDate.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-white text-[#02677f] border border-slate-200 uppercase">
                          {item.kategori}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-xs">{item.judul}</h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {item.deskripsi || 'Agenda resmi KBM / Sekolah TK CAHAYA HATI.'}
                      </p>
                    </div>
                  ))}

                  {eventsForSelectedDate.length === 0 && (
                    <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Tidak ada agenda kegiatan khusus di tanggal ini.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </AnimatedSection>

        </div>
      </section>

      {/* 4. SECTION 2: AKTIVITAS TERBARU WITH STAGGERED SCROLL ANIMATIONS */}
      <section id="aktivitas" className="max-w-7xl mx-auto px-4 lg:px-12 py-16 space-y-8 scroll-mt-12">
        <AnimatedSection>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <span className="text-[10px] font-extrabold text-[#02677f] uppercase tracking-wider block">Dokumentasi Liputan</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Aktivitas & Berita Terbaru
              </h3>
            </div>

            <Link href="/wali/dashboard" className="text-xs font-extrabold text-[#02677f] hover:underline inline-flex items-center gap-1">
              <span>Lihat Semua Berita</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </AnimatedSection>

        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Memuat dokumentasi liputan dari Supabase...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aktivitasList.map((item, idx) => (
              <AnimatedSection key={item.id} delay={idx * 100}>
                <div 
                  onClick={() => setSelectedAktivitas(item)}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-3xs hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-pointer flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                      {item.gambar_url ? (
                        <img 
                          src={item.gambar_url} 
                          alt={item.judul} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[#02677f] font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-xs uppercase">
                        {item.kategori}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">
                        {item.tanggal}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#02677f] transition-colors leading-snug">
                        {item.judul}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {item.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-1 text-[11px] font-bold text-[#02677f] flex items-center gap-1">
                    <span>Baca Selengkapnya</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>
              </AnimatedSection>
            ))}

            {aktivitasList.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs font-bold text-slate-400">
                Belum ada liputan aktivitas terbit dari Admin.
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. SECTION 3: QUICK CHECK STATUS RAPOR DIGITAL WITH ANIMATION */}
      <section id="rapor" className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#02677f] py-16 text-white my-8 scroll-mt-12">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-widest block">
                Integrasi Portal Wali
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Cek Status Rapor Digital Ananda
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
                Masukkan Nomor Induk Siswa (NIS) ananda untuk mengecek status publikasi lembar capaian hasil belajar dari wali kelas.
              </p>
            </div>

            <form onSubmit={handleCheckRapor} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                placeholder="Masukkan NIS Ananda (Contoh: 1234567890)" 
                value={searchNis}
                onChange={(e) => setSearchNis(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
              />
              <button 
                type="submit" 
                disabled={isSearchingRapor}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition-all shrink-0 active:scale-95"
              >
                {isSearchingRapor ? 'Memeriksa...' : 'Cek Status'}
              </button>
            </form>

            {searchResult && (
              <div className={`p-4 rounded-2xl max-w-md mx-auto text-xs font-bold border transition-all ${
                searchResult.found ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-rose-500/20 border-rose-400 text-rose-200'
              }`}>
                {searchResult.message}
              </div>
            )}
          </div>
        </AnimatedSection>
      </section>

      {/* 6. SECTION 4: MENGAPA MEMILIH KAMI? WITH STAGGERED CARDS */}
      <section id="keunggulan" className="bg-white py-16 border-b border-slate-200/60 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 space-y-12">
          
          <AnimatedSection>
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Mengapa Memilih Kami?
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Komitmen Unggul TK CAHAYA HATI
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <AnimatedSection delay={100}>
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group h-full">
                <div className="w-14 h-14 rounded-2xl bg-sky-100/80 border border-sky-200 text-[#02677f] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-base">Metode Bermain Interaktif</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Kurikulum berbasis permainan kreatif yang merangsang sensorik, motorik, dan kognitif anak secara alami.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group h-full">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 2.714Z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-base">Lingkungan Aman & Nyaman</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Fasilitas ramah anak dengan pengawasan kamera CCTV 24 jam serta staf pengajar yang berpengalaman.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.942 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900 text-base">Guru Berdedikasi Tinggi</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Pendidik penyabar yang mencintai anak-anak dan tersertifikasi resmi dalam pengembangan usia dini.
                  </p>
                </div>
              </div>
            </AnimatedSection>

          </div>

        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto px-4 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-base">TK CAHAYA HATI</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Bermain dan Belajar dengan Riang Gembira. Memberikan pendidikan anak usia dini yang bermakna, aman, dan menyenangkan.
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                © 2026 TK CAHAYA HATI. All rights reserved.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-300">Kontak Resmi</h5>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Jl. Pelangi No. 123, Samarinda, Kalimantan Timur<br />
                Email: halo@cahayahati.sch.id<br />
                Telepon: (0541) 555-0123
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-300">Navigasi Cepat</h5>
              <div className="flex flex-col gap-1 text-xs text-slate-400 font-medium">
                <a href="#hero" className="hover:text-white transition-colors">Home</a>
                <a href="#kalender" className="hover:text-white transition-colors">Kalender Akademik</a>
                <a href="#aktivitas" className="hover:text-white transition-colors">Aktivitas & Liputan</a>
                <a href="#rapor" className="hover:text-white transition-colors">Cek Status Rapor</a>
                <Link href="/wali/dashboard" className="hover:text-white transition-colors">Portal Login</Link>
              </div>
            </div>

          </div>
        </AnimatedSection>
      </footer>

      {/* 8. iOS FLOATING BOTTOM TAB BAR (MOBILE ONLY - CLEAN 4 NAVIGATION TABS) */}
      <div className="fixed bottom-4 left-6 right-6 z-50 bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-full lg:hidden p-1.5 transition-all">
        <div className="flex justify-around items-center">
          
          {/* TAB 1: HOME */}
          <a 
            href="#hero" 
            onClick={() => setActiveNavTab('home')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
              activeNavTab === 'home' 
                ? 'bg-[#02677f] text-white shadow-xs scale-105' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Home</span>
          </a>

          {/* TAB 2: KALENDER */}
          <a 
            href="#kalender" 
            onClick={() => setActiveNavTab('kalender')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
              activeNavTab === 'kalender' 
                ? 'bg-[#02677f] text-white shadow-xs scale-105' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Kalender</span>
          </a>

          {/* TAB 3: AKTIVITAS */}
          <a 
            href="#aktivitas" 
            onClick={() => setActiveNavTab('aktivitas')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
              activeNavTab === 'aktivitas' 
                ? 'bg-[#02677f] text-white shadow-xs scale-105' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Aktivitas</span>
          </a>

          {/* TAB 4: RAPOR */}
          <a 
            href="#rapor" 
            onClick={() => setActiveNavTab('rapor')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
              activeNavTab === 'rapor' 
                ? 'bg-[#02677f] text-white shadow-xs scale-105' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-[10px] font-extrabold tracking-tight">Rapor</span>
          </a>

        </div>
      </div>

      {/* MODAL PREVIEW DETAIL AKTIVITAS */}
      {selectedAktivitas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-lg w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#02677f] uppercase block">{selectedAktivitas.kategori}</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedAktivitas.judul}</h3>
              </div>
              <button onClick={() => setSelectedAktivitas(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {selectedAktivitas.gambar_url && (
              <div className="w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src={selectedAktivitas.gambar_url} alt={selectedAktivitas.judul} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold block">{selectedAktivitas.tanggal}</span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                {selectedAktivitas.deskripsi}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedAktivitas(null)} className="px-5 py-2 bg-[#02677f] text-white font-bold rounded-xl text-xs shadow-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}