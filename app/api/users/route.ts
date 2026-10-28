import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const data = await db.pengguna.findMany({
      include: { siswa: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedData = data.map((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      level_akses: u.levelAkses || "WALI MURID",
      avatar_url: u.avatarUrl || "",
      created_at: u.createdAt.toISOString(),
      nama_anak: u.siswa?.map((s) => s.nama).join(", ") || "-",
      siswa_ids: u.siswa?.map((s) => s.id) || [],
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email.trim().toLowerCase();
    const password = body.password ? String(body.password).trim() : null;
    const nama = body.nama.trim();

    const hashedPassword = password ? hashPassword(password) : null;

    const newUser = await db.pengguna.create({
      data: {
        nama: nama,
        email: email,
        password: hashedPassword,
        levelAkses: body.level_akses || "WALI MURID",
        avatarUrl: body.avatar_url || null,
      },
    });

    if (body.siswa_id) {
      await db.siswa.update({
        where: { id: body.siswa_id },
        data: { waliId: newUser.id },
      });
    }

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
