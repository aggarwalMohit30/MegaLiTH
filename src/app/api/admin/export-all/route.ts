import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function isAdmin(address: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { address: address.toLowerCase() },
  });
  return !!admin;
}

// Type-safe serializer for BigInt, Date, and nested objects
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

function serializeBigInt<T>(obj: T): JSONValue {
  if (obj === null || obj === undefined) return obj as unknown as JSONValue;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as JSONValue;
  }

  if (typeof obj === "object") {
    const serialized: Record<string, JSONValue> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  return obj as unknown as JSONValue;
}

export async function GET(req: NextRequest) {
  try {
    const address = req.headers.get("x-wallet-address");

    if (!address) {
      return new Response(JSON.stringify({ error: "Wallet address required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hasAccess = await isAdmin(address);
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch ALL data from the database in parallel
    const [allUsers, allUserProgress, allUserBoosts, allReferrals, allAdmins] =
      await Promise.all([
        prisma.user.findMany({
          include: {
            progress: true,
            boost: true,
            referrals: {
              include: {
                referrer: {
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.userProgress.findMany({
          include: {
            user: true,
            referredUsers: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.userBoost.findMany({
          include: { user: true },
          orderBy: { createdAt: "desc" },
        }),

        prisma.referral.findMany({
          include: {
            user: true,
            referrer: {
              include: { user: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.admin.findMany({
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Compute statistics
    const stats = {
      totalUsers: allUsers.length,
      totalUserProgress: allUserProgress.length,
      totalUserBoosts: allUserBoosts.length,
      totalReferrals: allReferrals.length,
      totalAdmins: allAdmins.length,
      usersWithReferralCodes: allUserProgress.filter((p) => p.referralCode).length,
      usersWithTwitter: allUserProgress.filter((p) => p.twitterId).length,
      usersWithTelegram: allUserProgress.filter((p) => p.telegramId).length,
      usersWithBoosts: allUserBoosts.length,
      averageReferralsPerUser:
        allUserProgress.length > 0
          ? (allReferrals.length / allUserProgress.length).toFixed(2)
          : "0",
      exportTimestamp: new Date().toISOString(),
    };

    // Return serialized data and stats
    return Response.json({
      success: true,
      data: {
        users: serializeBigInt(allUsers),
        userProgress: serializeBigInt(allUserProgress),
        userBoosts: serializeBigInt(allUserBoosts),
        referrals: serializeBigInt(allReferrals),
        admins: serializeBigInt(allAdmins),
      },
      stats,
      meta: {
        timestamp: new Date().toISOString(),
        recordCounts: {
          users: allUsers.length,
          userProgress: allUserProgress.length,
          userBoosts: allUserBoosts.length,
          referrals: allReferrals.length,
          admins: allAdmins.length,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Complete Database Export API Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to export database";
    return new Response(
      JSON.stringify({
        error: message,
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
