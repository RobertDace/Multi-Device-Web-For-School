import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET: Ambil daftar semua aktivitas (diurutkan dari yang terbaru)
export async function GET() {
  try {
    const data = await db.aktivitas.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedData = data.map((item) => ({
      id: item.id,
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal.toISOString(),
      deskripsi: item.deskripsi,
      gambar_url: item.gambarUrl || "",
      created_at: item.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/aktivitas error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil data aktivitas" },
      { status: 500 }
    );
  }
}

// POST: Tambah data aktivitas baru ke database Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newAktivitas = await db.aktivitas.create({
      data: {
        judul: body.judul,
        kategori: body.kategori,
        tanggal: body.tanggal ? new Date(body.tanggal) : new Date(),
        gambarUrl: body.gambar_url || body.gambarUrl || null,
        deskripsi: body.deskripsi || "",
      },
    });

    const formattedResponse = {
      id: newAktivitas.id,
      judul: newAktivitas.judul,
      kategori: newAktivitas.kategori,
      tanggal: newAktivitas.tanggal.toISOString(),
      deskripsi: newAktivitas.deskripsi,
      gambar_url: newAktivitas.gambarUrl,
      created_at: newAktivitas.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: formattedResponse }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/aktivitas error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Gagal menambah aktivitas" },
      { status: 500 }
    );
  }
}