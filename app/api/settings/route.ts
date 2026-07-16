import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Ambil profil sekolah
export async function GET() {
  const { data, error } = await supabase
    .from('pengaturan_sekolah')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      adminName: data.nama_admin,
      adminEmail: data.email_admin,
      schoolName: data.nama_sekolah,
      address: data.alamat,
      phone: data.telepon,
      accreditation: data.akreditasi,
    }
  });
}

// POST / PUT: Update profil sekolah
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from('pengaturan_sekolah')
      .upsert({
        id: 1,
        nama_admin: body.adminName,
        email_admin: body.adminEmail,
        nama_sekolah: body.schoolName,
        alamat: body.address,
        telepon: body.phone,
        akreditasi: body.accreditation,
      });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Pengaturan sekolah berhasil disimpan' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}