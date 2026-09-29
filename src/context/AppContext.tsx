import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Language,
  AppRole,
  ZoneCluster,
  HealthConditions,
  IncidentTicket,
  TransparencyAuditLog,
  ChatMessage,
  AQIBand
} from '../types';
import {
  INITIAL_ZONES,
  INITIAL_GRIEVANCES,
  TRANSPARENCY_LEDGER,
  TRANSLATIONS
} from '../data/bengaluruData';

interface AppContextType {
  language: Language;
  toggleLanguage: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  role: AppRole;
  setRole: (r: AppRole) => void;
  activeZoneId: string;
  setActiveZoneId: (id: string) => void;
  activeZone: ZoneCluster;
  zones: ZoneCluster[];
  simulationHour: number;
  setSimulationHour: (hour: number) => void;
  getDynamicAqi: (zone: ZoneCluster) => {
    aqi: number;
    band: AQIBand;
    windSpeed: number;
    mixingHeight: number;
  };
  healthConditions: HealthConditions;
  toggleHealthCondition: (key: keyof HealthConditions) => void;
  healthVulnerabilityScore: number;
  tickets: IncidentTicket[];
  addTicket: (ticket: Omit<IncidentTicket, 'id' | 'ticketNumber' | 'createdAt' | 'upvotes' | 'exifStripped' | 'officerChatLog'>) => IncidentTicket;
  upvoteTicket: (ticketId: string) => void;
  approveRemediation: (ticketId: string, remediationId: string) => void;
  transparencyLedger: TransparencyAuditLog[];
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
  speakText: (text: string) => void;
  isSpeaking: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [role, setRole] = useState<AppRole>('citizen');
  const [activeZoneId, setActiveZoneId] = useState<string>('peenya');
  const [simulationHour, setSimulationHour] = useState<number>(9); // 09:00 AM peak inversion
  const [zones, setZones] = useState<ZoneCluster[]>(INITIAL_ZONES);
  const [tickets, setTickets] = useState<IncidentTicket[]>(INITIAL_GRIEVANCES);
  const [transparencyLedger, setLedger] = useState<TransparencyAuditLog[]>(TRANSPARENCY_LEDGER);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Health Profile state
  const [healthConditions, setHealthConditions] = useState<HealthConditions>({
    asthmaCopd: true,
    cardiovascular: false,
    childrenUnder12: true,
    elderly60Plus: false,
    pregnancy: false,
    outdoorWorker: false
  });

