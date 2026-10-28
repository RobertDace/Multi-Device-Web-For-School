'use client';

import { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });

  const [settings, setSettings] = useState({
    nama_sekolah: 'TK CAHAYA HATI',
    npsn: '69974201',
    tagline: 'Bermain dan Belajar dengan Riang Gembira',
    email: 'halo@cahayahati.sch.id',
    telepon: '(0541) 555-0123',
    alamat: 'Jl. Pelangi No. 123, Samarinda, Kalimantan Timur',
    tahun_ajaran: '2026/2027',
    pendaftaran_buka: true,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat pengaturan:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan pengaturan');
      }

      showToast('Pengaturan sistem berhasil disimpan ke database Neon PostgreSQL!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER UTAMA */}
      <header className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan Sistem Lembaga</h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Konfigurasi identitas lembaga sekolah, periode tahun ajaran aktif, dan manajemen integrasi database Neon.
        </p>
      </header>

      {loading ? (
        <div className="p-16 text-center text-xs font-bold text-slate-400 animate-pulse">
          Memuat konfigurasi sistem sekolah dari database...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* BLOCK KIRI: FORM CONFIG */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Profil Sekolah */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 10h18M5 10V5a2 2 0 012-2h10a2 2 0 012 2v5M10 14v4M14 14v4" />
                </svg>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Identitas Lembaga</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Instansi</label>
                  <input
                    type="text"
                    value={settings.nama_sekolah}
                    onChange={(e) => setSettings({ ...settings, nama_sekolah: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nomor Pokok Sekolah Nasional (NPSN)</label>
                  <input
                    type="text"
                    value={settings.npsn}
                    onChange={(e) => setSettings({ ...settings, npsn: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Slogan / Tagline Sekolah</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Alamat Operasional Kampus</label>
                  <input
                    type="text"
                    value={settings.alamat}
                    onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Email Resmi</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nomor Telepon / Hotline</label>
                  <input
                    type="text"
                    value={settings.telepon}
                    onChange={(e) => setSettings({ ...settings, telepon: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Tahun Ajaran & Status Pendaftaran */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2V6M8 2V6M3 10H21" />
                </svg>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Periode Akademik & Penerimaan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tahun Ajaran Aktif</label>
                  <input
                    type="text"
                    value={settings.tahun_ajaran}
                    onChange={(e) => setSettings({ ...settings, tahun_ajaran: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Penerimaan Peserta Didik Baru (PPDB)</label>
                  <select
                    value={settings.pendaftaran_buka ? 'true' : 'false'}
                    onChange={(e) => setSettings({ ...settings, pendaftaran_buka: e.target.value === 'true' })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#02677f] bg-slate-50/50 focus:bg-white"
                  >
                    <option value="true">Pendaftaran Dibuka (Aktif)</option>
                    <option value="false">Pendaftaran Ditutup</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* BLOCK KANAN: STATUS DATABASE & ACTION TOMBOL */}
          <div className="space-y-6">
            
            {/* Card Status Integrasi */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <svg className="w-4 h-4 text-[#02677f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7c0-1.657 3.582-3 8-3s8 1.343 8 3M4 7c0 1.657 3.582 3 8 3s8-1.343 8-3M4 7v10c0 1.657 3.582 3 8 3s8-1.343 8-3M4 12v5" />
                </svg>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Koneksi Pangkalan Data</h3>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">✓</div>
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-emerald-800 block">Neon PostgreSQL Terhubung</span>
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                    Sinkronisasi tabel repositori Prisma ORM dan Clerk Authentication berjalan aktif dan aman.
                  </p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold space-y-2 px-1">
                <div className="flex justify-between">
                  <span>Client Engine</span>
                  <span className="font-mono text-slate-700 font-bold">Next.js v16 (Turbopack)</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Layer</span>
                  <span className="font-mono text-slate-700 font-bold">Prisma ORM 7 + Postgres</span>
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
              className="w-full bg-[#02677f] hover:bg-[#005468] text-white p-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <path d="M17 21v-8H7v8M7 3v5h8" />
              </svg>
              {isSaving ? 'Menyimpan ke Database...' : 'Simpan Seluruh Pengaturan'}
            </button>

          </div>
        </form>
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
