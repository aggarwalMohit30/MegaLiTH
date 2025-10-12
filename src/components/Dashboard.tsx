"use client";

import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// import KiltBalance from "@/components/KiltBalance";
import { useProgress } from "@/hooks/useProgress";
import { useBoost } from "@/hooks/useBoost";
import ReferralInviteModal from "@/components/InviteRefferalModal";
import TaskButtons from "@/app/dashboard/TaskButtons";
import Image from "next/image";
import ReferralShareModal from "./ReferralShareModal";
import ReferralSection from "./ReferralSection";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isFetched } = useProgress();
  const { data: boostData, calculateBoost, isCalculating } = useBoost();
  const didInitRef = useRef(false);
  const [userReady, setUserReady] = useState(false);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasProcessedReferral, setHasProcessedReferral] = useState(false);
  const [refCodeFromURL, setRefCodeFromURL] = useState<string | null>(null);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Capture and persist ref code from URL (before wallet connection)
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCodeFromURL(ref);
      // Store in sessionStorage to persist across page reloads
      sessionStorage.setItem("pendingReferralCode", ref);
    } else {
      // Check if there's a pending referral code
      const pending = sessionStorage.getItem("pendingReferralCode");
      if (pending) {
        setRefCodeFromURL(pending);
      }
    }
  }, [searchParams]);

  // ✅ Show referral modal when conditions are met
  useEffect(() => {
    // Only show modal if:
    // 1. Wallet is connected
    // 2. There's a ref code from URL
    // 3. Hasn't been processed yet
    // 4. User data is ready
    // 5. User's own referral code is loaded (to prevent self-referral check)
    if (
      isConnected &&
      refCodeFromURL &&
      !hasProcessedReferral &&
      userReady &&
      userReferralCode !== undefined
    ) {
      // ✅ Prevent self-referral
      if (refCodeFromURL === userReferralCode) {
        setError("You cannot use your own referral code");
        setHasProcessedReferral(true);
        sessionStorage.removeItem("pendingReferralCode");
        return;
      }

      setShowReferralModal(true);
    }
  }, [
    isConnected,
    refCodeFromURL,
    hasProcessedReferral,
    userReady,
    userReferralCode,
  ]);

  // Fetch or create user
  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
      return;
    }

    if (!didInitRef.current && isFetched) {
      didInitRef.current = true;
      fetch(`/api/user?address=${address}`)
        .then(async (r) => (r.ok ? r.json() : null))
        .then(async (existing) => {
          if (existing?.id) {
            setUserReady(true);
            if (existing.progress?.referralCode) {
              const refLink = `${window.location.origin}/?ref=${existing.progress.referralCode}`;
              setReferralLink(refLink);
              setUserReferralCode(existing.progress.referralCode);
            }
            // Silently compute and store boost on login
            try {
              await fetch("/api/boost/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
              });
            } catch (error) {
              console.error("Failed to calculate boost after login", {
                address,
                error,
              });
            }
            return;
          }

          // Create new user
          const r = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
          });

          if (r.ok) {
            const newUser = await r.json();
            setUserReady(true);

            // Set the new user's referral code
            if (newUser.progress?.referralCode) {
              const refLink = `${window.location.origin}/?ref=${newUser.progress.referralCode}`;
              setReferralLink(refLink);
              setUserReferralCode(newUser.progress.referralCode);
            }

            // After creating user, compute and store boost
            try {
              await fetch("/api/boost/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
              });
            } catch (error) {
              console.error("Failed to calculate boost after user creation", {
                address,
                error,
              });
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch or create user", { address, error });
        });
    }
  }, [isConnected, router, isFetched, data, address]);

  const handleRedeemReferral = async (code: string) => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    setIsRedeeming(true);
    setError(null);

    try {
      const response = await fetch("/api/referral/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUserAddress: address, referralCode: code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to redeem referral code");
      }

      // ✅ Success - clean up and close modal
      setHasProcessedReferral(true);
      setShowReferralModal(false);
      sessionStorage.removeItem("pendingReferralCode");

      // Optional: Show success message
      alert("Referral code redeemed successfully! 🎉");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to redeem referral code";
      setError(errorMessage);
      console.error("Referral error:", err);
      throw err; // Re-throw to let modal handle it
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCloseReferralModal = () => {
    setShowReferralModal(false);
    setHasProcessedReferral(true);
    sessionStorage.removeItem("pendingReferralCode");
  };

  return (
    <>
      <ReferralInviteModal
        isOpen={showReferralModal}
        onClose={handleCloseReferralModal}
        onRedeem={handleRedeemReferral}
        initialCode={refCodeFromURL || ""}
      />

      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="max-w-6xl mx-auto mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center max-w-6xl mx-auto"></div>

        <div className="max-w-6xl mx-auto grid gap-8">
          <section>
            <h2 className="heading text-2xl font-semibold">Holder Boost</h2>
            <div className="mt-4 p-6 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-900/20 dark:to-blue-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Boost Tokens
                  </h3>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center justify-center">
                      <Image src="/assets/BNB Logo.png" alt="BNB" width={40} height={40} className="w-10 h-10" />
                    </div>
                    <div className="flex items-center justify-center">
                      <Image src="/assets/ASTER Logo.png" alt="ASTER" width={40} height={40} className="w-10 h-10" />
                    </div>
                    <div className="flex items-center justify-center">
                      <Image src="/assets/kilt-logo.png" alt="KILT" width={40} height={40} className="w-10 h-10" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hold these tokens to get boost multipliers
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold flex items-center">
                    {boostData?.boostCoefficient &&
                    boostData.boostCoefficient > 1.0 ? (
                      <>
                        <span className="mr-2">✅</span>
                        <span className="text-green-600 dark:text-green-400">
                          Boost tokens detected
                        </span>
                      </>
                    ) : boostData?.hasBnbTokens ||
                      boostData?.hasAsterTokens ||
                      boostData?.hasKiltTokens ? (
                      <>
                        <span className="mr-2">⚠️</span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Tokens held, below minimum
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-2">❌</span>
                        <span className="text-red-600 dark:text-red-400">
                          No boost tokens
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={calculateBoost}
                    disabled={isCalculating}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 disabled:opacity-50"
                  >
                    {isCalculating ? "Checking..." : "Check Boost"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="heading text-2xl font-semibold">Genesis Drop</h2>
            <TaskButtons
              disabled={!userReady}
              setReferralLink={setReferralLink}
            />

            {referralLink && userReferralCode && (
              <>
                <ReferralSection
                  referralCode={userReferralCode}
                  referralLink={referralLink}
                  onOpenShareModal={() => setShowShareModal(true)}
                />
                
                <ReferralShareModal
                  isOpen={showShareModal}
                  onClose={() => setShowShareModal(false)}
                  referralCode={userReferralCode}
                  referralLink={referralLink}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
