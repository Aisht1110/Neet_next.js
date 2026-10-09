import {
  CutoffRecord,
  RoundInfo,
  CollegeIndexEntry,
  PredictionResult,
  PredictedCutoffDetails,
  StrategyPillar,
  ChanceTier,
  CollegeType,
  PredictorQuery,
  MasterCollege
} from './types';
import { scoreToRank } from './scoreToRank';

export const quotaMap: Record<string, string[]> = {
  'All India': ['All India'],
  'Open Seat Quota': ['Open Seat Quota'],
  'Deemed/Paid Seats Quota': ['Deemed/Paid Seats Quota'],
  'Delhi University Quota': ['Delhi University Quota'],
  'IP University Quota': ['IP University Quota'],
  'Employees State Insurance Scheme(ESI)': [
    'Employees State Insurance Scheme(ESI)',
    'Employees State Insurance Scheme Nursing Quota (ESI- IP Quota Nursing)'
  ],
  'Aligarh Muslim University (AMU) Quota': [
    'Aligarh Muslim University (AMU) Quota',
    '(AMU) Self finance All India',
    '(AMU)Self finance internal'
  ],
  'Internal -Puducherry UT Domicile': ['Internal -Puducherry UT Domicile'],
  'Non-Resident Indian': [
    'Non-Resident Indian',
    'Non-Resident Indian(AMU)Quota',
    'Non-Resident Indian(Jamia)Quota'
  ],
  'Muslim Minority Quota': [
    'Muslim Minority Quota',
    'Muslim Quota',
    'Muslim OBC Quota',
    'Muslim ST Quota',
    'Muslim Women Quota'
  ],
  'Jain Minority Quota': ['Jain Minority Quota'],
};

export const modeHints: Record<string, string> = {
  best: 'Shows the most favorable closing rank from the latest available year across all rounds — compares both 2024 & 2025 cutoffs',
  trend: 'Analyzes historical Year-over-Year (YoY) closing rank shifts between 2024 and 2025. Empirical historical data — not a future guarantee.',
  '2025': 'Shows closing ranks from 2025 MCC counselling data (best across available R2, R3, Special Stray rounds)',
  '2024': 'Shows closing ranks from 2024 MCC counselling data (best across R1, R2, R3, Stray rounds)',
  round1: 'Filters for Round 1 closing ranks only — stricter early round cutoffs (2024 data)',
  round2: 'Filters for Round 2 closing ranks only',
  round3: 'Filters for Round 3 closing ranks only — wider cutoff margins',
  stray: 'Filters for Stray & Special Stray Vacancy round closing ranks — final seat allocations'
};

export function normalizeCategoryName(raw: string): string {
  if (!raw) return 'Open';
  const cat = String(raw).trim();
  const map: Record<string, string> = {
    'Open': 'Open', 'General': 'Open', 'GN': 'Open', 'OP': 'Open',
    'OBC': 'OBC', 'BC': 'OBC', 'OBC-NCL': 'OBC',
    'SC': 'SC',
    'ST': 'ST',
    'EWS': 'EWS', 'EW': 'EWS', 'General-EWS': 'EWS',
    'Open PwD': 'Open PwD', 'General PwD': 'Open PwD', 'GN PwD': 'Open PwD', 'OP PwD': 'Open PwD',
    'OBC PwD': 'OBC PwD', 'BC PwD': 'OBC PwD', 'OBC-NCL PwD': 'OBC PwD',
    'SC PwD': 'SC PwD',
    'ST PwD': 'ST PwD',
    'EWS PwD': 'EWS PwD', 'EW PwD': 'EWS PwD'
  };
  if (map[cat]) return map[cat];
  for (const [k, v] of Object.entries(map)) {
    if (cat.toLowerCase() === k.toLowerCase()) return v;
  }
  if (cat.toLowerCase().includes('pwd') || cat.toLowerCase().includes('disability')) {
    const base = cat.split(/pwd/i)[0].trim();
    return `${normalizeCategoryName(base)} PwD`;
  }
  return cat;
}

