import { NextResponse } from 'next/server';

const defaultSettings = {
  nama_sekolah: 'TK CAHAYA HATI',
  tagline: 'Bermain dan Belajar dengan Riang Gembira',
  email: 'halo@cahayahati.sch.id',
  telepon: '(0541) 555-0123',
  alamat: 'Jl. Pelangi No. 123, Samarinda, Kalimantan Timur',
  tahun_ajaran: '2026/2027',
  pendaftaran_buka: true,
};

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: defaultSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, data: { ...defaultSettings, ...body } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}