import { 
  OpeningData, 
  OpeningsTableData, 
  DayPerformance, 
  TimeSlotPerformance, 
  PhaseAccuracy, 
  MoveQuality, 
  UserAnalysis, 
  Rating, 
  ChessVariant,
  UserInfo,
  TimeRange,
  Platform
} from '../utils/types';

// Import all our modular services
import { analyzeOpenings } from './chess/openingAnalysis.js';
import { generateTimeAnalysis, findBestAndWorstPerformances } from './chess/timeAnalysis';
import { extractInsights } from './chess/insightsService';
import { extractRatings } from './chess/ratingsService';
import { pgnToFen } from './chess/chessUtils';

// Re-export utility functions to maintain backward compatibility
export { pgnToFen } from './chess/chessUtils';
export { extractRatings } from './chess/ratingsService';

// Main function to analyze chess data
export const analyzeChessData = async (data: {
  games: any[];
  info: UserInfo;
  timeRange: TimeRange;
}): Promise<UserAnalysis> => {
  try {
    const { games, info } = data;
    
    // Ensure we have actual games to analyze
    if (!games || games.length === 0) {
      throw new Error("No games found for analysis");
    }
    
    // Limit games for analysis to improve performance while maintaining accuracy
    const ANALYSIS_LIMIT = 1000;
    const gamesToAnalyze = games.length > ANALYSIS_LIMIT ? games.slice(0, ANALYSIS_LIMIT) : games;
    
    console.log(`Found ${games.length} games, analyzing ${gamesToAnalyze.length} (limit: ${ANALYSIS_LIMIT})`);
    
    // Extract ratings from games
    const ratings = extractRatings(gamesToAnalyze, info.platform, info.username);
    
    // Analyze openings using our refactored function
    const { openings, totalWhiteGames, totalBlackGames } = analyzeOpenings(gamesToAnalyze, info.username);
    
    // Generate time analysis
    const { dayPerformance, timePerformance } = generateTimeAnalysis(gamesToAnalyze, info.username);
    
    // Find best and worst time slots/days for insights
    const { bestTimeSlot, worstTimeSlot, bestDay, worstDay } = findBestAndWorstPerformances(
      dayPerformance, 
      timePerformance
    );
    
    // Create phase accuracy data (in a real app, this would come from actual game analysis)
    const phaseAccuracy: PhaseAccuracy = {
      opening: 68 + Math.floor(Math.random() * 10),
      middlegame: 62 + Math.floor(Math.random() * 10),
      endgame: 59 + Math.floor(Math.random() * 12),
      totalGames: gamesToAnalyze.length
    };
    
    // Create move quality data
    const moveQuality: MoveQuality = {
      best: Math.floor(gamesToAnalyze.length * 15 + Math.random() * 10),
      good: Math.floor(gamesToAnalyze.length * 8 + Math.random() * 10),
      inaccuracy: Math.floor(gamesToAnalyze.length * 4 + Math.random() * 8),
      mistake: Math.floor(gamesToAnalyze.length * 2 + Math.random() * 5),
      blunder: Math.floor(gamesToAnalyze.length * 1 + Math.random() * 3),
      totalMoves: Math.floor(gamesToAnalyze.length * 30 + Math.random() * 100)
    };
    
    // Create material swings data (simplified)
    const materialSwings = Array.from({length: 40}, (_, i) => 
      ((Math.sin(i * 0.3) * (i/10)) + (Math.random() - 0.5) * 0.5)
    );
    
    // Create strengths based on data
    const strengths = createStrengths(phaseAccuracy, bestTimeSlot, bestDay);
    
    // Create weaknesses based on data
    const weaknesses = createWeaknesses(phaseAccuracy, worstTimeSlot, worstDay);
    
    // Create recommendations
    const recommendations = createRecommendations(
      phaseAccuracy, 
      bestTimeSlot, 
      worstDay, 
      openings.all.meaningfulWhite,
      openings.all.meaningfulBlack
    );
    
    // Add insights to the openings data for all variants
    const insights = extractInsights({
      timePerformance,
      dayPerformance,
      openings: {
        meaningfulWhite: openings.all.meaningfulWhite,
        meaningfulBlack: openings.all.meaningfulBlack
      },
      phaseAccuracy,
      weaknesses
    });
    
    // Add the insights to all variant data
    Object.keys(openings).forEach(variant => {
      openings[variant as ChessVariant].insights = insights;
    });
    
    // Construct the final user analysis object
    const userAnalysis: UserAnalysis = {
      ratings,
      openings,
      dayPerformance,
      timePerformance,
      phaseAccuracy,
      moveQuality,
      materialSwings,
      conversionRate: 65 + Math.floor(Math.random() * 20),
      timeScrambleRecord: {
        wins: Math.floor(gamesToAnalyze.length * 0.3),
        losses: Math.floor(gamesToAnalyze.length * 0.2)
      },
      strengths,
      weaknesses,
      recommendations,
      insights
    };
    
    return userAnalysis;
  } catch (error) {
    console.error("Error in analyzeChessData:", error);
    console.error('Analysis error: Failed to analyze chess data. Please try again.');
    throw error;
  }
};

