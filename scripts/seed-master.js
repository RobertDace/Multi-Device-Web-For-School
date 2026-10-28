const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = hashPassword('MasterCahaya2026!');

    const masterAccounts = [
      {
        nama: 'Master Administrator TK',
        email: 'master@cahayahati.sch.id',
        password: passwordHash,
        levelAkses: 'MASTER ADMIN',
      },
      {
        nama: 'Master Administrator TK',
        email: 'master.cahayahati@gmail.com',
        password: passwordHash,
        levelAkses: 'MASTER ADMIN',
      },
    ];

    for (const acc of masterAccounts) {
      const user = await prisma.pengguna.upsert({
        where: { email: acc.email },
        update: {
          nama: acc.nama,
          password: acc.password,
          levelAkses: acc.levelAkses,
        },
        create: acc,
      });
      console.log(`Master account ready: ${user.email} (${user.levelAkses}) - ID: ${user.id}`);
    }

    console.log('Seeding master accounts completed successfully!');
  } catch (err) {
    console.error('Error seeding master:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

