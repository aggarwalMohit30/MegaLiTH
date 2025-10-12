import { prisma } from "@/lib/prisma";
import { generateCode } from "@/utils/generateCode";

export async function generateReferral(address: string) {
  const user = await prisma.user.findUnique({
    where: { address },
    include: { progress: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.progress) {
    throw new Error("User progress not initialized");
  }

  // ✅ CHECK: User must complete Twitter and Telegram first
  // Adjust these conditions based on your task completion logic
  const hasCompletedTwitter = user.progress.xState >= 2 && user.progress.xVerified;
  const hasCompletedTelegram = user.progress.tgState >= 1;

  if (!hasCompletedTwitter || !hasCompletedTelegram) {
    throw new Error("Please complete Twitter and Telegram tasks first before generating a referral code");
  }

  // ✅ If referral code already exists, return it
  if (user.progress.referralCode) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/?ref=${user.progress.referralCode}`;
    return {
      referralCode: user.progress.referralCode,
      referralLink,
    };
  }

  // ✅ Generate a unique referral code with retry logic
  let referralCode = "";
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!isUnique && attempts < maxAttempts) {
    referralCode = generateCode();
    attempts++;

    // Ensure code is 6 characters and uppercase
    if (referralCode.length !== 6) {
      continue;
    }

    const existing = await prisma.userProgress.findFirst({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique referral code after multiple attempts. Please try again.");
  }

  // ✅ Normalize code to uppercase before saving
  const normalizedCode = referralCode.toUpperCase();

  // ✅ Save the referral code to DB
  await prisma.userProgress.update({
    where: { userId: user.id },
    data: {
      referralCode: normalizedCode,
      refState: 3, // Mark as having referral code generated
    },
  });

  const baseUrl =  process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const referralLink = `${baseUrl}/?ref=${normalizedCode}`;

  return {
    referralCode: normalizedCode,
    referralLink,
  };
}