export function normalizeRoundNameStr(rnd: string | number): string {
  const s = String(rnd).trim();
  if (s === '1' || s.toLowerCase() === 'round 1') return 'Round 1';
  if (s === '2' || s.toLowerCase() === 'round 2') return 'Round 2';
  if (s === '3' || s.toLowerCase() === 'round 3') return 'Round 3';
  if (s.toLowerCase() === 'special_stray' || s.toLowerCase().includes('special stray')) return 'Special Stray Vacancy';
  if (s.toLowerCase() === 'stray' || s.toLowerCase().includes('stray vacancy')) return 'Stray Vacancy';
  return s;
}

export function normalizeQuota(raw: string): string {
  if (!raw) return 'All India';
  let q = String(raw).trim().replace(/\s+/g, ' ');
  const qLower = q.toLowerCase();
  const qClean = qLower.replace(/\s+/g, '');
  if (qClean.includes('ipuniversity') || (qClean.includes('ipu') && qClean.includes('quota'))) return 'IP University Quota';
  if (qClean.includes('delhiuniversity') || (qClean.includes('du') && qClean.includes('quota'))) return 'Delhi University Quota';
  if (qLower.includes('foreign')) return 'Foreign Country Quota';
  if (qLower.includes('all india') || qLower === 'aiq' || qClean === 'allindiaquota') return 'All India';
  if (qClean.includes('openseat')) return 'Open Seat Quota';
  if (qClean.includes('deemed')) return 'Deemed/Paid Seats Quota';
  if (qClean.includes('employeesstate') || qClean.includes('esic') || qClean.includes('esi')) return 'Employees State Insurance Scheme(ESI)';
  if (qClean.includes('aligarh') || qClean.includes('amu')) return 'Aligarh Muslim University (AMU) Quota';
  if (qClean.includes('puducherry') || qClean.includes('pondicherry')) return 'Internal -Puducherry UT Domicile';
  if (qClean.includes('nonresident') || qClean.includes('nri')) return 'Non-Resident Indian';
  if (qClean.includes('muslimminority') || qClean.includes('muslimquota')) return 'Muslim Minority Quota';
  if (qClean.includes('jainminority')) return 'Jain Minority Quota';
  return q;
}

export function cleanName(raw: string): string {
  if (!raw) return '';
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/Govern\s*men\s*t/gi, 'Government');
  cleaned = cleaned.replace(/GOVERNMEN\s*T/gi, 'Government');
  cleaned = cleaned.replace(/GOVT\.?\s*/gi, 'Government ');
  cleaned = cleaned.replace(/MED\.?\s*COLL\.?/gi, 'MEDICAL COLLEGE');
  cleaned = cleaned.replace(/DENT\.?\s*COLL\.?/gi, 'DENTAL COLLEGE');
  cleaned = cleaned.replace(/INST\.?\s*OF/gi, 'INSTITUTE OF');
  cleaned = cleaned.replace(/HOSP\.?/gi, 'HOSPITAL');
  cleaned = cleaned.replace(/AIIMS[\-,\s]+/gi, 'AIIMS, ');
  cleaned = cleaned.replace(/\s*,\s*/g, ', ');
  cleaned = cleaned.replace(/,\s*(,\s*)+/g, ', ');
  cleaned = cleaned.replace(/\s+/g, ' ');

  const parts = cleaned.split(',');
  let name = parts[0].trim();
  if (parts.length > 1 && parts[1].trim().length < 30 && !parts[1].match(/\d{6}/)) {
    name = parts[0].trim() + ', ' + parts[1].trim();
  }
  return name;
}

