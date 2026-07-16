'use client';

import { useState, useEffect } from 'react';

export default function KalenderPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/kalender')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setEvents(res.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-16 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-extrabold text-[#0061a4]">TK Ceria</a>
          <div className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-[#0061a4]">Home</a>
            <a href="/aktivitas" className="hover:text-[#0061a4]">Aktivitas</a>
            <a href="/kalender" className="text-[#0061a4] font-bold border-b-2 border-[#0061a4]">Kalender</a>
            <a href="/wali/dashboard" className="hover:text-[#0061a4]">Rapor</a>
          </div>
          <a href="/login" className="bg-[#0061a4] text-white px-5 py-2 rounded-full font-bold text-sm">Login</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-16 py-10 space-y-10">
        <header className="bg-sky-100/50 p-8 rounded-3xl border border-sky-200">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0061a4] mb-2">Kalender Akademik 📅</h1>
          <p className="text-slate-600">Pantau seluruh agenda dan kegiatan si kecil di TK Ceria.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-[#0061a4] mb-6">Jadwal Bulan Ini</h2>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold border-t pt-4">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
                <div key={d} className="text-slate-400 pb-2">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <div key={day} className={`p-3 rounded-xl transition-all ${day === 11 ? 'bg-[#0061a4] text-white font-extrabold shadow-md' : 'hover:bg-sky-50'}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-[#0061a4] mb-4">Agenda Mendatang</h3>
            {loading ? (
              <p className="text-xs text-slate-400">Memuat agenda...</p>
            ) : events.map((ev) => (
              <div key={ev.id} className="p-4 bg-sky-50 rounded-2xl flex gap-4 items-start border border-sky-100">
                <div className="bg-[#0061a4] text-white p-3 rounded-xl text-center min-w-[60px]">
                  <span className="block font-bold text-sm">{ev.tanggal}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{ev.judul}</h4>
                  <p className="text-xs text-slate-500 mt-1">{ev.keterangan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}