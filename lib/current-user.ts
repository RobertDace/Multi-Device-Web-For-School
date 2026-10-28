import { cookies } from "next/headers";
import { db } from "@/lib/prisma";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const session = verifySession(sessionToken);
    if (!session) {
      return null;
    }

    // Ambil data user terbaru dari database
    const profile = await db.pengguna.findUnique({
      where: { id: session.id },
    });

    return profile;
  } catch (err) {
    console.error("Gagal mengambil session pengguna:", err);
    return null;
  }
}

export async function requireAdmin() {
  const profile = await getCurrentUser();
  if (!profile) {
    return null;
  }
  const role = (profile.levelAkses || "").toUpperCase();
  if (role.includes("GURU") || role.includes("ADMIN")) {
    return profile;
  }
  return null;
}
