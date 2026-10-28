import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'tk-cahaya-hati-super-secret-auth-key-2026';

export interface SessionPayload {
  id: string;
  email: string;
  nama: string;
  levelAkses: string;
  avatarUrl?: string | null;
  exp: number;
}

// Hash password menggunakan SHA-256 dengan salt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

// Verifikasi password (mendukung format salt:hash dan plain text fallback untuk seed)
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;

  // Mendukung plain text untuk kemudahan testing awal
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }

  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;

  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
}

// Buat signed session token
export function signSession(user: Omit<SessionPayload, 'exp'>, maxAgeSeconds = 7 * 24 * 60 * 60): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

// Verifikasi signed session token
export function verifySession(token?: string | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [payloadStr, signature] = token.split('.');
  if (!payloadStr || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
    if (!isMatch) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf8')
    );

    // Cek apakah token sudah expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

