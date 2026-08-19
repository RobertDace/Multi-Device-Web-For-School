import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await db.siswa.findMany({
      include: { wali: true },
      orderBy: { nama: "asc" },
    });

    const formattedData = data.map((s) => ({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      kelas: s.kelas,
      status: s.status,
      nama_wali: s.wali?.nama || "-",
      jurnal_hari_ini: s.jurnalHariIni || "",
      foto_jurnal: s.fotoJurnal || "",
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newSiswa = await db.siswa.create({
      data: {
        nis: body.nis.trim(),
        nama: body.nama.trim(),
        kelas: body.kelas,
        status: body.status || "Aktif",
        jurnalHariIni: body.jurnal_hari_ini || null,
        fotoJurnal: body.foto_jurnal || null,
      },
    });

    return NextResponse.json({ success: true, data: newSiswa }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}