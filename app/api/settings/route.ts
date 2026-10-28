import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/current-user';

const defaultSettings = {
  nama_sekolah: 'TK CAHAYA HATI',
  npsn: '69974201',
  tagline: 'Bermain dan Belajar dengan Riang Gembira',
  email: 'halo@cahayahati.sch.id',
  telepon: '(0541) 555-0123',
  alamat: 'Jl. Pelangi No. 123, Samarinda, Kalimantan Timur',
  tahun_ajaran: '2026/2027',
  pendaftaran_buka: true,
};

export async function GET() {
  try {
    let settings = await db.pengaturan.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await db.pengaturan.create({
        data: {
          id: 'default',
          namaSekolah: defaultSettings.nama_sekolah,
          npsn: defaultSettings.npsn,
          tagline: defaultSettings.tagline,
          email: defaultSettings.email,
          telepon: defaultSettings.telepon,
          alamat: defaultSettings.alamat,
          tahunAjaran: defaultSettings.tahun_ajaran,
          pendaftaranBuka: defaultSettings.pendaftaran_buka,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: settings.namaSekolah,
        npsn: settings.npsn,
        tagline: settings.tagline,
        email: settings.email,
        telepon: settings.telepon,
        alamat: settings.alamat,
        tahun_ajaran: settings.tahunAjaran,
        pendaftaran_buka: settings.pendaftaranBuka,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Hanya Guru & Admin yang dapat mengubah pengaturan.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updated = await db.pengaturan.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        namaSekolah: body.nama_sekolah || defaultSettings.nama_sekolah,
        npsn: body.npsn || defaultSettings.npsn,
        tagline: body.tagline || defaultSettings.tagline,
        email: body.email || defaultSettings.email,
        telepon: body.telepon || defaultSettings.telepon,
        alamat: body.alamat || defaultSettings.alamat,
        tahunAjaran: body.tahun_ajaran || defaultSettings.tahun_ajaran,
        pendaftaranBuka: body.pendaftaran_buka !== undefined ? body.pendaftaran_buka : defaultSettings.pendaftaran_buka,
      },
      update: {
        namaSekolah: body.nama_sekolah,
        npsn: body.npsn,
        tagline: body.tagline,
        email: body.email,
        telepon: body.telepon,
        alamat: body.alamat,
        tahunAjaran: body.tahun_ajaran,
        pendaftaranBuka: body.pendaftaran_buka,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        nama_sekolah: updated.namaSekolah,
        npsn: updated.npsn,
        tagline: updated.tagline,
        email: updated.email,
        telepon: updated.telepon,
        alamat: updated.alamat,
        tahun_ajaran: updated.tahunAjaran,
        pendaftaran_buka: updated.pendaftaranBuka,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
