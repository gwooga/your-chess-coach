
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpeningData, ChessVariant } from '@/utils/types';
import { Button } from '@/components/ui/button';
import ChessBoard from './ChessBoard';
import { EyeIcon } from 'lucide-react';

interface OpeningSummaryTableProps {
  rootLine: OpeningData;
  childLines: OpeningData[];
  tableNumber: number;
  totalGames: number;
}

const OpeningSummaryTable: React.FC<OpeningSummaryTableProps> = ({ 
  rootLine, 
  childLines, 
  tableNumber,
  totalGames 
}) => {
  const [selectedLine, setSelectedLine] = useState<OpeningData>(rootLine);
  
  // Function to format win/draw/loss percentages
  const formatPercentage = (percentage: number | undefined) => {
    if (percentage === undefined) return '0%';
    return `${Math.round(percentage)}%`;
  };

  // Format sequence with proper spacing for child lines
  const formatSequence = (sequence: string, isChild: boolean) => {
    return isChild ? <span className="pl-6 block">{sequence}</span> : sequence;
  };

  // Get color class for the table based on the root line's color
  const getColorClass = (color?: string) => {
    return color === 'white' ? 'text-amber-700' : 'text-blue-700';
  };

  // Format opening name to be more concise
  const formatOpeningName = (name: string) => {
    // Take just the opening and first sub-label if present
    const parts = name.split(':');
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return name;
  };

  // Format game count and percentage
  const formatGamesCount = (games: number, totalGamesForColor: number) => {
    const percentage = (games / totalGamesForColor) * 100;
    return `${games} (${percentage.toFixed(1)}%)`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 border rounded-lg p-4 bg-gray-50">
      <div className="lg:col-span-2">
        <h3 className="text-lg font-bold mb-3">
          Table {tableNumber}: Root '{rootLine.sequence}' ({rootLine.color === 'white' ? 'White' : 'Black'})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Opening</TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead className="w-[120px]">Games (N)</TableHead>
              <TableHead className="w-[80px] text-green-600">Wins (%)</TableHead>
              <TableHead className="w-[80px]">Draws (%)</TableHead>
              <TableHead className="w-[80px] text-red-600">Losses (%)</TableHead>
              <TableHead className="w-[80px]">Board</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Root line */}
            <TableRow className={`font-medium ${getColorClass(rootLine.color)}`}>
              <TableCell>{formatOpeningName(rootLine.name)}</TableCell>
              <TableCell>{rootLine.sequence}</TableCell>
              <TableCell>{formatGamesCount(rootLine.games, totalGames)}</TableCell>
              <TableCell className="text-green-600">{formatPercentage(rootLine.winsPercentage)}</TableCell>
              <TableCell>{formatPercentage(rootLine.drawsPercentage)}</TableCell>
              <TableCell className="text-red-600">{formatPercentage(rootLine.lossesPercentage)}</TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLine(rootLine)}
                  className="flex items-center gap-1"
                >
                  <EyeIcon className="h-4 w-4" /> View
                </Button>
              </TableCell>
            </TableRow>
            
            {/* Child lines */}
            {childLines.map((line, index) => (
              <TableRow key={index} className={getColorClass(line.color)}>
                <TableCell>{formatOpeningName(line.name)}</TableCell>
                <TableCell>{formatSequence(line.sequence, true)}</TableCell>
                <TableCell>{formatGamesCount(line.games, totalGames)}</TableCell>
                <TableCell className="text-green-600">{formatPercentage(line.winsPercentage)}</TableCell>
                <TableCell>{formatPercentage(line.drawsPercentage)}</TableCell>
                <TableCell className="text-red-600">{formatPercentage(line.lossesPercentage)}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedLine(line)}
                    className="flex items-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Coach's glance section */}
        <div className="mt-4 p-4 bg-white border rounded-lg">
          <h4 className="text-md font-semibold mb-2">Coach's glance</h4>
          <div className="space-y-2 text-gray-700">
            <p>
              {rootLine.color === 'white' 
                ? `This opening appears in ${rootLine.gamesPercentage?.toFixed(1)}% of your White games, making it a significant part of your repertoire.` 
                : `This opening appears in ${rootLine.gamesPercentage?.toFixed(1)}% of your Black games, making it a significant part of your repertoire.`
              }
            </p>
            {rootLine.winsPercentage && rootLine.winsPercentage > 60 && 
              <p>Your win rate of {Math.round(rootLine.winsPercentage)}% with this opening is excellent. Continue to explore and deepen your understanding of these positions.</p>
            }
            {rootLine.winsPercentage && rootLine.winsPercentage < 45 && 
              <p>Your win rate of {Math.round(rootLine.winsPercentage)}% suggests you may need to review your approach to this opening.</p>
            }
            <p>
              Consider watching instructional videos on key tactical themes in the {rootLine.name} to improve your understanding of the resulting positions.
            </p>
            <p>
              Practice the common tactical motifs that arise from this structure to build pattern recognition and increase your win rate.
            </p>
          </div>
        </div>
      </div>
      
      {/* Chess board display */}
      <div className="flex flex-col items-center">
        <h4 className="text-md font-semibold mb-2">Position after: {selectedLine.sequence}</h4>
        <ChessBoard fen={selectedLine.fen || ''} side={selectedLine.color} />
        <p className="mt-4 text-sm text-center text-gray-500">
          Click "View" next to any line to see the position on the board
        </p>
      </div>
    </div>
  );
};

export default OpeningSummaryTable;
