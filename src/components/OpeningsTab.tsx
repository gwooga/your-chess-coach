
import React from 'react';
import OpeningsTable from './OpeningsTable';
import RatingDisplay from './RatingDisplay';
import { OpeningsTableData, ChessVariant, Rating } from '@/utils/types';

interface OpeningsTabProps {
  data: OpeningsTableData;
  variant: ChessVariant;
  ratings: Rating;
}

const OpeningsTab: React.FC<OpeningsTabProps> = ({ data, variant, ratings }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <RatingDisplay ratings={ratings} variant={variant === 'all' ? undefined : variant} />
      </div>
      
      <div className="space-y-10">
        <div>
          <h2 className="text-xl font-bold mb-4">3-Move Openings</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            <OpeningsTable 
              data={data.white3} 
              title="Top 10 as White - First 3 Moves" 
              totalGames={data.totalWhiteGames} 
            />
            <OpeningsTable 
              data={data.black3} 
              title="Top 10 as Black - First 3 Moves" 
              totalGames={data.totalBlackGames} 
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">5-Move Openings</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            <OpeningsTable 
              data={data.white5} 
              title="Top 10 as White - First 5 Moves" 
              totalGames={data.totalWhiteGames} 
            />
            <OpeningsTable 
              data={data.black5} 
              title="Top 10 as Black - First 5 Moves" 
              totalGames={data.totalBlackGames} 
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-4">7-Move Openings</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
            <OpeningsTable 
              data={data.white7} 
              title="Top 10 as White - First 7 Moves" 
              totalGames={data.totalWhiteGames} 
            />
            <OpeningsTable 
              data={data.black7} 
              title="Top 10 as Black - First 7 Moves" 
              totalGames={data.totalBlackGames} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningsTab;
