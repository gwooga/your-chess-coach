import { OpeningData, OpeningsTableData, DayPerformance, TimeSlotPerformance, PhaseAccuracy, MoveQuality, UserAnalysis, Rating, ChessVariant } from '@/utils/types';
import { toast } from '@/hooks/use-toast';
import { UserInfo, TimeRange } from '@/utils/types';
import { Chess } from 'chess.js';

// Convert PGN moves to FEN
export const pgnToFen = (moves: string): string => {
  try {
    const chess = new Chess();
    
    // Clean up the PGN to extract just the moves
    const cleanMoves = moves.replace(/\d+\.\s/g, '').split(' ');
    
    // Apply each move
    for (const move of cleanMoves) {
      if (move && move.trim() !== '') {
        try {
          chess.move(move);
        } catch (moveError) {
          console.error(`Invalid move: ${move} in sequence: ${moves}`);
          break;
        }
      }
    }
    
    return chess.fen();
  } catch (error) {
    console.error("Error converting PGN to FEN:", error);
    // Default starting position if we can't parse
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  }
};

// Extract opening sequences from games
const extractOpeningSequences = (games: any[]): Record<string, any> => {
  const openingSequences: Record<string, any> = {
    white2: {},
    black2: {},
    white3: {},
    black3: {},
    white4: {},
    black4: {},
    white5: {},
    black5: {},
    white7: {},
    black7: {},
    white10: {},
    black10: {},
  };
  
  let totalWhiteGames = 0;
  let totalBlackGames = 0;
  
  games.forEach(game => {
    // Extract the player's color and opponent
    let playerColor = 'white';
    
    // If the player username matches the black player, adjust color
    if (game.black && game.black.username && game.white && game.white.username) {
      // For Chess.com games
      if (typeof game.black.username === 'string' && 
          typeof game.white.username === 'string' &&
          game.black.username.toLowerCase() === game.white.username.toLowerCase()) {
        playerColor = 'black';
      }
    } else if (game.players) {
      // For Lichess games
      const whiteUser = game.players.white.user;
      const blackUser = game.players.black.user;
      if (whiteUser && blackUser && blackUser.name && whiteUser.name && 
          blackUser.name.toLowerCase() === whiteUser.name.toLowerCase()) {
        playerColor = 'black';
      }
    }
    
    // Count total games by color
    if (playerColor === 'white') {
      totalWhiteGames++;
    } else {
      totalBlackGames++;
    }
    
    // Extract moves from the game
    let moves;
    if (game.pgn) {
      // Chess.com format
      moves = game.pgn.split('\n\n').pop();
    } else if (typeof game.moves === 'string') {
      // Lichess moves in string format
      moves = game.moves;
    } else if (Array.isArray(game.moves)) {
      // Moves in array format (our custom parser)
      moves = game.moves.map((m: any) => m.san).join(' ');
    }
    
    if (!moves) return;
    
    // Process the moves to extract opening sequences at different lengths
    const movePairs = moves.split(/\d+\./).filter(Boolean);
    
    // Extract sequences of different depths
    [2, 3, 4, 5, 7, 10].forEach(depth => {
      if (movePairs.length >= depth) {
        const sequenceMovePairs = movePairs.slice(0, depth).join(' ').trim();
        const sequenceKey = `${playerColor}${depth}`;
        
        let openingName = 'Unknown Opening';
        
        // Try to get opening name
        if (game.opening && game.opening.name) {
          openingName = game.opening.name;
        } else if (game.opening && typeof game.opening === 'string') {
          openingName = game.opening;
        }
        
        if (!openingSequences[sequenceKey][sequenceMovePairs]) {
          openingSequences[sequenceKey][sequenceMovePairs] = {
            name: openingName,
            sequence: sequenceMovePairs,
            games: 1,
            wins: game.result === 'win' ? 1 : 0,
            draws: game.result === 'draw' ? 1 : 0,
            losses: game.result === 'loss' ? 1 : 0,
          };
        } else {
          openingSequences[sequenceKey][sequenceMovePairs].games++;
          if (game.result === 'win') openingSequences[sequenceKey][sequenceMovePairs].wins++;
          else if (game.result === 'draw') openingSequences[sequenceKey][sequenceMovePairs].draws++;
          else if (game.result === 'loss') openingSequences[sequenceKey][sequenceMovePairs].losses++;
        }
      }
    });
  });
  
  return {
    sequences: openingSequences,
    totalWhiteGames,
    totalBlackGames
  };
};

