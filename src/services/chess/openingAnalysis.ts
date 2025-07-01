import { OpeningData, OpeningsTableData, ChessVariant } from '@/utils/types';
import { getOpeningName } from './openingsDatabase';
import { pgnToFen, extractOpeningName, filterGamesByPlayerColor, cleanMoveSequence } from './chessUtils';

// Analyze opening sequences based on games and user info
export const analyzeOpenings = (games: any[], username: string): {
  openings: Record<ChessVariant, OpeningsTableData>;
  totalWhiteGames: number;
  totalBlackGames: number;
} => {
  // First, separate games by variant and color
  const variantGames = {
    all: games,
    blitz: games.filter(g => {
      const timeControl = g.time_control || '';
      return timeControl.includes('blitz') || (parseInt(timeControl) >= 180 && parseInt(timeControl) <= 600);
    }),
    rapid: games.filter(g => {
      const timeControl = g.time_control || '';
      return timeControl.includes('rapid') || (parseInt(timeControl) > 600);
    }),
    bullet: games.filter(g => {
      const timeControl = g.time_control || '';
      return timeControl.includes('bullet') || (parseInt(timeControl) < 180);
    })
  };
  
  // Process each variant
  const result: Record<ChessVariant, OpeningsTableData> = {} as Record<ChessVariant, OpeningsTableData>;
  
  // Overall totals
  const totalWhiteGames = filterGamesByPlayerColor(games, username, 'white').length;
  const totalBlackGames = filterGamesByPlayerColor(games, username, 'black').length;
  
  // Process each variant
  for (const variant of Object.keys(variantGames) as ChessVariant[]) {
    // Get games for this variant
    const variantGameSet = variantGames[variant];
    
    // Separate by color
    const whiteGames = filterGamesByPlayerColor(variantGameSet, username, 'white');
    const blackGames = filterGamesByPlayerColor(variantGameSet, username, 'black');
    
    // Extract opening sequences
    const sequences = extractOpeningSequences(whiteGames, blackGames, username);
    
    // Find meaningful openings
    const { meaningfulWhite, meaningfulBlack, meaningfulCombined } = findMeaningfulOpenings(
      sequences, 
      whiteGames.length, 
      blackGames.length
    );
    
    // Format opening data for different move depths
    result[variant] = {
      white2: formatOpeningData(sequences.white2, whiteGames.length, 'white'),
      black2: formatOpeningData(sequences.black2, blackGames.length, 'black'),
      white3: formatOpeningData(sequences.white3, whiteGames.length, 'white'),
      black3: formatOpeningData(sequences.black3, blackGames.length, 'black'),
      white4: formatOpeningData(sequences.white4, whiteGames.length, 'white'),
      black4: formatOpeningData(sequences.black4, blackGames.length, 'black'),
      white5: formatOpeningData(sequences.white5, whiteGames.length, 'white'),
      black5: formatOpeningData(sequences.black5, blackGames.length, 'black'),
      white6: formatOpeningData(sequences.white6, whiteGames.length, 'white'),
      black6: formatOpeningData(sequences.black6, blackGames.length, 'black'),
      white7: formatOpeningData(sequences.white7, whiteGames.length, 'white'),
      black7: formatOpeningData(sequences.black7, blackGames.length, 'black'),
      white8: formatOpeningData(sequences.white8, whiteGames.length, 'white'),
      black8: formatOpeningData(sequences.black8, blackGames.length, 'black'),
      white10: formatOpeningData(sequences.white10, whiteGames.length, 'white'),
      black10: formatOpeningData(sequences.black10, blackGames.length, 'black'),
      totalWhiteGames: whiteGames.length,
      totalBlackGames: blackGames.length,
      meaningfulWhite,
      meaningfulBlack,
      meaningfulCombined
    };
  }
  
  return {
    openings: result,
    totalWhiteGames,
    totalBlackGames
  };
};

// Extract opening sequences from games
export const extractOpeningSequences = (whiteGames: any[], blackGames: any[], username: string) => {
  const sequences = {
    white2: {}, white3: {}, white4: {}, white5: {}, white6: {}, white7: {}, white8: {}, white10: {},
    black2: {}, black3: {}, black4: {}, black5: {}, black6: {}, black7: {}, black8: {}, black10: {}
  };
  
  // Process white games
  processGames(whiteGames, sequences, 'white', username);
  
  // Process black games
  processGames(blackGames, sequences, 'black', username);
  
  return sequences;
};

