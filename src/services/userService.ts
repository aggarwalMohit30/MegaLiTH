import { prisma } from "@/lib/prisma";

export async function getUserByAddress(address: string) {
  const user = await prisma.user.findUnique({ 
    where: { address }, 
    include: { 
      progress: true,
      referrals: {
        include: {
          referrer: {
            include: { user: true }
          }
        }
      }
    } 
  });

  if (!user) return null;

  // Check if user has been referred
  const hasReferrer = user.referrals.length > 0;
  const referredBy = hasReferrer ? user.referrals[0].referrer.user.address : null;

  return {
    ...user,
    hasReferrer,
    referredBy,
  };
}

export async function createOrGetUser(address: string) {
  // First try to get existing user
  const existing = await getUserByAddress(address);
  if (existing) {
    return existing;
  }

  // Create new user with progress (NO referral code yet)
  const newUser = await prisma.user.create({
    data: {
      address,
      progress: {
        create: {
          xState: 1,
          xVerified: false,
          tgState: 0,
          refState: 0, // Start at 0, will be updated after tasks
        }
      }
    },
    include: { 
      progress: true,
      referrals: {
        include: {
          referrer: {
            include: { user: true }
          }
        }
      }
    }
  });

  return {
    ...newUser,
    hasReferrer: false,
    referredBy: null,
  };
}