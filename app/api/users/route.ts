import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

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
    const password = body.password;
    const nama = body.nama.trim();

    let clerkId: string | null = null;

    // Jika password diisi, daftarkan akun ke Clerk Auth
    if (password) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.createUser({
          emailAddress: [email],
          password: password,
          firstName: nama.split(" ")[0],
          lastName: nama.split(" ").slice(1).join(" ") || undefined,
        });
        clerkId = clerkUser.id;
      } catch (clerkErr: any) {
        const errorMessage = clerkErr.errors?.[0]?.longMessage || clerkErr.errors?.[0]?.message || clerkErr.message;
        return NextResponse.json({ success: false, message: `Clerk: ${errorMessage}` }, { status: 400 });
      }
    }

    const newUser = await db.pengguna.create({
      data: {
        nama: nama,
        email: email,
        levelAkses: body.level_akses || "WALI MURID",
        avatarUrl: body.avatar_url || null,
        clerkId: clerkId,
      },
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}