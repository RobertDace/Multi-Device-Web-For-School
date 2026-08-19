import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

    let siswaData = null;
    let raporData = null;

    // 1. Cari data siswa berdasarkan relasi email wali yang sedang login
    if (userEmail) {
      const wali = await db.pengguna.findUnique({
        where: { email: userEmail },
        include: { siswa: true },
      });

      if (wali && wali.siswa.length > 0) {
        const targetSiswa = wali.siswa[0];
        siswaData = {
          id: targetSiswa.id,
          nis: targetSiswa.nis,
          nama: targetSiswa.nama,
          kelas: targetSiswa.kelas,
          nama_wali: wali.nama,
          status: targetSiswa.status,
          jurnal_hari_ini: targetSiswa.jurnalHariIni || "",
          foto_jurnal: targetSiswa.fotoJurnal || "",
        };

        const rapor = await db.rapor.findFirst({
          where: { nis: targetSiswa.nis, status: "Published" },
          orderBy: { createdAt: "desc" },
        });

        if (rapor) {
          raporData = {
            id: rapor.id,
            nis: rapor.nis,
            nama_siswa: rapor.namaSiswa,
            kelas: rapor.kelas,
            status: rapor.status,
            soft_skills_score: rapor.softSkillsScore,
            soft_skills_desc: rapor.softSkillsDesc || "",
            academic_score: rapor.academicScore,
            academic_desc: rapor.academicDesc || "",
            hadir: rapor.hadir,
            izin: rapor.izin,
            alfa: rapor.alfa,
            catatan_guru: rapor.catatanGuru || "",
            pdf_url: rapor.pdfUrl || "",
            pdf_name: rapor.pdfName || "",
          };
        }
      }
    }

    // 2. Fallback: Tampilkan data siswa pertama jika belum terhubung akun
    if (!siswaData) {
      const fallbackSiswa = await db.siswa.findFirst({
        include: { wali: true },
      });

      if (fallbackSiswa) {
        siswaData = {
          id: fallbackSiswa.id,
          nis: fallbackSiswa.nis,
          nama: fallbackSiswa.nama,
          kelas: fallbackSiswa.kelas,
          nama_wali: fallbackSiswa.wali?.nama || "-",
          status: fallbackSiswa.status,
          jurnal_hari_ini: fallbackSiswa.jurnalHariIni || "",
          foto_jurnal: fallbackSiswa.fotoJurnal || "",
        };

        const rapor = await db.rapor.findFirst({
          where: { nis: fallbackSiswa.nis, status: "Published" },
          orderBy: { createdAt: "desc" },
        });

        if (rapor) {
          raporData = {
            id: rapor.id,
            nis: rapor.nis,
            nama_siswa: rapor.namaSiswa,
            kelas: rapor.kelas,
            status: rapor.status,
            soft_skills_score: rapor.softSkillsScore,
            soft_skills_desc: rapor.softSkillsDesc || "",
            academic_score: rapor.academicScore,
            academic_desc: rapor.academicDesc || "",
            hadir: rapor.hadir,
            izin: rapor.izin,
            alfa: rapor.alfa,
            catatan_guru: rapor.catatanGuru || "",
            pdf_url: rapor.pdfUrl || "",
            pdf_name: rapor.pdfName || "",
          };
        }
      }
    }

    // 3. Ambil daftar agenda kalender terbaru
    const rawAgenda = await db.aktivitas.findMany({
      orderBy: { tanggal: "asc" },
      take: 6,
    });

    const agendaList = rawAgenda.map((a) => ({
      id: a.id,
      judul: a.judul,
      kategori: a.kategori,
      tanggal: a.tanggal.toISOString(),
      gambar_url: a.gambarUrl || "",
      deskripsi: a.deskripsi,
    }));

    return NextResponse.json({
      siswa: siswaData,
      rapor: raporData,
      agendaList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}