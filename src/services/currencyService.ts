import { useState, useEffect } from 'react';

export interface ExchangeRates {
  usd: number;
  eur: number;
  lastUpdated: string;
  isLive: boolean;
  isLoading: boolean;
  error?: string | null;
}

const STORAGE_KEY = 'arslan_finans_live_rates_v1';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes cache

const FALLBACK_RATES = {
  usd: 34.35,
  eur: 37.45,
};

export async function fetchLiveExchangeRates(): Promise<{ usd: number; eur: number; lastUpdated: string }> {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS && parsed.usd && parsed.eur) {
        return {
          usd: parsed.usd,
          eur: parsed.eur,
          lastUpdated: parsed.lastUpdated,
        };
      }
    }
  } catch {}

  // 1. Primary: open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.TRY) {
        const usdRate = Number(data.rates.TRY.toFixed(2));
        const eurRate = data.rates.EUR ? Number((data.rates.TRY / data.rates.EUR).toFixed(2)) : Number((usdRate * 1.09).toFixed(2));
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const result = { usd: usdRate, eur: eurRate, lastUpdated: timeStr };
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...result, timestamp: Date.now() })
          );
        } catch {}
        return result;
      }
    }
  } catch (err) {
    console.warn('Primary currency API failed, trying fallback...', err);
  }

  // 2. Fallback: exchangerate-api.com
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && data.rates.TRY) {
        const usdRate = Number(data.rates.TRY.toFixed(2));
        const eurRate = data.rates.EUR ? Number((data.rates.TRY / data.rates.EUR).toFixed(2)) : Number((usdRate * 1.09).toFixed(2));
        const now = new Date();
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const result = { usd: usdRate, eur: eurRate, lastUpdated: timeStr };
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...result, timestamp: Date.now() })
          );
        } catch {}
        return result;
      }
    }
  } catch (err) {
    console.warn('Fallback currency API failed:', err);
  }

  const now = new Date();
  return {
    usd: FALLBACK_RATES.usd,
    eur: FALLBACK_RATES.eur,
    lastUpdated: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function useLiveCurrency() {
  const [rates, setRates] = useState<ExchangeRates>({
    usd: FALLBACK_RATES.usd,
    eur: FALLBACK_RATES.eur,
    lastUpdated: '',
    isLive: false,
    isLoading: true,
  });

  const refreshRates = async (force = false) => {
    if (force) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setRates(prev => ({ ...prev, isLoading: true }));
    try {
      const live = await fetchLiveExchangeRates();
      setRates({
        usd: live.usd,
        eur: live.eur,
        lastUpdated: live.lastUpdated,
        isLive: true,
        isLoading: false,
        error: null,
      });
    } catch {
      setRates(prev => ({
        ...prev,
        isLoading: false,
        isLive: false,
        error: 'Kurlar güncellenemedi',
      }));
    }
  };

  useEffect(() => {
    refreshRates();
    const interval = setInterval(() => {
      refreshRates();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { ...rates, refreshRates };
}
