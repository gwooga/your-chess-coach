import React from 'react';
import { OpeningsTableData, ChessVariant } from '@/utils/types';
import OpeningSummaryTable from './OpeningSummaryTable';

interface OpeningSummaryProps {
  data: OpeningsTableData;
  variant: ChessVariant;
  rating: number;
}

const OpeningSummary: React.FC<OpeningSummaryProps> = ({ data, variant, rating }) => {
  // Function to extract root lines that meet criteria (>= 5% of games)
  const extractRootLines = (colorData: any[], totalGames: number, color: 'white' | 'black') => {
    if (!colorData || !Array.isArray(colorData)) return [];
    
    // Filter for valid root lines (>= 5% share and depth >= 2)
    const validRoots = colorData
      .filter(line => {
        // Ensure it's a proper line with enough games
        if (!line || !line.sequence) return false;
        
        // Check if it has >= 5% of the games
        const sharePercentage = (line.games / totalGames) * 100;
        return sharePercentage >= 5;
      })
      .sort((a, b) => b.games - a.games) // Sort by number of games (descending)
      .slice(0, 10); // Take at most 10 roots
    
    return validRoots;
  };
  
  // Function to find child lines for a root
  const findChildLines = (rootLine: any, allLines: any[], totalGames: number) => {
    if (!rootLine || !rootLine.sequence || !allLines || !Array.isArray(allLines)) return [];
    
    // Find lines that start with the root sequence and have at least 2% of games
    return allLines
      .filter(line => {
        if (!line || !line.sequence) return false;
        
        const isChild = line.sequence !== rootLine.sequence && 
                       line.sequence.startsWith(rootLine.sequence);
        
        // Check if it has >= 2% of the games
        const sharePercentage = (line.games / totalGames) * 100;
        return isChild && sharePercentage >= 2;
      })
      .sort((a, b) => b.games - a.games) // Sort by number of games (descending)
      .slice(0, 5); // Take at most 5 children
  };
  
  // Combine move depths to find all possible lines
  const getAllMoveDepthsForColor = (color: 'white' | 'black') => {
    const allDepths = [];
    
    // Combine all depths for comprehensive analysis
    if (data[`${color}2`]) allDepths.push(...data[`${color}2`]);
    if (data[`${color}3`]) allDepths.push(...data[`${color}3`]);
    if (data[`${color}4`]) allDepths.push(...data[`${color}4`]);
    if (data[`${color}5`]) allDepths.push(...data[`${color}5`]);
    if (data[`${color}6`]) allDepths.push(...data[`${color}6`]);
    if (data[`${color}7`]) allDepths.push(...data[`${color}7`]);
    if (data[`${color}8`]) allDepths.push(...data[`${color}8`]);
    if (data[`${color}10`]) allDepths.push(...data[`${color}10`]);
    
    return allDepths;
  };
  
  // Extract root lines for both colors
  const whiteRootLines = extractRootLines(
    data.white2 || [], 
    data.totalWhiteGames,
    'white'
  );
  
  const blackRootLines = extractRootLines(
    data.black2 || [], 
    data.totalBlackGames,
    'black'
  );
  
  // Get all move depths for finding child lines
  const allWhiteMoves = getAllMoveDepthsForColor('white');
  const allBlackMoves = getAllMoveDepthsForColor('black');
  
  // Prepare data for tables, combining white and black by share percentage
  const rootLinesWithChildren = [
    ...whiteRootLines.map(root => ({
      root,
      children: findChildLines(root, allWhiteMoves, data.totalWhiteGames),
      totalGames: data.totalWhiteGames
    })),
    ...blackRootLines.map(root => ({
      root,
      children: findChildLines(root, allBlackMoves, data.totalBlackGames),
      totalGames: data.totalBlackGames
    }))
  ];
  
  // Sort by share percentage (games/totalGames)
  rootLinesWithChildren.sort((a, b) => {
    const shareA = (a.root.games / a.totalGames);
    const shareB = (b.root.games / b.totalGames);
    return shareB - shareA;
  });
  
  // Take at most 10 tables total
  const tablesToShow = rootLinesWithChildren.slice(0, 10);
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-6">Opening Summary</h2>
      
      {tablesToShow.length > 0 ? (
        tablesToShow.map((table, index) => (
          <OpeningSummaryTable
            key={index}
            rootLine={table.root}
            childLines={table.children}
            tableNumber={index + 1}
            totalGames={table.totalGames}
            rating={rating}
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
