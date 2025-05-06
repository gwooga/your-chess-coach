
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  shouldDisplayTable
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ChessBoard from './ChessBoard';
import { OpeningData } from '@/utils/types';
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MeaningfulOpeningsTableProps {
  data: OpeningData[];
  totalGames: number;
}

type SortField = 'impact' | 'games' | 'winsPercentage' | 'drawsPercentage' | 'lossesPercentage' | 'gamesPercentage';

const MeaningfulOpeningsTable: React.FC<MeaningfulOpeningsTableProps> = ({ data, totalGames }) => {
  const [sortField, setSortField] = useState<SortField>('impact');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />;
  };
  
  const sortedData = [...data].sort((a, b) => {
    if (sortField === 'impact') {
      const aValue = a.impact || 0;
      const bValue = b.impact || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const aValue = (a as any)[sortField] || 0;
      const bValue = (b as any)[sortField] || 0;
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Create a properly formatted Lichess URL
  const getLichessUrl = (fen: string, side: string): string => {
    // Replace spaces with underscores for the URL
    const formattedFen = fen.replace(/ /g, '_');
    return `https://lichess.org/editor/${formattedFen}?color=${side}`;
  };
  
  const formatSequence = (sequence: string): string => {
    // Replace number dot patterns (like "1.") with number dot space (like "1. ")
    const formattedSequence = sequence
      .replace(/(\d+)\.(\S)/g, '$1. $2') // Add space after number dot if missing
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    // Split the sequence into move pairs for better readability
    const moveParts = formattedSequence.split(/(\d+\.\s)/g);
    
    let result = '';
    for (let i = 0; i < moveParts.length; i++) {
      // If this is a move number, add it and continue
      if (moveParts[i].match(/\d+\.\s/)) {
        result += moveParts[i];
      } 
      // If this is move content, add it and a line break after every complete move
      else if (moveParts[i].trim()) {
        result += moveParts[i];
        // If this is a full move pair and not the last one, add a line break
        if ((i + 2) < moveParts.length && moveParts[i+1] && moveParts[i+1].match(/\d+\.\s/)) {
          result += '\n';
        }
      }
    }
    
    return result;
  };
  
  return (
    <div className="my-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('impact')}>
              Impact {getSortIcon('impact')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Impact ranks openings by importance to your results. It combines how often you play an opening with your performance in it. 
                  Higher numbers (closer to 1) indicate openings that have more influence on your overall results.</p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Opening</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('games')}>
              Games (N) {getSortIcon('games')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Number of your games with this opening. Percentage is based on color total, not overall total.</p>
                </TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="cursor-pointer text-green-600" onClick={() => handleSort('winsPercentage')}>
              Wins (%) {getSortIcon('winsPercentage')}
            </TableHead>
            <TableHead className="cursor-pointer text-gray-600" onClick={() => handleSort('drawsPercentage')}>
              Draws (%) {getSortIcon('drawsPercentage')}
            </TableHead>
            <TableHead className="cursor-pointer text-red-600" onClick={() => handleSort('lossesPercentage')}>
              Losses (%) {getSortIcon('lossesPercentage')}
            </TableHead>
            <TableHead>Board</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((opening, index) => (
            <TableRow key={index} className={opening.color === 'black' ? 'bg-gray-50' : ''}>
              <TableCell>{opening.impact || index + 1}</TableCell>
              <TableCell className={`font-medium ${opening.color === 'white' ? 'text-amber-700' : 'text-blue-700'}`}>
                {opening.color?.charAt(0).toUpperCase() + opening.color?.slice(1) || '-'}
              </TableCell>
              <TableCell className="font-medium">{opening.name || "Unnamed Opening"}</TableCell>
              <TableCell className="font-mono text-xs">{formatSequence(opening.sequence)}</TableCell>
              <TableCell>{opening.games} ({opening.gamesPercentage}%)</TableCell>
              <TableCell className="text-green-600 font-medium">{opening.winsPercentage}%</TableCell>
              <TableCell className="text-gray-600">{opening.drawsPercentage}%</TableCell>
              <TableCell className="text-red-600 font-medium">{opening.lossesPercentage}%</TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">View</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <div className="p-4">
                      <ChessBoard fen={opening.fen} side={opening.color || 'white'} />
                      <div className="mt-2 text-center">
                        <a 
                          href={getLichessUrl(opening.fen, opening.color || 'white')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-chess-purple hover:underline"
                        >
                          Open in Lichess
                        </a>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MeaningfulOpeningsTable;
