
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

type SortField = 'games' | 'wins' | 'draws' | 'losses';

const OpeningsTable: React.FC<OpeningsTableProps> = ({ data, title, totalGames }) => {
  const [sortField, setSortField] = useState<SortField>('games');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
  
  return (
    <div className="my-4 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-2">{title} <span className="text-sm font-normal text-gray-500">({totalGames} games)</span></h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Opening</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('games')}>
              Games {getSortIcon('games')}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('wins')}>
              Wins {getSortIcon('wins')}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('draws')}>
              Draws {getSortIcon('draws')}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('losses')}>
              Losses {getSortIcon('losses')}
            </TableHead>
            <TableHead>Board</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((opening, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{opening.name}</TableCell>
              <TableCell className="font-mono text-xs">{opening.sequence}</TableCell>
              <TableCell>{opening.games} ({opening.gamesPercentage}%)</TableCell>
              <TableCell>
                <span className="text-chess-win">{opening.winsPercentage}%</span>
              </TableCell>
              <TableCell>
                <span className="text-chess-draw">{opening.drawsPercentage}%</span>
              </TableCell>
              <TableCell>
                <span className="text-chess-loss">{opening.lossesPercentage}%</span>
              </TableCell>
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
                          href={`https://lichess.org/editor/${opening.fen.replace(/ /g, '_')}?color=${title.includes('White') ? 'white' : 'black'}`} 
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

export default OpeningsTable;
