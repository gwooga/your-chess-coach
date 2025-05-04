import { OpeningData, OpeningsTableData, DayPerformance, TimeSlotPerformance, PhaseAccuracy, MoveQuality, UserAnalysis, Rating, ChessVariant } from '@/utils/types';
import { toast } from '@/hooks/use-toast';
import { UserInfo, TimeRange, Platform } from '@/utils/types';
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

// Map of opening moves to names
const openingNames: Record<string, string> = {
  // White openings
  "e4": "King's Pawn Opening",
  "d4": "Queen's Pawn Opening",
  "c4": "English Opening",
  "Nf3": "Réti Opening",
  "f4": "Bird's Opening",
  "b3": "Larsen's Opening",
  "g3": "King's Fianchetto Opening",
  "b4": "Sokolsky Opening",
  "a3": "Anderssen's Opening",
  "Nc3": "Van Geet Opening",
  
  // Black responses to e4
  "e4 e5": "Open Game",
  "e4 e6": "French Defense",
  "e4 c5": "Sicilian Defense",
  "e4 c6": "Caro-Kann Defense",
  "e4 d5": "Scandinavian Defense",
  "e4 d6": "Pirc Defense",
  "e4 g6": "Modern Defense",
  "e4 Nf6": "Alekhine's Defense",
  
  // Black responses to d4
  "d4 d5": "Closed Game",
  "d4 Nf6": "Indian Defense",
  "d4 f5": "Dutch Defense",
  "d4 c5": "Benoni Defense",
  "d4 e6": "French Defense Structure",
  
  // Deeper openings - e4
  "e4 e5 Nf3": "King's Knight Opening",
  "e4 e5 Nf3 Nc6": "Two Knights Defense",
  "e4 e5 Nf3 Nf6": "Petrov's Defense",
  "e4 e5 Bc4": "Bishop's Opening",
  "e4 e5 f4": "King's Gambit",
  "e4 c5 Nf3": "Open Sicilian",
  "e4 c5 Nf3 d6": "Sicilian Najdorf Variation",
  "e4 c5 Nf3 e6": "Sicilian Scheveningen",
  "e4 c5 c3": "Sicilian Alapin",
  "e4 c5 b4": "Sicilian Wing Gambit",
  "e4 e6 d4": "French Defense",
  "e4 e6 d4 d5": "French Defense Main Line",
  "e4 d5 exd5": "Scandinavian Defense",
  "e4 c6 d4": "Caro-Kann Defense",
  "e4 c6 d4 d5": "Caro-Kann Main Line",
  
  // Deeper openings - d4
  "d4 d5 c4": "Queen's Gambit",
  "d4 d5 c4 e6": "Queen's Gambit Declined",
  "d4 d5 c4 c6": "Slav Defense",
  "d4 d5 c4 dxc4": "Queen's Gambit Accepted",
  "d4 Nf6 c4": "Indian Defense",
  "d4 Nf6 c4 e6": "Queen's Indian Defense",
  "d4 Nf6 c4 g6": "King's Indian Defense",
  "d4 Nf6 c4 c5": "Benoni Defense",
  "d4 Nf6 Bf4": "London System",
};

