import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.pengguna.update({
      where: { id },
      data: {
        nama: body.nama ? body.nama.trim() : undefined,
        email: body.email ? body.email.trim().toLowerCase() : undefined,
        levelAkses: body.level_akses,
        avatarUrl: body.avatar_url !== undefined ? body.avatar_url : undefined,
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
    await db.pengguna.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}