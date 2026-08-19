import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function getCurrentUser() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

  if (!email) {
    return null;
  }

  let profile = await db.pengguna.findUnique({
    where: { email },
  });

  if (!profile) {
    const nama = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Pengguna";
    profile = await db.pengguna.create({
      data: {
        clerkId: user.id,
        email,
        nama,
        levelAkses: "WALI MURID",
        avatarUrl: user.imageUrl || null,
      },
    });
  } else if (!profile.clerkId) {
    profile = await db.pengguna.update({
      where: { email },
      data: {
        clerkId: user.id,
        avatarUrl: user.imageUrl || profile.avatarUrl,
      },
    });
  }

  return profile;
}