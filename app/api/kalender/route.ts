import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('kalender')
    .select('*')
    .order('tanggal', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('kalender')
      .insert([
        {
          judul: body.judul,
          tanggal: body.tanggal,
          kategori: body.kategori || 'Acara',
          keterangan: body.keterangan || '',
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Gagal menambah acara' }, { status: 500 });
  }
}