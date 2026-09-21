export interface CutoffRecord {
  year: string | number;
  round: string;
  institute: string;
  course: string;
  quota: string;
  category: string;
  closing_rank: number;
  opening_rank?: number;
  allotment_count?: number;
}

export interface RoundInfo {
  year: string;
  round: string;
  allotted_category: string;
  candidate_category: string;
  opening_rank: number;
  closing_rank: number;
  allotment_count: number;
  quota?: string;
}

export interface MasterCollege {
  college_id?: string;
  name: string;
  state: string;
  university?: string;
  institution_category?: string[];
  management?: string;
  established_year?: number;
  mbbs_seats?: number;
  official_website?: string | null;
}

export interface CollegeIndexEntry {
  key: string;
  institute: string;
  name: string;
  course: string;
  quota: string;
  category: string;
  state: string;
  rounds: RoundInfo[];
  allHistoricalRounds?: RoundInfo[];
  availableQuotas?: string[];
  availableCategories?: string[];
  masterInfo?: MasterCollege;
}

export type StrategyKey = 'safety' | 'target' | 'reach' | 'longshot';

export interface StrategyPillar {
  key: StrategyKey;
  label: string;
  cls: string;
  sort: number;
}

export type ChanceTierKey = 'tVerySafe' | 'tSafe' | 'tGood' | 'tMod' | 'tLow' | 'tLong';

export interface ChanceTier {
  tier: ChanceTierKey;
  label: string;
  icon: string;
  desc: string;
  sort: number;
}

export interface CollegeType {
  type: string;
  cls: string;
  label: string;
}

export interface PredictedCutoffDetails {
  rank: number;
  predictedCutoff: number;
  lowerBound: number;
  upperBound: number;
  volatility: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  trend: 'stable' | 'opening' | 'tightening';
  yoyDelta: number;
  round: string;
  basis: string;
  best2024: number | null;
  best2025: number | null;
  seatFactor: number;
  note: string;
  allRounds?: Record<string, PredictedCutoffDetails | null>;
}

export interface PredictionResult {
  key: string;
  institute: string;
  name: string;
  state: string;
  course: string;
  quota: string;
  availableQuotas?: string[];
  availableCategories?: string[];
  category: string;
  isUrFallback: boolean;
  closingRank: number;
  projected: PredictedCutoffDetails;
  userRank: number;
  ratio: number;
  chance: ChanceTier;
  strategy: StrategyPillar;
  collegeType: CollegeType;
  rounds: RoundInfo[];
  allHistoricalRounds?: RoundInfo[];
  masterInfo?: MasterCollege;
}

export interface PredictorQuery {
  rank: number;
  score?: number;
  inputMode: 'rank' | 'score';
  category: string;
  mode: string;
  courses: string[];
  quotas: string[];
}
