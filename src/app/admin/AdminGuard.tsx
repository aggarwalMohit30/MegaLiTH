"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      // If not connected, go home
      if (!isConnected || !address) {
        setIsAllowed(false);
        toast.dismiss();
        toast.error("Admin access requires a connected wallet", { id: "admin-connect" });
        return;
      }

      try {
        // Probe the admin endpoint with minimal cost to verify access
        const res = await fetch("/api/admin/dashboard", {
          method: "GET",
          headers: { "x-wallet-address": address },
        });

        if (res.ok) {
          setIsAllowed(true);
          return;
        }

        // 401/403 -> block
        if (res.status === 401 || res.status === 403) {
          setIsAllowed(false);
          toast.dismiss();
          toast.error("Admin access denied for this wallet", { id: "admin-required" });
          return;
        }

        // Other errors -> be conservative and block
        setIsAllowed(false);
        toast.dismiss();
        toast.error("Unable to verify admin access", { id: "admin-verify" });
      } catch {
        setIsAllowed(false);
        toast.dismiss();
        toast.error("Unable to verify admin access", { id: "admin-verify" });
      }
    };

    check();
  }, [address, isConnected]);

  if (isAllowed === null) {
    return <div className="p-6">Checking admin access…</div>;
  }

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}


