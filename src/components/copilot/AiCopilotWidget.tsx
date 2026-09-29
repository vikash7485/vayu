import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const AiCopilotWidget: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    addChatMessage,
    activeZone,
    getDynamicAqi,
    healthConditions,
    healthVulnerabilityScore,
    addTicket,
    tickets,
    language,
    speakText,
    isSpeaking,
    t
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const dynamicZone = getDynamicAqi(activeZone);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  // Voice Input Speech Recognition Handler
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      // Fallback voice simulation
      setIsListening(true);
      setTimeout(() => {
        setInputQuery(
          language === 'hi'
            ? 'पीन्या औद्योगिक क्षेत्र में हवा का स्तर कैसा है?'
            : 'Can my asthmatic child play outside in Peenya at 5 PM?'
        );
        setIsListening(false);
      }, 1500);
    }
  };

  // AI Response Processing Engine
  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    // 1. Add User Message
    addChatMessage({ sender: 'user', text: textToSend });
    if (!queryText) setInputQuery('');

    // Process Response after brief simulated AI latency
    setTimeout(() => {
      const lower = textToSend.toLowerCase();

      // Case A: Conversational Incident Filing
      if (
        lower.includes('smoke') ||
        lower.includes('burning') ||
        lower.includes('dust') ||
        lower.includes('factory') ||
        lower.includes('report') ||
        lower.includes('froth')
      ) {
        let cat: 'Open Burning' | 'Construction/Road Dust' | 'Industrial Smoke' | 'Vehicular Idling' | 'DG Sets' | 'Tree Loss' | 'Lake Froth' | 'Sensor Fault' = 'Open Burning';
        let dept: 'BBMP' | 'KSPCB' | 'Traffic Police' | 'BWSSB' = 'BBMP';

        if (lower.includes('factory') || lower.includes('smoke') || lower.includes('industrial')) {
          cat = 'Industrial Smoke';
          dept = 'KSPCB';
        } else if (lower.includes('dust') || lower.includes('construction')) {
          cat = 'Construction/Road Dust';
          dept = 'BBMP';
        } else if (lower.includes('froth') || lower.includes('lake')) {
          cat = 'Lake Froth';
          dept = 'BWSSB';
        }

        const newTkt = addTicket({
          category: cat,
          categoryHi: cat,
          description: textToSend,
          zoneId: activeZone.id,
          zoneName: activeZone.name,
          coarsenedLocation: `Grid Cell ${activeZone.name.substring(0, 3).toUpperCase()}-250m`,
          lat: activeZone.centerLat,
          lng: activeZone.centerLng,
          slaDeadline: '24 Hours (Active SLA)',
          slaHours: 24,
          slaBreached: false,
          department: dept,
          status: 'Submitted',
          hasPhoto: false
        });

        const reply = language === 'hi'
          ? `आपकी शिकायत स्वचालित रूप से दर्ज कर ली गई है! टिकट नंबर #${newTkt.ticketNumber} ${dept} विभाग को 24-घंटे की एसएलए समय-सीमा के तहत भेजा गया है।`
          : `I have automatically parsed your report and generated Civic Ticket #${newTkt.ticketNumber}! Assigned to ${dept} under 24h statutory SLA. Location coarsened to 250m grid for privacy.`;

        addChatMessage({
          sender: 'ai',
          text: reply,
          textHi: reply,
          ticketCreated: newTkt,
          quickChips: ['Track ticket status', 'View ticket in My Grievances', 'Speak with officer']
        });

        speakText(reply);
        return;
      }

      // Case B: Officer Copilot Querying
      if (lower.includes('breached') || lower.includes('sla') || lower.includes('wards') || lower.includes('officer')) {
        const breachedList = tickets.filter(t => t.slaBreached);
        const reply = `Currently, ${breachedList.length} ticket(s) have breached SLA deadlines in Bengaluru. The highest priority breach is #${breachedList[0]?.ticketNumber || 'BLR-2026-0892'} in Silk Board due to vehicular congestion. Recommended action: Approve green corridor signal sequence.`;

        addChatMessage({
          sender: 'ai',
          text: reply,
          quickChips: ['Show Silk Board remediations', 'View Executive HUD', 'Dispatch patrol unit']
        });

        speakText(reply);
        return;
      }

      // Case C: Intervention / Silk Board query
      if (lower.includes('intervention') || lower.includes('silk board') || lower.includes('budget') || lower.includes('50 lakh')) {
        const reply = `For Silk Board / BTM under ₹50 Lakh, the optimal AI-ranked intervention is: 'Activate Adaptive Green Corridor Signal Sequence' (Delta AQI: -38, Citizen Reach: 85,000, Cost: ₹4.5 Lakhs). Yields 8.5 Impact per ₹ Lakh.`;

        addChatMessage({
          sender: 'ai',
          text: reply,
          quickChips: ['Approve Silk Board intervention', 'Open Budget ROI Optimizer', 'Run Digital Twin']
        });

        speakText(reply);
        return;
      }

      // Case D: Health Advisory query (Default Grounded Response)
      const isAsthmatic = healthConditions.asthmaCopd || lower.includes('asthma');
      const safeWindow = activeZone.cleanestWindow;

      const replyEn = `Based on live ground readings in ${activeZone.name} (AQI ${dynamicZone.aqi}, ${dynamicZone.band}): ${
        isAsthmatic
          ? `Because your profile indicates asthma sensitivity, outdoor activity during peak inversion (08:00-10:00 AM) is unsafe. The cleanest window in ${activeZone.name} today is ${safeWindow}. Please use an N95 mask if outdoors at 5 PM.`
          : `Air quality is ${dynamicZone.band}. The cleanest 3-hour window is ${safeWindow}. Moderate outdoor activity is safe.`
      }`;

      const replyHi = `${activeZone.hiName} (एक्यूआई ${dynamicZone.aqi}) में लाइव रीडिंग के आधार पर: ${
        isAsthmatic
          ? `आपके प्रोफ़ाइल में अस्थमा की संवेदनशीलता के कारण, सुबह 08:00-10:00 बजे के दौरान बाहर जाना असुरक्षित है। आज ${activeZone.hiName} में सबसे स्वच्छ समय ${safeWindow} है।`
          : `वायु गुणवत्ता ${dynamicZone.band} है। सबसे स्वच्छ समय ${safeWindow} है।`
      }`;

      addChatMessage({
        sender: 'ai',
        text: replyEn,
        textHi: replyHi,
        quickChips: [
          `What is the cleanest window in ${activeZone.name}?`,
          'Report an incident in my ward',
          'Switch to Government Officer mode'
        ]
      });

      speakText(language === 'hi' ? replyHi : replyEn);
    }, 600);
  };

  return (
    <>
      {/* Floating Copilot Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-500 text-white p-4 rounded-full shadow-2xl border-2 border-teal-300 transition-all transform hover:scale-105 flex items-center gap-2 font-display font-bold text-sm"
      >
        <span className="text-xl animate-bounce">🤖</span>
        <span className="hidden sm:inline">VayuRakshak AI</span>
      </button>

      {/* Expandable Chat Modal / Overlay */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-teal-500/40">
          {/* Header */}
          <div className="bg-slate-900/90 p-4 border-b border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-700 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                🤖
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-100 text-sm">
                  VayuRakshak AI Copilot
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-teal-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Grounded in {activeZone.name} (AQI {dynamicZone.aqi})</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white text-lg font-bold p-1"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed font-sans shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-teal-700 text-white rounded-br-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  <p>{language === 'hi' && msg.textHi ? msg.textHi : msg.text}</p>

                  {/* Created Ticket Card inside Chat */}
                  {msg.ticketCreated && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-teal-500/40 font-mono text-[11px] space-y-1">
                      <div className="font-bold text-teal-300">🎟️ Civic Ticket Created #{msg.ticketCreated.ticketNumber}</div>
                      <div>Category: {msg.ticketCreated.category}</div>
                      <div>Department: {msg.ticketCreated.department}</div>
                      <div className="text-amber-400">SLA: {msg.ticketCreated.slaDeadline}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-1.5 pt-1 border-t border-slate-800">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => speakText(language === 'hi' && msg.textHi ? msg.textHi : msg.text)}
                        className="text-teal-400 hover:underline ml-2"
                      >
                        🔊 {isSpeaking ? 'Speaking...' : 'Listen'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Action Chips */}
                {msg.quickChips && msg.quickChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickChips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="text-[10px] bg-slate-800/80 hover:bg-teal-900/80 text-teal-200 border border-teal-500/30 px-2.5 py-1 rounded-full transition text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-slate-900/90 border-t border-teal-500/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-800 text-teal-300 hover:bg-slate-700'
                }`}
                title="Voice Input (EN/HI)"
              >
                🎙️
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? 'Listening...' : t('askCopilot')}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-sans"
              />

              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold p-2.5 rounded-xl transition"
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
