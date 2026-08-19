import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await db.rapor.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedData = data.map((r) => ({
      id: r.id,
      nis: r.nis,
      nama_siswa: r.namaSiswa,
      kelas: r.kelas,
      status: r.status,
      soft_skills_score: r.softSkillsScore,
      soft_skills_desc: r.softSkillsDesc || "",
      academic_score: r.academicScore,
      academic_desc: r.academicDesc || "",
      hadir: r.hadir,
      izin: r.izin,
      alfa: r.alfa,
      catatan_guru: r.catatanGuru || "",
      pdf_url: r.pdfUrl || "",
      pdf_name: r.pdfName || "",
      created_at: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const siswa = await db.siswa.findUnique({
      where: { nis: body.nis.trim() },
    });

    const newRapor = await db.rapor.create({
      data: {
        nis: body.nis.trim(),
        namaSiswa: body.nama_siswa?.trim() || (siswa ? siswa.nama : "Murid"),
        kelas: body.kelas || (siswa ? siswa.kelas : "Kelompok A"),
        status: body.status || "Draft",
        softSkillsScore: parseFloat(body.soft_skills_score || 0),
        softSkillsDesc: body.soft_skills_desc || "",
        academicScore: parseFloat(body.academic_score || 0),
        academicDesc: body.academic_desc || "",
        hadir: parseInt(body.hadir || 0),
        izin: parseInt(body.izin || 0),
        alfa: parseInt(body.alfa || 0),
        catatanGuru: body.catatan_guru || "",
        pdfUrl: body.pdf_url || null,
        pdfName: body.pdf_name || null,
        siswaId: siswa?.id || null,
      },
    });

    return NextResponse.json({ success: true, data: newRapor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}