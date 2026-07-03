import { useMemo, useRef, useState } from 'react';
import { Apple, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Platform = 'apple' | 'google';

interface IssueResult {
  googleSaveUrl: string | null;
  applePassUrl: string | null;
}

/**
 * "Add to Wallet" buttons for the rewards QR card. On click we call the
 * `wallet-issue` edge function (which mints the pass via guka and returns the
 * save links), then navigate to the platform link. The card's QR carries the
 * same `cloudcafe:${userId}` value as the on-screen QR, so staff scan either
 * one identically — no scanner changes.
 *
 * We issue lazily (on click, not on mount) so a card is only ever created for
 * users who actually want one. The result is cached so a second click for the
 * other platform reuses it.
 */
export function AddToWalletButtons() {
  const [loading, setLoading] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cached = useRef<IssueResult | null>(null);

  // Order the buttons by the user's platform; still show both (desktop users
  // often add to whichever wallet their phone uses).
  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      // iPadOS 13+ reports as Mac; treat touch-capable Macs as iOS.
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  async function handleAdd(platform: Platform) {
    setLoading(platform);
    setError(null);
    try {
      if (!cached.current) {
        const { data, error: fnError } = await supabase.functions.invoke<
          IssueResult & { success: boolean; error?: string }
        >('wallet-issue', { body: {} });
        if (fnError || !data?.success) {
          throw new Error(data?.error || fnError?.message || 'Could not create wallet card');
        }
        cached.current = { googleSaveUrl: data.googleSaveUrl, applePassUrl: data.applePassUrl };
      }

      const url =
        platform === 'apple' ? cached.current.applePassUrl : cached.current.googleSaveUrl;
      if (!url) {
        throw new Error(
          platform === 'apple'
            ? 'Apple Wallet is not available right now'
            : 'Google Wallet is not available right now',
        );
      }
      // Same-tab navigation — a signed download / save link, safe from popup blockers.
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  const appleBtn = (
    <button
      key="apple"
      onClick={() => handleAdd('apple')}
      disabled={loading !== null}
      className="flex items-center justify-center gap-2 px-5 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading === 'apple' ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Apple className="w-5 h-5" />
      )}
      Add to Apple Wallet
    </button>
  );

  const googleBtn = (
    <button
      key="google"
      onClick={() => handleAdd('google')}
      disabled={loading !== null}
      className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-800 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading === 'google' ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Wallet className="w-5 h-5 text-[#4285F4]" />
      )}
      Add to Google Wallet
    </button>
  );

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isIOS ? [appleBtn, googleBtn] : [googleBtn, appleBtn]}
      </div>
      {error && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
