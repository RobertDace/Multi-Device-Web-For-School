import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// UPDATE AKTIVITAS
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.aktivitas.update({
      where: { id },
      data: {
        judul: body.judul,
        kategori: body.kategori,
        tanggal: body.tanggal ? new Date(body.tanggal) : undefined,
        gambarUrl: body.gambar_url || body.gambarUrl,
        deskripsi: body.deskripsi,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE AKTIVITAS
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aktivitas.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Aktivitas berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}