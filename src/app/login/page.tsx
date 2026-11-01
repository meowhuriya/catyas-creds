"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/lib/repository";
import { LogoMark } from "@/components/brand/logo";
import { ShieldCheck, Copy, Check, AlertCircle, Compass, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, isRealMode, firebaseUser, authLoading } = useDataStore();

  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isInAppBrowser, setIsInAppBrowser] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (!authLoading && firebaseUser) {
      router.push("/");
    }
  }, [authLoading, firebaseUser, router]);

  // Detect in-app browsers (WhatsApp, Instagram, FB, Telegram, Line, WeChat)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
      const isEmbedded = /FBAN|FBAV|Instagram|WhatsApp|Telegram|Line\/|MicroMessenger/i.test(ua);
      setIsInAppBrowser(isEmbedded);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      const code = err?.code;
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";

      if (code === "auth/popup-blocked") {
        setErrorMessage("The sign-in popup was blocked by your browser. Please allow popups for this site or refresh to try redirect sign-in.");
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMessage("The sign-in window was closed before completion. Please click Continue with Google to try again.");
      } else if (code === "auth/network-request-failed") {
        setErrorMessage("Network connection error. Please check your internet connection.");
      } else if (code === "auth/unauthorized-domain") {
        setErrorMessage(
          `Domain "${currentHost}" is not authorized in Firebase. Please add "${currentHost}" to Firebase Console > Authentication > Settings > Authorized domains.`
        );
      } else if (code === "auth/cancelled-popup-request") {
        // Ignored duplicate click
      } else {
        setErrorMessage(err?.message || "Sign-in could not be completed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 select-none">
      {/* Centred Solid Cream Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-2xl text-center space-y-6">
        {/* In-App Browser Detection Banner */}
        {isInAppBrowser && (
          <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-left text-xs space-y-2">
            <div className="flex items-start gap-2">
              <Compass className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300 mt-0.5" />
              <p className="leading-snug">
                You are viewing this inside an in-app browser. Google sign-in may be blocked here. Please open this page in <strong>Chrome</strong> or <strong>Safari</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-medium transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Link copied!" : "Copy page link"}</span>
            </button>
          </div>
        )}

        {/* Cat Sticker Logo */}
        <div className="flex justify-center">
          <LogoMark size={76} />
        </div>

        {/* Brand Headings */}
        <div className="space-y-1.5">
          <span className="eyebrow-label text-[#8A1627] dark:text-[#F07B88] block">
            Academic Portal & Degree Tracker
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#14161F] dark:text-[#F6EBD3]">
            Valeria&apos;s Creds
          </h1>
          <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] max-w-xs mx-auto leading-relaxed mt-2">
            Independent collegiate curriculum progress, verified lecture video tracking, and topic mastery rubrics.
          </p>
        </div>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-[10px] bg-red-500/10 border border-red-500/30 text-left text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-[8px] btn-primary flex items-center justify-center gap-2.5 text-sm font-semibold shadow-sm disabled:opacity-60 transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security & Verification Note */}
        <div className="pt-3 border-t border-[#E4D9C0] dark:border-[#3D2D31] flex items-center justify-center gap-1.5 text-[11px] text-[#4B5160] dark:text-[#CFC8BB]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#5E7B5B]" />
          <span>Curricular records encrypted and isolated to your Google account</span>
        </div>
      </div>
    </div>
  );
}
