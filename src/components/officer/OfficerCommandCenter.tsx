import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BengaluruGisMap } from '../gis/BengaluruGisMap';
import {
  PREDICTIVE_EVENTS,
  DIGITAL_TWIN_SCENARIOS
} from '../../data/bengaluruData';

export const OfficerCommandCenter: React.FC = () => {
  const {
    zones,
    tickets,
    approveRemediation,
    transparencyLedger,
    language
  } = useApp();

  const [activeOfficerTab, setActiveOfficerTab] = useState<
    'triage' | 'predictive' | 'gaps' | 'budget' | 'digitalTwin' | 'ledger'
  >('triage');

  // Budget ROI Optimizer State
  const [budgetLakhs, setBudgetLakhs] = useState<number>(150); // ₹ 1.5 Crore default
  const [optimizationStrategy, setOptimizationStrategy] = useState<'Balanced' | 'MaxHealth' | 'SensorCoverage'>('Balanced');

  // Compute Pop-weighted city AQI
  const totalPop = zones.reduce((acc, z) => acc + z.populationDensity, 0);
  const popWeightedAqi = Math.round(
    zones.reduce((acc, z) => acc + z.aqi * z.populationDensity, 0) / totalPop
  );

  const openTickets = tickets.filter(t => t.status !== 'Resolved');
  const breachedSlaCount = tickets.filter(t => t.slaBreached && t.status !== 'Resolved').length;
  const highestRiskZone = [...zones].sort((a, b) => b.aqi - a.aqi)[0];

  // Budget ROI calculation logic
  const calculateBudgetAllocations = () => {
    const total = budgetLakhs;
    if (optimizationStrategy === 'MaxHealth') {
      return {
        antiSmogGuns: Math.round(total * 0.45),
        mechanizedSweepers: Math.round(total * 0.35),
        sensorNodes: Math.round(total * 0.10),
        greenCanopy: Math.round(total * 0.10),
        estimatedAqiImprovement: Math.round(total * 0.42),
        livesImpacted: Math.round(total * 1450)
      };
    } else if (optimizationStrategy === 'SensorCoverage') {
      return {
        antiSmogGuns: Math.round(total * 0.15),
        mechanizedSweepers: Math.round(total * 0.20),
        sensorNodes: Math.round(total * 0.50),
        greenCanopy: Math.round(total * 0.15),
        estimatedAqiImprovement: Math.round(total * 0.22),
        livesImpacted: Math.round(total * 980)
      };
    } else {
      // Balanced
      return {
        antiSmogGuns: Math.round(total * 0.30),
        mechanizedSweepers: Math.round(total * 0.30),
        sensorNodes: Math.round(total * 0.20),
        greenCanopy: Math.round(total * 0.20),
        estimatedAqiImprovement: Math.round(total * 0.34),
        livesImpacted: Math.round(total * 1200)
      };
    }
  };

  const budgetAlloc = calculateBudgetAllocations();

  return (
    <div className="space-y-6">
      {/* 1. Executive Operations HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-teal-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">POP-WEIGHTED CITY AQI</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{popWeightedAqi}</div>
          <div className="text-[10px] text-teal-400 mt-0.5">Citywide Average</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-amber-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">OPEN GRIEVANCES</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{openTickets.length}</div>
          <div className="text-[10px] text-amber-400 mt-0.5">{breachedSlaCount} Breached SLA</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-emerald-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">RESOLUTION RATE</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">92.4%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">30-Day Avg</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-cyan-500">
          <div className="text-[11px] font-mono text-slate-400 uppercase">AVG RESPONSE TIME</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">3.2 Hrs</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">▼ 18m faster than target</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-red-500 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">HIGHEST-RISK ZONE</div>
          <div className="text-lg font-bold font-display text-red-400 mt-1 truncate">{highestRiskZone.name}</div>
          <div className="text-[10px] text-red-300 font-mono">AQI {highestRiskZone.aqi} ({highestRiskZone.band})</div>
        </div>
      </div>

      {/* Main War Map Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
            <span>🗺️</span> Municipal GIS War Map & Real-time Layer Matrix
          </h3>
          <span className="text-xs font-mono text-teal-400">20 Zone Voronoi Clusters Active</span>
        </div>
        <BengaluruGisMap />
      </div>

      {/* Officer Workbench Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--card-border)] text-xs font-mono">
        <button
          onClick={() => setActiveOfficerTab('triage')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'triage'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🎯</span> Triage & AI Remediation DSS
        </button>

        <button
          onClick={() => setActiveOfficerTab('predictive')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'predictive'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>📅</span> Predictive Calendar
        </button>

        <button
          onClick={() => setActiveOfficerTab('gaps')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'gaps'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🔍</span> Infra Gap Detector
        </button>

        <button
          onClick={() => setActiveOfficerTab('budget')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'budget'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>💰</span> Budget ROI Optimizer
        </button>

        <button
          onClick={() => setActiveOfficerTab('digitalTwin')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'digitalTwin'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🧪</span> 52-Wk Digital Twin
        </button>

        <button
          onClick={() => setActiveOfficerTab('ledger')}
          className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeOfficerTab === 'ledger'
              ? 'bg-teal-700 text-white shadow-lg'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>📜</span> Public Audit Ledger
        </button>
      </div>

      {/* TAB 1: TRIAGE & AI REMEDIATION DSS */}
      {activeOfficerTab === 'triage' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
              <div>
                <h3 className="font-display font-bold text-xl text-slate-100">
                  Grievance Triage & AI Decision Support System (DSS)
                </h3>
                <p className="text-xs text-slate-400">
                  AI-ranked municipal remediation actions scored by Impact per ₹ Lakh & Citizen Reach
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {openTickets.length} Pending Action Queue
              </span>
            </div>

            <div className="space-y-6">
              {tickets.map((tkt) => (
                <div key={tkt.id} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-teal-400">{tkt.ticketNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{tkt.department}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">{tkt.zoneName}</span>
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-100 mt-1">
                        [{tkt.category}] {tkt.description}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold ${tkt.slaBreached ? 'text-red-400' : 'text-amber-400'}`}>
                        SLA: {tkt.slaDeadline}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">Status: {tkt.status}</span>
                    </div>
                  </div>

                  {/* AI Ranked Remediation Options */}
                  {tkt.aiRemediations && tkt.aiRemediations.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs font-mono font-semibold uppercase text-teal-300 flex items-center gap-1.5">
                        <span>🤖</span> Ranked AI Municipal Remediation Actions:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tkt.aiRemediations.map((rem) => (
                          <div
                            key={rem.id}
                            className={`p-4 rounded-2xl border transition text-xs space-y-3 ${
                              rem.approved
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                                : 'bg-slate-950 border-slate-800 hover:border-teal-500/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-display font-bold text-sm text-slate-100">
                                {rem.title}
                              </h5>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-900/50 text-teal-300 border border-teal-500/30 whitespace-nowrap">
                                Impact: {rem.impactPerLakh} / ₹Lakh
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] bg-slate-900 p-2 rounded-xl">
                              <div>
                                <span className="text-slate-400 block text-[9px]">DELTA AQI</span>
                                <span className="font-bold text-emerald-400">{rem.deltaAqi} AQI</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">REACH</span>
                                <span className="font-bold text-cyan-300">{rem.exposedCitizenReach.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">COST</span>
                                <span className="font-bold text-amber-300">₹{rem.operationalCostLakhs} L</span>
                              </div>
                            </div>

                            {rem.approved ? (
                              <div className="text-center font-mono font-bold text-emerald-400 bg-emerald-900/40 p-2 rounded-xl border border-emerald-500/40">
                                ✅ Approved & Logged to Transparency Ledger
                              </div>
                            ) : (
                              <button
                                onClick={() => approveRemediation(tkt.id, rem.id)}
                                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-display font-bold py-2 rounded-xl transition shadow text-xs uppercase"
                              >
                                Approve & Log Intervention
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No AI remediations generated yet.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIVE GOVERNANCE CALENDAR */}
      {activeOfficerTab === 'predictive' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>📅</span> Predictive Governance Calendar
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Proactive seasonal spike forecasts & automated pre-positioning action orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PREDICTIVE_EVENTS.map((evt) => (
              <div key={evt.id} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
                  <span className="text-teal-400 font-bold">{evt.dateRange}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    +{evt.projectedAqiSpike} AQI Spike
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-slate-100">
                  {evt.title}
                </h4>

                <p className="text-xs text-slate-300">
                  <strong className="text-slate-400">Cause:</strong> {evt.triggerCause}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono font-bold text-teal-300">Pre-Positioning Action Orders:</div>
                  <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                    {evt.prePositioningOrders.map((order, i) => (
                      <li key={i}>{order}</li>
                    ))}
                  </ul>
                </div>

                <button className="w-full bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono font-semibold py-2 rounded-xl transition text-xs border border-teal-500/30">
                  Issue Automated Order to Field Units
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INFRASTRUCTURE GAP DETECTOR */}
      {activeOfficerTab === 'gaps' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>🔍</span> Ward Infrastructure Gap Detector
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates sensing blindspots, green canopy deficit vs 33% national target, & solid waste transfer shortages.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3">Ward / Zone</th>
                  <th className="p-3">Canopy Cover (%)</th>
                  <th className="p-3">Target Deficit (%)</th>
                  <th className="p-3">Sensor Blindspot Score</th>
                  <th className="p-3">Waste Shortage Score</th>
                  <th className="p-3">Action Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {zones.map((z) => (
                  <tr key={z.id} className="hover:bg-slate-900/60 font-mono">
                    <td className="p-3 font-bold text-slate-100 font-display">{z.name} (Ward #{z.wardNumber})</td>
                    <td className="p-3">{z.canopyCoverPct}%</td>
                    <td className="p-3 font-bold text-amber-400">{z.canopyDeficitPct}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded ${z.sensorBlindspotScore >= 6 ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                        {z.sensorBlindspotScore} / 10
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded ${z.wasteTransferDeficit >= 6 ? 'bg-red-900/60 text-red-300' : 'bg-slate-800 text-slate-300'}`}>
                        {z.wasteTransferDeficit} / 10
                      </span>
                    </td>
                    <td className="p-3">
                      {z.canopyDeficitPct > 18 || z.sensorBlindspotScore >= 6 ? (
                        <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-[10px]">CRITICAL GAP</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-teal-800 text-teal-200 font-semibold text-[10px]">MODERATE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUDGET ROI OPTIMIZER */}
      {activeOfficerTab === 'budget' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>💰</span> Budget ROI & Resource Allocation Optimizer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Computes optimal capital allocation across anti-smog equipment, sensor density, and greenbelts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-6 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <div>
                <label className="font-mono text-xs font-semibold uppercase text-slate-300 block mb-2">
                  Total Available Capital Budget: <strong className="text-teal-300 text-sm">₹ {budgetLakhs} Lakhs (₹ {(budgetLakhs / 100).toFixed(2)} Cr)</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={budgetLakhs}
                  onChange={(e) => setBudgetLakhs(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="font-mono text-xs font-semibold uppercase text-slate-300 block mb-2">
                  Optimization Strategy
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'Balanced', label: '⚖️ Balanced Optimization (30% Dust, 30% Sweepers, 20% Sensors, 20% Trees)' },
                    { key: 'MaxHealth', label: '🫁 Maximum Health Impact (Focus on Dust Suppression & Anti-Smog)' },
                    { key: 'SensorCoverage', label: '📡 Sensor Grid Density (Eliminate Ward Blindspots First)' }
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setOptimizationStrategy(s.key as any)}
                      className={`w-full p-3 rounded-xl border text-left font-sans transition ${
                        optimizationStrategy === s.key
                          ? 'bg-teal-800 border-teal-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-300">
                Optimal Budget Allocation Output
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block">Anti-Smog Guns / Mist Towers</span>
                  <span className="text-lg font-bold text-teal-300">₹ {budgetAlloc.antiSmogGuns} Lakhs</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block">Mechanized Sweepers & Scrubbers</span>
                  <span className="text-lg font-bold text-cyan-300">₹ {budgetAlloc.mechanizedSweepers} Lakhs</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block">CAAQMS / Citizen Sensor Nodes</span>
                  <span className="text-lg font-bold text-purple-300">₹ {budgetAlloc.sensorNodes} Lakhs</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <span className="text-slate-400 block">Urban Miyawaki Green Canopy</span>
                  <span className="text-lg font-bold text-emerald-300">₹ {budgetAlloc.greenCanopy} Lakhs</span>
                </div>
              </div>

              <div className="bg-teal-900/30 p-4 rounded-2xl border border-teal-500/40 space-y-2 text-xs">
                <div className="font-bold font-display text-teal-300 text-sm">
                  Projected Environmental ROI:
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>Estimated City AQI Improvement: <strong className="text-emerald-400 font-bold">-{budgetAlloc.estimatedAqiImprovement} Delta AQI</strong></div>
                  <div>Exposed Citizens Protected: <strong className="text-cyan-300 font-bold">{budgetAlloc.livesImpacted.toLocaleString()} citizens</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 52-WEEK DIGITAL TWIN SANDBOX */}
      {activeOfficerTab === 'digitalTwin' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>🧪</span> 52-Week Digital Twin Intervention Sandbox
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate complex what-if intervention scenarios & neighborhood dispersion spillover before committing public funds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIGITAL_TWIN_SCENARIOS.map((scen) => (
              <div key={scen.id} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-display font-bold text-base text-slate-100">
                  {scen.name}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {scen.description}
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cost:</span>
                    <span className="text-amber-300 font-bold">₹ {scen.costLakhs} Lakhs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">City AQI Impact:</span>
                    <span className="text-emerald-400 font-bold">{scen.cityAqiBefore} ➔ {scen.cityAqiAfter} AQI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Neighborhood Spillover:</span>
                    <span className="text-cyan-300 font-bold">+{scen.neighborhoodSpilloverPct}% Benefit</span>
                  </div>
                </div>

                <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-display font-bold py-2 rounded-xl transition shadow text-xs uppercase">
                  Run Full 52-Wk Physics Simulation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PUBLIC TRANSPARENCY LEDGER */}
      {activeOfficerTab === 'ledger' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="border-b border-teal-500/20 pb-3">
            <h3 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
              <span>📜</span> Public Transparency & Action Audit Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Immutable public audit log of completed municipal interventions with sensor-verified before/after AQI readings.
            </p>
          </div>

          <div className="space-y-3">
            {transparencyLedger.map((audit) => (
              <div key={audit.id} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <h4 className="font-display font-bold text-sm text-slate-100">
                    {audit.actionTitle}
                  </h4>
                  <span className="font-mono text-[10px] text-teal-400">Logged: {audit.completedAt}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                  <div>Department: <strong className="text-slate-200">{audit.department}</strong></div>
                  <div>Zone: <strong className="text-slate-200">{audit.zoneName}</strong></div>
                  <div>AQI Delta: <strong className="text-emerald-400 font-bold">{audit.beforeAqi} ➔ {audit.afterAqi} AQI</strong></div>
                  <div>Cost: <strong className="text-amber-300 font-bold">₹ {audit.costLakhs} L</strong></div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 italic">
                  {audit.verifiedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