export function extractState(raw: string): string {
  if (!raw) return '';
  const stateMatch = raw.match(/,\s*([\w\s&]+),\s*\d{6}\s*$/);
  if (stateMatch) return stateMatch[1].trim();
  const knownStates = [
    'Delhi (NCT)', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Kerala', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Odisha', 'Telangana', 'Andhra Pradesh', 'Bihar', 'Punjab',
    'Haryana', 'Chhattisgarh', 'Uttarakhand', 'Jharkhand', 'Assam', 'Himachal Pradesh', 'Puducherry',
    'Jammu And Kashmir', 'Chandigarh', 'Goa', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'
  ];
  for (const s of knownStates) {
    if (raw.includes(s)) return s.replace(' (NCT)', '');
  }
  if (/\bU\.?P\.?\b/i.test(raw)) return 'Uttar Pradesh';
  if (/\bM\.?P\.?\b/i.test(raw)) return 'Madhya Pradesh';
  if (/\bA\.?P\.?\b/i.test(raw)) return 'Andhra Pradesh';
  if (/\bT\.?N\.?\b/i.test(raw)) return 'Tamil Nadu';
  if (/\bW\.?B\.?\b/i.test(raw)) return 'West Bengal';
  if (/\bH\.?P\.?\b/i.test(raw)) return 'Himachal Pradesh';
  if (/\bJ\s*&\s*K\b/i.test(raw)) return 'Jammu And Kashmir';
  if (/\bU\.?K\.?\b/i.test(raw) || /\bUT\b/i.test(raw)) return 'Uttarakhand';
  return '';
}

export function getCollegeType(institute: string, quota: string = ''): CollegeType {
  const name = (institute || '').toUpperCase();
  const q = (quota || '').toUpperCase();

  if (name.includes('AIIMS')) return { type: 'AIIMS', cls: 'ctype-aiims', label: 'AIIMS' };
  if (name.includes('JIPMER')) return { type: 'JIPMER', cls: 'ctype-jipmer', label: 'JIPMER' };
  if (name.includes('EMPLOYEES STATE') || name.includes('ESIC') || name.includes('ESI ') || q.includes('ESI')) {
    return { type: 'ESI', cls: 'ctype-esi', label: 'ESI' };
  }

  if (
    q.includes('DEEMED') || name.includes('DEEMED') || name.includes('SRM') || name.includes('MANIPAL') ||
    name.includes('KASTURBA') || name.includes('RAMACHANDRA') || name.includes('AMRITA') || name.includes('SAVEETHA') ||
    name.includes('SHARDA') || name.includes('MGM') || name.includes('D.Y.') || name.includes('BHARATI') ||
    name.includes('DATTA MEGHE') || name.includes('HAMDARD') || name.includes('PRAVARA') || name.includes('KRISHNA') ||
    name.includes('SYMBIOSIS') || name.includes('MEENAKSHI') || name.includes('YENEPOYA') || name.includes('JSS') ||
    name.includes('SDM ') || name.includes('VELS') || name.includes('BALAJI') || name.includes('VINAYAKA') ||
    name.includes('ACS') || name.includes('CHETTINAD') || name.includes('GITAM') || name.includes('KLE ')
  ) {
    return { type: 'Deemed', cls: 'ctype-deemed', label: 'DEEMED' };
  }

  if (
    q.includes('AMU') || q.includes('BHU') || q.includes('DELHI UNIVERSITY') || q.includes('IP UNIVERSITY') ||
    q.includes('JAMIA') || name.includes('BANARAS HINDU') || name.includes('ALIGARH MUSLIM') || name.includes('JAMIA MILLIA')
  ) {
    return { type: 'Central', cls: 'ctype-central', label: 'CENTRAL' };
  }

  return { type: 'Government', cls: 'ctype-govt', label: 'GOVT' };
}