// Get opening name based on sequence
const getOpeningName = (sequence: string): string => {
  // Clean the sequence to simplify matching
  const cleanSequence = sequence.replace(/\d+\.\s/g, '').trim();
  
  // Try to find the longest matching sequence
  let bestMatch = '';
  
  // Check exact matches
  for (const key in openingNames) {
    if (cleanSequence.startsWith(key) && key.length > bestMatch.length) {
      bestMatch = key;
    }
  }
  
  // Return the match or a generic name
  return bestMatch ? openingNames[bestMatch] : "Unknown Opening";
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
    white6: {},
    black6: {},
    white7: {},
    black7: {},
    white8: {},
    black8: {},
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
    [2, 3, 4, 5, 6, 7, 8, 10].forEach(depth => {
      if (movePairs.length >= depth) {
        const sequenceMovePairs = movePairs.slice(0, depth).join(' ').trim();
        const sequenceKey = `${playerColor}${depth}`;
        
        // Get opening name
        const openingName = getOpeningName(sequenceMovePairs);
        
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
  meaningfulCombined: OpeningData[];
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

  // Function to collect sequences across all depths
  const collectSequencesByColor = (color: 'white' | 'black') => {
    const allSequences: Record<string, OpeningSeq> = {};
    
    // Collect sequences from all depths
    for (const depth of [2, 3, 4, 5, 6, 7, 8, 10]) {
      const key = `${color}${depth}`;
      if (!sequences[key]) continue;
      
      for (const [seq, data] of Object.entries(sequences[key])) {
        // Only consider sequences with enough games
        if (data.games >= 5) {
          allSequences[seq] = data as OpeningSeq;
        }
      }
    }
    
    return allSequences;
  };
  
  // Collect all valid sequences
  const whiteSequences = collectSequencesByColor('white');
  const blackSequences = collectSequencesByColor('black');
  
  // Sort sequences by depth (descending), then by games (descending)
  const sortedWhiteKeys = Object.keys(whiteSequences)
    .sort((a, b) => {
      const depthA = a.split(' ').length;
      const depthB = b.split(' ').length;
      if (depthA !== depthB) return depthB - depthA;
      return whiteSequences[b].games - whiteSequences[a].games;
    });
  
  const sortedBlackKeys = Object.keys(blackSequences)
    .sort((a, b) => {
      const depthA = a.split(' ').length;
      const depthB = b.split(' ').length;
      if (depthA !== depthB) return depthB - depthA;
      return blackSequences[b].games - blackSequences[a].games;
    });
  
  // Prune redundant prefixes
  const finalWhiteSequences: OpeningSeq[] = [];
  const finalBlackSequences: OpeningSeq[] = [];
  const usedWhitePrefixes = new Set<string>();
  const usedBlackPrefixes = new Set<string>();
  
  // Process white sequences
  for (const seq of sortedWhiteKeys) {
    // Skip if this sequence is a prefix of an already chosen sequence
    let isPrefix = false;
    for (const prefix of usedWhitePrefixes) {
      if (seq.startsWith(prefix)) {
        isPrefix = true;
        break;
      }
    }
    
    if (!isPrefix) {
      finalWhiteSequences.push(whiteSequences[seq]);
      usedWhitePrefixes.add(seq);
      
      // Stop if we have enough sequences
      if (finalWhiteSequences.length >= 20) break;
    }
  }
  
  // Process black sequences
  for (const seq of sortedBlackKeys) {
    // Skip if this sequence is a prefix of an already chosen sequence
    let isPrefix = false;
    for (const prefix of usedBlackPrefixes) {
      if (seq.startsWith(prefix)) {
        isPrefix = true;
        break;
      }
    }
    
    if (!isPrefix) {
      finalBlackSequences.push(blackSequences[seq]);
      usedBlackPrefixes.add(seq);
      
      // Stop if we have enough sequences
      if (finalBlackSequences.length >= 20) break;
    }
  }
  
  // Calculate percentages and impact scores
  const processSequences = (seqs: OpeningSeq[], totalGames: number, color: 'white' | 'black'): OpeningData[] => {
    return seqs.map(seq => {
      const gamesPercentage = parseFloat((seq.games / totalGames * 100).toFixed(1));
      const winsPercentage = parseFloat((seq.wins / seq.games * 100).toFixed(1));
      const drawsPercentage = parseFloat((seq.draws / seq.games * 100).toFixed(1));
      const lossesPercentage = parseFloat((seq.losses / seq.games * 100).toFixed(1));
      
      // Calculate impact score (games × max(win%, loss%))
      const impactScore = seq.games * Math.max(winsPercentage, lossesPercentage) / 100;
      
      return {
        name: seq.name,
        sequence: seq.sequence,
        games: seq.games,
        gamesPercentage,
        wins: seq.wins,
        winsPercentage,
        draws: seq.draws,
        drawsPercentage,
        losses: seq.losses,
        lossesPercentage,
        fen: pgnToFen(seq.sequence),
        score: impactScore,
        color
      };
    });
  };
  
  const meaningfulWhite = processSequences(finalWhiteSequences, totalWhiteGames, 'white')
    .sort((a, b) => b.score! - a.score!)
    .slice(0, 20);
  
  const meaningfulBlack = processSequences(finalBlackSequences, totalBlackGames, 'black')
    .sort((a, b) => b.score! - a.score!)
    .slice(0, 20);
  
  // Create combined list with impact rankings
  const meaningfulCombined = [...meaningfulWhite, ...meaningfulBlack]
    .sort((a, b) => b.score! - a.score!)
    .slice(0, 20)
    .map((opening, index) => ({
      ...opening,
      impact: index + 1
    }));
  
  return { meaningfulWhite, meaningfulBlack, meaningfulCombined };
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
  
  if (!sequences[key]) return [];
  
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
  
  // Opening insights - more detailed
  if (data.openings) {
    // Find best white opening
    if (data.openings.meaningfulWhite && data.openings.meaningfulWhite.length > 0) {
      const bestWhiteOpening = data.openings.meaningfulWhite[0];
      if (bestWhiteOpening.games > 10) {
        insights.push(`Your strongest White opening is the ${bestWhiteOpening.name} with a ${bestWhiteOpening.winsPercentage}% win rate over ${bestWhiteOpening.games} games. You might want to research more theory on this opening to further improve your results.`);
      }
    }
    
    // Find best black opening
    if (data.openings.meaningfulBlack && data.openings.meaningfulBlack.length > 0) {
      const bestBlackOpening = data.openings.meaningfulBlack[0];
      if (bestBlackOpening.games > 10) {
        insights.push(`Your strongest response as Black is the ${bestBlackOpening.name} with a ${bestBlackOpening.winsPercentage}% win rate over ${bestBlackOpening.games} games. Consider focusing your study on this opening to capitalize on your strengths.`);
      }
    }
    
    // Find problematic opening
    if (data.openings.meaningfulWhite && data.openings.meaningfulWhite.length > 0) {
      const problematicWhite = [...data.openings.meaningfulWhite]
        .filter(o => o.games > 15)
        .sort((a, b) => a.winsPercentage - b.winsPercentage)[0];
      
      if (problematicWhite && problematicWhite.winsPercentage < 40) {
        insights.push(`Your results with the ${problematicWhite.name} as White are concerning (${problematicWhite.winsPercentage}% win rate over ${problematicWhite.games} games). Consider studying this opening more deeply or switching to an alternative.`);
      }
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
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: []
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
        totalWhiteGames: 0,
        totalBlackGames: 0,
        meaningfulWhite: [],
        meaningfulBlack: []
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

// Add function to extract ratings from raw game data
export const extractRatings = (games: any[], platform: Platform): Rating => {
  const ratings: Rating = {};
  
  // Group games by variant
  const variantGames = {
    bullet: [] as any[],
    blitz: [] as any[],
    rapid: [] as any[],
  };
  
  // Process games based on platform
  if (games.length > 0) {
    if (platform === 'chess.com') {
      // For chess.com, filter games by time control
      games.forEach(game => {
        const timeControl = game.time_control || '';
        if (typeof timeControl === 'string') {
          if (timeControl.includes('bullet') || (parseInt(timeControl) < 180)) {
            variantGames.bullet.push(game);
          } else if (timeControl.includes('blitz') || (parseInt(timeControl) >= 180 && parseInt(timeControl) <= 600)) {
            variantGames.blitz.push(game);
          } else if (timeControl.includes('rapid') || (parseInt(timeControl) > 600)) {
            variantGames.rapid.push(game);
          }
        }
      });
      
      // Extract most recent rating for each variant
      if (variantGames.bullet.length > 0) {
        const game = variantGames.bullet[0];
        // Try to get the player's rating, checking both white and black
        if (game.white && game.white.rating && game.white.username) {
          ratings.bullet = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.bullet = parseInt(game.black.rating);
        }
      }
      
      if (variantGames.blitz.length > 0) {
        const game = variantGames.blitz[0];
        if (game.white && game.white.rating && game.white.username) {
          ratings.blitz = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.blitz = parseInt(game.black.rating);
        }
      }
      
      if (variantGames.rapid.length > 0) {
        const game = variantGames.rapid[0];
        if (game.white && game.white.rating && game.white.username) {
          ratings.rapid = parseInt(game.white.rating);
        } else if (game.black && game.black.rating && game.black.username) {
          ratings.rapid = parseInt(game.black.rating);
        }
      }
    } else if (platform === 'lichess') {
      // For lichess, extract from players object
      games.forEach(game => {
        const variant = game.speed || 'blitz';
        if (variant === 'bullet') {
          variantGames.bullet.push(game);
        } else if (variant === 'blitz') {
          variantGames.blitz.push(game);
        } else if (variant === 'rapid') {
          variantGames.rapid.push(game);
        }
      });
      
      // Extract most recent rating for each variant
      if (variantGames.bullet.length > 0) {
        const game = variantGames.bullet[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.bullet = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.bullet = game.players.black.rating;
        }
      }
      
      if (variantGames.blitz.length > 0) {
        const game = variantGames.blitz[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.blitz = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.blitz = game.players.black.rating;
        }
      }
      
      if (variantGames.rapid.length > 0) {
        const game = variantGames.rapid[0];
        if (game.players && game.players.white && game.players.white.rating) {
          ratings.rapid = game.players.white.rating;
        } else if (game.players && game.players.black && game.players.black.rating) {
          ratings.rapid = game.players.black.rating;
        }
      }
    }
    
    // Placeholder for uploaded games
    else {
      // For uploaded games, use some dummy ratings if not available otherwise
      if (!ratings.blitz) ratings.blitz = 1500 + Math.floor(Math.random() * 500);
      if (!ratings.rapid) ratings.rapid = 1500 + Math.floor(Math.random() * 500);
      if (!ratings.bullet) ratings.bullet = 1500 + Math.floor(Math.random() * 500);
    }
  }
  
  return ratings;
};
