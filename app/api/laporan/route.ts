import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { db } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const data = await db.laporanKegiatan.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = data.map((item) => {
      const activities = Array.isArray(item.dataJson) ? item.dataJson : [];
      return {
        id: item.id,
        judul: item.judul,
        subjudul: item.subjudul || '',
        activityCount: activities.length,
        dataJson: activities,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error GET /api/laporan:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const judul = (body.judul || 'LAPORAN DOKUMENTASI KEGIATAN').trim();
    const subjudul = (body.subjudul || '').trim();
    const activities = Array.isArray(body.activities) ? body.activities : [];

    const newReport = await db.laporanKegiatan.create({
      data: {
        judul,
        subjudul,
        dataJson: activities,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Laporan kegiatan berhasil disimpan ke database!',
        data: {
          id: newReport.id,
          judul: newReport.judul,
          subjudul: newReport.subjudul,
          updatedAt: newReport.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error POST /api/laporan:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

