
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
