import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email.toLowerCase();

    const { searchParams } = new URL(request.url);
    const requestedSiswaId = searchParams.get("siswaId");

    let siswaData = null;
    let raporData = null;
    let siswaList: Array<{ id: string; nis: string; nama: string; kelas: string }> = [];

    // 1. Cari data wali berdasarkan email login
    const wali = await db.pengguna.findUnique({
      where: { email: userEmail },
      include: { siswa: { orderBy: { nama: "asc" } } },
    });

    if (wali && wali.siswa.length > 0) {
      siswaList = wali.siswa.map((s) => ({
        id: s.id,
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas,
      }));

      // Pilih siswa berdasarkan requestedSiswaId atau anak pertama
      const targetSiswa =
        (requestedSiswaId ? wali.siswa.find((s) => s.id === requestedSiswaId) : null) ||
        wali.siswa[0];

      if (targetSiswa) {
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
            pdf_url: rapor.pdfUrl
              ? rapor.pdfUrl.startsWith("data:")
                ? `/api/rapor/${rapor.id}/pdf`
                : rapor.pdfUrl
              : "",
            pdf_name: rapor.pdfName || "",
          };
        }
      }
    }

    // 2. Ambil daftar agenda kalender terbaru (maksimal 6)
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
      siswaList,
      rapor: raporData,
      agendaList,
      userRole: wali?.levelAkses || "WALI MURID",
    });
  } catch (error: any) {
    console.error("GET /api/wali/dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
