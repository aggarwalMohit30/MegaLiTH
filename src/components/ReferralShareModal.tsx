"use client";

import { X, Copy } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";

interface ReferralShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  referralLink: string;
}

export default function ReferralShareModal({
  isOpen,
  onClose,
  referralCode,
  referralLink,
}: ReferralShareModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `Join me on this amazing platform! Use my referral code: ${referralCode}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank");
  };

  const handleShareTelegram = () => {
    const text = `Join me on this amazing platform! Use my referral code: ${referralCode}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink
    )}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleShareDiscord = () => {
  const text = `Join me on this amazing platform! Use my referral code: ${referralCode}\n${referralLink}`;
  navigator.clipboard.writeText(text).then(() => {
    setCopiedLink(true);
    window.open("https://discord.com/app", "_blank");
  });
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 rounded-2xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-orange-500/20">
          <h2 className="text-2xl font-bold text-white mb-2">Invite friends</h2>
          <div className="flex items-center gap-2">
            <p className="text-orange-400 text-sm">
              Share and earn rewards together
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-6 flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeCanvas value={referralLink} size={128} />
          </div>
        </div>

        {/* Referral Info */}
        <div className="px-6 pb-6 space-y-4">
          {/* Referral Code */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Referral code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800/50 border border-orange-500/30 rounded-lg px-4 py-3">
                <span className="text-orange-400 font-mono font-semibold">
                  {referralCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                title="Copy code"
              >
                <Copy size={20} className="text-white" />
              </button>
            </div>
            {copiedCode && (
              <p className="text-xs text-green-400 mt-1">Code copied!</p>
            )}
          </div>

          {/* Referral Link */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Referral link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-800/50 border border-orange-500/30 rounded-lg px-4 py-3 overflow-hidden">
                <span className="text-orange-400 font-mono text-sm truncate block">
                  {referralLink}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                title="Copy entire link"
              >
                <Copy size={20} className="text-white" />
              </button>
            </div>
            {copiedLink && (
              <p className="text-xs text-green-400 mt-1">Link copied!</p>
            )}
          </div>

          {/* Share Options */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {/* Twitter */}
            <button
              onClick={handleShareTwitter}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Share on Twitter"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            {/* Telegram */}
            <button
              onClick={handleShareTelegram}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Share on Telegram"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
            </button>

            {/* Discord */}
            <button
              onClick={handleShareDiscord}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Share on Discord"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 640 640"
              >
                <path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