export function predictSingleRound(
  rounds: RoundInfo[],
  targetRoundName: string,
  inputSource: 'rank' | 'score' = 'rank'
): PredictedCutoffDetails | null {
  const round2024 = rounds.find(r => String(r.year) === '2024' && r.round === targetRoundName);
  const round2025 = rounds.find(r => String(r.year) === '2025' && r.round === targetRoundName);

  const c2024 = round2024 && round2024.closing_rank > 0 ? round2024.closing_rank : null;
  const c2025 = round2025 && round2025.closing_rank > 0 ? round2025.closing_rank : null;

  if (c2024 === null && c2025 === null) return null;

  if (c2024 !== null && c2025 !== null) {
    const baseForecast = Math.round(c2024 * 0.40 + c2025 * 0.60);
    const delta = c2025 - c2024;
    const avg = (c2024 + c2025) / 2;
    const relDiff = avg > 0 ? Math.abs(delta) / avg : 0;

    let volatility: 'low' | 'medium' | 'high' = 'low';
    let lowerBound: number, upperBound: number;
    let confidence: 'low' | 'medium' | 'high' = inputSource === 'score' ? 'medium' : 'high';
    let trend: 'stable' | 'opening' | 'tightening' = 'stable';

    if (delta > c2024 * 0.06) {
      trend = 'opening';
    } else if (delta < -c2024 * 0.06) {
      trend = 'tightening';
    }

    if (relDiff <= 0.08) {
      volatility = 'low';
      lowerBound = Math.round(Math.min(c2024, c2025, baseForecast) * 0.96);
      upperBound = Math.round(Math.max(c2024, c2025, baseForecast) * 1.04);
    } else if (relDiff <= 0.20) {
      volatility = 'medium';
      lowerBound = Math.round(Math.min(c2024, c2025, baseForecast) * 0.94);
      upperBound = Math.round(Math.max(c2024, c2025, baseForecast) * 1.06);
      if (inputSource === 'score') confidence = 'low';
    } else {
      volatility = 'high';
      lowerBound = Math.round(Math.min(c2024, c2025, baseForecast) * 0.90);
      upperBound = Math.round(Math.max(c2024, c2025, baseForecast) * 1.10);
      confidence = inputSource === 'score' ? 'low' : 'medium';
    }

    let seatFactor = 0;
    const s2024 = round2024?.allotment_count || 0;
    const s2025 = round2025?.allotment_count || 0;
    if (s2024 > 0 && s2025 > 0 && s2024 !== s2025) {
      const seatRatio = s2025 / s2024;
      const seatDiff = seatRatio - 1.0;
      if (Math.abs(seatDiff) >= 0.10) {
        seatFactor = Math.max(-0.04, Math.min(0.04, seatDiff * 0.08));
      }
    }
    const finalForecast = Math.round(baseForecast * (1 + seatFactor));

    return {
      rank: finalForecast,
      predictedCutoff: finalForecast,
      lowerBound,
      upperBound,
      volatility,
      confidence,
      trend,
      yoyDelta: delta,
      round: targetRoundName,
      basis: `2024 ${targetRoundName}: ${c2024.toLocaleString()} | 2025 ${targetRoundName}: ${c2025.toLocaleString()} | Weighted (40/60): ${finalForecast.toLocaleString()}`,
      best2024: c2024,
      best2025: c2025,
      seatFactor,
      note: `2024 (${c2024.toLocaleString()}) & 2025 (${c2025.toLocaleString()}) exact ${targetRoundName} comparison.`
    };
  }

  if (c2025 !== null) {
    const lowerBound = Math.round(c2025 * 0.93);
    const upperBound = Math.round(c2025 * 1.07);
    return {
      rank: c2025,
      predictedCutoff: c2025,
      lowerBound,
      upperBound,
      volatility: 'medium',
      confidence: inputSource === 'score' ? 'low' : 'medium',
      trend: 'stable',
      yoyDelta: 0,
      round: targetRoundName,
      basis: `2025 ${targetRoundName}: ${c2025.toLocaleString()} (2024 unavailable)`,
      best2024: null,
      best2025: c2025,
      seatFactor: 0,
      note: `Single-year baseline from 2025 ${targetRoundName} allotments.`
    };
  }

  if (c2024 !== null) {
    const lowerBound = Math.round(c2024 * 0.90);
    const upperBound = Math.round(c2024 * 1.10);
    return {
      rank: c2024,
      predictedCutoff: c2024,
      lowerBound,
      upperBound,
      volatility: 'medium',
      confidence: 'low',
      trend: 'stable',
      yoyDelta: 0,
      round: targetRoundName,
      basis: `2024 ${targetRoundName}: ${c2024.toLocaleString()} (2025 unavailable)`,
      best2024: c2024,
      best2025: null,
      seatFactor: 0,
      note: `Single-year baseline from 2024 ${targetRoundName} allotments.`
    };
  }

  return null;
}

