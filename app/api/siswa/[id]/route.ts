import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.siswa.update({
      where: { id },
      data: {
        nis: body.nis ? body.nis.trim() : undefined,
        nama: body.nama ? body.nama.trim() : undefined,
        kelas: body.kelas,
        status: body.status,
        jurnalHariIni: body.jurnal_hari_ini !== undefined ? body.jurnal_hari_ini : undefined,
        fotoJurnal: body.foto_jurnal !== undefined ? body.foto_jurnal : undefined,
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
    await db.siswa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Data murid berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}