// Process games to extract opening sequences
const processGames = (games: any[], sequences: Record<string, any>, color: 'white' | 'black', username: string) => {
  games.forEach(game => {
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
    
    // Clean the moves string before splitting into move pairs
    const cleanedMoves = cleanMoveSequence(moves);
    const movePairs = cleanedMoves.split(/\d+\./).filter(Boolean);
    
    // Extract sequences of different depths
    [2, 3, 4, 5, 6, 7, 8, 10].forEach(depth => {
      if (movePairs.length >= depth) {
        const sequenceMovePairs = movePairs.slice(0, depth).join(' ').trim();
        const sequenceKey = `${color}${depth}`;
        
        // Extract opening name from headers
        let openingName = "Unknown Opening";
        if (game.headers) {
          openingName = extractOpeningName(game.headers);
        }
        
        if (!sequences[sequenceKey][sequenceMovePairs]) {
          sequences[sequenceKey][sequenceMovePairs] = {
            name: openingName,
            sequence: sequenceMovePairs,
            games: 1,
            wins: game.result === 'win' ? 1 : 0,
            draws: game.result === 'draw' ? 1 : 0,
            losses: game.result === 'loss' ? 1 : 0,
          };
        } else {
          sequences[sequenceKey][sequenceMovePairs].games++;
          if (game.result === 'win') sequences[sequenceKey][sequenceMovePairs].wins++;
          else if (game.result === 'draw') sequences[sequenceKey][sequenceMovePairs].draws++;
          else if (game.result === 'loss') sequences[sequenceKey][sequenceMovePairs].losses++;
        }
      }
    });
  });
};

// Analyze opening data to find most meaningful openings
export const findMeaningfulOpenings = (
  sequences: Record<string, any>, 
  totalWhiteGames: number, 
  totalBlackGames: number
): {
  meaningfulWhite: OpeningData[];
  meaningfulBlack: OpeningData[];
  meaningfulCombined: OpeningData[];
} => {
  // Define typed openingSeq type
  interface OpeningSeq {
    name: string;
    sequence: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
  }

  // Function to collect sequences across all depths by color
  const collectSequencesByColor = (color: 'white' | 'black') => {
    const allSequences: Record<string, OpeningSeq> = {};
    
    // Collect sequences from all depths
    for (const depth of [2, 3, 4, 5, 6, 7, 8, 10]) {
      const key = `${color}${depth}`;
      if (!sequences[key]) continue;
      
      for (const [seq, data] of Object.entries(sequences[key])) {
        // Only consider sequences with enough games (minimum threshold)
        if ((data as OpeningSeq).games >= 3) {
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
  
  // Prune redundant prefixes for more targeted analysis
  const finalWhiteSequences: OpeningSeq[] = [];
  const finalBlackSequences: OpeningSeq[] = [];
  const usedWhitePrefixes = new Set<string>();
  const usedBlackPrefixes = new Set<string>();
  
  // Process white sequences
  processMeaningfulSequences(sortedWhiteKeys, whiteSequences, finalWhiteSequences, usedWhitePrefixes);
  
  // Process black sequences
  processMeaningfulSequences(sortedBlackKeys, blackSequences, finalBlackSequences, usedBlackPrefixes);
  
  // Calculate percentages and impact scores
  const meaningfulWhite = processOpeningData(finalWhiteSequences, totalWhiteGames, 'white');
  const meaningfulBlack = processOpeningData(finalBlackSequences, totalBlackGames, 'black');
  
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

// Process sequences for meaningful openings analysis
const processMeaningfulSequences = (
  sortedKeys: string[],
  sequences: Record<string, any>,
  finalSequences: any[],
  usedPrefixes: Set<string>
) => {
  for (const seq of sortedKeys) {
    // Skip if this sequence is a prefix of an already chosen sequence
    let isPrefix = false;
    for (const prefix of usedPrefixes) {
      if (seq.startsWith(prefix)) {
        isPrefix = true;
        break;
      }
    }
    
    if (!isPrefix) {
      finalSequences.push(sequences[seq]);
      usedPrefixes.add(seq);
      
      // Stop if we have enough sequences
      if (finalSequences.length >= 20) break;
    }
  }
};

// Process opening data with statistics
const processOpeningData = (seqs: any[], totalGames: number, color: 'white' | 'black'): OpeningData[] => {
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
  }).sort((a, b) => b.score! - a.score!).slice(0, 20);
};

// Format opening data for display
export const formatOpeningData = (sequences: Record<string, any>, totalGames: number, color: 'white' | 'black'): OpeningData[] => {
  if (!sequences) return [];
  
  return Object.values(sequences)
    .map((opening: any) => ({
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
      fen: pgnToFen(opening.sequence),
      color: color
    }))
    .sort((a: any, b: any) => b.games - a.games)
    .slice(0, 10);
};
