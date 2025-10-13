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
  const [refCodeFromURL, setRefCodeFromURL] = useState<string | null>(null);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    id: string;
    address: string;
    progress?: {
      referralCode?: string | null;
      xState: number;
      xVerified: boolean;
      tgState: number;
      refState: number;
    } | null;
    hasReferrer?: boolean;
    referredBy?: string | null;
  } | null>(null);

  // ✅ Capture ref code from URL on mount and store in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    
    if (ref) {
      console.log("Referral code found in URL:", ref);
      // Store in sessionStorage for persistence
      sessionStorage.setItem("pendingReferralCode", ref);
      setRefCodeFromURL(ref);
      
      // Clear URL parameter immediately to prevent issues
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("ref");
      window.history.replaceState({}, "", newUrl.toString());
    } else {
      // Check if there's a pending referral code in session
      const storedRef = sessionStorage.getItem("pendingReferralCode");
      if (storedRef) {
        console.log("Referral code found in session:", storedRef);
        setRefCodeFromURL(storedRef);
      }
    }
  }, []);

  // ✅ Initialize or fetch user
  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
      return;
    }

    if (!didInitRef.current && isFetched) {
      didInitRef.current = true;
      
      const initializeUser = async () => {
        try {
          const response = await fetch(`/api/user?address=${address}`);
          const existing = response.ok ? await response.json() : null;

          if (existing?.id) {
            // Existing user
            console.log("Existing user loaded:", existing);
            setUserData(existing);
            setUserReferralCode(existing.progress?.referralCode || null);
            
            if (existing.progress?.referralCode) {
              const refLink = `${window.location.origin}/?ref=${existing.progress.referralCode}`;
              setReferralLink(refLink);
            }

            setUserReady(true);

            // Calculate boost silently
            try {
              await fetch("/api/boost/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address }),
              });
            } catch (error) {
              console.error("Failed to calculate boost", error);
            }
          } else {
            // Create new user WITHOUT referral code
            console.log("Creating new user without referral code");
            const createResponse = await fetch("/api/user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address }),
            });

            if (createResponse.ok) {
              const newUser = await createResponse.json();
              console.log("New user created:", newUser);
              setUserData(newUser);
              setUserReferralCode(null);
              setUserReady(true);

              // Calculate boost
              try {
                await fetch("/api/boost/calculate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ address }),
                });
              } catch (error) {
                console.error("Failed to calculate boost", error);
              }
            }
          }
        } catch (error) {
          console.error("Failed to initialize user", error);
          setError("Failed to initialize user. Please refresh the page.");
        }
      };

      initializeUser();
    }
  }, [isConnected, router, isFetched, address]);

  // ✅ Show referral modal after user is ready - with session support
  useEffect(() => {
    if (!userReady || !refCodeFromURL || !userData) {
      return;
    }

    console.log("Checking referral eligibility with userData:", userData);

    // Prevent self-referral
    if (userData.progress?.referralCode === refCodeFromURL) {
      console.log("Self-referral detected");
      setError("You cannot use your own referral code");
      setRefCodeFromURL(null);
      sessionStorage.removeItem("pendingReferralCode");
      return;
    }

    // Check if user already has a referrer
    if (userData.hasReferrer) {
      console.log("User already has a referrer");
      setError("You have already been referred by someone else");
      setRefCodeFromURL(null);
      sessionStorage.removeItem("pendingReferralCode");
      return;
    }

    // All checks passed - show modal
    console.log("Showing referral modal for code:", refCodeFromURL);
    setShowReferralModal(true);
  }, [userReady, refCodeFromURL, userData]);

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
        body: JSON.stringify({ 
          newUserAddress: address, 
          referralCode: code.toUpperCase() 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to redeem referral code");
      }

      // Clear session storage on success
      sessionStorage.removeItem("pendingReferralCode");
      setShowReferralModal(false);
      setRefCodeFromURL(null);
      
      // Show success message
      setTimeout(() => {
        alert("Referral code redeemed successfully! 🎉");
        // Refresh user data
        window.location.reload();
      }, 100);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to redeem referral code";
      setError(errorMessage);
      console.error("Referral error:", err);
      throw err;
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCloseReferralModal = () => {
    setShowReferralModal(false);
    setRefCodeFromURL(null);
    // Clear session storage when user dismisses modal
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
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              Dismiss
            </button>
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