export function getEffectiveRank(
  entry: CollegeIndexEntry,
  mode: string,
  inputSource: 'rank' | 'score' = 'rank'
): PredictedCutoffDetails | null {
  const rounds = entry.rounds;
  if (!rounds || rounds.length === 0) return null;

  if (mode === 'round1') return predictSingleRound(rounds, 'Round 1', inputSource);
  if (mode === 'round2') return predictSingleRound(rounds, 'Round 2', inputSource);
  if (mode === 'round3') return predictSingleRound(rounds, 'Round 3', inputSource);
  if (mode === 'stray') {
    const pStray = predictSingleRound(rounds, 'Stray Vacancy', inputSource);
    const pSpStray = predictSingleRound(rounds, 'Special Stray Vacancy', inputSource);
    return pStray || pSpStray;
  }
  if (mode === '2025') {
    const r2 = rounds.find(r => String(r.year) === '2025' && r.round === 'Round 2');
    const r3 = rounds.find(r => String(r.year) === '2025' && r.round === 'Round 3');
    const r1 = rounds.find(r => String(r.year) === '2025' && r.round === 'Round 1');
    const match = r2 || r3 || r1 || rounds.find(r => String(r.year) === '2025');
    if (!match) return null;
    const cutoff = match.closing_rank;
    return {
      rank: cutoff,
      predictedCutoff: cutoff,
      lowerBound: Math.round(cutoff * 0.93),
      upperBound: Math.round(cutoff * 1.07),
      volatility: 'medium',
      confidence: inputSource === 'score' ? 'medium' : 'high',
      trend: 'stable',
      yoyDelta: 0,
      round: match.round,
      basis: `2025 ${match.round} MCC cutoff: ${cutoff.toLocaleString()}`,
      best2024: null,
      best2025: cutoff,
      seatFactor: 0,
      note: `2025 ${match.round} cutoff record`
    };
  }
  if (mode === '2024') {
    const r2 = rounds.find(r => String(r.year) === '2024' && r.round === 'Round 2');
    const r3 = rounds.find(r => String(r.year) === '2024' && r.round === 'Round 3');
    const r1 = rounds.find(r => String(r.year) === '2024' && r.round === 'Round 1');
    const match = r2 || r3 || r1 || rounds.find(r => String(r.year) === '2024');
    if (!match) return null;
    const cutoff = match.closing_rank;
    return {
      rank: cutoff,
      predictedCutoff: cutoff,
      lowerBound: Math.round(cutoff * 0.90),
      upperBound: Math.round(cutoff * 1.10),
      volatility: 'medium',
      confidence: 'medium',
      trend: 'stable',
      yoyDelta: 0,
      round: match.round,
      basis: `2024 ${match.round} MCC cutoff: ${cutoff.toLocaleString()}`,
      best2024: cutoff,
      best2025: null,
      seatFactor: 0,
      note: `2024 ${match.round} cutoff record`
    };
  }
  if (mode === 'trend') {
    const pR2 = predictSingleRound(rounds, 'Round 2', inputSource);
    if (pR2 && pR2.best2024 && pR2.best2025) return pR2;
    const pR1 = predictSingleRound(rounds, 'Round 1', inputSource);
    if (pR1 && pR1.best2024 && pR1.best2025) return pR1;
    const pR3 = predictSingleRound(rounds, 'Round 3', inputSource);
    if (pR3 && pR3.best2024 && pR3.best2025) return pR3;
    return pR2 || pR1 || pR3 || predictSingleRound(rounds, 'Stray Vacancy', inputSource);
  }

  // Default 'best'
  const pR2 = predictSingleRound(rounds, 'Round 2', inputSource);
  const pR3 = predictSingleRound(rounds, 'Round 3', inputSource);
  const pR1 = predictSingleRound(rounds, 'Round 1', inputSource);
  const pStray = predictSingleRound(rounds, 'Stray Vacancy', inputSource) || predictSingleRound(rounds, 'Special Stray Vacancy', inputSource);

  const primary = (pR2 && (pR2.best2024 || pR2.best2025)) ? pR2 :
                  (pR3 && (pR3.best2024 || pR3.best2025)) ? pR3 :
                  (pR1 && (pR1.best2024 || pR1.best2025)) ? pR1 :
                  pStray;

  if (!primary) return null;

  primary.allRounds = {
    round1: pR1,
    round2: pR2,
    round3: pR3,
    stray: pStray
  };

  return primary;
}

