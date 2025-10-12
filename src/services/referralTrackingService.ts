import { prisma } from "@/lib/prisma";

interface ReferralJoinData {
  newUserAddress: string;
  referralCode: string;
}

export async function trackReferralJoin(data: ReferralJoinData) {
  const { newUserAddress, referralCode } = data;

  // Normalize the referral code
  const normalizedCode = referralCode.toUpperCase().trim();

  // 1️⃣ Find the referrer by code
  const referrerProgress = await prisma.userProgress.findUnique({
    where: { referralCode: normalizedCode },
    include: { user: true },
  });

  if (!referrerProgress) {
    throw new Error("Invalid referral code");
  }

  // 2️⃣ Prevent self-referral
  if (referrerProgress.user.address.toLowerCase() === newUserAddress.toLowerCase()) {
    throw new Error("You cannot use your own referral code");
  }

  // Run inside transaction for data consistency
  const result = await prisma.$transaction(async (tx) => {
    // 3️⃣ Get the new user (must exist at this point)
    const newUser = await tx.user.findUnique({
      where: { address: newUserAddress },
      include: { progress: true },
    });

    if (!newUser) {
      throw new Error("User not found. Please try again.");
    }

    // 4️⃣ Check if user already has a referrer
    const existingReferral = await tx.referral.findFirst({
      where: { userId: newUser.id },
    });

    if (existingReferral) {
      throw new Error("You have already been referred by someone else");
    }

    // 5️⃣ Create the referral record
    const referral = await tx.referral.create({
      data: {
        userId: newUser.id,
        referrerId: referrerProgress.userId,
      },
    });

    // 6️⃣ Optional: Update referrer's refState to show they have referrals
    await tx.userProgress.update({
      where: { userId: referrerProgress.userId },
      data: {
        refState: Math.max(referrerProgress.refState, 3), // Ensure at least state 3
      },
    });

    return { referral, newUser };
  });

  return {
    success: true,
    referral: result.referral,
    referrer: referrerProgress.user.address,
    newUser: result.newUser.address,
  };
}

export async function getUserReferralStats(address: string) {
  const user = await prisma.user.findUnique({
    where: { address },
    include: {
      progress: true,
      referrals: {
        include: {
          referrer: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!user || !user.progress) {
    return null;
  }

  // Get users referred BY this user
  const referredByThisUser = await prisma.referral.findMany({
    where: { referrerId: user.progress.userId },
    include: { user: true },
  });

  // Check if this user was referred by someone
  const referredByUser = user.referrals[0];

  return {
    totalReferrals: referredByThisUser.length,
    referralCode: user.progress.referralCode,
    hasReferrer: !!referredByUser,
    referredBy: referredByUser ? referredByUser.referrer.user.address : null,
    referredUsers: referredByThisUser.map((r) => ({
      address: r.user.address,
      joinedAt: r.createdAt,
    })),
  };
}