import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Ambil daftar rapor semua siswa
export async function GET() {
  const { data, error } = await supabase
    .from('rapor')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  const formattedData = data.map((r) => ({
    id: r.nis,
    name: r.nama_siswa,
    class: r.kelas,
    status: r.status,
    lastUpdate: new Date(r.created_at).toLocaleDateString('id-ID'),
  }));

  return NextResponse.json({ success: true, data: formattedData }, { status: 200 });
}

// PUT: Update status terbit rapor
export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    const { error } = await supabase
      .from('rapor')
      .update({ status })
      .eq('nis', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Status rapor berhasil diperbarui' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui rapor' }, { status: 500 });
  }
}