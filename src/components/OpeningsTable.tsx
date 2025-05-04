
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
import { ArrowDown, ArrowUp } from "lucide-react";

interface OpeningsTableProps {
  data: OpeningData[];
  title: string;
  totalGames: number;
}

type SortField = 'games' | 'wins' | 'draws' | 'losses' | 'winsPercentage' | 'drawsPercentage' | 'lossesPercentage';

const OpeningsTable: React.FC<OpeningsTableProps> = ({ data, title, totalGames }) => {
  const [sortField, setSortField] = useState<SortField>('games');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(window.innerWidth < 768);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />;
  };
  
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
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
    <div className="my-4 overflow-x-auto border rounded-lg">
      <div 
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-gray-500">({totalGames} games)</span></h3>
        <Button variant="ghost" size="icon">
          {isCollapsed ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opening</TableHead>
              <TableHead>Sequence</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('games')}>
                Games {getSortIcon('games')}
              </TableHead>
              <TableHead className="cursor-pointer text-green-600" onClick={() => handleSort('winsPercentage')}>
                Wins {getSortIcon('winsPercentage')}
              </TableHead>
              <TableHead className="cursor-pointer text-gray-600" onClick={() => handleSort('drawsPercentage')}>
                Draws {getSortIcon('drawsPercentage')}
              </TableHead>
              <TableHead className="cursor-pointer text-red-600" onClick={() => handleSort('lossesPercentage')}>
                Losses {getSortIcon('lossesPercentage')}
              </TableHead>
              <TableHead>Board</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((opening, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{opening.name || "Unnamed Opening"}</TableCell>
                <TableCell className="font-mono text-xs">{formatSequence(opening.sequence)}</TableCell>
                <TableCell>{opening.gamesPercentage}%</TableCell>
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
                        <ChessBoard fen={opening.fen} side={title.includes('White') ? 'white' : 'black'} />
                        <div className="mt-2 text-center">
                          <a 
                            href={getLichessUrl(opening.fen, title.includes('White') ? 'white' : 'black')} 
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
      )}
    </div>
  );
};

export default OpeningsTable;