export function getStrategy(userRank: number, lowerBound: number, forecast: number, upperBound: number): StrategyPillar {
  if (userRank <= lowerBound) {
    return { key: 'safety', label: '🟢 Safety', cls: 'strat-safety', sort: 1 };
  }
  if (userRank <= forecast) {
    return { key: 'target', label: '🟡 Target', cls: 'strat-target', sort: 2 };
  }
  if (userRank <= upperBound) {
    return { key: 'reach', label: '🟠 Reach', cls: 'strat-reach', sort: 3 };
  }
  return { key: 'longshot', label: '🔴 Long Shot', cls: 'strat-longshot', sort: 4 };
}

export function getChance(userRank: number, lowerBound: number, forecast: number, upperBound: number): ChanceTier {
  if (userRank <= Math.round(lowerBound * 0.85)) {
    return { tier: 'tVerySafe', label: 'Very Safe', icon: 'shield-check', desc: 'Well Below Cutoff Range', sort: 1 };
  }
  if (userRank <= lowerBound) {
    return { tier: 'tSafe', label: 'Safe', icon: 'check-circle-2', desc: 'Within Safety Range', sort: 2 };
  }
  if (userRank <= Math.round((lowerBound + forecast) / 2)) {
    return { tier: 'tGood', label: 'Good Chance', icon: 'trending-up', desc: 'Competitive for Target Round', sort: 3 };
  }
  if (userRank <= forecast) {
    return { tier: 'tMod', label: 'Moderate', icon: 'minus-circle', desc: 'Near Projected Cutoff', sort: 4 };
  }
  if (userRank <= upperBound) {
    return { tier: 'tLow', label: 'Low Chance', icon: 'trending-down', desc: 'Within Reach Window', sort: 5 };
  }
  return { tier: 'tLong', label: 'Long Shot', icon: 'alert-triangle', desc: 'Beyond Historical Range', sort: 6 };
}

const masterCollegeLookupCache = new Map<string, MasterCollege | null>();

export function findMasterCollege(
  institute: string,
  state: string,
  masterMap: Map<string, MasterCollege>
): MasterCollege | undefined {
  if (!masterMap || masterMap.size === 0) return undefined;
  const cName = cleanName(institute).toLowerCase();
  const k1 = cName.replace(/[^a-z0-9]/g, '');
  if (!k1) return undefined;

  const cacheKey = `${k1}|${(state || '').toLowerCase()}`;
  if (masterCollegeLookupCache.has(cacheKey)) {
    return masterCollegeLookupCache.get(cacheKey) || undefined;
  }

  if (masterMap.has(k1)) {
    const found = masterMap.get(k1);
    masterCollegeLookupCache.set(cacheKey, found || null);
    return found;
  }

  if (cName.includes('aiims')) {
    const aiimsKey = cName.replace('aiims', 'all india institute of medical sciences').replace(/[^a-z0-9]/g, '');
    if (masterMap.has(aiimsKey)) {
      const found = masterMap.get(aiimsKey);
      masterCollegeLookupCache.set(cacheKey, found || null);
      return found;
    }
  }

  for (const [mKey, mCol] of masterMap) {
    if (mKey.length > 8 && (k1.includes(mKey) || mKey.includes(k1))) {
      masterCollegeLookupCache.set(cacheKey, mCol);
      return mCol;
    }
  }

  masterCollegeLookupCache.set(cacheKey, null);
  return undefined;
}

