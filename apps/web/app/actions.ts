"use server";
import { prisma } from "@repo/db";

export async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: `test${Math.random()}@example.com`,
      name: "Test User",
    },
  });
  console.log("Created user:", user);
  return user;
}
