import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('aktivitas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('aktivitas')
      .insert([
        {
          judul: body.judul,
          kategori: body.kategori,
          tanggal: body.tanggal,
          gambar_url: body.gambar_url,
          deskripsi: body.deskripsi,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal menambah aktivitas' }, { status: 500 });
  }
}