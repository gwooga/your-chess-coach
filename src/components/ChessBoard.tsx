
import React, { useEffect, useState } from 'react';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  side?: 'white' | 'black';
}

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, side = 'white' }) => {
  const [boardArray, setBoardArray] = useState<string[][]>([]);
  
  useEffect(() => {
    try {
      // Try to use Chess.js to parse the FEN
      const chess = new Chess(fen);
      const board = chess.board();
      
      // Process the board into a 2D array format we can display
      const processedBoard = board.map(row => 
        row.map(square => square ? (square.color + square.type) : '')
      );
      
      setBoardArray(processedBoard);
    } catch (error) {
      console.error("Invalid FEN or parsing error:", error);
      // Fall back to default position if there's an error
      try {
        const chess = new Chess();
        const board = chess.board();
        const processedBoard = board.map(row => 
          row.map(square => square ? (square.color + square.type) : '')
        );
        setBoardArray(processedBoard);
      } catch (fallbackError) {
        console.error("Failed to use fallback board:", fallbackError);
        // Use empty board as last resort
        setBoardArray(Array(8).fill(Array(8).fill('')));
      }
    }
  }, [fen]);
  
  // Chess pieces mapping
  const getPieceImagePath = (piece: string): string => {
    if (!piece) return '';
    
    const color = piece[0]; // 'w' or 'b'
    const type = piece[1]; // 'p', 'r', 'n', 'b', 'q', 'k'
    
    // Map piece to its name
    switch (type) {
      case 'p': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}p.png`;
      case 'r': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}r.png`;
      case 'n': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}n.png`;
      case 'b': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}b.png`;
      case 'q': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}q.png`;
      case 'k': return `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${color}k.png`;
      default: return '';
    }
  };
  
  const renderSquare = (row: number, col: number, piece: string) => {
    const isLightSquare = (row + col) % 2 === 0;
    const squareClass = isLightSquare ? 'chess-square-light' : 'chess-square-dark';
    
    return (
      <div key={`${row}-${col}`} className={`chess-square ${squareClass}`}>
        {piece && (
          <div 
            className="chess-piece animate"
            style={{
              backgroundImage: `url(${getPieceImagePath(piece)})`
            }}
          />
        )}
      </div>
    );
  };
  
  const renderBoard = () => {
    if (!boardArray.length) return null;
    
    // Adjust the board based on the side to play
    const adjustedBoard = side === 'white' ? [...boardArray] : [...boardArray].reverse();
    
    return (
      <div className="chess-board border border-gray-300 rounded overflow-hidden grid grid-cols-8">
        {adjustedBoard.map((row, rowIndex) => {
          const adjustedRow = side === 'white' ? [...row] : [...row].reverse();
          
          return adjustedRow.map((piece, colIndex) => {
            const adjustedRowIndex = side === 'white' ? rowIndex : 7 - rowIndex;
            const adjustedColIndex = side === 'white' ? colIndex : 7 - colIndex;
            return renderSquare(adjustedRowIndex, adjustedColIndex, piece);
          });
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[300px] mx-auto">
      {renderBoard()}
    </div>
  );
};

export default ChessBoard;