  // Initial greeting chat message
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Namaskara! I am VayuRakshak AI Copilot. How can I assist you today with Bengaluru air quality, health advisories, or civic ticket reporting?',
      textHi: 'नमस्कार! मैं वायुरक्षक एआई कोपायलट हूं। आज मैं बेंगलुरु की वायु गुणवत्ता, स्वास्थ्य सलाह या नागरिक शिकायत दर्ज करने में आपकी कैसे मदद कर सकता हूं?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickChips: [
        'Can my child play outside in Peenya at 5 PM?',
        'Report open waste burning near my ward',
        'Which wards breached SLA today?',
        'Optimal intervention for Silk Board'
      ]
    }
  ]);

  // Dark mode side-effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleLanguage = () => setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const activeZone = zones.find(z => z.id === activeZoneId) || zones[0];

  // Dynamic Diurnal Curve calculation
  const getDynamicAqi = (zone: ZoneCluster) => {
    let multiplier = 1.0;
    let windSpeed = 3.2; // m/s
    let mixingHeight = 450; // meters

    if (simulationHour >= 7 && simulationHour <= 10) {
      // Morning inversion & rush hour
      multiplier = 1.28;
      windSpeed = 1.5;
      mixingHeight = 210;
    } else if (simulationHour >= 13 && simulationHour <= 16) {
      // Afternoon thermal dispersion
      multiplier = 0.76;
      windSpeed = 5.4;
      mixingHeight = 820;
    } else if (simulationHour >= 19 && simulationHour <= 22) {
      // Evening rush hour
      multiplier = 1.22;
      windSpeed = 2.1;
      mixingHeight = 310;
    } else {
      multiplier = 0.95;
      windSpeed = 2.8;
      mixingHeight = 420;
    }

    const calculatedAqi = Math.round(zone.aqi * multiplier);

    let band: AQIBand = 'Good';
    if (calculatedAqi <= 50) band = 'Good';
    else if (calculatedAqi <= 100) band = 'Satisfactory';
    else if (calculatedAqi <= 200) band = 'Moderate';
    else if (calculatedAqi <= 300) band = 'Poor';
    else if (calculatedAqi <= 400) band = 'Very Poor';
    else band = 'Severe';

    return { aqi: calculatedAqi, band, windSpeed, mixingHeight };
  };

  // Health vulnerability score calculation (0 - 100)
  const toggleHealthCondition = (key: keyof HealthConditions) => {
    setHealthConditions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dynamicAqiVal = getDynamicAqi(activeZone).aqi;

  let riskMultiplier = 1.0;
  if (healthConditions.asthmaCopd) riskMultiplier += 0.45;
  if (healthConditions.cardiovascular) riskMultiplier += 0.35;
  if (healthConditions.childrenUnder12) riskMultiplier += 0.25;
  if (healthConditions.elderly60Plus) riskMultiplier += 0.30;
  if (healthConditions.pregnancy) riskMultiplier += 0.30;
  if (healthConditions.outdoorWorker) riskMultiplier += 0.40;

  const rawScore = (dynamicAqiVal / 400) * 50 * riskMultiplier;
  const healthVulnerabilityScore = Math.min(100, Math.round(rawScore));

  // Add Incident Ticket
  const addTicket = (data: Omit<IncidentTicket, 'id' | 'ticketNumber' | 'createdAt' | 'upvotes' | 'exifStripped' | 'officerChatLog'>) => {
    const newId = `tkt-${Date.now().toString().slice(-4)}`;
    const ticketNum = `BLR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: IncidentTicket = {
      ...data,
      id: newId,
      ticketNumber: ticketNum,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      exifStripped: true,
      officerChatLog: [
        {
          sender: 'System',
          message: `Ticket automatically routed to ${data.department} under ${data.slaHours}h statutory SLA. Location coarsened to 250m grid cell for privacy protection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const upvoteTicket = (ticketId: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, upvotes: t.upvotes + 1 } : t))
    );
  };

  // Approve & Log Remediation
  const approveRemediation = (ticketId: string, remediationId: string) => {
    setTickets(prev =>
      prev.map(ticket => {
        if (ticket.id === ticketId) {
          const updatedRemediations = ticket.aiRemediations?.map(rem => {
            if (rem.id === remediationId) {
              // Add to public audit log
              const newAudit: TransparencyAuditLog = {
                id: `aud-${Date.now().toString().slice(-4)}`,
                actionTitle: rem.title,
                department: rem.department,
                zoneName: ticket.zoneName,
                completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
                beforeAqi: activeZone.aqi,
                afterAqi: Math.max(25, activeZone.aqi + rem.deltaAqi),
                verifiedBy: `Verified by ${rem.department} Officer (Real-time CAAQMS Sensor Audit)`,
                costLakhs: rem.operationalCostLakhs
              };
              setLedger(l => [newAudit, ...l]);

              // Update zone AQI in state
              setZones(zList =>
                zList.map(z =>
                  z.id === ticket.zoneId
                    ? { ...z, aqi: Math.max(25, z.aqi + rem.deltaAqi) }
                    : z
                )
              );

              return { ...rem, approved: true };
            }
            return rem;
          });

          return {
            ...ticket,
            status: 'Resolved' as const,
            aiRemediations: updatedRemediations,
            officerChatLog: [
              ...ticket.officerChatLog,
              {
                sender: 'Officer Command System',
                message: `Remediation action approved and initiated. Expected delta AQI improvement logged to Public Transparency Register.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          };
        }
        return ticket;
      })
    );
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const t = (key: keyof typeof TRANSLATIONS.en) => TRANSLATIONS[language][key] || key;

  return (
    <AppContext.Provider
      value={{
        language,
        toggleLanguage,
        darkMode,
        toggleDarkMode,
        role,
        setRole,
        activeZoneId,
        setActiveZoneId,
        activeZone,
        zones,
        simulationHour,
        setSimulationHour,
        getDynamicAqi,
        healthConditions,
        toggleHealthCondition,
        healthVulnerabilityScore,
        tickets,
        addTicket,
        upvoteTicket,
        approveRemediation,
        transparencyLedger,
        chatMessages,
        addChatMessage,
        isChatOpen,
        setIsChatOpen,
        t,
        speakText,
        isSpeaking
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
