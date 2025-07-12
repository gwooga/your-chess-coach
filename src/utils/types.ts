
export type Platform = 'chess.com' | 'lichess' | 'uploaded';

export type TimeRange = 'all' | 'last30' | 'last90' | 'last180' | 'last365';

export type ChessVariant = 'all' | 'blitz' | 'rapid' | 'bullet';

export interface UserInfo {
  username: string;
  platform: Platform;
}

export interface Rating {
  blitz?: number;
  rapid?: number;
  bullet?: number;
}

export interface OpeningData {
  name: string;
  sequence: string;
  games: number;
  gamesPercentage: number;
  wins: number;
  winsPercentage: number;
  draws: number;
  drawsPercentage: number;
  losses: number;
  lossesPercentage: number;
  fen: string;
  score?: number; // Optional field for meaningful openings
  color?: 'white' | 'black'; // Added color field for meaningful openings
  impact?: number; // Added impact field for ranking
}

export interface OpeningSummaryTable {
  rootLine: OpeningData;
  childLines: OpeningData[];
  totalGames: number;
}

export interface OpeningsTableData {
  white2: OpeningData[];
  black2: OpeningData[];
  white3: OpeningData[];
  black3: OpeningData[];
  white4: OpeningData[];
  black4: OpeningData[];
  white5: OpeningData[];
  black5: OpeningData[];
  white6: OpeningData[];
  black6: OpeningData[];
  white7: OpeningData[];
  black7: OpeningData[];
  white8: OpeningData[];
  black8: OpeningData[];
  white10?: OpeningData[];
  black10?: OpeningData[];
  totalWhiteGames: number;
  totalBlackGames: number;
  meaningfulWhite?: OpeningData[];
  meaningfulBlack?: OpeningData[];
  meaningfulCombined?: OpeningData[]; // New field for combined meaningful openings
  openingSummaryTables?: OpeningSummaryTable[]; // Pre-computed opening summary tables
  insights?: string[];
}

export interface DayPerformance {
  day: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface TimeSlotPerformance {
  slot: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface PhaseAccuracy {
  opening: number;
  middlegame: number;
  endgame: number;
  totalGames: number;
}

export interface MoveQuality {
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  totalMoves: number;
}

export interface UserAnalysis {
  ratings: Rating;
  openings: Record<ChessVariant, OpeningsTableData>;
  dayPerformance: DayPerformance[];
  timePerformance: TimeSlotPerformance[];
  phaseAccuracy?: PhaseAccuracy;
  moveQuality?: MoveQuality;
  materialSwings?: number[];
  conversionRate?: number;
  timeScrambleRecord?: { wins: number; losses: number };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  insights?: string[];
}
