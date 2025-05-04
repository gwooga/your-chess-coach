
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
} from '@/utils/types';
import { toast } from '@/hooks/use-toast';

// Import all our new modular services
import { extractOpeningSequences, findMeaningfulOpenings, formatOpeningData } from './chess/openingAnalysis';
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
    
    console.log(`Found ${games.length} games for analysis`);
    
    // Extract ratings more thoroughly
    const ratings = extractRatings(games, info.platform);
    
    // Extract opening data
    const { sequences, totalWhiteGames, totalBlackGames } = extractOpeningSequences(games);
    
    // Find meaningful openings
    const { meaningfulWhite, meaningfulBlack, meaningfulCombined } = findMeaningfulOpenings(
      sequences, 
      totalWhiteGames, 
      totalBlackGames
    );
    
    // Format openings data for all variants
    const allOpeningsData: Record<ChessVariant, OpeningsTableData> = {
      all: {
        white2: formatOpeningData(sequences, 2, 'white', totalWhiteGames),
        black2: formatOpeningData(sequences, 2, 'black', totalBlackGames),
        white3: formatOpeningData(sequences, 3, 'white', totalWhiteGames),
        black3: formatOpeningData(sequences, 3, 'black', totalBlackGames),
        white4: formatOpeningData(sequences, 4, 'white', totalWhiteGames),
        black4: formatOpeningData(sequences, 4, 'black', totalBlackGames),
        white5: formatOpeningData(sequences, 5, 'white', totalWhiteGames),
        black5: formatOpeningData(sequences, 5, 'black', totalBlackGames),
        white6: formatOpeningData(sequences, 6, 'white', totalWhiteGames),
        black6: formatOpeningData(sequences, 6, 'black', totalBlackGames),
        white7: formatOpeningData(sequences, 7, 'white', totalWhiteGames),
        black7: formatOpeningData(sequences, 7, 'black', totalBlackGames),
        white8: formatOpeningData(sequences, 8, 'white', totalWhiteGames),
        black8: formatOpeningData(sequences, 8, 'black', totalBlackGames),
        white10: formatOpeningData(sequences, 10, 'white', totalWhiteGames),
        black10: formatOpeningData(sequences, 10, 'black', totalBlackGames),
        totalWhiteGames,
        totalBlackGames,
        meaningfulWhite,
        meaningfulBlack,
        meaningfulCombined
      },
      blitz: {
        white2: [],
        black2: [],
        white3: [],
        black3: [],
        white4: [],
        black4: [],
        white5: [],
        black5: [],
        white6: [],
        black6: [],
        white7: [],
        black7: [],
        white8: [],
        black8: [],
        white10: [],
        black10: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: [],
        meaningfulCombined: []
      },
      rapid: {
        white2: [],
        black2: [],
        white3: [],
        black3: [],
        white4: [],
        black4: [],
        white5: [],
        black5: [],
        white6: [],
        black6: [],
        white7: [],
        black7: [],
        white8: [],
        black8: [],
        white10: [],
        black10: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: [],
        meaningfulCombined: []
      },
      bullet: {
        white2: [],
        black2: [],
        white3: [],
        black3: [],
        white4: [],
        black4: [],
        white5: [],
        black5: [],
        white6: [],
        black6: [],
        white7: [],
        black7: [],
        white8: [],
        black8: [],
        white10: [],
        black10: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: [],
        meaningfulCombined: []
      }
    };
    
    // Split games by time control for variant-specific analysis
    const variantGames = {
      blitz: games.filter(g => {
        const timeControl = g.time_control || '';
        if (typeof timeControl === 'string') {
          return timeControl.includes('blitz') || 
                 (parseInt(timeControl) >= 180 && parseInt(timeControl) <= 600);
        }
        return false;
      }),
      rapid: games.filter(g => {
        const timeControl = g.time_control || '';
        if (typeof timeControl === 'string') {
          return timeControl.includes('rapid') || 
                 (parseInt(timeControl) > 600);
        }
        return false;
      }),
      bullet: games.filter(g => {
        const timeControl = g.time_control || '';
        if (typeof timeControl === 'string') {
          return timeControl.includes('bullet') || 
                 (parseInt(timeControl) < 180);
        }
        return false;
      })
    };
    
    // Process each variant
    for (const variant of ['blitz', 'rapid', 'bullet'] as const) {
      if (variantGames[variant].length > 0) {
        const variantData = extractOpeningSequences(variantGames[variant]);
        const { meaningfulWhite: variantMeaningfulWhite, meaningfulBlack: variantMeaningfulBlack, meaningfulCombined: variantMeaningfulCombined } = 
          findMeaningfulOpenings(variantData.sequences, variantData.totalWhiteGames, variantData.totalBlackGames);
        
        allOpeningsData[variant] = {
          white2: formatOpeningData(variantData.sequences, 2, 'white', variantData.totalWhiteGames),
          black2: formatOpeningData(variantData.sequences, 2, 'black', variantData.totalBlackGames),
          white3: formatOpeningData(variantData.sequences, 3, 'white', variantData.totalWhiteGames),
          black3: formatOpeningData(variantData.sequences, 3, 'black', variantData.totalBlackGames),
          white4: formatOpeningData(variantData.sequences, 4, 'white', variantData.totalWhiteGames),
          black4: formatOpeningData(variantData.sequences, 4, 'black', variantData.totalBlackGames),
          white5: formatOpeningData(variantData.sequences, 5, 'white', variantData.totalWhiteGames),
          black5: formatOpeningData(variantData.sequences, 5, 'black', variantData.totalBlackGames),
          white6: formatOpeningData(variantData.sequences, 6, 'white', variantData.totalWhiteGames),
          black6: formatOpeningData(variantData.sequences, 6, 'black', variantData.totalBlackGames),
          white7: formatOpeningData(variantData.sequences, 7, 'white', variantData.totalWhiteGames),
          black7: formatOpeningData(variantData.sequences, 7, 'black', variantData.totalBlackGames),
          white8: formatOpeningData(variantData.sequences, 8, 'white', variantData.totalWhiteGames),
          black8: formatOpeningData(variantData.sequences, 8, 'black', variantData.totalBlackGames),
          white10: formatOpeningData(variantData.sequences, 10, 'white', variantData.totalWhiteGames),
          black10: formatOpeningData(variantData.sequences, 10, 'black', variantData.totalBlackGames),
          totalWhiteGames: variantData.totalWhiteGames,
          totalBlackGames: variantData.totalBlackGames,
          meaningfulWhite: variantMeaningfulWhite,
          meaningfulBlack: variantMeaningfulBlack,
          meaningfulCombined: variantMeaningfulCombined
        };
      }
    }
    
    // Generate time analysis
    const { dayPerformance, timePerformance } = generateTimeAnalysis(games);
    
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
      totalGames: games.length
    };
    
    // Create move quality data
    const moveQuality: MoveQuality = {
      best: Math.floor(games.length * 15 + Math.random() * 10),
      good: Math.floor(games.length * 8 + Math.random() * 10),
      inaccuracy: Math.floor(games.length * 4 + Math.random() * 8),
      mistake: Math.floor(games.length * 2 + Math.random() * 5),
      blunder: Math.floor(games.length * 1 + Math.random() * 3),
      totalMoves: Math.floor(games.length * 30 + Math.random() * 100)
    };
    
    // Create material swings data (simplified)
    const materialSwings = Array.from({length: 40}, (_, i) => 
      ((Math.sin(i * 0.3) * (i/10)) + (Math.random() - 0.5) * 0.5)
    );
    
    // Create strengths based on data
    const strengths = [
      `Strong ${phaseAccuracy.opening > phaseAccuracy.middlegame && phaseAccuracy.opening > phaseAccuracy.endgame ? 
        'opening' : (phaseAccuracy.middlegame > phaseAccuracy.endgame ? 'middlegame' : 'endgame')} play`,
      "Good tactical awareness", // Default strength
      bestTimeSlot ? `Consistent performance during ${bestTimeSlot.slot} time period` : "Consistent performance throughout the day",
      bestDay ? `Strong results on ${bestDay.day}` : "Balanced performance across the week"
    ];
    
    // Create weaknesses based on data
    const weaknesses = [
      `Weaker ${phaseAccuracy.opening < phaseAccuracy.middlegame && phaseAccuracy.opening < phaseAccuracy.endgame ? 
        'opening' : (phaseAccuracy.middlegame < phaseAccuracy.endgame ? 'middlegame' : 'endgame')} play`,
      "Time management issues", // Default weakness
      worstTimeSlot ? `Below average performance during ${worstTimeSlot.slot} time period` : "Inconsistent performance throughout the day",
      worstDay ? `Poor results on ${worstDay.day}` : "Inconsistent performance throughout the week"
    ];
    
    // Create recommendations based on analysis
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
    
    // Add insights to the openings data for all variants
    const insights = extractInsights({
      timePerformance,
      dayPerformance,
      openings: {
        meaningfulWhite,
        meaningfulBlack
      },
      phaseAccuracy,
      weaknesses
    });
    
    // Add the insights to all variant data
    Object.keys(allOpeningsData).forEach(variant => {
      allOpeningsData[variant as ChessVariant].insights = insights;
    });
    
    // Construct the final user analysis object
    const userAnalysis: UserAnalysis = {
      ratings,
      openings: allOpeningsData,
      dayPerformance,
      timePerformance,
      phaseAccuracy,
      moveQuality,
      materialSwings,
      conversionRate: 65 + Math.floor(Math.random() * 20),
      timeScrambleRecord: {
        wins: Math.floor(games.length * 0.3),
        losses: Math.floor(games.length * 0.2)
      },
      strengths,
      weaknesses,
      recommendations,
      insights
    };
    
    return userAnalysis;
  } catch (error) {
    console.error("Error in analyzeChessData:", error);
    toast({
      title: "Analysis error",
      description: "Failed to analyze chess data. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

// Main function to fetch and analyze chess data - no longer needed but kept for compatibility
export const fetchUserData = async (userInfo: UserInfo, timeRange: TimeRange): Promise<UserAnalysis> => {
  try {
    // This function is maintained for backward compatibility
    // Now we handle the downloading separately
    throw new Error("This function is deprecated, please use analyzeChessData instead");
  } catch (error) {
    toast({
      title: "Error fetching data",
      description: "Failed to fetch or analyze chess games. Please try again.",
      variant: "destructive",
    });
    
    throw error;
  }
};
