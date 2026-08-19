import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const nama =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    clerkUser.username ||
    "Pengguna";

  // Upsert: Simpan jika belum ada, atau update jika sudah terdaftar
  const user = await db.pengguna.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      nama,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      nama,
      role: "WALI_MURID",
    },
  });

  return user;
}