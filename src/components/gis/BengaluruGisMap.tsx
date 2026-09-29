import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SENSING_STATIONS } from '../../data/bengaluruData';

interface GisMapProps {
  compact?: boolean;
  onSelectZone?: (zoneId: string) => void;
}

export const BengaluruGisMap: React.FC<GisMapProps> = ({ compact = false, onSelectZone }) => {
  const {
    zones,
    activeZoneId,
    setActiveZoneId,
    getDynamicAqi,
    tickets,
    language
  } = useApp();

  // GIS Layer toggles
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showMetro, setShowMetro] = useState(true);
  const [showLakes, setShowLakes] = useState(true);
  const [showPlume, setShowPlume] = useState(false); // Satellite NO2 plume
  const [showInfraGaps, setShowInfraGaps] = useState(false); // Sensor blindspots hatching
  const [showIncidents, setShowIncidents] = useState(true);

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Helper function to get statutory CPCB AQI color
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#46a04a';      // Good
    if (aqi <= 100) return '#9dc84b';     // Satisfactory
    if (aqi <= 200) return '#e8b400';     // Moderate
    if (aqi <= 300) return '#ef8632';     // Poor
    if (aqi <= 400) return '#e04b3d';     // Very Poor
    return '#a4302a';                     // Severe
  };

  const handleZoneClick = (zoneId: string) => {
    setActiveZoneId(zoneId);
    if (onSelectZone) onSelectZone(zoneId);
  };

  const activeZoneObj = zones.find(z => z.id === (hoveredZone || activeZoneId)) || zones[0];
  const dynamicActive = getDynamicAqi(activeZoneObj);

  return (
    <div className={`relative w-full rounded-2xl glass-panel overflow-hidden border border-[var(--card-border)] ${compact ? 'h-[360px]' : 'h-[580px]'}`}>
      {/* Map Control Bar / Layer Switchers */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl border border-teal-500/30 text-xs text-slate-200">
        <div className="flex items-center gap-2 font-semibold text-teal-400">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
          <span>GIS WAR MAP (BENGALURU)</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowVoronoi(!showVoronoi)}
            className={`px-2.5 py-1 rounded-lg font-mono transition ${
              showVoronoi ? 'bg-teal-700 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            AQI Voronoi
          </button>
          <button
            onClick={() => setShowPlume(!showPlume)}
            className={`px-2.5 py-1 rounded-lg font-mono transition ${
              showPlume ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            TROPOMI NO₂ Plume
          </button>
          <button
            onClick={() => setShowInfraGaps(!showInfraGaps)}
            className={`px-2.5 py-1 rounded-lg font-mono transition ${
              showInfraGaps ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Blindspot Gaps
          </button>
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1 rounded-lg font-mono transition ${
              showStations ? 'bg-cyan-700 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Sensing Nodes
          </button>
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-lg font-mono transition ${
              showIncidents ? 'bg-red-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Incident Pins
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <svg
        viewBox="0 0 650 560"
        className="w-full h-full bg-[#071318] select-none cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Infrastructure Gap Hatch Pattern */}
          <pattern id="infraGapHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="2.5" opacity="0.6" />
          </pattern>

          {/* TROPOMI Satellite NO2 Gradient */}
          <radialGradient id="tropomiPlume" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
          </radialGradient>

          {/* Glowing dot filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Base Map Mesh Grid */}
        <g opacity="0.08" stroke="#108098" strokeWidth="0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="560" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 50} x2="650" y2={i * 50} />
          ))}
        </g>

        {/* 2. Lakes & Water Bodies */}
        {showLakes && (
          <g id="lakes" fill="#0284c7" opacity="0.65" stroke="#38bdf8" strokeWidth="1">
            {/* Bellandur Lake */}
            <path d="M 480 340 Q 510 330 530 350 Q 520 370 490 360 Z" />
            {/* Varthur Lake */}
            <path d="M 540 330 Q 570 325 580 345 Q 560 360 535 345 Z" />
            {/* Hebbal Lake */}
            <path d="M 330 110 Q 360 100 370 120 Q 350 135 325 125 Z" />
            {/* Sankey Tank */}
            <path d="M 280 210 Q 295 205 300 220 Q 290 228 280 220 Z" />
            <text x="495" y="352" fill="#e0f2fe" fontSize="8" fontFamily="IBM Plex Sans">Bellandur Lake</text>
            <text x="332" y="118" fill="#e0f2fe" fontSize="8" fontFamily="IBM Plex Sans">Hebbal Lake</text>
          </g>
        )}

        {/* 3. Major Road Network (Outer Ring Road, NICE Road, Radial Highways) */}
        <g id="roads" stroke="#334155" strokeWidth="3" fill="none" opacity="0.7">
          {/* Outer Ring Road (ORR) Loop */}
          <path d="M 340 100 C 480 110 520 250 490 380 C 420 450 250 420 180 300 C 180 180 250 100 340 100" stroke="#475569" strokeWidth="4" strokeDasharray="6 3" />
          {/* Hosur Road (Radial South-East) */}
          <path d="M 320 310 L 480 500" stroke="#64748b" strokeWidth="3" />
          {/* Tumkur Road (Radial North-West) */}
          <path d="M 280 210 L 120 100" stroke="#64748b" strokeWidth="3" />
          {/* Bellary Road (Radial North) */}
          <path d="M 340 210 L 380 30" stroke="#64748b" strokeWidth="3" />
          {/* Old Madras Road (Radial East) */}
          <path d="M 380 240 L 610 220" stroke="#64748b" strokeWidth="3" />
        </g>

        {/* 4. Metro Lines */}
        {showMetro && (
          <g id="metro" fill="none">
            {/* Purple Line (East-West: Kengeri to Whitefield) */}
            <path d="M 120 350 L 260 270 L 340 270 L 450 250 L 570 240" stroke="#a855f7" strokeWidth="3.5" opacity="0.9" />
            {/* Green Line (North-South: Nagasandra to Silk Board) */}
            <path d="M 220 120 L 270 200 L 320 270 L 330 380 L 340 430" stroke="#22c55e" strokeWidth="3.5" opacity="0.9" />
          </g>
        )}

        {/* 5. Voronoi AQI Polygons for 20 Zones */}
        {showVoronoi && (
          <g id="voronoi-zones">
            {zones.map((zone) => {
              const dynamic = getDynamicAqi(zone);
              const color = getAqiColor(dynamic.aqi);
              const isSelected = zone.id === activeZoneId;
              const isHovered = zone.id === hoveredZone;

              return (
                <g key={zone.id} className="transition-all duration-300">
                  <path
                    d={zone.polygonSvg}
                    fill={color}
                    fillOpacity={isSelected ? 0.65 : isHovered ? 0.5 : 0.35}
                    stroke={isSelected ? '#38bdf8' : color}
                    strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onClick={() => handleZoneClick(zone.id)}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />

                  {/* Infrastructure Gap Hatch Overlay if toggled */}
                  {showInfraGaps && zone.sensorBlindspotScore >= 5 && (
                    <path
                      d={zone.polygonSvg}
                      fill="url(#infraGapHatch)"
                      pointerEvents="none"
                    />
                  )}

                  {/* Zone Name Label */}
                  <text
                    x={zone.polygonSvg.split(' ')[1]}
                    y={parseInt(zone.polygonSvg.split(' ')[2]) + 15}
                    fill="#ffffff"
                    fontSize={isSelected ? '11' : '9.5'}
                    fontWeight={isSelected ? 'bold' : '500'}
                    fontFamily="IBM Plex Sans"
                    textAnchor="middle"
                    pointerEvents="none"
                    className="drop-shadow-md"
                  >
                    {language === 'hi' ? zone.hiName : zone.name}
                  </text>

                  {/* AQI Badge on Map */}
                  <rect
                    x={parseInt(zone.polygonSvg.split(' ')[1]) - 14}
                    y={parseInt(zone.polygonSvg.split(' ')[2]) - 14}
                    width="28"
                    height="16"
                    rx="4"
                    fill={color}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    pointerEvents="none"
                  />
                  <text
                    x={zone.polygonSvg.split(' ')[1]}
                    y={parseInt(zone.polygonSvg.split(' ')[2]) - 3}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="IBM Plex Mono"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {dynamic.aqi}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 6. Satellite TROPOMI NO2 Plume Overlay */}
        {showPlume && (
          <g id="tropomi-plume" pointerEvents="none">
            {/* Major industrial & heavy traffic NO2 hotspots: Peenya & Silk Board */}
            <circle cx="220" cy="160" r="110" fill="url(#tropomiPlume)" />
            <circle cx="340" cy="400" r="95" fill="url(#tropomiPlume)" />
            <circle cx="500" cy="270" r="85" fill="url(#tropomiPlume)" />
          </g>
        )}

        {/* 7. Ground Truth Sensing Nodes (CAAQMS & RWA) */}
        {showStations && (
          <g id="sensing-stations">
            {SENSING_STATIONS.map((st) => {
              // Convert lat/lng roughly to SVG x/y relative to Bengaluru map bounding box
              // Lat range: 12.80 to 13.12 -> Y: 520 to 30
              // Lng range: 77.45 to 77.78 -> X: 60 to 600
              const x = 60 + ((st.lng - 77.45) / (77.78 - 77.45)) * 540;
              const y = 520 - ((st.lat - 12.80) / (13.12 - 12.80)) * 490;

              const isCaaqms = st.type === 'CAAQMS';

              return (
                <g key={st.id} transform={`translate(${x}, ${y})`} className="cursor-pointer group">
                  {/* Pulsing ring for online sensors */}
                  {st.status === 'Online' && (
                    <circle
                      r={isCaaqms ? '9' : '6'}
                      fill="none"
                      stroke={isCaaqms ? '#38bdf8' : '#34d399'}
                      strokeWidth="1.5"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    r={isCaaqms ? '5' : '3.5'}
                    fill={isCaaqms ? '#0284c7' : '#10b981'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    filter="url(#glow)"
                  />
                  {/* Tooltip on hover */}
                  <title>{`${st.name} (${st.type}) - AQI: ${st.lastReadingAqi || 'N/A'}`}</title>
                </g>
              );
            })}
          </g>
        )}

        {/* 8. Active Incident Ticket Pins */}
        {showIncidents && (
          <g id="incident-pins">
            {tickets.map((tkt) => {
              const x = 60 + ((tkt.lng - 77.45) / (77.78 - 77.45)) * 540;
              const y = 520 - ((tkt.lat - 12.80) / (13.12 - 12.80)) * 490;

              return (
                <g key={tkt.id} transform={`translate(${x}, ${y})`} className="cursor-pointer">
                  <path
                    d="M 0 -12 C -6 -12 -9 -6 0 0 C 9 -6 6 -12 0 -12 Z"
                    fill={tkt.slaBreached ? '#ef4444' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="-7" r="2.5" fill="#ffffff" />
                  <title>{`[${tkt.category}] ${tkt.description} (${tkt.status})`}</title>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Active Zone Information Panel */}
      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-lg p-3 rounded-xl border border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-base font-bold text-white shadow-lg"
            style={{ backgroundColor: getAqiColor(dynamicActive.aqi) }}
          >
            {dynamicActive.aqi}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 font-display">
                {language === 'hi' ? activeZoneObj.hiName : activeZoneObj.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-teal-300 border border-teal-500/20">
                Ward #{activeZoneObj.wardNumber}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span>Band: <strong className="text-slate-200">{dynamicActive.band}</strong></span>
              <span>•</span>
              <span>Dominant: <strong className="text-amber-400 font-mono">{activeZoneObj.dominantPollutant}</strong></span>
              <span>•</span>
              <span>Clean Window: <strong className="text-emerald-400 font-mono">{activeZoneObj.cleanestWindow}</strong></span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#46a04a]"></span><span>0-50</span></div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#9dc84b]"></span><span>51-100</span></div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#e8b400]"></span><span>101-200</span></div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#ef8632]"></span><span>201-300</span></div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#e04b3d]"></span><span>301-400</span></div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#a4302a]"></span><span>401+</span></div>
        </div>
      </div>
    </div>
  );
};
