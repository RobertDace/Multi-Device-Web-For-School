'use client';

import { useState } from 'react';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulasi penyimpanan data pengaturan
    setTimeout(() => {
      setIsSaving(false);
      alert('Pengaturan sistem berhasil diperbarui!');
    }, 800);
  };

  return (
    <>
      {/* HEADER UTAMA */}
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Konfigurasi identitas lembaga sekolah, periode tahun ajaran aktif, dan manajemen integrasi database API.
        </p>
      </header>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* BLOCK KIRI: FORM CONFIG */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Profil Sekolah */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 10V5a2 2 0 012-2h10a2 2 0 012 2v5M10 14v4M14 14v4" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Identitas Lembaga</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Nama Instansi</label>
                <input
                  type="text"
                  defaultValue="TK Cahaya Hati Ceria"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Nomor Pokok Sekolah Nasional (NPSN)</label>
                <input
                  type="text"
                  defaultValue="69974201"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Alamat Operasional</label>
                <input
                  type="text"
                  defaultValue="Jl. Al-Wahab No. 42, Kompleks Pendidikan Ceria"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Tahun Ajaran & Rapor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2V6M8 2V6M3 10H21" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Periode Akademik</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Tahun Ajaran Aktif</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50 text-slate-700">
                  <option>2026/2027</option>
                  <option>2025/2026</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Semester Berjalan</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#02677f] bg-slate-50/50 text-slate-700">
                  <option>Ganjil (1)</option>
                  <option>Genap (2)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* BLOCK KANAN: STATUS DATABASE & ACTION TOMBOL */}
        <div className="space-y-6">
          
          {/* Card Status Integrasi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3M4 7v10c0 1.657 3.582 3 8 3s8-1.343 8-3M4 12v5" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Koneksi Pangkalan Data</h3>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">✓</div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-800 block">Supabase Terhubung</span>
                <p className="text-[10px] text-emerald-600 font-medium leading-relaxed">
                  Sinkronisasi tabel repositori `rapor` dan `auth` berjalan dengan responsivitas tinggi (Realtime Enabled).
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold space-y-1 px-1">
              <div className="flex justify-between">
                <span>Client Engine</span>
                <span className="font-mono text-slate-600">Next.js v16 (Turbopack)</span>
              </div>
              <div className="flex justify-between">
                <span>SSL Security</span>
                <span className="text-emerald-600 font-bold">Aktif / Aman</span>
              </div>
            </div>
          </div>

          {/* Tombol Simpan Aksi Global */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#02677f] hover:bg-[#005468] text-white p-4 rounded-xl font-bold text-xs shadow-md shadow-cyan-950/5 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            {isSaving ? 'Menyinkronkan...' : 'Simpan Seluruh Pengaturan'}
          </button>

        </div>
      </form>
    </>
  );
}