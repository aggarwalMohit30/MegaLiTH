"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";

interface ReferralSectionProps {
  referralCode: string | null;
  referralLink: string | null;
  onOpenShareModal: () => void;
}

export default function ReferralSection({
  referralCode,
  referralLink,
  onOpenShareModal,
}: ReferralSectionProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!referralCode || !referralLink) {
    return null;
  }

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-white mb-4">
        Invite Friends & Earn
      </h3>
      
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 rounded-2xl p-6 shadow-xl">
        <div className="space-y-4">
          {/* Referral Code */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Referral code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-orange-500/20 rounded-lg px-4 py-3">
                <span className="text-orange-400 font-mono font-semibold text-lg">
                  {referralCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all hover:scale-105"
                title="Copy code"
              >
                <Copy size={20} className="text-white" />
              </button>
            </div>
            {copiedCode && (
              <p className="text-xs text-green-400 mt-1 animate-fade-in">
                ✓ Code copied to clipboard!
              </p>
            )}
          </div>

          {/* Referral Link */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Referral link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-orange-500/20 rounded-lg px-4 py-3 overflow-hidden">
                <span className="text-orange-400/80 font-mono text-sm truncate block">
                  {referralLink}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-all hover:scale-105"
                title="Copy link"
              >
                <Copy size={20} className="text-white" />
              </button>
            </div>
            {copiedLink && (
              <p className="text-xs text-green-400 mt-1 animate-fade-in">
                ✓ Link copied to clipboard!
              </p>
            )}
          </div>

          {/* Invite Button */}
          <button
            onClick={onOpenShareModal}
            className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <Share2 size={20} />
            Invite friends
          </button>
        </div>
      </div>
    </div>
  );
}