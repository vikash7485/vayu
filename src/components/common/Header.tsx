import React from 'react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    language,
    toggleLanguage,
    darkMode,
    toggleDarkMode,
    activeZoneId,
    setActiveZoneId,
    zones,
    simulationHour,
    setSimulationHour,
    t
  } = useApp();

  const activeZoneObj = zones.find(z => z.id === activeZoneId) || zones[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-[var(--card-border)] px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-xl font-bold text-white shadow-lg border border-teal-400/30">
            🌱
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-100 flex items-center gap-2">
              <span>{t('appTitle')}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                v2.6 Enterprise
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Global Controls: Dual Portal Switcher, Zone Selector, Diurnal Time Engine, Language & Dark Mode */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Dual Experience Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRole('citizen')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                role === 'citizen'
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>👤</span>
              <span>{t('citizenPortal')}</span>
            </button>

            <button
              onClick={() => setRole('officer')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                role === 'officer'
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏛️</span>
              <span>{t('officerCenter')}</span>
            </button>
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">📍</span>
            <select
              value={activeZoneId}
              onChange={(e) => setActiveZoneId(e.target.value)}
              className="bg-transparent text-teal-300 font-bold focus:outline-none cursor-pointer"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id} className="bg-slate-900 text-slate-100">
                  {language === 'hi' ? z.hiName : z.name} (AQI {z.aqi})
                </option>
              ))}
            </select>
          </div>

          {/* Diurnal Time Engine Slider */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-amber-400">🕒</span>
            <span className="text-slate-400">Diurnal:</span>
            <span className="text-slate-200 font-bold w-12">
              {simulationHour < 10 ? `0${simulationHour}` : simulationHour}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              value={simulationHour}
              onChange={(e) => setSimulationHour(Number(e.target.value))}
              className="w-20 accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Bilingual Switcher EN / HI */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-teal-300 font-bold hover:bg-slate-800 transition"
            title="Instant Bilingual Switcher"
          >
            {language === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-amber-400 hover:bg-slate-800 transition"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
};
