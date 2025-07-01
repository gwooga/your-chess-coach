import { Chess } from 'chess.js';

// Convert PGN moves to FEN
export const pgnToFen = (moves: string): string => {
  try {
    const chess = new Chess();
    
    // Clean up the PGN to extract just the moves
    // Remove result patterns like 1-0, 0-1, 1/2-1/2
    const cleanedMoves = moves.replace(/\s+(1-0|0-1|1\/2-1\/2)\s*$/, '');
    
    // Split the moves by move numbers and clean them
    const moveRegex = /(\d+\.\s*[^\d.]+)(?:\s+|$)/g;
    let moveMatch;
    let cleanMoves = [];
    
    while ((moveMatch = moveRegex.exec(cleanedMoves)) !== null) {
      // Extract just the moves without the numbers
      const movePair = moveMatch[1].replace(/^\d+\.\s*/, '');
      const individualMoves = movePair.trim().split(/\s+/);
      cleanMoves.push(...individualMoves);
    }
    
    // If regex didn't work, fall back to simple space splitting
    if (cleanMoves.length === 0) {
      cleanMoves = cleanedMoves.replace(/\d+\.\s/g, '').split(/\s+/).filter(Boolean);
    }
    
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

// Extract opening name from PGN headers according to specified priority
export const extractOpeningName = (headers: Record<string, string>): string => {
  // Priority 1: Use the "Opening" header if available
  if (headers.Opening) {
    return headers.Opening;
  }
  
  // Priority 2: Use ECOUrl if available
  if (headers.ECOUrl) {
    const match = headers.ECOUrl.match(/\/openings\/(.+)$/);
    if (match && match[1]) {
      return match[1].replace(/-/g, ' ');
    }
  }
  
  // Priority 3: If we have an ECO code, use our mapping table
  if (headers.ECO) {
    const openingName = ecoToOpeningName(headers.ECO);
    if (openingName) {
      return openingName;
    }
  }
  
  // Default fallback
  return "Unknown Opening";
};

// Map ECO code to opening name
const ecoToOpeningName = (eco: string): string => {
  // A simplified mapping table for common ECO codes
  const ecoMap: Record<string, string> = {
    // A codes - Flank Openings
    "A00": "Irregular Opening",
    "A01": "Nimzovich-Larsen Attack",
    "A04": "Reti Opening",
    "A07": "King's Indian Attack",
    "A10": "English Opening",
    "A20": "English Opening",
    "A40": "Queen's Pawn",
    "A45": "Queen's Pawn Game",
    "A80": "Dutch",
    "A90": "Dutch Defense",
    
    // B codes - Semi-Open Games
    "B00": "Uncommon King's Pawn Opening",
    "B01": "Scandinavian Defense",
    "B06": "Modern Defense",
    "B07": "Pirc Defense",
    "B10": "Caro-Kann Defense",
    "B12": "Caro-Kann Defense",
    "B20": "Sicilian Defense",
    "B21": "Sicilian, Smith-Morra Gambit",
    "B23": "Sicilian, Closed",
    "B30": "Sicilian Defense",
    "B50": "Sicilian",
    "B54": "Sicilian",
    "B72": "Sicilian, Dragon",
    "B90": "Sicilian, Najdorf",
    
    // C codes - Open Games
    "C00": "French Defense",
    "C02": "French Defense, Advance",
    "C10": "French Defense",
    "C20": "King's Pawn Game",
    "C23": "Bishop's Opening",
    "C25": "Vienna Game",
    "C30": "King's Gambit",
    "C40": "King's Knight Opening",
    "C41": "Philidor Defense",
    "C42": "Petrov Defense",
    "C44": "King's Pawn Game",
    "C45": "Scotch Game",
    "C50": "Italian Game",
    "C55": "Two Knights Defense",
    "C60": "Ruy Lopez",
    "C65": "Ruy Lopez, Berlin Defense",
    "C70": "Ruy Lopez",
    "C78": "Ruy Lopez",
    "C80": "Ruy Lopez, Open",
    "C88": "Ruy Lopez",
    
    // D codes - Closed Games and Semi-Closed
    "D00": "Queen's Pawn Game",
    "D02": "Queen's Pawn Game",
    "D04": "Queen's Pawn Game",
    "D10": "Queen's Gambit Declined Slav",
    "D20": "Queen's Gambit Accepted",
    "D30": "Queen's Gambit Declined",
    "D35": "Queen's Gambit Declined",
    "D37": "Queen's Gambit Declined",
    "D43": "Queen's Gambit Declined Semi-Slav",
    "D44": "Queen's Gambit Declined Semi-Slav",
    "D45": "Queen's Gambit Declined Semi-Slav",
    "D50": "Queen's Gambit Declined",
    "D80": "Gruenfeld Defense",
    "D85": "Gruenfeld Defense",
    "D90": "Gruenfeld Defense",
    
    // E codes - Indian Defenses
    "E00": "Queen's Pawn Game",
    "E10": "Queen's Pawn Game",
    "E12": "Queen's Indian",
    "E20": "Nimzo-Indian Defense",
    "E32": "Nimzo-Indian Defense",
    "E40": "Nimzo-Indian Defense",
    "E50": "Nimzo-Indian Defense",
    "E60": "King's Indian Defense",
    "E70": "King's Indian Defense",
    "E80": "King's Indian Defense",
    "E90": "King's Indian Defense"
  };

  // Get the first 3 characters of the ECO code (the main classification)
  const mainEco = eco.substring(0, 3);
  
  // Return the opening name if found, otherwise a generic name based on the ECO range
  if (ecoMap[mainEco]) {
    return ecoMap[mainEco];
  }
  
  // If not in our map, create a generic name based on the ECO category
  const firstChar = eco.charAt(0);
  switch (firstChar) {
    case 'A': return "Flank Opening";
    case 'B': return "Semi-Open Game";
    case 'C': return "Open Game";
    case 'D': return "Closed Game";
    case 'E': return "Indian Defense";
    default: return "Unknown Opening";
  }
};

// Filter games by player color
export const filterGamesByPlayerColor = (games: any[], username: string, color: 'white' | 'black'): any[] => {
  return games.filter(game => {
    if (color === 'white') {
      // Check if the player is White
      if (game.white && game.white.username) {
        return game.white.username.toLowerCase() === username.toLowerCase();
      }
      // For Lichess games
      if (game.players && game.players.white && game.players.white.user) {
        return game.players.white.user.name?.toLowerCase() === username.toLowerCase();
      }
    } else {
      // Check if the player is Black
      if (game.black && game.black.username) {
        return game.black.username.toLowerCase() === username.toLowerCase();
      }
      // For Lichess games
      if (game.players && game.players.black && game.players.black.user) {
        return game.players.black.user.name?.toLowerCase() === username.toLowerCase();
      }
    }
    
    // If unable to determine by the above, check playerColor (if available)
    if (game.playerColor) {
      return game.playerColor === color;
    }
    
    return false;
  });
};

// Utility to clean move sequences of clock annotations and curly-brace metadata
export const cleanMoveSequence = (sequence: string): string => {
  // Remove all {...} blocks (including clock annotations and comments)
  return sequence.replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
};
