'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SiswaItem {
  id: string; 
  nisn: string;
  name: string;
  class: string;
  parent: string;
  status: string;
  jurnal_hari_ini: string;
  foto_jurnal: string;
  foto_name?: string;
}

export default function AdminSiswaPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaItem | null>(null);

  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // State Form Input Siswa Baru
  const [newNisn, setNewNisn] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('Tiger Class (A)');
  const [newParent, setNewParent] = useState('');

  // State Kontrol Custom Dropdown Kelas (Anti Native OS Select UI)
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const classOptions = ['Tiger Class (A)', 'Rabbit Class (B)', 'Elephant Class (B)'];

  // State Form Jurnal Harian
  const [jurnalText, setJurnalText] = useState('');
  const [jurnalFotoUrl, setJurnalFotoUrl] = useState('');
  const [jurnalFotoName, setJurnalFotoName] = useState('');
  const [isUploadingJurnal, setIsUploadingJurnal] = useState(false);

  // State Toast Notifikasi & Confirm Dialog
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 3500);
  };

  const fetchSiswaDariSupabase = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedData: SiswaItem[] = data.map((item: any) => ({
          id: item.id, 
          nisn: item.nis || '-', 
          name: item.nama || 'Tanpa Nama', 
          class: item.kelas || 'Tiger Class (A)', 
          parent: item.nama_wali || '', 
          status: item.status || 'Aktif',
          jurnal_hari_ini: item.jurnal_hari_ini || 'Belum diisi oleh guru.',
          foto_jurnal: item.foto_jurnal || '',
          foto_name: item.foto_name || ''
        }));
        setSiswaList(mappedData);
      }
    } catch (err: any) {
      console.error('Gagal memuat data dari Supabase:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSiswaDariSupabase();
  }, []);

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNisn.trim() || !newParent.trim()) return;

    try {
      const { error } = await supabase
        .from('siswa')
        .insert([
          {
            nis: newNisn.trim(),         
            nama: newName.trim(),        
            kelas: newClass,             
            nama_wali: newParent.trim(),  
            status: 'Aktif'
          }
        ]);

      if (error) throw error;

      fetchSiswaDariSupabase();
      setIsModalOpen(false);
      setNewNisn('');
      setNewName('');
      setNewParent('');
      showToast('Data anak didik baru berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast(`Gagal menyimpan data: ${err.message}`, 'error');
    }
  };

  const handleSaveJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiswa) return;

    try {
      const { error } = await supabase
        .from('siswa')
        .update({
          jurnal_hari_ini: jurnalText,
          foto_jurnal: jurnalFotoUrl,
          foto_name: jurnalFotoName
        })
        .eq('id', selectedSiswa.id);

      if (error) throw error;

      fetchSiswaDariSupabase();
      setIsJurnalModalOpen(false);
      showToast(`Jurnal harian untuk ${selectedSiswa.name} sukses diperbarui!`, 'success');
    } catch (err: any) {
      showToast(`Gagal mengupdate jurnal: ${err.message}`, 'error');
    }
  };

  const triggerDeleteSiswa = (siswa: SiswaItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin menghapus data siswa "${siswa.name}" secara permanen?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('siswa')
            .delete()
            .eq('id', siswa.id);

          if (error) throw error;
          fetchSiswaDariSupabase();
          showToast('Data siswa berhasil dihapus secara permanen.', 'success');
        } catch (err: any) {
          showToast(`Gagal menghapus data: ${err.message}`, 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleJurnalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingJurnal(true);
    setTimeout(() => {
      setJurnalFotoName(file.name);
      setJurnalFotoUrl(URL.createObjectURL(file));
      setIsUploadingJurnal(false);
    }, 1000);
  };

  const handleOpenJurnal = (siswa: SiswaItem) => {
    setSelectedSiswa(siswa);
    setJurnalText(siswa.jurnal_hari_ini === 'Belum diisi oleh guru.' ? '' : siswa.jurnal_hari_ini);
    setJurnalFotoUrl(siswa.foto_jurnal);
    setJurnalFotoName(siswa.foto_name || '');
    setIsJurnalModalOpen(true);
  };

  const filtered = siswaList.filter(s => {
    const studentName = s.name?.toLowerCase() || '';
    const studentNisn = s.nisn || '';
    const searchKeyword = search.toLowerCase();
    return studentName.includes(searchKeyword) || studentNisn.includes(searchKeyword);
  });

  return (
    <div className="pb-28 font-sans">
      {/* HEADER UTAMA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Database Anak Didik</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Koneksi Real-time Cloud Supabase • TK CAHAYA HATI</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs items-center gap-1.5 transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tambah Siswa Baru
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="relative max-w-md w-full mt-4">
        <input 
          type="text" 
          placeholder="Cari nama atau NIS anak didik..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-[#02677f] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-3xs" 
        />
        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {loadingData ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke pangkalan data Supabase...</div>
      ) : (
        <>
          {/* VIEW MOBILE */}
          <div className="grid grid-cols-1 gap-4 md:hidden mt-5">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-3xs animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{s.name}</h4>
                    <span className="text-[10px] font-mono font-bold text-[#02677f] block mt-1 uppercase">NIS: {s.nisn}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide bg-slate-100 text-slate-700 uppercase shrink-0">
                    {s.class.replace(' Class', '')}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5 tracking-wider">Log Hari Ini</span>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-2">{s.jurnal_hari_ini}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                  <button onClick={() => handleOpenJurnal(s)} className="border border-slate-200 hover:border-[#02677f] hover:bg-sky-50 text-slate-800 font-bold px-3 py-2 rounded-xl text-[11px] inline-flex items-center gap-1.5 transition-all flex-1 justify-center bg-white shadow-3xs">
                    <svg className="w-3.5 h-3.5 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Jurnal Harian
                  </button>
                  <button onClick={() => triggerDeleteSiswa(s)} className="text-slate-400 hover:text-rose-600 p-2 rounded-xl transition-colors shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW DESKTOP */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">NIS (Identitas)</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Log Hari Ini</th>
                  <th className="p-4 text-right pr-6">Aksi & Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6"><div className="font-mono font-bold text-[#02677f] text-[11px]">{s.nisn}</div></td>
                    <td className="p-4 font-bold text-slate-900 text-sm">{s.name}</td>
                    <td className="p-4 font-semibold text-slate-700">{s.class}</td>
                    <td className="p-4 text-slate-500 truncate max-w-[180px] font-semibold">{s.jurnal_hari_ini}</td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button onClick={() => handleOpenJurnal(s)} className="border border-slate-200 hover:border-[#02677f] hover:bg-sky-50 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-[11px] inline-flex items-center gap-1.5 bg-white shadow-3xs transition-all">
                        <svg className="w-3.5 h-3.5 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Jurnal Harian
                      </button>
                      <button onClick={() => triggerDeleteSiswa(s)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FLOATING FAB MOBILE */}
      <div className="fixed bottom-[92px] right-4 left-4 md:hidden z-40">
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full bg-[#02677f] hover:bg-[#005468] text-white py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tambah Siswa Baru
        </button>
      </div>

      {/* MODAL REGISTRASI SISWA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Registrasi Siswa Baru</h3>
              <button onClick={() => { setIsModalOpen(false); setIsClassDropdownOpen(false); }} className="text-slate-400 hover:text-slate-600"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
            </div>
            <form onSubmit={handleAddSiswa} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Nama Lengkap Murid</label>
                <input 
                  type="text" required placeholder="Masukkan nama anak" value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] focus:bg-white bg-slate-50/50 transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">NIS (Nomor Induk Siswa)</label>
                <input 
                  type="text" required placeholder="Masukkan nomor induk murid" value={newNisn} 
                  onChange={(e) => setNewNisn(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] focus:bg-white bg-slate-50/50 transition-all" 
                />
              </div>

              {/* CUSTOM DROPDOWN KELAS */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Kelas</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-slate-50/50 outline-none text-left flex justify-between items-center transition-all focus:border-[#02677f] focus:bg-white"
                  >
                    <span>{newClass}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isClassDropdownOpen && (
                    <div className="absolute left-0 right-0 top-[46px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn max-w-full">
                      {classOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setNewClass(option);
                            setIsClassDropdownOpen(false);
                          }}
                          className="p-3 text-xs font-bold text-slate-900 hover:bg-sky-50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <span>{option}</span>
                          {newClass === option && (
                            <svg className="w-3.5 h-3.5 text-[#02677f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Nama Lengkap Wali Murid</label>
                <input 
                  type="text" required placeholder="Nama Ayah / Bunda" value={newParent} 
                  onChange={(e) => setNewParent(e.target.value)} 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] focus:bg-white bg-slate-50/50 transition-all" 
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsClassDropdownOpen(false); }} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50">Batal</button>
                <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL JURNAL HARIAN */}
      {isJurnalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Laporan Jurnal Harian</h3>
                <span className="text-[10px] text-[#02677f] font-bold">Subjek: {selectedSiswa?.name}</span>
              </div>
              <button onClick={() => setIsJurnalModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
            </div>
            <form onSubmit={handleSaveJurnal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Narasi Progres Hari Ini</label>
                <textarea 
                  rows={4} required value={jurnalText} onChange={(e) => setJurnalText(e.target.value)} 
                  placeholder="Tulis cerita aktivitas anak..." 
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#02677f] focus:bg-white bg-slate-50/40 leading-relaxed resize-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Foto Dokumentasi</label>
                {jurnalFotoUrl ? (
                  <div className="flex items-center justify-between bg-white border border-[#02677f]/20 p-3 rounded-xl shadow-3xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <img src={jurnalFotoUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs font-bold text-slate-800 truncate">{jurnalFotoName || 'gambar.jpg'}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setJurnalFotoName(''); setJurnalFotoUrl(''); }} className="text-xs font-bold text-rose-600 px-2 py-1">Hapus</button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#02677f] rounded-xl p-5 text-center bg-slate-50/30 transition-colors cursor-pointer group">
                    <input type="file" accept="image/*" onChange={handleJurnalFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-xs font-bold group-hover:text-[#02677f] flex items-center justify-center gap-1.5 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {isUploadingJurnal ? 'Memproses berkas...' : 'Klik / Seret Gambar Dokumentasi'}
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsJurnalModalOpen(false)} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50">Batal</button>
                <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs">Kirim ke Wali Murid</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST & CONFIRM DIALOG */}
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

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Konfirmasi Penghapusan</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmDialog.onConfirm} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs">Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}