export function buildCollegeIndex(
  records: CutoffRecord[],
  masterColleges?: MasterCollege[]
): Map<string, CollegeIndexEntry> {
  const index = new Map<string, CollegeIndexEntry>();
  const globalBranchRounds = new Map<string, RoundInfo[]>();

  const masterMap = new Map<string, MasterCollege>();
  if (masterColleges && masterColleges.length > 0) {
    for (const m of masterColleges) {
      const k = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      masterMap.set(k, m);
    }
  }

  for (const row of records) {
    const cName = cleanName(row.institute);
    let state = extractState(row.institute);
    const cat = normalizeCategoryName(row.category);
    const quota = normalizeQuota(row.quota);

    // Canonicalize with masterMap if available
    const masterInfo = findMasterCollege(cName, state, masterMap);
    const canonicalName = masterInfo ? masterInfo.name : cName;
    if (!state && masterInfo?.state) {
      state = masterInfo.state;
    }

    const key = `${canonicalName.toLowerCase()}|${state.toLowerCase()}|${row.course.toLowerCase()}|${quota.toLowerCase()}|${cat.toLowerCase()}`;

    if (!index.has(key)) {
      index.set(key, {
        key,
        institute: row.institute,
        name: canonicalName,
        course: row.course,
        quota,
        category: cat,
        state,
        rounds: [],
        masterInfo
      });
    }

    const entry = index.get(key)!;
    if (row.institute && row.institute.length > entry.institute.length) {
      entry.institute = row.institute;
    }

    const rndStr = normalizeRoundNameStr(row.round);
    const yrStr = String(row.year);
    const closing = Math.round(Number(row.closing_rank) || 0);
    const opening = row.opening_rank !== undefined ? Math.round(Number(row.opening_rank)) : closing;

    const existingRound = entry.rounds.find(r => r.year === yrStr && r.round === rndStr && (r.quota === quota || !r.quota));
    if (!existingRound) {
      entry.rounds.push({
        year: yrStr,
        round: rndStr,
        allotted_category: cat,
        candidate_category: cat,
        opening_rank: opening,
        closing_rank: closing,
        allotment_count: row.allotment_count || 1,
        quota
      });
    } else {
      if (opening < existingRound.opening_rank) existingRound.opening_rank = opening;
      if (closing > existingRound.closing_rank) existingRound.closing_rank = closing;
      existingRound.allotment_count = (existingRound.allotment_count || 1) + 1;
      if (!existingRound.quota) existingRound.quota = quota;
    }

    // Also register into globalBranchRounds for complete historical modal archive
    const branchKey = `${canonicalName.toLowerCase()}|${row.course.toLowerCase()}`;
    if (!globalBranchRounds.has(branchKey)) {
      globalBranchRounds.set(branchKey, []);
    }
    const bRounds = globalBranchRounds.get(branchKey)!;
    const existingBranchRound = bRounds.find(
      r => r.year === yrStr && r.round === rndStr && r.quota === quota && r.allotted_category === cat
    );
    if (!existingBranchRound) {
      bRounds.push({
        year: yrStr,
        round: rndStr,
        allotted_category: cat,
        candidate_category: cat,
        opening_rank: opening,
        closing_rank: closing,
        allotment_count: row.allotment_count || 1,
        quota
      });
    } else {
      if (opening < existingBranchRound.opening_rank) existingBranchRound.opening_rank = opening;
      if (closing > existingBranchRound.closing_rank) existingBranchRound.closing_rank = closing;
      existingBranchRound.allotment_count = (existingBranchRound.allotment_count || 1) + 1;
    }
  }

  // Populate complete branch rounds and metadata on each index entry
  for (const entry of index.values()) {
    const branchKey = `${entry.name.toLowerCase()}|${entry.course.toLowerCase()}`;
    const allR = globalBranchRounds.get(branchKey) || entry.rounds;
    entry.allHistoricalRounds = allR;
    entry.availableQuotas = Array.from(new Set(allR.map(r => r.quota).filter(Boolean))) as string[];
    entry.availableCategories = Array.from(new Set(allR.map(r => r.allotted_category).filter(Boolean))) as string[];
  }

  return index;
}

