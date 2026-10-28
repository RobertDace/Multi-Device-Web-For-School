const fs = require('fs');
const https = require('https');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
});

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function createClerkUser(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.clerk.com',
      port: 443,
      path: '/v1/users',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function seed() {
  console.log('--- 1. Creating Wali in Clerk ---');
  let waliClerkId = '';
  const waliRes = await createClerkUser({
    email_address: ['wali.cahayahati@gmail.com'],
    password: 'PasswordWali2026!',
    first_name: 'Bunda',
    last_name: 'Aisyah Putri'
  });
  if (waliRes.status === 200) {
    waliClerkId = waliRes.body.id;
    console.log('Created Wali Clerk ID:', waliClerkId);
  } else {
    console.log('Wali creation response status:', waliRes.status);
    // If user already exists in Clerk, find their ID
    if (waliRes.body?.errors?.[0]?.message?.includes('already exists') || waliRes.status === 422) {
      console.log('Looking up existing wali in Clerk...');
      const lookupRes = await new Promise((res) => {
        https.get('https://api.clerk.com/v1/users?email_address=wali.cahayahati@gmail.com', {
          headers: { 'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY }
        }, (r) => {
          let b = '';
          r.on('data', c => b += c);
          r.on('end', () => res(JSON.parse(b)));
        });
      });
      if (Array.isArray(lookupRes) && lookupRes[0]) {
        waliClerkId = lookupRes[0].id;
        console.log('Found existing Wali Clerk ID:', waliClerkId);
      }
    }
  }

  console.log('--- 2. Upserting Users in Database ---');
  // Guru User
  const guruUser = await prisma.pengguna.upsert({
    where: { email: 'guru.cahayahati@gmail.com' },
    update: {
      nama: 'Ibu Guru Siti Rahmah',
      levelAkses: 'GURU & ADMIN',
      clerkId: 'user_3LIw2Uo91FRpeQAHm9F32gs1ULn'
    },
    create: {
      email: 'guru.cahayahati@gmail.com',
      nama: 'Ibu Guru Siti Rahmah',
      levelAkses: 'GURU & ADMIN',
      clerkId: 'user_3LIw2Uo91FRpeQAHm9F32gs1ULn'
    }
  });
  console.log('Guru in DB:', guruUser.email, guruUser.levelAkses);

  // Wali User
  const waliUser = await prisma.pengguna.upsert({
    where: { email: 'wali.cahayahati@gmail.com' },
    update: {
      nama: 'Bunda Aisyah Putri',
      levelAkses: 'WALI MURID',
      clerkId: waliClerkId || undefined
    },
    create: {
      email: 'wali.cahayahati@gmail.com',
      nama: 'Bunda Aisyah Putri',
      levelAkses: 'WALI MURID',
      clerkId: waliClerkId || null
    }
  });
  console.log('Wali in DB:', waliUser.email, waliUser.levelAkses);

  console.log('--- 3. Creating Dummy Students ---');
  const siswa1 = await prisma.siswa.upsert({
    where: { nis: '20260101' },
    update: {
      nama: 'Muhammad Rizky Pratama',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Aktif',
      waliId: waliUser.id,
      jurnalHariIni: 'Hari ini ananda Rizky sangat aktif bermain balok susun dan belajar mengenal huruf vokal A, I, U, E, O.',
      fotoJurnal: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'
    },
    create: {
      nis: '20260101',
      nama: 'Muhammad Rizky Pratama',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Aktif',
      waliId: waliUser.id,
      jurnalHariIni: 'Hari ini ananda Rizky sangat aktif bermain balok susun dan belajar mengenal huruf vokal A, I, U, E, O.',
      fotoJurnal: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=600&q=80'
    }
  });

  const siswa2 = await prisma.siswa.upsert({
    where: { nis: '20260102' },
    update: {
      nama: 'Ahmad Faris Al-Fatih',
      kelas: 'Kelompok B (Matahari)',
      status: 'Aktif',
      jurnalHariIni: 'Belajar berhitung 1-10 menggunakan kancing warna-warni dan bernyanyi bersama.'
    },
    create: {
      nis: '20260102',
      nama: 'Ahmad Faris Al-Fatih',
      kelas: 'Kelompok B (Matahari)',
      status: 'Aktif',
      jurnalHariIni: 'Belajar berhitung 1-10 menggunakan kancing warna-warni dan bernyanyi bersama.'
    }
  });

  const siswa3 = await prisma.siswa.upsert({
    where: { nis: '20260103' },
    update: {
      nama: 'Siti Humaira Khadijah',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Aktif',
      waliId: waliUser.id,
      jurnalHariIni: 'Mewarnai gambar kupu-kupu dengan paduan warna cerah dan rapi.'
    },
    create: {
      nis: '20260103',
      nama: 'Siti Humaira Khadijah',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Aktif',
      waliId: waliUser.id,
      jurnalHariIni: 'Mewarnai gambar kupu-kupu dengan paduan warna cerah dan rapi.'
    }
  });

  console.log('Siswa created/linked:', [siswa1.nama, siswa2.nama, siswa3.nama]);

  console.log('--- 4. Creating Dummy Rapor ---');
  await prisma.rapor.upsert({
    where: { id: 'rapor-rizky-2026' },
    update: {
      nis: '20260101',
      namaSiswa: 'Muhammad Rizky Pratama',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Published',
      softSkillsScore: 3.8,
      softSkillsDesc: 'Ananda Rizky menunjukkan sikap empati yang luar biasa, terbiasa mencuci tangan sebelum makan, dan mandiri merapikan mainan.',
      academicScore: 2.9,
      academicDesc: 'Mampu mengenal angka 1-10, menyebutkan warna primer & sekunder, serta aktif saat kegiatan hafalan surat pendek.',
      hadir: 22,
      izin: 1,
      alfa: 0,
      catatanGuru: 'Alhamdulillah ananda Rizky mengalami perkembangan yang sangat membanggakan di semester ini. Pertahankan ya nak!',
      siswaId: siswa1.id
    },
    create: {
      id: 'rapor-rizky-2026',
      nis: '20260101',
      namaSiswa: 'Muhammad Rizky Pratama',
      kelas: 'Kelompok A (Bintang Kecil)',
      status: 'Published',
      softSkillsScore: 3.8,
      softSkillsDesc: 'Ananda Rizky menunjukkan sikap empati yang luar biasa, terbiasa mencuci tangan sebelum makan, dan mandiri merapikan mainan.',
      academicScore: 2.9,
      academicDesc: 'Mampu mengenal angka 1-10, menyebutkan warna primer & sekunder, serta aktif saat kegiatan hafalan surat pendek.',
      hadir: 22,
      izin: 1,
      alfa: 0,
      catatanGuru: 'Alhamdulillah ananda Rizky mengalami perkembangan yang sangat membanggakan di semester ini. Pertahankan ya nak!',
      siswaId: siswa1.id
    }
  });

  console.log('--- 5. Creating Activities & Calendar ---');
  const activities = [
    {
      id: 'akt-1',
      judul: 'Pentas Seni dan Kreativitas Cilik TK Cahaya Hati',
      kategori: 'Kegiatan',
      tanggal: new Date('2026-11-05T08:00:00Z'),
      deskripsi: 'Penampilan tari daerah, gerak dan lagu, serta pameran hasil karya seni lukis anak didik menyambut tengah semester ganjil.',
      gambarUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'akt-2',
      judul: 'Field Trip Edukasi: Mengenal Flora & Fauna di Kebun Raya',
      kategori: 'Kegiatan',
      tanggal: new Date('2026-11-12T08:00:00Z'),
      deskripsi: 'Kegiatan outing class seru untuk mengenalkan aneka ragam tanaman hias, satwa jinak, dan belajar mencintai alam sekitar.',
      gambarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'akt-3',
      judul: 'Pemeriksaan Kesehatan Gigi & Tumbuh Kembang Bersama Puskesmas',
      kategori: 'Pengumuman',
      tanggal: new Date('2026-11-20T08:00:00Z'),
      deskripsi: 'Pemeriksaan berkala kesehatan gigi, penimbangan berat badan, dan pengukuran tinggi badan anak didik oleh tim dokter puskesmas.',
      gambarUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const akt of activities) {
    await prisma.aktivitas.upsert({
      where: { id: akt.id },
      update: akt,
      create: akt
    });
  }

  console.log('SUCCESS_ALL_SEEDED');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  pool.end();
});
