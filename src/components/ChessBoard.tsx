
import React, { useEffect, useState } from 'react';

interface ChessBoardProps {
  fen: string;
  side?: 'white' | 'black';
}

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, side = 'white' }) => {
  const [boardArray, setBoardArray] = useState<string[][]>([]);
  
  useEffect(() => {
    // Parse FEN and get the position part
    const fenParts = fen.split(' ');
    const position = fenParts[0];
    
    // Split position by ranks
    const ranks = position.split('/');
    
    // Process each rank and create a 2D array
    const board: string[][] = [];
    
    ranks.forEach(rank => {
      const row: string[] = [];
      
      for (let i = 0; i < rank.length; i++) {
        const char = rank[i];
        
        if (isNaN(parseInt(char, 10))) {
          // It's a piece
          row.push(char);
        } else {
          // It's a number, add that many empty spaces
          const emptySquares = parseInt(char, 10);
          for (let j = 0; j < emptySquares; j++) {
            row.push('');
          }
        }
      }
      
      board.push(row);
    });
    
    setBoardArray(board);
  }, [fen]);
  
  // Chess pieces mapping
  const getPieceImagePath = (piece: string): string => {
    const color = piece.toLowerCase() === piece ? 'b' : 'w';
    const type = piece.toLowerCase();
    
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
    // Adjust the board based on the side to play
    const adjustedBoard = side === 'white' ? [...boardArray] : [...boardArray].reverse();
    
    return (
      <div className="chess-board border border-gray-300 rounded overflow-hidden">
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
    <div className="w-full max-w-[300px]">
      {renderBoard()}
    </div>
  );
};

export default ChessBoard;
