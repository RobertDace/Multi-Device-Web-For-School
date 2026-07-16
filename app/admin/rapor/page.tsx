'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RaporItem {
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

interface SiswaDropdownItem {
  nis: string;
  nama: string;
  kelas: string;
}

export default function AdminRaporPage() {
  const [globalSearch, setGlobalSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRapor, setEditingRapor] = useState<RaporItem | null>(null);
  
  // State Navigasi Tab Modal
  const [activeTab, setActiveTab] = useState<'identitas' | 'nilai' | 'absensi'>('identitas');

  const [raporList, setRaporList] = useState<RaporItem[]>([]);
  const [siswaOptions, setSiswaOptions] = useState<SiswaDropdownItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // State Search & Autocomplete Siswa
  const [siswaSearchInput, setSiswaSearchQuery] = useState('');
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  // Custom Dropdown Control States (Anti Native OS Dropdown UI)
  const [isSoftSkillsDropdownOpen, setIsSoftSkillsDropdownOpen] = useState(false);
  const [isAcademicDropdownOpen, setIsAcademicDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const softSkillsOptions = [
    { label: 'Sangat Baik (4)', value: 4 },
    { label: 'Baik (3)', value: 3 },
    { label: 'Cukup (2)', value: 2 }
  ];

  const academicOptions = [
    { label: 'Sangat Baik (3)', value: 3 },
    { label: 'Berkembang (2)', value: 2 },
    { label: 'Mulai Berkembang (1)', value: 1 }
  ];

  const statusOptions = [
    { label: 'Simpan Sebagai Draft', value: 'Draft' },
    { label: 'Terbitkan Langsung Online', value: 'Published' }
  ];

  // Upload Engine States
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // Form Validation & Notification States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    isOpen: false, message: '', type: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
    isOpen: false, message: '', onConfirm: () => {}
  });

  const [formData, setFormData] = useState<Omit<RaporItem, 'id'>>({
    nis: '', nama_siswa: '', kelas: '', status: 'Draft',
    soft_skills_score: 4, soft_skills_desc: '',
    academic_score: 2, academic_desc: '',
    hadir: 20, izin: 0, alfa: 0, catatan_guru: '',
    pdf_url: '', pdf_name: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const fetchDataMaster = async () => {
    setLoadingData(true);
    try {
      const { data: raporData, error: raporErr } = await supabase
        .from('rapor')
        .select('*')
        .order('created_at', { ascending: false });
      if (raporErr) throw raporErr;
      if (raporData) setRaporList(raporData);

      const { data: siswaData, error: siswaErr } = await supabase
        .from('siswa')
        .select('nis, nama, kelas');
      if (siswaErr) throw siswaErr;
      if (siswaData) setSiswaOptions(siswaData);
    } catch (err: any) {
      console.error('Gagal mengambil data:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDataMaster();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('Sistem hanya menerima berkas resmi berformat PDF!', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file rapor maksimal adalah 5MB.', 'warning');
      return;
    }

    setUploadingFileName(file.name);
    setIsUploadingFile(true);
    setUploadProgress(5);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev: number) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    try {
      const fileExtension = file.name.split('.').pop();
      const cleanFileName = `${Date.now()}_rapor_${formData.nis || 'siswa'}.${fileExtension}`;
      const filePath = `public/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rapor-pdfs')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { data } = supabase.storage.from('rapor-pdfs').getPublicUrl(filePath);

      setTimeout(() => {
        setFormData((prev: Omit<RaporItem, 'id'>) => ({ ...prev, pdf_name: file.name, pdf_url: data.publicUrl }));
        setIsUploadingFile(false);
        showToast('Berkas dokumen rapor sukses diunggah ke server cloud!', 'success');
      }, 400);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploadingFile(false);
      showToast(`Gagal mengunggah file: ${err.message}`, 'error');
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev: Omit<RaporItem, 'id'>) => ({ ...prev, pdf_name: '', pdf_url: '' }));
    showToast('Lampiran berkas rapor dicabut.', 'warning');
  };

  const handleOpenAdd = () => {
    setEditingRapor(null);
    setSiswaSearchQuery('');
    setErrors({});
    setActiveTab('identitas');
    setIsSoftSkillsDropdownOpen(false);
    setIsAcademicDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setFormData({
      nis: '', nama_siswa: '', kelas: '', status: 'Draft',
      soft_skills_score: 4, soft_skills_desc: '',
      academic_score: 2, academic_desc: '',
      hadir: 20, izin: 0, alfa: 0, catatan_guru: '',
      pdf_url: '', pdf_name: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RaporItem) => {
    setEditingRapor(item);
    setSiswaSearchQuery(item.nama_siswa);
    setErrors({});
    setActiveTab('identitas');
    setIsSoftSkillsDropdownOpen(false);
    setIsAcademicDropdownOpen(false);
    setIsStatusDropdownOpen(false);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSelectStudent = (siswa: SiswaDropdownItem) => {
    setFormData((prev: Omit<RaporItem, 'id'>) => ({ 
      ...prev, 
      nama_siswa: siswa.nama, 
      nis: siswa.nis, 
      kelas: siswa.kelas 
    }));
    setSiswaSearchQuery(siswa.nama);
    setIsDropdownActive(false);

    const cleanErrors = { ...errors };
    delete cleanErrors.nama_siswa;
    setErrors(cleanErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nama_siswa.trim()) newErrors.nama_siswa = 'Nama anak didik wajib ditentukan.';
    if (!formData.soft_skills_desc.trim()) newErrors.soft_skills_desc = 'Deskripsi perilaku wajib diisi.';
    if (!formData.academic_desc.trim()) newErrors.academic_desc = 'Deskripsi akademik wajib diisi.';
    if (!formData.catatan_guru.trim()) newErrors.catatan_guru = 'Catatan ulasan guru wajib diisi.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRapor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Periksa kembali! Ada beberapa kolom wajib yang masih kosong.', 'warning');
      return;
    }

    try {
      if (editingRapor) {
        const { error } = await supabase
          .from('rapor')
          .update({
            soft_skills_score: Number(formData.soft_skills_score),
            soft_skills_desc: formData.soft_skills_desc.trim(),
            academic_score: Number(formData.academic_score),
            academic_desc: formData.academic_desc.trim(),
            hadir: Number(formData.hadir),
            izin: Number(formData.izin),
            alfa: Number(formData.alfa),
            catatan_guru: formData.catatan_guru.trim(),
            status: formData.status,
            pdf_url: formData.pdf_url,
            pdf_name: formData.pdf_name
          })
          .eq('id', editingRapor.id);

        if (error) throw error;
        showToast('Berkas rekapitulasi rapor berhasil diperbarui!', 'success');
      } else {
        const { error } = await supabase.from('rapor').insert([formData]);
        if (error) throw error;
        showToast('Lembar rapor baru sukses diterbitkan!', 'success');
      }
      fetchDataMaster();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Gagal memproses data: ${err.message}`, 'error');
    }
  };

  const handleToggleStatus = async (item: RaporItem) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    try {
      const { error } = await supabase.from('rapor').update({ status: newStatus }).eq('id', item.id);
      if (error) throw error;
      fetchDataMaster();
      showToast(`Status berkas diubah menjadi ${newStatus === 'Published' ? 'Terbit Online' : 'Draft'}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const triggerDeleteRapor = (item: RaporItem) => {
    setConfirmDialog({
      isOpen: true,
      message: `Apakah Anda yakin ingin menghapus rekapitulasi rapor milik "${item.nama_siswa}" secara permanen?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('rapor').delete().eq('id', item.id);
          if (error) throw error;
          fetchDataMaster();
          showToast('Dokumen rekapitulasi rapor berhasil dihapus.', 'success');
        } catch (err: any) {
          showToast(`Gagal menghapus dokumen: ${err.message}`, 'error');
        } finally {
          setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="pb-28 font-sans">
      {/* HEADER UTAMA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Manajemen Penerbitan Rapor</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Validasi nilai terpadu, konversi digital, dan ubah visibilitas dokumen ke portal wali murid.</p>
        </div>
        <button onClick={handleOpenAdd} className="hidden md:flex bg-[#02677f] hover:bg-[#005468] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Buat Rekapitulasi Rapor Baru
        </button>
      </header>

      {/* SEARCH BAR */}
      <div className="relative max-w-md w-full mt-4">
        <input type="text" placeholder="Cari nama atau NIS siswa..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-[#02677f] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-3xs" />
        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      </div>

      {loadingData ? (
        <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Menghubungkan ke server cloud Supabase...</div>
      ) : (
        <>
          {/* VIEW MOBILE LAYAR HP */}
          <div className="grid grid-cols-1 gap-4 md:hidden mt-5">
            {raporList.filter(item => item.nama_siswa?.toLowerCase().includes(globalSearch.toLowerCase()) || item.nis?.includes(globalSearch)).map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-3xs animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{r.nama_siswa}</h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1">NIS: {r.nis}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">{r.kelas.replace(' Class', '')}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Kehadiran (H/I/A)</span>
                    <div className="font-mono font-bold"><span className="text-emerald-600">{r.hadir}</span> / <span className="text-amber-500">{r.izin}</span> / <span className="text-rose-500">{r.alfa}</span></div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <span className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">Berkas Rapor</span>
                    {r.pdf_url ? (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-rose-600 font-bold inline-flex items-center gap-0.5 hover:underline">PDF Terlampir</a>
                    ) : (
                      <span className="text-slate-400 italic font-medium">No PDF File</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-4">
                  {r.status === 'Published' ? (
                    <button onClick={() => handleToggleStatus(r)} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Terbit Online</button>
                  ) : (
                    <button onClick={() => handleToggleStatus(r)} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">Draft</button>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(r)} className="p-2 rounded-xl text-slate-400 hover:text-[#02677f] transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => triggerDeleteRapor(r)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW LAPTOP MODE */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 pl-6">Siswa & Identitas</th>
                  <th className="p-4">Grup Kelas</th>
                  <th className="p-4">Berkas Resmi (PDF)</th>
                  <th className="p-4">Kehadiran (H / I / A)</th>
                  <th className="p-4">Status & Publikasi</th>
                  <th className="p-4 text-right pr-6">Otoritas Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {raporList.filter(item => item.nama_siswa?.toLowerCase().includes(globalSearch.toLowerCase()) || item.nis?.includes(globalSearch)).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-sm">{r.nama_siswa}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5 uppercase">NIS: {r.nis}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{r.kelas}</td>
                    <td className="p-4"><a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-rose-600 font-bold">Lihat Rapor</a></td>
                    <td className="p-4 font-mono font-bold text-slate-500"><span className="text-emerald-600">{r.hadir}</span> / <span className="text-amber-500">{r.izin}</span> / <span className="text-rose-500">{r.alfa}</span></td>
                    <td className="p-4"><span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">{r.status}</span></td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button onClick={() => handleOpenEdit(r)} className="text-slate-400 hover:text-[#02677f] transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      <button onClick={() => triggerDeleteRapor(r)} className="text-slate-400 hover:text-rose-600 transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FLOATING ACTION BUTTON FOR MOBILE */}
      <div className="fixed bottom-[92px] right-4 left-4 md:hidden z-40">
        <button onClick={handleOpenAdd} className="w-full bg-[#02677f] text-white py-3 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Buat Rekapitulasi Rapor Baru
        </button>
      </div>

      {/* ================= MODAL EDITOR RAPOR (CUSTOM SLEEK DROPDOWNS & UNIFORM SIZING) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-xl w-full shadow-xl my-8 animate-fadeIn">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{editingRapor ? 'Modifikasi Rapor' : 'Buat Rapor Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
            </div>

            {/* Controller Header Navigation Tabs */}
            <div className="flex border-b border-slate-100 text-[11px] font-bold text-slate-400 mb-4 overflow-x-auto whitespace-nowrap">
              <button type="button" onClick={() => setActiveTab('identitas')} className={`pb-2.5 px-3 flex-1 border-b-2 transition-all ${activeTab === 'identitas' ? 'border-[#02677f] text-[#02677f]' : 'border-transparent text-slate-500'}`}>Identitas</button>
              <button type="button" onClick={() => setActiveTab('nilai')} className={`pb-2.5 px-3 flex-1 border-b-2 transition-all ${activeTab === 'nilai' ? 'border-[#02677f] text-[#02677f]' : 'border-transparent text-slate-500'}`}>Matriks Nilai</button>
              <button type="button" onClick={() => setActiveTab('absensi')} className={`pb-2.5 px-3 flex-1 border-b-2 transition-all ${activeTab === 'absensi' ? 'border-[#02677f] text-[#02677f]' : 'border-transparent text-slate-500'}`}>Absen & Catatan</button>
            </div>

            <form onSubmit={handleSaveRapor} noValidate className="space-y-4">
              
              {/* TAB 1: IDENTITAS SISWA & PDF */}
              {activeTab === 'identitas' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">File Rapor Resmi (Format PDF)</label>
                    {isUploadingFile ? (
                      <div className="border border-slate-200 bg-white p-3 rounded-xl shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="truncate max-w-[200px]">{uploadingFileName}</span>
                          <span className="font-mono text-[#02677f]">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-[#02677f] h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} /></div>
                      </div>
                    ) : formData.pdf_name ? (
                      <div className="flex items-center justify-between bg-white border border-rose-200 p-2.5 rounded-xl">
                        <div className="truncate text-xs font-bold text-slate-900">{formData.pdf_name}</div>
                        <button type="button" onClick={handleRemoveFile} className="text-[10px] font-bold text-rose-600 shrink-0">Hapus</button>
                      </div>
                    ) : (
                      <div className="relative border border-dashed border-slate-200 rounded-xl p-4 text-center bg-white cursor-pointer group">
                        <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="text-xs font-bold text-slate-500 group-hover:text-[#02677f] flex items-center justify-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Klik Untuk Unggah PDF Rapor
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Siswa</label>
                      <input type="text" placeholder="Ketik nama anak..." value={siswaSearchInput || ''} disabled={!!editingRapor} onFocus={() => setIsDropdownActive(true)} onChange={(e) => { setSiswaSearchQuery(e.target.value); setIsDropdownActive(true); setFormData(prev => ({ ...prev, nama_siswa: e.target.value, nis: '', kelas: '' })); }} className="w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]" />
                      {isDropdownActive && !editingRapor && (
                        <div className="absolute left-0 right-0 top-[60px] bg-white border border-slate-200 rounded-xl shadow-xl max-h-36 overflow-y-auto z-50 divide-y divide-slate-50">
                          {siswaOptions.filter(s => s.nama?.toLowerCase().includes(siswaSearchInput.toLowerCase()) || s.nis?.includes(siswaSearchInput)).map(s => (
                            <div key={s.nis} onClick={() => handleSelectStudent(s)} className="p-2.5 text-xs font-bold text-slate-900 hover:bg-slate-50 cursor-pointer flex justify-between"><span>{s.nama}</span><span className="text-[9px] font-mono text-slate-500">NIS: {s.nis}</span></div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">NIS Siswa</label><input type="text" disabled value={formData.nis || ''} placeholder="Auto fill..." className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-100 text-slate-900 outline-none"/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Kelas</label><input type="text" disabled value={formData.kelas || ''} placeholder="Auto fill..." className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 outline-none"/></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MATRIKS KOMPETENSI NILAI (CUSTOM DIV DROPDOWNS REPLACING NATIVE SELECT) */}
              {activeTab === 'nilai' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* SOFT SKILLS CARD */}
                  <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-center relative">
                      <label className="text-xs font-extrabold text-slate-900">Kecerdasan Sosial</label>
                      
                      {/* Custom Dropdown Trigger */}
                      <div className="relative w-48">
                        <button
                          type="button"
                          onClick={() => setIsSoftSkillsDropdownOpen(!isSoftSkillsDropdownOpen)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-white outline-none flex justify-between items-center transition-all focus:border-[#02677f] shadow-3xs"
                        >
                          <span>{softSkillsOptions.find(o => o.value === formData.soft_skills_score)?.label}</span>
                          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSoftSkillsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Custom Dropdown Options Popover */}
                        {isSoftSkillsDropdownOpen && (
                          <div className="absolute right-0 top-[42px] w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                            {softSkillsOptions.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setFormData({ ...formData, soft_skills_score: opt.value });
                                  setIsSoftSkillsDropdownOpen(false);
                                }}
                                className="p-2.5 text-xs font-bold text-slate-900 hover:bg-sky-50/60 cursor-pointer flex justify-between items-center transition-colors"
                              >
                                <span>{opt.label}</span>
                                {formData.soft_skills_score === opt.value && (
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

                    <input 
                      type="text" 
                      placeholder="Deskripsi narasi progres sosial..." 
                      value={formData.soft_skills_desc || ''} 
                      onChange={(e) => setFormData({ ...formData, soft_skills_desc: e.target.value })} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none bg-white focus:border-[#02677f] transition-all" 
                    />
                  </div>

                  {/* ACADEMIC CARD */}
                  <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between items-center relative">
                      <label className="text-xs font-extrabold text-slate-900">Kognitif (Akademik)</label>
                      
                      {/* Custom Dropdown Trigger */}
                      <div className="relative w-48">
                        <button
                          type="button"
                          onClick={() => setIsAcademicDropdownOpen(!isAcademicDropdownOpen)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-white outline-none flex justify-between items-center transition-all focus:border-[#02677f] shadow-3xs"
                        >
                          <span>{academicOptions.find(o => o.value === formData.academic_score)?.label}</span>
                          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAcademicDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Custom Dropdown Options Popover */}
                        {isAcademicDropdownOpen && (
                          <div className="absolute right-0 top-[42px] w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                            {academicOptions.map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setFormData({ ...formData, academic_score: opt.value });
                                  setIsAcademicDropdownOpen(false);
                                }}
                                className="p-2.5 text-xs font-bold text-slate-900 hover:bg-sky-50/60 cursor-pointer flex justify-between items-center transition-colors"
                              >
                                <span>{opt.label}</span>
                                {formData.academic_score === opt.value && (
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

                    <input 
                      type="text" 
                      placeholder="Deskripsi narasi progres akademik..." 
                      value={formData.academic_desc || ''} 
                      onChange={(e) => setFormData({ ...formData, academic_desc: e.target.value })} 
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none bg-white focus:border-[#02677f] transition-all" 
                    />
                  </div>

                </div>
              )}

              {/* TAB 3: REKAP ABSENSI & ULASAN KELAS */}
              {activeTab === 'absensi' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-600 uppercase">Hadir</label><input type="number" value={formData.hadir} onChange={(e)=>setFormData({...formData, hadir: parseInt(e.target.value) || 0})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#02677f]"/></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-600 uppercase">Izin</label><input type="number" value={formData.izin} onChange={(e)=>setFormData({...formData, izin: parseInt(e.target.value) || 0})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#02677f]"/></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-600 uppercase">Alfa</label><input type="number" value={formData.alfa} onChange={(e)=>setFormData({...formData, alfa: parseInt(e.target.value) || 0})} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#02677f]"/></div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan / Ulasan Wali Kelas</label>
                    <textarea rows={3} value={formData.catatan_guru || ''} onChange={(e)=>setFormData({...formData, catatan_guru: e.target.value})} className="w-full p-3 border rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 leading-relaxed resize-none outline-none border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#02677f]" placeholder="Tulis catatan umpan balik perkembangan anak..." />
                  </div>

                  {/* CUSTOM DROPDOWN STATUS VISIBILITAS */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status Visibilitas Document</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 bg-slate-50/50 outline-none text-left flex justify-between items-center transition-all focus:border-[#02677f] focus:bg-white"
                      >
                        <span>{statusOptions.find(s => s.value === formData.status)?.label}</span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isStatusDropdownOpen && (
                        <div className="absolute left-0 right-0 top-[46px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                          {statusOptions.map((st) => (
                            <div
                              key={st.value}
                              onClick={() => {
                                setFormData({ ...formData, status: st.value });
                                setIsStatusDropdownOpen(false);
                              }}
                              className="p-3 text-xs font-bold text-slate-900 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                            >
                              <span>{st.label}</span>
                              {formData.status === st.value && (
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

                </div>
              )}

              {/* FOOTER ACTION BUTTONS */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                <div>
                  {activeTab !== 'identitas' && (
                    <button type="button" onClick={() => setActiveTab(activeTab === 'absensi' ? 'nilai' : 'identitas')} className="text-xs font-bold text-[#02677f] hover:underline">Kembali</button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-50">Batal</button>
                  {activeTab !== 'absensi' ? (
                    <button type="button" onClick={() => setActiveTab(activeTab === 'identitas' ? 'nilai' : 'absensi')} className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs">Lanjut</button>
                  ) : (
                    <button type="submit" className="bg-[#02677f] hover:bg-[#005468] text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs">Simpan Data</button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Konfirmasi Penghapusan</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">{confirmDialog.message}</p>
            </div>
            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50">Batal</button>
              <button type="button" onClick={confirmDialog.onConfirm} className="flex-1 bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs">Hapus</button>
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