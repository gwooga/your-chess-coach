
import { OpeningData, OpeningsTableData, ChessVariant } from '@/utils/types';
import { getOpeningName } from './openingsDatabase';
import { pgnToFen } from './chessUtils';

// Extract opening sequences from games
export const extractOpeningSequences = (games: any[]): Record<string, any> => {
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
    // Extract the player's color
    let playerColor = game.playerColor || 'white';
    
    // If playerColor is not already determined
    if (!game.playerColor) {
      // For Chess.com games
      if (game.black && game.black.username && 
          game.white && game.white.username) {
        if (typeof game.black.username === 'string' && 
            typeof game.white.username === 'string' &&
            game.black.username.toLowerCase() === game.username?.toLowerCase()) {
          playerColor = 'black';
        }
      } 
      // For Lichess games
      else if (game.players) {
        const blackUser = game.players.black.user;
        const whiteUser = game.players.white.user;
        if (blackUser && whiteUser && blackUser.name && 
            blackUser.name.toLowerCase() === game.username?.toLowerCase()) {
          playerColor = 'black';
        }
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
export const findMeaningfulOpenings = (
  sequences: Record<string, any>, 
  totalWhiteGames: number, 
  totalBlackGames: number
): {
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
  // Ensure we combine both White and Black openings
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
export const formatOpeningData = (sequences: Record<string, any>, depth: number, color: 'white' | 'black', totalGames: number): OpeningData[] => {
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
      fen: pgnToFen(opening.sequence),
      color: color // Add color info to each opening
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10);
};