// Helper function to create strengths based on analysis
const createStrengths = (
  phaseAccuracy: PhaseAccuracy,
  bestTimeSlot: TimeSlotPerformance | null,
  bestDay: DayPerformance | null
): string[] => {
  return [
    `Strong ${phaseAccuracy.opening > phaseAccuracy.middlegame && phaseAccuracy.opening > phaseAccuracy.endgame ? 
      'opening' : (phaseAccuracy.middlegame > phaseAccuracy.endgame ? 'middlegame' : 'endgame')} play`,
    "Good tactical awareness", // Default strength
    bestTimeSlot ? `Consistent performance during ${bestTimeSlot.slot} time period` : "Consistent performance throughout the day",
    bestDay ? `Strong results on ${bestDay.day}` : "Balanced performance across the week"
  ];
};

// Helper function to create weaknesses based on analysis
const createWeaknesses = (
  phaseAccuracy: PhaseAccuracy,
  worstTimeSlot: TimeSlotPerformance | null,
  worstDay: DayPerformance | null
): string[] => {
  return [
    `Weaker ${phaseAccuracy.opening < phaseAccuracy.middlegame && phaseAccuracy.opening < phaseAccuracy.endgame ? 
      'opening' : (phaseAccuracy.middlegame < phaseAccuracy.endgame ? 'middlegame' : 'endgame')} play`,
    "Time management issues", // Default weakness
    worstTimeSlot ? `Below average performance during ${worstTimeSlot.slot} time period` : "Inconsistent performance throughout the day",
    worstDay ? `Poor results on ${worstDay.day}` : "Inconsistent performance throughout the week"
  ];
};

// Helper function to create recommendations based on analysis
const createRecommendations = (
  phaseAccuracy: PhaseAccuracy,
  bestTimeSlot: TimeSlotPerformance | null,
  worstDay: DayPerformance | null,
  meaningfulWhite: OpeningData[],
  meaningfulBlack: OpeningData[]
): string[] => {
  const recommendations = [
    `Focus on improving ${phaseAccuracy.opening < phaseAccuracy.middlegame && phaseAccuracy.opening < phaseAccuracy.endgame ? 
      'opening' : (phaseAccuracy.middlegame < phaseAccuracy.endgame ? 'middlegame' : 'endgame')} technique`,
    "Practice tactical puzzles daily to reduce blunders",
    bestTimeSlot ? `Schedule important matches during your peak performance time (${bestTimeSlot.slot})` : "Try to identify your best playing time and schedule important games then",
    worstDay ? `Consider taking a break from competitive play on ${worstDay.day}` : "Maintain a consistent playing schedule throughout the week"
  ];

  // Add meaningful opening recommendations
  if (meaningfulWhite.length > 0) {
    const topWhiteOpening = meaningfulWhite[0];
    recommendations.push(`Continue developing your ${topWhiteOpening.name} repertoire as White, which currently shows a ${topWhiteOpening.winsPercentage}% win rate.`);
  }
  
  if (meaningfulBlack.length > 0) {
    const topBlackOpening = meaningfulBlack[0];
    recommendations.push(`Study more deeply the ${topBlackOpening.name} as Black, focusing on common middlegame plans and endgame patterns.`);
  }

  return recommendations;
};

// Main function to fetch and analyze chess data - no longer needed but kept for compatibility
export const fetchUserData = async (userInfo: UserInfo, timeRange: TimeRange): Promise<UserAnalysis> => {
  // This function is maintained for backward compatibility
  throw new Error("This function is deprecated, please use analyzeChessData instead");
};
