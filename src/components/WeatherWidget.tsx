'use client';

import { useState, useEffect } from 'react';
import {
  IconSun, IconCloud, IconCloudFilled, IconCloudRain, IconSnowflake,
  IconCloudStorm, IconCloudFog, IconMapPin,
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

// Fallback location if geolocation is denied/unavailable (Zagreb, HR)
const FALLBACK = { lat: 45.815, lon: 15.982, name: 'Zagreb' };

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async (lat: number, lon: number, cityHint?: string) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const data = await res.json();
        let city = cityHint ?? '';
        // Reverse-geocode for a city name (best-effort, free)
        if (!city) {
          try {
            const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`);
            const g = await geo.json();
            city = g?.results?.[0]?.name ?? '';
          } catch { /* ignore */ }
        }
        if (!cancelled && data?.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            city: city || 'Your location',
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    const start = () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(FALLBACK.lat, FALLBACK.lon, FALLBACK.name),
          { timeout: 8000, maximumAge: 600000 }
        );
      } else {
        fetchWeather(FALLBACK.lat, FALLBACK.lon, FALLBACK.name);
      }
    };

    start();
    // Refresh every 10 minutes
    const interval = setInterval(start, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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
    <div style={chipStyle} title={`${label} · ${weather.city}`}>
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{weather.temp}°C</span>
      <span style={{ width: '0.5px', height: 16, background: 'var(--color-border-default)' }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        <IconMapPin size={12} /> {weather.city}
      </span>
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
