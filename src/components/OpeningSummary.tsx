import React from 'react';
import { OpeningsTableData, ChessVariant } from '@/utils/types';
import OpeningSummaryTable from './OpeningSummaryTable';

interface OpeningSummaryProps {
  data: OpeningsTableData;
  variant: ChessVariant;
  rating: number;
  tableNotes?: any[];
}

const OpeningSummary: React.FC<OpeningSummaryProps> = ({ data, variant, rating, tableNotes = [] }) => {
  // Use pre-computed opening summary tables if available, otherwise fall back to dynamic generation
  const tablesToShow = data.openingSummaryTables || [];
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Opening Summary</h2>
      
      {tablesToShow.length > 0 ? (
        tablesToShow.map((table, index) => (
          <OpeningSummaryTable
            key={index}
            rootLine={table.rootLine}
            childLines={table.childLines}
            tableNumber={index + 1}
            totalGames={table.totalGames}
            rating={rating}
            preloadedNotes={tableNotes && tableNotes[index] && tableNotes[index].notes ? tableNotes[index].notes : undefined}
            variant={variant}
          />
        ))
      ) : (
        <p className="text-center text-gray-500 py-10">
          Not enough game data to create meaningful opening summary tables.
          More games are needed to meet the minimum 5% threshold.
        </p>
      )}
    </div>
  );
};

export default OpeningSummary;
