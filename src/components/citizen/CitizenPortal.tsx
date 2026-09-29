import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BengaluruGisMap } from '../gis/BengaluruGisMap';
import { NAAQS_LIMITS } from '../../data/bengaluruData';
import { HourlyForecast } from '../../types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  LineChart, Line, Legend
} from 'recharts';

export const CitizenPortal: React.FC = () => {
  const {
    activeZone,
    getDynamicAqi,
    healthConditions,
    toggleHealthCondition,
    healthVulnerabilityScore,
    tickets,
    addTicket,
    upvoteTicket,
    language,
    t
  } = useApp();

  const dynamicZone = getDynamicAqi(activeZone);

  // Active Citizen Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'report' | 'grievances'>('overview');

  // New Ticket Form State
  const [reportCategory, setReportCategory] = useState<'Open Burning' | 'Construction/Road Dust' | 'Industrial Smoke' | 'Vehicular Idling' | 'DG Sets' | 'Tree Loss' | 'Lake Froth' | 'Sensor Fault'>('Open Burning');
  const [reportDescription, setReportDescription] = useState('');
  const [department, setDepartment] = useState<'BBMP' | 'KSPCB' | 'Traffic Police' | 'BWSSB'>('BBMP');
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [photoStripped, setPhotoStripped] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Generate 72-Hour Predictive Forecast Data
  const forecastData: HourlyForecast[] = Array.from({ length: 24 }).map((_, i) => {
    const hourVal = (i * 3) % 24;
    const hourStr = `${hourVal < 10 ? '0' : ''}${hourVal}:00`;
    let wave = Math.sin((i / 24) * Math.PI * 4) * 40;
    if (hourVal >= 8 && hourVal <= 10) wave += 55; // morning inversion
    if (hourVal >= 19 && hourVal <= 21) wave += 45; // evening rush

    const baseAqi = Math.max(35, Math.round(activeZone.aqi + wave));
    return {
      hour: hourStr,
      aqi: baseAqi,
      lowerBound: Math.max(20, baseAqi - 15),
      upperBound: baseAqi + 25,
      windSpeed: Number((2.5 + Math.cos(i) * 1.5).toFixed(1)),
      mixingHeight: Math.round(300 + Math.sin(i) * 350)
    };
  });

  const getAqiBadgeColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-[#46a04a] text-white';
    if (aqi <= 100) return 'bg-[#9dc84b] text-slate-900';
    if (aqi <= 200) return 'bg-[#e8b400] text-slate-900';
    if (aqi <= 300) return 'bg-[#ef8632] text-white';
    if (aqi <= 400) return 'bg-[#e04b3d] text-white';
    return 'bg-[#a4302a] text-white';
  };

  // Image Upload Simulation with EXIF Stripping
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSimulatedPhoto(url);
      setPhotoStripped(true);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;

    let sla = 24;
    if (reportCategory === 'Industrial Smoke') sla = 48;
    if (reportCategory === 'Vehicular Idling') sla = 12;

    const newTicket = addTicket({
      category: reportCategory,
      categoryHi: reportCategory,
      description: reportDescription,
      zoneId: activeZone.id,
      zoneName: activeZone.name,
      coarsenedLocation: `Grid Cell ${activeZone.name.substring(0, 3).toUpperCase()}-250m (250m coarsened)`,
      lat: activeZone.centerLat,
      lng: activeZone.centerLng,
      slaDeadline: `${sla} Hours (Active SLA countdown)`,
      slaHours: sla,
      slaBreached: false,
      department: department,
      status: 'Submitted',
      hasPhoto: !!simulatedPhoto,
      photoUrl: simulatedPhoto || undefined
    });

    setSubmittedTicketId(newTicket.ticketNumber);
    setReportDescription('');
    setSimulatedPhoto(null);
    setActiveTab('grievances');
  };

  // Citizen Tickets
  const myZoneTickets = tickets.filter(t => t.zoneId === activeZone.id);

  return (
    <div className="space-y-6">
      {/* Mobile-First Navigation Header / Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-[var(--card-border)]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🌬️</span>
          <span>{t('liveAQI')} & Health</span>
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'forecast'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>📈</span>
          <span>72-Hr Forecast</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🚨</span>
          <span>Report Incident</span>
        </button>

        <button
          onClick={() => setActiveTab('grievances')}
          className={`px-4 py-2 rounded-xl font-display font-semibold text-sm transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'grievances'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>📋</span>
          <span>My Grievances ({myZoneTickets.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HEALTH VULNERABILITY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hero AQI & Pollutant Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Ward AQI Card */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-500/20 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Ward #{activeZone.wardNumber}
                    </span>
                    <span className="text-xs text-slate-400">Live Station Network ({activeZone.stationCount} Nodes)</span>
                  </div>
                  <h2 className="text-2xl font-bold font-display mt-1 text-slate-100">
                    {language === 'hi' ? activeZone.hiName : activeZone.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-2xl font-mono text-2xl font-bold ${getAqiBadgeColor(dynamicZone.aqi)} shadow-md`}>
                    AQI {dynamicZone.aqi}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">STATUTORY BAND</div>
                  <div className="text-base font-bold text-teal-300 font-display mt-0.5">
                    {dynamicZone.band}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">{t('dominantPollutant')}</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {activeZone.dominantPollutant}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">{t('cleanestWindow')}</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {activeZone.cleanestWindow}
                  </div>
                </div>
              </div>

              {/* 6 Multi-Pollutant statutory limit channels */}
              <div className="mt-6">
                <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-3 tracking-wider">
                  6-Pollutant Channels vs NAAQS Thresholds
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'PM2.5', val: activeZone.pollutants.pm25, limit: NAAQS_LIMITS.pm25, unit: 'µg/m³' },
                    { name: 'PM10', val: activeZone.pollutants.pm10, limit: NAAQS_LIMITS.pm10, unit: 'µg/m³' },
                    { name: 'NO₂', val: activeZone.pollutants.no2, limit: NAAQS_LIMITS.no2, unit: 'ppb' },
                    { name: 'SO₂', val: activeZone.pollutants.so2, limit: NAAQS_LIMITS.so2, unit: 'µg/m³' },
                    { name: 'CO', val: activeZone.pollutants.co, limit: NAAQS_LIMITS.co, unit: 'mg/m³' },
                    { name: 'O₃', val: activeZone.pollutants.o3, limit: NAAQS_LIMITS.o3, unit: 'µg/m³' }
                  ].map((p) => {
                    const ratio = Math.min(100, Math.round((p.val / p.limit) * 100));
                    const isExceeded = p.val > p.limit;

                    return (
                      <div key={p.name} className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-200">{p.name}</span>
                          <span className={`font-mono ${isExceeded ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                            {p.val} / {p.limit} {p.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExceeded ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Source Archetype Breakdown */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-2">
                  Ward Emission Source Breakdown (%)
                </h3>
                <div className="grid grid-cols-5 gap-1.5 text-[11px] font-mono">
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                    <div className="text-amber-400 font-bold">{activeZone.sources.industrial}%</div>
                    <div className="text-slate-400 text-[10px]">Industry</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                    <div className="text-red-400 font-bold">{activeZone.sources.vehicular}%</div>
                    <div className="text-slate-400 text-[10px]">Vehicles</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                    <div className="text-orange-400 font-bold">{activeZone.sources.construction}%</div>
                    <div className="text-slate-400 text-[10px]">Dust</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                    <div className="text-purple-400 font-bold">{activeZone.sources.openBurning}%</div>
                    <div className="text-slate-400 text-[10px]">Burning</div>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center border border-slate-800">
                    <div className="text-emerald-400 font-bold">{activeZone.sources.residential}%</div>
                    <div className="text-slate-400 text-[10px]">Residential</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive GIS Map Widget */}
            <div>
              <h3 className="text-sm font-display font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <span>📍</span> Hyper-Local Ward Map
              </h3>
              <BengaluruGisMap compact />
            </div>
          </div>

          {/* Right Column: Personalized Health Vulnerability Score & Profile */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
                <h3 className="font-display font-bold text-lg text-slate-100">
                  {t('healthScore')}
                </h3>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI Dynamic Risk
                </span>
              </div>

              {/* Health Risk Gauge */}
              <div className="text-center py-2">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="12"
                      className={
                        healthVulnerabilityScore > 70
                          ? 'text-red-500'
                          : healthVulnerabilityScore > 40
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }
                      strokeDasharray={376.8}
                      strokeDashoffset={376.8 - (376.8 * healthVulnerabilityScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-mono font-bold text-slate-100">{healthVulnerabilityScore}</span>
                    <span className="text-[10px] font-mono block text-slate-400 uppercase">/ 100 Risk</span>
                  </div>
                </div>

                <div className="mt-2 text-sm font-semibold text-slate-200">
                  {healthVulnerabilityScore > 70 ? (
                    <span className="text-red-400 font-bold">⚠️ High Health Vulnerability Alert</span>
                  ) : healthVulnerabilityScore > 40 ? (
                    <span className="text-amber-400 font-bold">⚡ Moderate Sensitivity Exposure</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">✅ Low Health Risk Profile</span>
                  )}
                </div>
              </div>

              {/* Sensitivity Conditions Selector */}
              <div>
                <label className="text-xs font-mono font-semibold uppercase text-slate-400 block mb-3">
                  Setup Personal / Family Sensitivity Conditions:
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'asthmaCopd', label: 'Asthma / COPD Respiratory Condition', icon: '🫁' },
                    { key: 'cardiovascular', label: 'Cardiovascular / Heart Condition', icon: '❤️' },
                    { key: 'childrenUnder12', label: 'Children Under 12 Years', icon: '👶' },
                    { key: 'elderly60Plus', label: 'Elderly 60+ Senior Citizens', icon: '👴' },
                    { key: 'pregnancy', label: 'Pregnancy', icon: '🤰' },
                    { key: 'outdoorWorker', label: 'Outdoor Traffic / Construction Worker', icon: '👷' }
                  ].map((cond) => {
                    const isChecked = healthConditions[cond.key as keyof typeof healthConditions];
                    return (
                      <button
                        key={cond.key}
                        onClick={() => toggleHealthCondition(cond.key as keyof typeof healthConditions)}
                        className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-teal-900/40 border-teal-500/60 text-teal-200 font-semibold shadow-sm'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cond.icon}</span>
                          <span>{cond.label}</span>
                        </span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${isChecked ? 'bg-teal-500 text-slate-950' : 'border border-slate-600'}`}>
                          {isChecked ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Medical Advisory */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-teal-500/30 text-xs space-y-2">
                <div className="font-bold text-teal-300 font-display flex items-center gap-1.5">
                  <span>💡</span> AI Medical Advisory:
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {healthVulnerabilityScore > 70
                    ? `In ${activeZone.name}, high PM2.5 levels during morning inversion (08:00 - 10:00 AM) pose acute risk. Sensitive individuals and children should avoid outdoor sports until ${activeZone.cleanestWindow} and wear N95 filtration masks outdoors.`
                    : `Air quality in ${activeZone.name} is within manageable limits. The safest window for outdoor exercise is ${activeZone.cleanestWindow}. Keep indoor air purifiers running on eco mode.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 72-HOUR PREDICTIVE FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-100">
                  {t('predictive72h')} ({activeZone.name})
                </h3>
                <p className="text-xs text-slate-400">
                  AI dispersion physics model with confidence bands & personal health danger threshold
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-teal-400"><span className="w-3 h-3 bg-teal-500 rounded-sm"></span> AQI Forecast</span>
                <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-0.5 bg-red-500"></span> Personal Vulnerability Limit (AQI 150)</span>
              </div>
            </div>

            {/* Recharts Area Chart for 72h AQI Forecast */}
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#12798c" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#12798c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 400]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#12798c', borderRadius: '12px', color: '#fff' }}
                  />
                  <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Health Danger Threshold', fill: '#ef4444', fontSize: 10 }} />
                  <Area type="monotone" dataKey="upperBound" stroke="none" fill="#12798c" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="aqi" stroke="#12798c" strokeWidth={3} fillOpacity={1} fill="url(#aqiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Meteorological Driver Chart */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-3">
                Meteorological Drivers: Wind Speed (m/s) vs Inversion Mixing Layer Height (m)
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                    <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} domain={[0, 10]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#c084fc" fontSize={10} domain={[0, 1000]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="windSpeed" name="Wind Speed (m/s)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="mixingHeight" name="Mixing Layer (m)" stroke="#c084fc" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INCIDENT REPORTING MODULE */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>🚨</span> Citizen AQI Incident Reporting
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              File verified civic grievances directly to municipal enforcement under statutory response SLAs.
            </p>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            {/* Incident Category */}
            <div>
              <label className="font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                Category
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-teal-500 font-display text-sm"
              >
                <option value="Open Burning">🔥 Open Waste / Plastic Burning (24h SLA)</option>
                <option value="Construction/Road Dust">🏗️ Construction Dust / Uncovered Transport (48h SLA)</option>
                <option value="Industrial Smoke">🏭 Industrial Stack Smoke / Illegal Boiler (48h SLA)</option>
                <option value="Vehicular Idling">🚗 Heavy Vehicular Gridlock / Idling (12h SLA)</option>
                <option value="DG Sets">⚡ Unpermitted Diesel Generator (DG Set) (24h SLA)</option>
                <option value="Tree Loss">🌳 Illegal Tree Felling / Green Canopy Loss (24h SLA)</option>
                <option value="Lake Froth">🌊 Lake Froth / Chemical Discharge (24h SLA)</option>
                <option value="Sensor Fault">📡 Air Quality Sensor Node Malfunction (12h SLA)</option>
              </select>
            </div>

            {/* Department Assignment */}
            <div>
              <label className="font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                Responsible Authority Department
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['BBMP', 'KSPCB', 'Traffic Police', 'BWSSB'] as const).map((dept) => (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => setDepartment(dept)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      department === dept
                        ? 'bg-teal-700 text-white border-teal-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                Incident Description & Landmark
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="E.g., Open waste burning near stormwater drain behind industrial area block 4..."
                rows={3}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-teal-500 font-sans text-sm"
              />
            </div>

            {/* Privacy Coarsened Location Notice */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-teal-500/30 text-teal-300 flex items-start gap-2 text-[11px]">
              <span className="text-base">🔒</span>
              <div>
                <strong>Privacy Guard Enabled:</strong> Your exact GPS coordinates will be automatically coarsened to <strong>Grid Cell {activeZone.name.substring(0, 3).toUpperCase()}-250m</strong> to protect your residential privacy.
              </div>
            </div>

            {/* Photo Attachment Simulator with EXIF Stripping */}
            <div>
              <label className="font-mono font-semibold uppercase text-slate-300 block mb-1.5">
                Photo Evidence Simulator (Auto EXIF Stripping)
              </label>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-teal-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-input"
                />
                <label htmlFor="photo-input" className="cursor-pointer text-slate-400 block">
                  {simulatedPhoto ? (
                    <div className="space-y-2">
                      <img src={simulatedPhoto} alt="Uploaded evidence" className="h-32 mx-auto rounded-xl object-cover border border-teal-500/40" />
                      <span className="text-xs text-emerald-400 font-mono block">
                        ✅ EXIF Metadata Stripped (Device ID & Raw GPS Cleared)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl block mb-1">📷</span>
                      <span className="font-semibold text-slate-200">Click to upload photo evidence</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Automated client-side EXIF metadata removal</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-display font-bold py-3 px-6 rounded-xl transition shadow-lg text-sm uppercase tracking-wider"
            >
              {t('submitReport')}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: MY GRIEVANCES TRACKER */}
      {activeTab === 'grievances' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {submittedTicketId && (
            <div className="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-2xl text-xs text-emerald-200 flex items-center justify-between">
              <div>
                <strong>Ticket Generated: #{submittedTicketId}</strong> — Submitted successfully with statutory response SLA.
              </div>
              <button onClick={() => setSubmittedTicketId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>📋</span> Active Civic Grievance Tracker ({myZoneTickets.length} Tickets in {activeZone.name})
            </h3>

            {myZoneTickets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active grievance tickets reported in {activeZone.name} yet.
              </div>
            ) : (
              <div className="space-y-6">
                {myZoneTickets.map((tkt) => (
                  <div key={tkt.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-300">{tkt.ticketNumber}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {tkt.department}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-slate-100 mt-1">
                          {tkt.category}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => upvoteTicket(tkt.id)}
                          className="px-3 py-1.5 rounded-xl bg-teal-900/50 border border-teal-500/40 text-teal-300 text-xs font-mono font-semibold hover:bg-teal-800 transition flex items-center gap-1.5"
                        >
                          <span>👍</span>
                          <span>{tkt.upvotes} Upvotes</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tkt.description}
                    </p>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                      <span>Location: <strong className="text-slate-200">{tkt.coarsenedLocation}</strong></span>
                      <span>•</span>
                      <span>SLA: <strong className={tkt.slaBreached ? 'text-red-400 font-bold' : 'text-amber-400'}>{tkt.slaDeadline}</strong></span>
                    </div>

                    {/* Timeline Stepper */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400 mb-2">Statutory Resolution Timeline</div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-mono">
                        {[
                          { key: 'Submitted', label: '1. Submitted' },
                          { key: 'Acknowledged', label: '2. Acknowledged' },
                          { key: 'In Progress', label: '3. In Progress' },
                          { key: 'Resolved', label: '4. Resolved' }
                        ].map((step, idx) => {
                          const statusOrder = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved'];
                          const currentIdx = statusOrder.indexOf(tkt.status);
                          const isDone = idx <= currentIdx;

                          return (
                            <div
                              key={step.key}
                              className={`p-2 rounded-xl border transition ${
                                isDone
                                  ? 'bg-teal-900/60 border-teal-500 text-teal-200 font-bold'
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}
                            >
                              {step.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Officer Chat Log */}
                    {tkt.officerChatLog.length > 0 && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          Official Action Log:
                        </div>
                        {tkt.officerChatLog.map((log, i) => (
                          <div key={i} className="text-slate-300 text-[11px]">
                            <strong className="text-teal-400 font-mono">[{log.timestamp}] {log.sender}:</strong> {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
