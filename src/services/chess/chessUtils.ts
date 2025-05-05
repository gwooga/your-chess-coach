
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
