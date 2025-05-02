
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
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";

interface OpeningsTableProps {
  data: OpeningData[];
  title: string;
  totalGames: number;
}

type SortField = 'games' | 'wins' | 'draws' | 'losses';

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
  
  return (
    <div className="my-4 overflow-x-auto border rounded-lg">
      <div 
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-semibold">{title} <span className="text-sm font-normal text-gray-500">({totalGames} games)</span></h3>
        <Button variant="ghost" size="icon">
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
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
              <TableHead>Win Rate</TableHead>
              <TableHead>Board</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((opening, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{opening.name}</TableCell>
                <TableCell className="font-mono text-xs">{opening.sequence}</TableCell>
                <TableCell>{opening.gamesPercentage}%</TableCell>
                <TableCell>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${opening.winsPercentage + opening.drawsPercentage / 2}%`,
                        background: `linear-gradient(to right, 
                          #4ade80 0%, 
                          #4ade80 ${(opening.winsPercentage / (opening.winsPercentage + opening.drawsPercentage / 2) * 100).toFixed(1)}%, 
                          #a3a3a3 ${(opening.winsPercentage / (opening.winsPercentage + opening.drawsPercentage / 2) * 100).toFixed(1)}%, 
                          #a3a3a3 100%
                        )`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-emerald-600">{opening.winsPercentage}%</span>
                    <span className="text-gray-500">{opening.drawsPercentage}%</span>
                    <span className="text-red-600">{opening.lossesPercentage}%</span>
                  </div>
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
