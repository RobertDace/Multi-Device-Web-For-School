import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email tidak ditemukan" }, { status: 400 });
    }

    const nama = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Wali Murid";

    let pengguna = await db.pengguna.findUnique({
      where: { email },
    });

    if (!pengguna) {
      pengguna = await db.pengguna.create({
        data: {
          clerkId: user.id,
          email,
          nama,
          levelAkses: "WALI MURID",
          avatarUrl: user.imageUrl || null,
        },
      });
    } else if (!pengguna.clerkId) {
      pengguna = await db.pengguna.update({
        where: { email },
        data: {
          clerkId: user.id,
          avatarUrl: user.imageUrl || pengguna.avatarUrl,
        },
      });
    }

    return NextResponse.json({ success: true, data: pengguna });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}