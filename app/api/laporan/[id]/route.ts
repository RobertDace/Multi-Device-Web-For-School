import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/current-user';
import { db } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const report = await db.laporanKegiatan.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hanya pemilik akun atau Master Admin yang boleh mengakses
    const isOwner = report.userId === user.id;
    const isMaster = (user.levelAkses || '').toUpperCase().includes('MASTER');
    if (!isOwner && !isMaster) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: report.id,
        judul: report.judul,
        subjudul: report.subjudul || '',
        dataJson: Array.isArray(report.dataJson) ? report.dataJson : [],
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await db.laporanKegiatan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    const isOwner = existing.userId === user.id;
    const isMaster = (user.levelAkses || '').toUpperCase().includes('MASTER');
    if (!isOwner && !isMaster) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await db.laporanKegiatan.update({
      where: { id },
      data: {
        judul: body.judul !== undefined ? String(body.judul).trim() : undefined,
        subjudul: body.subjudul !== undefined ? String(body.subjudul).trim() : undefined,
        dataJson: Array.isArray(body.activities) ? body.activities : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan kegiatan di database berhasil diperbarui!',
      data: {
        id: updated.id,
        judul: updated.judul,
        subjudul: updated.subjudul,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await db.laporanKegiatan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    const isOwner = existing.userId === user.id;
    const isMaster = (user.levelAkses || '').toUpperCase().includes('MASTER');
    if (!isOwner && !isMaster) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    await db.laporanKegiatan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Laporan kegiatan berhasil dihapus dari database.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

