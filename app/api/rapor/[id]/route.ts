import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.rapor.update({
      where: { id },
      data: {
        nis: body.nis ? body.nis.trim() : undefined,
        namaSiswa: body.nama_siswa ? body.nama_siswa.trim() : undefined,
        kelas: body.kelas,
        status: body.status,
        softSkillsScore: body.soft_skills_score !== undefined ? parseFloat(body.soft_skills_score) : undefined,
        softSkillsDesc: body.soft_skills_desc,
        academicScore: body.academic_score !== undefined ? parseFloat(body.academic_score) : undefined,
        academicDesc: body.academic_desc,
        hadir: body.hadir !== undefined ? parseInt(body.hadir) : undefined,
        izin: body.izin !== undefined ? parseInt(body.izin) : undefined,
        alfa: body.alfa !== undefined ? parseInt(body.alfa) : undefined,
        catatanGuru: body.catatan_guru,
        pdfUrl: body.pdf_url !== undefined ? body.pdf_url : undefined,
        pdfName: body.pdf_name !== undefined ? body.pdf_name : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.rapor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Rapor berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}