export type Language = 'en' | 'hi';
export type AppRole = 'citizen' | 'officer';

export type AQIBand = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface PollutantValues {
  pm25: number; // ug/m3
  pm10: number; // ug/m3
  no2: number;  // ppb or ug/m3
  so2: number;  // ug/m3
  co: number;   // mg/m3
  o3: number;   // ug/m3
}

export interface PollutantLimits {
  pm25: number; // statutory limit e.g. 60
  pm10: number; // statutory limit e.g. 100
  no2: number;  // 80
  so2: number;  // 80
  co: number;   // 2.0
  o3: number;   // 100
}

export interface SourceBreakdown {
  industrial: number; // percentage %
  vehicular: number;
  construction: number;
  openBurning: number;
  residential: number;
}

export interface StationNode {
  id: string;
  name: string;
  type: 'CAAQMS' | 'RWA_LowCost';
  lat: number;
  lng: number;
  zoneId: string;
  status: 'Online' | 'Calibration' | 'Offline';
  lastReadingAqi: number;
}

export interface ZoneCluster {
  id: string;
  name: string;
  hiName: string;
  wardNumber: number;
  centerLat: number;
  centerLng: number;
  polygonSvg: string; // SVG path or polygon points string
  aqi: number;
  band: AQIBand;
  dominantPollutant: 'PM2.5' | 'PM10' | 'NO2' | 'SO2' | 'CO' | 'O3';
  cleanestWindow: string; // e.g. "14:00 - 17:00"
  pollutants: PollutantValues;
  sources: SourceBreakdown;
  stationCount: number;
  populationDensity: number; // per sq km
  canopyCoverPct: number;    // e.g. 18.5%
  canopyDeficitPct: number; // e.g. 14.5% vs 33% target
  wasteTransferDeficit: number; // score 1-10
  sensorBlindspotScore: number; // score 1-10
}

export interface HealthConditions {
  asthmaCopd: boolean;
  cardiovascular: boolean;
  childrenUnder12: boolean;
  elderly60Plus: boolean;
  pregnancy: boolean;
  outdoorWorker: boolean;
}

export interface IncidentTicket {
  id: string;
  ticketNumber: string;
  category: 'Open Burning' | 'Construction/Road Dust' | 'Industrial Smoke' | 'Vehicular Idling' | 'DG Sets' | 'Tree Loss' | 'Lake Froth' | 'Sensor Fault';
  categoryHi: string;
  description: string;
  zoneId: string;
  zoneName: string;
  coarsenedLocation: string; // e.g., "Grid Cell 44B (250m coarsened)"
  lat: number;
  lng: number;
  createdAt: string; // ISO string or time label
  slaDeadline: string; // e.g., "24 Hours (Expires in 14h 20m)"
  slaHours: number;
  slaBreached: boolean;
  department: 'BBMP' | 'KSPCB' | 'Traffic Police' | 'BWSSB';
  status: 'Submitted' | 'Acknowledged' | 'In Progress' | 'Resolved';
  upvotes: number;
  hasPhoto: boolean;
  photoUrl?: string;
  exifStripped: boolean;
  officerChatLog: {
    sender: string;
    message: string;
    timestamp: string;
  }[];
  aiRemediations?: AIRemediationAction[];
}

export interface AIRemediationAction {
  id: string;
  title: string;
  titleHi: string;
  actionType: 'Anti-smog Sprinkler' | 'EV Corridor Reroute' | 'Industrial Stack Audit' | 'Waste Patrol Deployment' | 'Mechanized Sweeper';
  impactPerLakh: number; // Delta AQI / ₹ Lakh
  deltaAqi: number; // e.g. -18 AQI
  exposedCitizenReach: number; // e.g. 45,000 citizens
  operationalCostLakhs: number; // e.g. ₹ 4.5 Lakhs
  department: 'BBMP' | 'KSPCB' | 'Traffic Police' | 'BWSSB';
  approved: boolean;
}

export interface PredictiveEvent {
  id: string;
  title: string;
  titleHi: string;
  dateRange: string;
  zoneId: string;
  projectedAqiSpike: number; // e.g. +85 AQI
  triggerCause: string;
  prePositioningOrders: string[];
  status: 'Upcoming' | 'Active' | 'Mitigated';
}

export interface DigitalTwinScenario {
  id: string;
  name: string;
  description: string;
  interventionType: 'Greenbelts' | 'Anti-smog guns' | 'Mechanized sweepers' | 'E-bus loops';
  targetZones: string[];
  cityAqiBefore: number;
  cityAqiAfter: number;
  neighborhoodSpilloverPct: number;
  costLakhs: number;
}

export interface TransparencyAuditLog {
  id: string;
  actionTitle: string;
  department: string;
  zoneName: string;
  completedAt: string;
  beforeAqi: number;
  afterAqi: number;
  verifiedBy: string;
  costLakhs: number;
}

export interface HourlyForecast {
  hour: string; // "14:00"
  aqi: number;
  lowerBound: number;
  upperBound: number;
  windSpeed: number; // m/s
  mixingHeight: number; // m
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  textHi?: string;
  timestamp: string;
  quickChips?: string[];
  ticketCreated?: IncidentTicket;
}
