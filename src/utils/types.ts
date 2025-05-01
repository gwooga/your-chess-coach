
export type Platform = 'chess.com' | 'lichess';

export type TimeRange = 'last30' | 'last90' | 'last180' | 'last365';

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
}

export interface OpeningsTableData {
  white3: OpeningData[];
  black3: OpeningData[];
  white5: OpeningData[];
  black5: OpeningData[];
  white7: OpeningData[];
  black7: OpeningData[];
  totalWhiteGames: number;
  totalBlackGames: number;
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
}
