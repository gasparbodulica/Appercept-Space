'use client';

import { useState, useEffect, useRef } from 'react';
import {
  IconSun, IconCloud, IconCloudFilled, IconCloudRain, IconSnowflake,
  IconCloudStorm, IconCloudFog, IconMapPin, IconPencil, IconCheck, IconX,
} from '@tabler/icons-react';

interface WeatherData {
  temp: number;
  code: number;
  city: string;
}

// Map WMO weather codes → label + icon
function weatherInfo(code: number): { label: string; Icon: typeof IconSun; color: string } {
  if (code === 0) return { label: 'Clear', Icon: IconSun, color: '#f5c518' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', Icon: IconCloud, color: '#9bb8d3' };
  if (code === 3) return { label: 'Overcast', Icon: IconCloudFilled, color: '#7e93a8' };
  if (code === 45 || code === 48) return { label: 'Fog', Icon: IconCloudFog, color: '#9aa6b2' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', Icon: IconCloudRain, color: '#5fa8e0' };
  if (code >= 61 && code <= 67) return { label: 'Rain', Icon: IconCloudRain, color: '#4f9ae0' };
  if (code >= 71 && code <= 77) return { label: 'Snow', Icon: IconSnowflake, color: '#bfe3ff' };
  if (code >= 80 && code <= 82) return { label: 'Showers', Icon: IconCloudRain, color: '#4f9ae0' };
  if (code === 85 || code === 86) return { label: 'Snow showers', Icon: IconSnowflake, color: '#bfe3ff' };
  if (code >= 95) return { label: 'Thunderstorm', Icon: IconCloudStorm, color: '#a78bfa' };
  return { label: 'Clear', Icon: IconSun, color: '#f5c518' };
}

const FALLBACK = { lat: 45.815, lon: 15.982, name: 'Zagreb' };
const SAVED_KEY = 'appercept-weather-location'; // { lat, lon, name }

// Proper reverse geocoding (keyless) — coords → city name
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const g = await res.json();
    return g.city || g.locality || g.principalSubdivision || '';
  } catch {
    return '';
  }
}

// Approx distance between two coords in km (haversine, good enough for city detection)
function distKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const MOVE_THRESHOLD_KM = 3; // refetch city/weather once you've moved this far

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const cancelledRef = useRef(false);
  const lastFixRef = useRef<{ lat: number; lon: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const manualRef = useRef(false);

  const fetchWeather = async (lat: number, lon: number, cityHint?: string) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
      const data = await res.json();
      const city = cityHint || (await reverseGeocode(lat, lon)) || 'Your location';
      if (!cancelledRef.current && data?.current) {
        setWeather({ temp: Math.round(data.current.temperature_2m), code: data.current.weather_code, city });
      }
    } catch { /* ignore */ }
    finally { if (!cancelledRef.current) setLoading(false); }
  };

  const clearWatch = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Continuously follow the device's location — refetch when moved past the threshold
  const startWatching = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setDenied(true);
      fetchWeather(FALLBACK.lat, FALLBACK.lon, FALLBACK.name);
      return;
    }
    clearWatch();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const prev = lastFixRef.current;
        setDenied(false);
        // First fix, or moved far enough to likely be a different area → refetch
        if (!prev || distKm(prev, next) >= MOVE_THRESHOLD_KM) {
          lastFixRef.current = next;
          fetchWeather(next.lat, next.lon);
        }
      },
      () => { setDenied(true); if (!lastFixRef.current) fetchWeather(FALLBACK.lat, FALLBACK.lon, FALLBACK.name); },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  const locate = () => {
    setLoading(true);
    setDenied(false);

    // A manually-pinned city pauses auto-tracking (until the user clears it)
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null');
      if (saved?.lat && saved?.lon) {
        manualRef.current = true;
        clearWatch();
        fetchWeather(saved.lat, saved.lon, saved.name);
        return;
      }
    } catch { /* ignore */ }

    // Otherwise follow the device live
    manualRef.current = false;
    startWatching();
  };

  useEffect(() => {
    cancelledRef.current = false;
    locate();
    // Periodically refresh the temperature for the current spot (every 10 min),
    // even when stationary. Live movement is handled by watchPosition.
    const interval = setInterval(() => {
      if (manualRef.current) { locate(); return; }
      const fix = lastFixRef.current;
      if (fix) fetchWeather(fix.lat, fix.lon);
    }, 10 * 60 * 1000);
    return () => { cancelledRef.current = true; clearWatch(); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manually set a city by name (forward-geocode → save → refetch)
  const setManualCity = async () => {
    const q = cityInput.trim();
    if (!q) return;
    setSearchError('');
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`);
      const g = await res.json();
      const hit = g?.results?.[0];
      if (!hit) { setSearchError('City not found'); return; }
      const saved = { lat: hit.latitude, lon: hit.longitude, name: hit.name };
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
      manualRef.current = true;
      clearWatch();
      setEditing(false);
      setCityInput('');
      setDenied(false);
      setLoading(true);
      fetchWeather(saved.lat, saved.lon, saved.name);
    } catch {
      setSearchError('Lookup failed');
    }
  };

  const useMyLocation = () => {
    localStorage.removeItem(SAVED_KEY);
    lastFixRef.current = null;
    setEditing(false);
    locate();
  };

  // ── Editing UI ──
  if (editing) {
    return (
      <div style={{ ...chipStyle, gap: 6 }}>
        <IconMapPin size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          autoFocus
          value={cityInput}
          onChange={(e) => { setCityInput(e.target.value); setSearchError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') setManualCity(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="Type a city…"
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', width: 110 }}
        />
        {searchError && <span style={{ fontSize: 10, color: 'var(--color-red)' }}>{searchError}</span>}
        <button onClick={setManualCity} title="Set city" style={iconBtn}><IconCheck size={14} style={{ color: 'var(--color-green)' }} /></button>
        <button onClick={useMyLocation} title="Use my location" style={iconBtn}><IconMapPin size={14} style={{ color: 'var(--color-accent-bright)' }} /></button>
        <button onClick={() => setEditing(false)} title="Cancel" style={iconBtn}><IconX size={14} style={{ color: 'var(--color-text-muted)' }} /></button>
      </div>
    );
  }

  if (loading && !weather) {
    return (
      <div style={chipStyle}>
        <div className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%' }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading weather…</span>
      </div>
    );
  }

  if (!weather) return null;

  const { label, Icon, color } = weatherInfo(weather.code);

  return (
    <div style={chipStyle} title={`${label} · ${weather.city}${denied ? ' (location blocked — click to set)' : manualRef.current ? ' (pinned — click pin to follow live)' : ' (following your location live)'}`}>
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{weather.temp}°C</span>
      <span style={{ width: '0.5px', height: 16, background: 'var(--color-border-default)' }} />
      <button
        onClick={() => { setCityInput(weather.city === 'Your location' ? '' : weather.city); setEditing(true); }}
        title="Change location"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: denied ? 'var(--color-amber)' : 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}
      >
        <IconMapPin size={12} /> {weather.city}
        <IconPencil size={10} style={{ opacity: 0.6 }} />
      </button>
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '7px 14px', borderRadius: 10,
  background: 'var(--color-bg-elevated)',
  border: '0.5px solid var(--color-border-default)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 4,
};
