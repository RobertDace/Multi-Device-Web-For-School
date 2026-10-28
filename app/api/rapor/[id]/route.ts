import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rapor = await db.rapor.findUnique({
      where: { id },
    });

    if (!rapor) {
      return NextResponse.json({ success: false, message: "Rapor tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
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
        has_pdf: Boolean(rapor.pdfUrl),
        pdf_name: rapor.pdfName || "",
        created_at: rapor.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Pastikan jika frontend mengirimkan URL streaming '/api/rapor/...',
    // jangan menimpa file Base64 asli di database
    let resolvedPdfUrl: string | null | undefined = undefined;
    if (body.pdf_url !== undefined) {
      if (typeof body.pdf_url === "string" && body.pdf_url.startsWith("/api/rapor/")) {
        resolvedPdfUrl = undefined; // Jangan ubah pdfUrl
      } else if (!body.pdf_url) {
        resolvedPdfUrl = null; // Menghapus file
      } else {
        resolvedPdfUrl = body.pdf_url;
      }
    }

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
        pdfUrl: resolvedPdfUrl,
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
