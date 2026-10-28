import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingUser = await db.pengguna.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    const hashedPassword = body.password ? hashPassword(body.password.trim()) : undefined;

    const updated = await db.pengguna.update({
      where: { id },
      data: {
        nama: body.nama ? body.nama.trim() : undefined,
        email: body.email ? body.email.trim().toLowerCase() : undefined,
        password: hashedPassword,
        levelAkses: body.level_akses,
        avatarUrl: body.avatar_url !== undefined ? body.avatar_url : undefined,
      },
    });

    if (body.siswa_id !== undefined) {
      if (body.siswa_id) {
        await db.siswa.update({
          where: { id: body.siswa_id },
          data: { waliId: id },
        });
      } else if (body.siswa_id === "") {
        await db.siswa.updateMany({
          where: { waliId: id },
          data: { waliId: null },
        });
      }
    }

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

    const existingUser = await db.pengguna.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (
      existingUser.levelAkses === 'MASTER ADMIN' ||
      existingUser.email === 'master@cahayahati.sch.id' ||
      existingUser.email === 'master.cahayahati@gmail.com'
    ) {
      return NextResponse.json(
        { success: false, message: "Akun Master Administrator dilindungi dan tidak dapat dihapus." },
        { status: 403 }
      );
    }

    // Hapus data pengguna di Prisma Database
    await db.pengguna.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
