import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Ambil semua data siswa dari database Supabase
export async function GET() {
  const { data, error } = await supabase
    .from('siswa')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  // Formatting field agar sesuai dengan tampilan frontend
  const formattedData = data.map((s) => ({
    id: s.nis,
    name: s.nama,
    class: s.kelas,
    status: s.status,
    guardian: s.nama_wali,
    phone: s.telepon_wali,
  }));

  return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
}

// POST: Tambah siswa baru langsung ke database Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newNis = `TKC-2026-${Math.floor(100 + Math.random() * 900)}`;

    const { data, error } = await supabase
      .from('siswa')
      .insert([
        {
          nis: newNis,
          nama: body.name,
          kelas: body.class || 'Tiger Class (A)',
          status: 'Active',
          nama_wali: body.guardian || 'Orang Tua',
          telepon_wali: body.phone || '-',
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Siswa berhasil ditambahkan', data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memproses data' }, { status: 500 });
  }
}