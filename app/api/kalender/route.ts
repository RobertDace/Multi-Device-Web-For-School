import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await db.aktivitas.findMany({
      orderBy: { tanggal: 'asc' },
    });

    const formatted = data.map((item) => ({
      id: item.id,
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal.toISOString(),
      deskripsi: item.deskripsi,
      gambar_url: item.gambarUrl,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}