export function runPredictionEngine(
  collegeIndex: Map<string, CollegeIndexEntry>,
  query: PredictorQuery
): PredictionResult[] {
  let userRank = query.rank;
  if (query.inputMode === 'score' && query.score) {
    userRank = scoreToRank(query.score);
  }

  const allowedQuotas = new Set<string>();
  for (const qKey of query.quotas) {
    const mapped = quotaMap[qKey] || [qKey];
    mapped.forEach(q => allowedQuotas.add(q));
  }

  const courseSet = new Set(query.courses);
  const rawResults: PredictionResult[] = [];

  for (const [, entry] of collegeIndex) {
    if (!courseSet.has(entry.course)) continue;

    const isExactCategory = entry.category === query.category;
    const isOpenCategoryFallback = query.category !== 'Open' && entry.category === 'Open';
    const isOpenPwdFallback = query.category.includes('PwD') && entry.category === 'Open PwD';

    if (!isExactCategory && !isOpenCategoryFallback && !isOpenPwdFallback) continue;
    if (!allowedQuotas.has(entry.quota)) continue;

    const effective = getEffectiveRank(entry, query.mode, query.inputMode);
    if (!effective) continue;

    const strategy = getStrategy(userRank, effective.lowerBound, effective.rank, effective.upperBound);
    const chance = getChance(userRank, effective.lowerBound, effective.rank, effective.upperBound);
    const ratio = userRank / effective.rank;
    const collegeType = getCollegeType(entry.institute, entry.quota);

    rawResults.push({
      key: entry.key,
      institute: entry.institute,
      name: entry.name,
      state: entry.state,
      course: entry.course,
      quota: entry.quota,
      availableQuotas: entry.availableQuotas && entry.availableQuotas.length > 0 ? entry.availableQuotas : [entry.quota],
      availableCategories: entry.availableCategories && entry.availableCategories.length > 0 ? entry.availableCategories : [entry.category],
      category: entry.category,
      isUrFallback: isOpenCategoryFallback,
      closingRank: effective.rank,
      projected: effective,
      userRank,
      ratio,
      chance,
      strategy,
      collegeType,
      rounds: entry.allHistoricalRounds && entry.allHistoricalRounds.length > 0 ? entry.allHistoricalRounds : entry.rounds,
      allHistoricalRounds: entry.allHistoricalRounds || entry.rounds,
      masterInfo: entry.masterInfo
    });
  }

  // Deduplicate and consolidate similar college + branch (course) into the same card
  const dedupeMap = new Map<string, PredictionResult>();
  for (const item of rawResults) {
    // Group strictly by College Name + Course (Branch) so same college & branch always share one card
    const groupKey = `${item.name.toLowerCase()}|${(item.state || '').toLowerCase()}|${item.course.toLowerCase()}`;
    if (!dedupeMap.has(groupKey)) {
      item.availableQuotas = item.availableQuotas && item.availableQuotas.length > 0 ? item.availableQuotas : [item.quota];
      dedupeMap.set(groupKey, item);
    } else {
      const existing = dedupeMap.get(groupKey)!;
      existing.availableQuotas = existing.availableQuotas || [existing.quota];
      if (item.availableQuotas) {
        for (const q of item.availableQuotas) {
          if (!existing.availableQuotas.includes(q)) existing.availableQuotas.push(q);
        }
      }
      if (item.availableCategories) {
        existing.availableCategories = existing.availableCategories || [];
        for (const c of item.availableCategories) {
          if (!existing.availableCategories.includes(c)) existing.availableCategories.push(c);
        }
      }

      // Merge all rounds across quotas and categories for this college and branch into the card
      const sourceRounds = item.allHistoricalRounds && item.allHistoricalRounds.length > 0 ? item.allHistoricalRounds : item.rounds;
      for (const r of sourceRounds) {
        const already = existing.rounds.some(
          er => er.year === r.year && er.round === r.round && er.quota === r.quota && er.allotted_category === r.allotted_category
        );
        if (!already) {
          existing.rounds.push(r);
        }
      }
      existing.allHistoricalRounds = existing.rounds;

      // Choose the best strategic quota to represent this card
      const shouldSwapPrimary =
        (existing.isUrFallback && !item.isUrFallback) ||
        (!existing.isUrFallback === !item.isUrFallback && item.strategy.sort < existing.strategy.sort) ||
        (!existing.isUrFallback === !item.isUrFallback && item.strategy.sort === existing.strategy.sort && item.closingRank > existing.closingRank);

      if (shouldSwapPrimary) {
        existing.key = item.key;
        existing.quota = item.quota;
        existing.category = item.category;
        existing.isUrFallback = item.isUrFallback;
        existing.closingRank = item.closingRank;
        existing.projected = item.projected;
        existing.ratio = item.ratio;
        existing.chance = item.chance;
        existing.strategy = item.strategy;
        existing.collegeType = item.collegeType;
      }
    }
  }

  const list = Array.from(dedupeMap.values());
  list.sort((a, b) => {
    if (a.strategy.sort !== b.strategy.sort) return a.strategy.sort - b.strategy.sort;
    return a.closingRank - b.closingRank;
  });

  return list;
}
