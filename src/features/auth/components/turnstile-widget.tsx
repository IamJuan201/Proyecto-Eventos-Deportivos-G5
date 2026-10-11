'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

/**
 * Minimal typing for the Cloudflare Turnstile browser API.
 */
interface TurnstileApi {
  /**
   * Renders a widget into an element.
   */
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  /**
   * Removes a rendered widget.
   */
  remove: (widgetId: string) => void;
}

/**
 * Reads the injected Turnstile API when the script has loaded.
 *
 * @returns Browser Turnstile API or undefined.
 */
function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

/**
 * Checks whether the Turnstile widget can render in the browser.
 *
 * @returns True when NEXT_PUBLIC_TURNSTILE_SITE_KEY looks usable.
 */
export function isTurnstileWidgetEnabled(): boolean {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  return siteKey.length > 5 && !siteKey.includes("<");
}

/**
 * Returns the configured Turnstile site key.
 *
 * @returns Site key or an empty string.
 */
export function getTurnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

/**
 * Props for the Turnstile challenge widget.
 */
interface TurnstileWidgetProps {
  /**
   * Public site key (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
   */
  siteKey: string;
  /**
   * Receives the token on every successful challenge.
   */
  onVerify: (token: string) => void;
  /**
   * Called when the token expires before submit.
   */
  onExpire?: () => void;
}

/**
 * Cloudflare Turnstile challenge rendered explicitly.
 * Emits short-lived tokens the server validates with the secret key.
 *
 * @param props Widget props with the site key and callbacks.
 * @returns Turnstile widget placeholder.
 */
export function TurnstileWidget({ siteKey, onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(() => getTurnstile() !== undefined);
  const callbacksRef = useRef({ onVerify, onExpire });

  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire };
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!ready) return;
    const api = getTurnstile();
    const container = containerRef.current;
    if (!api || !container) return;
    const widgetId = api.render(container, {
      sitekey: siteKey,
      theme: 'dark',
      callback: (token: string) => callbacksRef.current.onVerify(token),
      'expired-callback': () => callbacksRef.current.onExpire?.(),
      'error-callback': () => callbacksRef.current.onExpire?.(),
    });
    return () => {
      try {
        api.remove(widgetId);
      } catch {
        // Widget already removed; nothing to clean up.
      }
    };
  }, [ready, siteKey]);

  return <>
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onLoad={() => setReady(true)}
    />
    <div ref={containerRef} className="flex justify-center" />
  </>;
}
