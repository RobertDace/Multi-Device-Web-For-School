'use client';

import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-[#f9faff] text-[#191c20] font-sans overflow-x-hidden min-h-screen">
      {/* Mobile Navigation Drawer Overlay */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
        />
        <nav className={`absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-[#f9faff] shadow-2xl transition-transform duration-300 ease-out p-6 flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10">
            <span className="font-extrabold text-2xl text-[#4a7095]">TK Ceria</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-6 font-semibold">
            <a href="/" className="text-[#4a7095] flex items-center gap-3">
              <span className="material-symbols-outlined">home</span> Home
            </a>
            <a href="/aktivitas" className="text-slate-600 hover:text-[#4a7095] flex items-center gap-3">
              <span className="material-symbols-outlined">local_activity</span> Aktivitas
            </a>
            <a href="/kalender" className="text-slate-600 hover:text-[#4a7095] flex items-center gap-3">
              <span className="material-symbols-outlined">calendar_month</span> Kalender
            </a>
            <a href="/login" className="text-slate-600 hover:text-[#4a7095] flex items-center gap-3">
              <span className="material-symbols-outlined">assignment</span> Rapor
            </a>
          </div>
          <div className="mt-auto">
            <a href="/login" className="w-full bg-[#4a7095] text-white font-bold py-3.5 px-4 rounded-full flex justify-center items-center gap-2 shadow-md">
              <span className="material-symbols-outlined">login</span> Login Wali Murid
            </a>
          </div>
        </nav>
      </div>

      {/* Header / Top Navigation Bar */}
      <header className="bg-[#f1f4fb] sticky top-0 z-40 shadow-sm">
        <nav className="flex justify-between items-center w-full px-4 md:px-16 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-extrabold text-[#4a7095] tracking-tight">TK Ceria</div>
          
          {/* Desktop Nav Links */}
          <ul className="hidden md:flex gap-6 items-center font-medium text-slate-600">
            <li><a className="text-[#4a7095] font-bold border-b-4 border-[#4a7095] pb-1" href="/">Home</a></li>
            <li><a className="hover:text-[#4a7095] transition-colors" href="/aktivitas">Aktivitas</a></li>
            <li><a className="hover:text-[#4a7095] transition-colors" href="/kalender">Kalender</a></li>
            <li><a className="hover:text-[#4a7095] transition-colors" href="/login">Rapor</a></li>
          </ul>

          <div className="flex items-center gap-3">
            <a href="/login" className="hidden md:inline-flex bg-[#4a7095] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-[#324961] transition-all">
              Login Wali Murid
            </a>
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-[#4a7095] p-2 rounded-full hover:bg-slate-200">
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 md:px-16 py-12 md:py-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 text-center lg:text-left">
            <span className="inline-block bg-[#d4e4f7] text-[#031d33] px-4 py-1.5 rounded-full font-bold text-sm mb-6 shadow-sm">
              Pendaftaran 2024 Dibuka!
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-900 mb-6">
              Bermain dan Belajar <br /><span className="text-[#4a7095]">dengan Riang Gembira!</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Membangun karakter dan kreativitas si kecil melalui metode belajar yang seru, aman, dan penuh kasih sayang.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="/admin/siswa" className="bg-[#4a7095] text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform text-center shadow-md">
                Daftar Sekarang
              </a>
              <a href="/aktivitas" className="bg-white text-[#4a7095] border-2 border-[#4a7095]/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all text-center flex justify-center items-center gap-2">
                <span className="material-symbols-outlined">play_circle</span> Tur Virtual
              </a>
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 bg-[#d4e4f7]/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="relative p-2 w-full max-w-md">
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  alt="Anak-anak TK Ceria sedang bermain" 
                  className="w-full h-80 md:h-[400px] object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoyU3Ut2o3PTv_TAYv9wuPE1iCp0QKayQR5DkUzT47_LNPinBlMl7gOnWRzVXY30TAvq_24-QqeOtPNXMLxuHdRcDH6xe2ZvCAog1MNjrmKOYO9hEo6B1JVONppulDMQXygjkMmgidLbVOQ0EW7jyWfukg5JROfMdUzEol9MujHE83PW92sTNvUZd9bzUGbLWCt0LxqADsJ8rz62Afdehgg3dID_btprGdYbC9gXwN72ue6tsLZF9Klw" 
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#d4e4f7] text-[#031d33] p-3 rounded-2xl shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#4a7095]">mood</span>
                </div>
                <div>
                  <p className="font-extrabold text-base leading-none">500+</p>
                  <p className="text-xs opacity-80">Siswa Ceria</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kenapa Memilih Kami */}
        <section className="bg-[#f1f4fb] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Mengapa Memilih Kami?</h2>
              <div className="h-1 w-20 bg-[#4a7095] mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 bg-[#d4e4f7]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#4a7095]">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-800">Metode Bermain</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Kurikulum berbasis permainan yang merangsang motorik dan kognitif secara alami.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-700">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-800">Lingkungan Aman</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Fasilitas ramah anak dengan pengawasan CCTV dan staf yang berpengalaman.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-700">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-slate-800">Guru Berdedikasi</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Pendidik yang mencintai anak-anak dan tersertifikasi dalam pengembangan usia dini.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Aktivitas Terbaru Grid */}
        <section className="py-16 md:py-20 px-4 md:px-16 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Aktivitas Terbaru</h2>
              <p className="text-slate-500 mt-1">Melihat keceriaan harian anak didik kami</p>
            </div>
            <a href="/aktivitas" className="text-[#4a7095] font-bold flex items-center gap-1 hover:gap-2 transition-all">
              Lihat Semua <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 relative group overflow-hidden rounded-2xl h-64 md:h-80 shadow-md">
              <img alt="Belajar Menanam" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB996ocIaTB_4xc4dIJAfXtL-SVp_IdvnHOml9t2BU2F5u4loBagwQDSkqWyqv0PObZbUc5KHtj9WP-q3uSbso2Syi_zkmdM9lN4ozTmoCfZt_e3Cy46qhwx7ysLHOWbDApLKfu9Ifk_-GFn210DV0G4fT0COh88msf7hbBUx4PpEXNxaK5881X3yYCK6Px6K2z4rwhXOrtNee6CQkiOf8l2253bgjhsnJ1_TeT8c8_hqx7xr1lZHYLxg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="bg-[#4a7095] px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">Berkebun</span>
                <h4 className="font-bold text-xl">Belajar Menanam Bibit</h4>
              </div>
            </div>

            <div className="md:col-span-2 relative group overflow-hidden rounded-2xl h-64 md:h-80 shadow-md">
              <img alt="Melukis" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7i8mieDap0MD3Ra4JaBVfPiRQ1Gce3em02FNIHTPpQ3OF2ZV7Yot5gMq1afxKWsKy1GLHxCTdQEMx_2eDRtkSCYvUkbPeY3Pr260muPcRX4oU-9cNIuFpC8fHliZCczP17x62bywHRcv_RYilBMPT2enHezrkZEFRhAbKIMbG5kuGO9EALWD2oJsbgTIsb30uKiYIOo1Uci-uG9ji9FFxw8R3IhpelKlRD9zbUhrlX1PePaXvc_d9mA" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="bg-emerald-600 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">Seni</span>
                <h4 className="font-bold text-xl">Melukis dengan Jari</h4>
              </div>
            </div>
          </div>
        </section>

        {/* Testimoni Orang Tua */}
        <section className="bg-[#f1f4fb] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">Apa Kata Orang Tua?</h2>
              <p className="text-slate-500">Kepercayaan Anda adalah amanah bagi kami</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <img alt="Ibu Maya" className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-[#4a7095]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlaKcIJh4oD8zNWsV-E--nxks1NmukDLdJkJqxWuM_Ds91zTvyTjFPhRt5yPu_lYozQ7CQ55D2wjR9BincI2jYP7M5zHpC7znU1jh7rr25zYg0u9FIHptvwrHrxeuHDiFquki1kbURTRlMfRBzm_rfufKBPj_c3ACpa3ICFEfVJi4wBOXjm-4jWPOrJ03QFCkX40PGGKvB0ldm1d_gAEXbpTKrX7G_vaCLj1JCcqupMRELgvOoZWeU-Q" />
                <p className="text-slate-600 italic mb-4 text-sm">"Anak saya selalu bersemangat pergi ke sekolah setiap pagi. Gurunya sangat sabar dan laporannya sangat detail."</p>
                <h5 className="font-bold text-slate-800">Ibu Maya</h5>
                <span className="text-xs text-slate-400">Orang Tua dari Alif</span>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200 flex flex-col items-center text-center">
                <img alt="Bapak Rudi" className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-[#4a7095]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhkhPlct2ZWXOjOarIteNkB003WTZmqSCNSWCrhiDpCGIzGEVbpYZtcPtoMCaUjthKgeTLEf-rHkRUaBtE5VhECJ9cdLiHwmXbD4g1MU9ZKI3qm3elZQooXm5INxMI19tVfZ5eKiuTMoCKpnMdPgBBHDcKWNFR5LVl8M5FoOC4kCcZyIkDCcOrNAX5mS1uxasuQg5aKZedgVhBaZaoMnXs7AEqMWAxdEGS-54Yecyayan9uVW_6PUTlA" />
                <p className="text-slate-600 italic mb-4 text-sm">"Fasilitasnya sangat lengkap dan kurikulumnya benar-benar fokus pada karakter anak. Sangat merekomendasikan TK Ceria!"</p>
                <h5 className="font-bold text-slate-800">Bapak Rudi</h5>
                <span className="text-xs text-slate-400">Orang Tua dari Siska</span>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <img alt="Ibu Sarah" className="w-16 h-16 rounded-full object-cover mb-4 border-2 border-[#4a7095]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQYAzMOuoInAaQD7HnjYQ6j6nXZolGSlEzEmdZa8y6DzTuVumTjc_SNUaKU_bnFkgaMVQN4oeUfbSpKrKA8M8ZDOnHNod20D0SVjINhCwERQyXFzOxfQX9uDOJExzJTnXO7C-YLVA5yHsC3s3_0wO__CnGq0XFvuima9ghDW6pM9SRkU_Wg3HiR2y14nKnrsCuH5VOZNG5GCqndGW7wqjZP7AEx1kg54De7rrKmuGsm2BRE_u6mFQGpA" />
                <p className="text-slate-600 italic mb-4 text-sm">"Lingkungannya sangat bersih dan aman. Program berkebunnya membuat anak saya jadi lebih mencintai alam."</p>
                <h5 className="font-bold text-slate-800">Ibu Sarah</h5>
                <span className="text-xs text-slate-400">Orang Tua dari Budi</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12 px-4 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="text-2xl font-extrabold text-white mb-2">TK Ceria</div>
            <p className="text-slate-400 text-sm max-w-sm">© 2026 TK Ceria - Bermain dan Belajar dengan Riang. Memberikan pendidikan anak usia dini yang bermakna dan menyenangkan.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-white mb-2">Kontak</h4>
              <p>Jl. Pelangi No. 123</p>
              <p>halo@tkceria.sch.id</p>
              <p>(021) 555-0123</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">Navigasi</h4>
              <p><a href="/aktivitas" className="hover:underline">Aktivitas</a></p>
              <p><a href="/kalender" className="hover:underline">Kalender</a></p>
              <p><a href="/login" className="hover:underline">Portal Wali</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}