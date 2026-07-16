'use client';

import { useState, useEffect } from 'react';

export default function AktivitasPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/aktivitas')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setActivities(res.data);
        setLoading(false);
      });
  }, []);

  const filteredActivities = selectedFilter === 'Semua' 
    ? activities 
    : activities.filter(a => a.kategori === selectedFilter);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-16 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-extrabold text-[#02677f]">TK Ceria</a>
          <div className="hidden md:flex gap-6 items-center text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-[#02677f]">Home</a>
            <a href="/aktivitas" className="text-[#02677f] font-bold border-b-2 border-[#02677f]">Aktivitas</a>
            <a href="/kalender" className="hover:text-[#02677f]">Kalender</a>
            <a href="/wali/dashboard" className="hover:text-[#02677f]">Rapor</a>
          </div>
          <a href="/login" className="bg-[#02677f] text-white px-5 py-2 rounded-full font-bold text-sm">Login</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-16 py-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#02677f] mb-2">Aktivitas Seru di TK Ceria ✨</h1>
          <p className="text-slate-500">Melihat keceriaan harian anak didik kami secara real-time.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {['Semua', 'Seni', 'Olahraga', 'Sains', 'Agama'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                selectedFilter === cat ? 'bg-[#02677f] text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p className="text-slate-500 col-span-3 text-center">Memuat galeri aktivitas...</p>
          ) : filteredActivities.map((act) => (
            <div key={act.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform">
              <div className="relative h-56">
                <img src={act.gambar_url} alt={act.judul} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 bg-[#b7eaff] text-[#005468] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {act.kategori}
                </span>
              </div>
              <div className="p-6">
                <span className="text-xs font-bold text-slate-400 block mb-1">{act.tanggal}</span>
                <h3 className="font-bold text-xl text-[#02677f] mb-2">{act.judul}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{act.deskripsi}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}