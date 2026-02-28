'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/api/settings/turnstile')
      .then((r) => r.json())
      .then((data) => {
        if (data.enabled) {
          setEnabled(true);
        } else {
          setEnabled(false);
          onVerify('disabled');
        }
      })
      .catch(() => {
        setEnabled(false);
        onVerify('disabled');
      });
  }, [onVerify]);

  useEffect(() => {
    if (enabled !== true) return;

    const timeoutId = setTimeout(() => {
      if (!widgetIdRef.current) {
        setLoadError(true);
      }
    }, 10000);

    function renderWidget() {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;
      clearTimeout(timeoutId);
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        theme: 'light',
        'error-callback': () => setLoadError(true),
      });
    }

    if (window.turnstile) {
      renderWidget();
      return () => clearTimeout(timeoutId);
    }

    const existing = document.querySelector('script[src*="turnstile"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderWidget();
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', () => renderWidget());
    }

    return () => clearTimeout(timeoutId);
  }, [enabled, onVerify]);

  if (!enabled) return null;

  if (loadError) {
    return (
      <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
        Security verification could not load.{' '}
        <button
          type="button"
          onClick={() => onVerify('bypass')}
          className="underline hover:text-amber-900"
        >
          Continue without verification
        </button>
      </div>
    );
  }

  return <div ref={containerRef} className="mb-3" />;
}
