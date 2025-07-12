import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OpeningData } from '@/utils/types';
import ChessBoard from './ChessBoard';
import { getOpeningNameBySequence } from '@/services/chess/openingsDatabase';

interface OpeningSummaryTableProps {
  rootLine: OpeningData;
  childLines: OpeningData[];
  tableNumber: number;
  totalGames: number;
  rating: number;
  tableKey?: string;
  preloadedNotes?: string[];
  variant?: string;
}

const notesCache: Record<string, string[]> = {};

const OpeningSummaryTable: React.FC<OpeningSummaryTableProps> = ({ 
  rootLine, 
  childLines, 
  tableNumber,
  totalGames,
  rating,
  tableKey,
  preloadedNotes,
  variant
}) => {
  const [selectedLine, setSelectedLine] = useState<OpeningData>(rootLine);
  const [coachNotes, setCoachNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare table data for API
  const tableData = [rootLine, ...childLines].map(line => ({
    Opening: getOpeningNameBySequence(line.sequence),
    Sequence: line.sequence,
    'Games (N)': line.games,
    'Wins (%)': Math.round(line.winsPercentage ?? 0),
    'Draws (%)': Math.round(line.drawsPercentage ?? 0),
    'Losses (%)': Math.round(line.lossesPercentage ?? 0),
  }));
  const cacheKey = JSON.stringify({ tableData, rating });

  useEffect(() => {
    // If preloaded notes are provided, use them instead of fetching
    if (preloadedNotes && preloadedNotes.length > 0) {
      setCoachNotes(preloadedNotes);
      setLoading(false);
      setError(null);
      return;
    }

    // If variant is not 'all' and no preloaded notes, show upgrade message instead of loading
    if (variant && variant !== 'all' && (!preloadedNotes || preloadedNotes.length === 0)) {
      setCoachNotes([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    if (notesCache[cacheKey]) {
      setCoachNotes(notesCache[cacheKey]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setCoachNotes([]);
    fetch('/api/coachNotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableData, rating }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          if (data.notes) {
            notesCache[cacheKey] = data.notes;
            setCoachNotes(data.notes);
            setError(null);
          } else {
            setError(data.error || 'No notes returned');
          }
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Failed to fetch coach notes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cacheKey, preloadedNotes, variant]);

  // Format opening name to be more concise
  const formatOpeningName = (sequence: string) => {
    return getOpeningNameBySequence(sequence);
  };
  
  // Function to format win/draw/loss percentages
  const formatPercentage = (percentage: number | undefined) => {
    if (percentage === undefined) return '0%';
    return `${Math.round(percentage)}%`;
  };

  // Format game count and percentage
  const formatGamesCount = (games: number, totalGamesForColor: number) => {
    const percentage = (games / totalGamesForColor) * 100;
    return `${games} (${percentage.toFixed(1)}%)`;
  };

  // Get display name for the table
  const getTableTitle = () => {
    const colorDisplay = rootLine.color === 'white' ? 'White' : 'Black';
    const colorStyle = rootLine.color === 'white' ? { color: 'blue' } : { color: 'orange' };
    
    return (
      <>
        {formatOpeningName(rootLine.sequence)}: '{rootLine.sequence}' (
        <span style={colorStyle}>{colorDisplay}</span>
        )
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 border rounded-lg p-4 bg-gray-50">
      <div className="lg:col-span-2">
        <h3 className="text-lg font-bold mb-3">{getTableTitle()}</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Opening</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead className="w-[120px]">Games (N)</TableHead>
                <TableHead className="w-[80px]" style={{color: 'rgb(22 163 74)'}}>Wins (%)</TableHead>
                <TableHead className="w-[80px]" style={{color: 'rgb(75 85 99)'}}>Draws (%)</TableHead>
                <TableHead className="w-[80px]" style={{color: 'rgb(220 38 38)'}}>Losses (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Root line */}
              <TableRow 
                className="font-medium bg-gray-100 hover:bg-gray-200"
                onMouseEnter={() => setSelectedLine(rootLine)}
              >
                <TableCell>{formatOpeningName(rootLine.sequence)}</TableCell>
                <TableCell>{rootLine.sequence}</TableCell>
                <TableCell>{formatGamesCount(rootLine.games, totalGames)}</TableCell>
                <TableCell style={{color: 'rgb(22 163 74)'}}>{formatPercentage(rootLine.winsPercentage)}</TableCell>
                <TableCell style={{color: 'rgb(75 85 99)'}}>{formatPercentage(rootLine.drawsPercentage)}</TableCell>
                <TableCell style={{color: 'rgb(220 38 38)'}}>{formatPercentage(rootLine.lossesPercentage)}</TableCell>
              </TableRow>
              
              {/* Child lines */}
              {childLines.map((line, index) => (
                <TableRow 
                  key={index}
                  onMouseEnter={() => setSelectedLine(line)}
                >
                  <TableCell>{formatOpeningName(line.sequence)}</TableCell>
                  <TableCell>{line.sequence}</TableCell>
                  <TableCell>{formatGamesCount(line.games, totalGames)}</TableCell>
                  <TableCell style={{color: 'rgb(22 163 74)'}}>{formatPercentage(line.winsPercentage)}</TableCell>
                  <TableCell style={{color: 'rgb(75 85 99)'}}>{formatPercentage(line.drawsPercentage)}</TableCell>
                  <TableCell style={{color: 'rgb(220 38 38)'}}>{formatPercentage(line.lossesPercentage)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Coach's notes section */}
        <div className="mt-4 p-4 bg-white border rounded-lg">
          <h4 className="text-md font-semibold mb-2">Coach's notes</h4>
          <div className="space-y-2" style={{color: 'rgb(75 85 99)'}}>
            {loading && <p>Loading coach's notes...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && Array.isArray(coachNotes) && coachNotes.length > 0 && (
              <div>
                {coachNotes.map((sentence: string, idx: number) => (
                  <p key={idx}>{sentence}</p>
                ))}
              </div>
            )}
            {!loading && !error && (!Array.isArray(coachNotes) || coachNotes.length === 0) && variant && variant !== 'all' && (
              <div className="text-center py-4">
                <p className="text-gray-600 font-medium">Upgrade to Premium</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chess board display */}
      <div className="flex flex-col items-center justify-center h-full">
        <h4 className="text-md font-semibold mb-2">Position after: {selectedLine.sequence}</h4>
        <ChessBoard fen={selectedLine.fen || ''} side={selectedLine.color} />
        <p className="mt-4 text-sm text-center" style={{color: 'rgb(75 85 99)'}}>
          Hover over any line to see the position on the board
        </p>
      </div>
    </div>
  );
};

export default OpeningSummaryTable;