// Analyze opening data to find most meaningful openings
const findMeaningfulOpenings = (sequences: Record<string, any>, totalWhiteGames: number, totalBlackGames: number): {
  meaningfulWhite: OpeningData[];
  meaningfulBlack: OpeningData[];
} => {
  // Define typed openingSeq type to avoid 'unknown' errors
  interface OpeningSeq {
    name: string;
    sequence: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
  }

  // Combine all white sequences
  const whiteSequences = [
    ...Object.values(sequences.white2) as OpeningSeq[], 
    ...Object.values(sequences.white3) as OpeningSeq[],
    ...Object.values(sequences.white4) as OpeningSeq[], 
    ...Object.values(sequences.white5) as OpeningSeq[],
    ...Object.values(sequences.white7) as OpeningSeq[], 
    ...Object.values(sequences.white10) as OpeningSeq[]
  ];
  
  // Combine all black sequences
  const blackSequences = [
    ...Object.values(sequences.black2) as OpeningSeq[], 
    ...Object.values(sequences.black3) as OpeningSeq[],
    ...Object.values(sequences.black4) as OpeningSeq[], 
    ...Object.values(sequences.black5) as OpeningSeq[],
    ...Object.values(sequences.black7) as OpeningSeq[], 
    ...Object.values(sequences.black10) as OpeningSeq[]
  ];
  
  // Filter sequences with at least 25 games
  const candidateWhite = whiteSequences.filter(seq => seq.games >= 25);
  const candidateBlack = blackSequences.filter(seq => seq.games >= 25);
  
  // Calculate score and sort - for now using a simplified formula
  const calculateScore = (seq: OpeningSeq) => {
    const winRate = seq.wins / seq.games;
    return seq.games * (Math.abs(winRate - 0.5) + 0.2);
  };
  
  // Sort by score and take top 10
  const meaningfulWhite = candidateWhite
    .map(seq => ({
      ...seq,
      score: calculateScore(seq),
      gamesPercentage: parseFloat((seq.games / totalWhiteGames * 100).toFixed(1)),
      winsPercentage: parseFloat((seq.wins / seq.games * 100).toFixed(1)),
      drawsPercentage: parseFloat((seq.draws / seq.games * 100).toFixed(1)),
      lossesPercentage: parseFloat((seq.losses / seq.games * 100).toFixed(1)),
      fen: pgnToFen(seq.sequence)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  const meaningfulBlack = candidateBlack
    .map(seq => ({
      ...seq,
      score: calculateScore(seq),
      gamesPercentage: parseFloat((seq.games / totalBlackGames * 100).toFixed(1)),
      winsPercentage: parseFloat((seq.wins / seq.games * 100).toFixed(1)),
      drawsPercentage: parseFloat((seq.draws / seq.games * 100).toFixed(1)),
      lossesPercentage: parseFloat((seq.losses / seq.games * 100).toFixed(1)),
      fen: pgnToFen(seq.sequence)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  return { meaningfulWhite, meaningfulBlack };
};

// Format opening data for display
const formatOpeningData = (sequences: Record<string, any>, depth: number, color: 'white' | 'black', totalGames: number): OpeningData[] => {
  // Define typed openingSeq type to avoid 'unknown' errors
  interface OpeningSeq {
    name: string;
    sequence: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
  }

  const key = `${color}${depth}`;
  
  return Object.values(sequences[key])
    .map((opening: OpeningSeq) => ({
      name: opening.name,
      sequence: opening.sequence,
      games: opening.games,
      gamesPercentage: parseFloat((opening.games / totalGames * 100).toFixed(1)),
      wins: opening.wins,
      winsPercentage: parseFloat((opening.wins / opening.games * 100).toFixed(1)),
      draws: opening.draws,
      drawsPercentage: parseFloat((opening.draws / opening.games * 100).toFixed(1)),
      losses: opening.losses,
      lossesPercentage: parseFloat((opening.losses / opening.games * 100).toFixed(1)),
      fen: pgnToFen(opening.sequence)
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);
};

// Generate day and time performance data
const generateTimeAnalysis = (games: any[]): { 
  dayPerformance: DayPerformance[],
  timePerformance: TimeSlotPerformance[]
} => {
  // Initialize day performance tracking
  const dayMap: Record<string, DayPerformance> = {
    'Monday': { day: 'Monday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Tuesday': { day: 'Tuesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Wednesday': { day: 'Wednesday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Thursday': { day: 'Thursday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Friday': { day: 'Friday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Saturday': { day: 'Saturday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    'Sunday': { day: 'Sunday', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  };
  
  // Initialize time slot performance tracking
  const timeSlotMap: Record<string, TimeSlotPerformance> = {
    '00:00-03:59': { slot: '00:00-03:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '04:00-07:59': { slot: '04:00-07:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '08:00-11:59': { slot: '08:00-11:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '12:00-15:59': { slot: '12:00-15:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '16:00-19:59': { slot: '16:00-19:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 },
    '20:00-23:59': { slot: '20:00-23:59', games: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
  };
  
  // Process each game
  games.forEach(game => {
    // Get game timestamp and result
    let timestamp: number = Date.now(); // Default to now
    let result: 'win' | 'loss' | 'draw' = 'draw'; // Default
    
    // Get timestamp
    if (game.end_time) {
      // Chess.com format
      timestamp = game.end_time * 1000; // Convert to milliseconds
    } else if (game.createdAt) {
      // Lichess format
      timestamp = game.createdAt;
    } else if (game.date) {
      // Try to parse from date header
      try {
        const dateStr = game.date.replace(/\./g, '-');
        timestamp = new Date(dateStr).getTime();
      } catch (e) {
        // Use default
      }
    }
    
    // Get result
    result = game.result || 'draw';
    
    // Create a date object
    const date = new Date(timestamp);
    
    // Get day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[date.getDay()];
    
    // Get time slot
    const hour = date.getHours();
    let timeSlot: string;
    
    if (hour >= 0 && hour < 4) timeSlot = '00:00-03:59';
    else if (hour >= 4 && hour < 8) timeSlot = '04:00-07:59';
    else if (hour >= 8 && hour < 12) timeSlot = '08:00-11:59';
    else if (hour >= 12 && hour < 16) timeSlot = '12:00-15:59';
    else if (hour >= 16 && hour < 20) timeSlot = '16:00-19:59';
    else timeSlot = '20:00-23:59';
    
    // Update day stats
    dayMap[day].games++;
    if (result === 'win') dayMap[day].wins++;
    else if (result === 'draw') dayMap[day].draws++;
    else dayMap[day].losses++;
    
    // Update time slot stats
    timeSlotMap[timeSlot].games++;
    if (result === 'win') timeSlotMap[timeSlot].wins++;
    else if (result === 'draw') timeSlotMap[timeSlot].draws++;
    else if (result === 'loss') timeSlotMap[timeSlot].losses++;
  });
  
  // Calculate win rates
  for (const day in dayMap) {
    const data = dayMap[day];
    data.winRate = data.games > 0 ? parseFloat(((data.wins / data.games) * 100).toFixed(1)) : 0;
  }
  
  for (const slot in timeSlotMap) {
    const data = timeSlotMap[slot];
    data.winRate = data.games > 0 ? parseFloat(((data.wins / data.games) * 100).toFixed(1)) : 0;
  }
  
  return {
    dayPerformance: Object.values(dayMap),
    timePerformance: Object.values(timeSlotMap)
  };
};

// Extract insights from user's chess data
const extractInsights = (data: any): string[] => {
  const insights: string[] = [];
  
  // Time-of-day insights
  const timePerformance = data.timePerformance;
  // Find best and worst time slots
  const bestTimeSlot = [...timePerformance].sort((a, b) => b.winRate - a.winRate)[0];
  const worstTimeSlot = [...timePerformance].sort((a, b) => a.winRate - b.winRate)[0];
  
  if (bestTimeSlot && worstTimeSlot && bestTimeSlot.games > 10 && worstTimeSlot.games > 10) {
    const diff = bestTimeSlot.winRate - worstTimeSlot.winRate;
    if (diff > 15) {
      insights.push(`You perform ${diff.toFixed(1)}% better during ${bestTimeSlot.slot} compared to ${worstTimeSlot.slot}. Consider scheduling important games in your stronger time slot.`);
    }
  }
  
  // Day-of-week insights
  const dayPerformance = data.dayPerformance;
  // Find best and worst days
  const bestDay = [...dayPerformance].sort((a, b) => b.winRate - a.winRate)[0];
  const worstDay = [...dayPerformance].sort((a, b) => a.winRate - b.winRate)[0];
  
  if (bestDay && worstDay && bestDay.games > 10 && worstDay.games > 10) {
    insights.push(`Your strongest day is ${bestDay.day} (${bestDay.winRate}% win rate), while your most challenging is ${worstDay.day} (${worstDay.winRate}% win rate).`);
  }
  
  // Opening insights
  const whiteMoves = data.openings.white3;
  const blackMoves = data.openings.black3;
  
  if (whiteMoves.length > 0) {
    const bestWhiteOpening = whiteMoves.sort((a, b) => b.winsPercentage - a.winsPercentage)[0];
    if (bestWhiteOpening.games > 10) {
      insights.push(`Your strongest opening with White is the ${bestWhiteOpening.name} with a ${bestWhiteOpening.winsPercentage}% win rate over ${bestWhiteOpening.games} games.`);
    }
  }
  
  if (blackMoves.length > 0) {
    const bestBlackOpening = blackMoves.sort((a, b) => b.winsPercentage - a.winsPercentage)[0];
    if (bestBlackOpening.games > 10) {
      insights.push(`Your strongest response as Black is the ${bestBlackOpening.name} with a ${bestBlackOpening.winsPercentage}% win rate over ${bestBlackOpening.games} games.`);
    }
  }
  
  // Game phase insights
  if (data.phaseAccuracy) {
    const phases = data.phaseAccuracy;
    const strongest = Object.entries(phases)
      .filter(([key]) => key !== 'totalGames')
      .reduce((a, b) => a[1] > b[1] ? a : b);
    
    const weakest = Object.entries(phases)
      .filter(([key]) => key !== 'totalGames')
      .reduce((a, b) => a[1] < b[1] ? a : b);
    
    if (strongest && weakest) {
      insights.push(`Your ${strongest[0]} is your strongest phase at ${strongest[1]}% accuracy, while your ${weakest[0]} could use improvement at ${weakest[1]}%.`);
    }
  }
  
  // Additional insights as needed
  if (data.weaknesses && data.weaknesses.length > 0) {
    insights.push(`Based on your game history, working on ${data.weaknesses[0].toLowerCase()} could significantly improve your results.`);
  }
  
  return insights.slice(0, 5); // Return at most 5 insights
};

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
    
    // Extract ratings - initially set as empty
    let ratings: Rating = {};
    
    // Try to extract ratings from the games
    if (games.length > 0) {
      const recentGame = games[0];
      
      if (info.platform === 'chess.com') {
        // For Chess.com, try to determine from game time control
        if (recentGame.time_control) {
          const timeControl = recentGame.time_control.toLowerCase();
          if (timeControl.includes('bullet')) {
            ratings.bullet = parseInt(recentGame.white.rating);
          } else if (timeControl.includes('blitz')) {
            ratings.blitz = parseInt(recentGame.white.rating);
          } else if (timeControl.includes('rapid')) {
            ratings.rapid = parseInt(recentGame.white.rating);
          }
        }
      } else {
        // For Lichess, try to get from the players object
        if (recentGame.players && recentGame.players.white && recentGame.players.white.rating) {
          const variant = recentGame.speed || 'blitz';
          if (variant === 'bullet') {
            ratings.bullet = recentGame.players.white.rating;
          } else if (variant === 'blitz') {
            ratings.blitz = recentGame.players.white.rating;
          } else if (variant === 'rapid') {
            ratings.rapid = recentGame.players.white.rating;
          }
        }
      }
    }
    
    // Extract opening data
    const { sequences, totalWhiteGames, totalBlackGames } = extractOpeningSequences(games);
    
    // Find meaningful openings
    const { meaningfulWhite, meaningfulBlack } = findMeaningfulOpenings(sequences, totalWhiteGames, totalBlackGames);
    
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
        white7: formatOpeningData(sequences, 7, 'white', totalWhiteGames),
        black7: formatOpeningData(sequences, 7, 'black', totalBlackGames),
        totalWhiteGames,
        totalBlackGames,
        meaningfulWhite,
        meaningfulBlack
      },
      blitz: {
        white3: [],
        black3: [],
        white5: [],
        black5: [],
        white7: [],
        black7: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: []
      },
      rapid: {
        white3: [],
        black3: [],
        white5: [],
        black5: [],
        white7: [],
        black7: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: []
      },
      bullet: {
        white3: [],
        black3: [],
        white5: [],
        black5: [],
        white7: [],
        black7: [],
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: []
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
        const { meaningfulWhite: variantMeaningfulWhite, meaningfulBlack: variantMeaningfulBlack } = 
          findMeaningfulOpenings(variantData.sequences, variantData.totalWhiteGames, variantData.totalBlackGames);
        
        allOpeningsData[variant] = {
          white3: formatOpeningData(variantData.sequences, 3, 'white', variantData.totalWhiteGames),
          black3: formatOpeningData(variantData.sequences, 3, 'black', variantData.totalBlackGames),
          white5: formatOpeningData(variantData.sequences, 5, 'white', variantData.totalWhiteGames),
          black5: formatOpeningData(variantData.sequences, 5, 'black', variantData.totalBlackGames),
          white7: formatOpeningData(variantData.sequences, 7, 'white', variantData.totalWhiteGames),
          black7: formatOpeningData(variantData.sequences, 7, 'black', variantData.totalBlackGames),
          totalWhiteGames: variantData.totalWhiteGames,
          totalBlackGames: variantData.totalBlackGames,
          meaningfulWhite: variantMeaningfulWhite,
          meaningfulBlack: variantMeaningfulBlack
        };
      }
    }
    
    // Generate time analysis
    const { dayPerformance, timePerformance } = generateTimeAnalysis(games);
    
    // Find best and worst time slots
    const sortedTimeSlots = [...timePerformance].sort((a, b) => b.winRate - a.winRate);
    const bestTimeSlot = sortedTimeSlots.length > 0 ? sortedTimeSlots[0] : null;
    const worstTimeSlot = sortedTimeSlots.length > 0 ? sortedTimeSlots[sortedTimeSlots.length - 1] : null;
    
    // Find best and worst days
    const sortedDays = [...dayPerformance].sort((a, b) => b.winRate - a.winRate);
    const bestDay = sortedDays.length > 0 ? sortedDays[0] : null;
    const worstDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;
    
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
    
    // Add insights to the openings data for all variants
    const insights = extractInsights({
      timePerformance,
      dayPerformance,
      openings: allOpeningsData.all,
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

// Add function to extract ratings from raw game data
export const extractRatings = (games: any[], platform: Platform): Rating => {
  const ratings: Rating = {};
  
  // Group games by variant
  const variantGames = {
    bullet: [] as any[],
    blitz: [] as any[],
    rapid: [] as any[],
  };
