import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nis = searchParams.get("nis");

    if (!nis) {
      return NextResponse.json({ success: false, message: "NIS wajib diisi" }, { status: 400 });
    }

    const rapor = await db.rapor.findFirst({
      where: { nis: nis.trim() },
      orderBy: { createdAt: "desc" },
    });

    if (!rapor) {
      return NextResponse.json({ success: false, message: "Nomor NIS tidak ditemukan dalam pangkalan rapor." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        nama_siswa: rapor.namaSiswa,
        status: rapor.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}