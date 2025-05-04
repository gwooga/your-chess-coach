
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpeningsTable from './OpeningsTable';
import RatingDisplay from './RatingDisplay';
import { OpeningsTableData, ChessVariant, Rating } from '@/utils/types';
import OpeningInsights from './OpeningInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon } from 'lucide-react';
import MeaningfulOpeningsTable from './MeaningfulOpeningsTable';
import { shouldDisplayTable } from "@/components/ui/table";

interface OpeningsTabProps {
  data: OpeningsTableData;
  variant: ChessVariant;
  ratings: Rating;
}

const OpeningsTab: React.FC<OpeningsTabProps> = ({ data, variant, ratings }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("highlights");
  
  // Create combined meaningful openings data
  const combinedMeaningful = React.useMemo(() => {
    const whiteMeaningful = data.meaningfulWhite?.map(opening => ({
      ...opening,
      color: 'white' as const
    })) || [];
    
    const blackMeaningful = data.meaningfulBlack?.map(opening => ({
      ...opening,
      color: 'black' as const
    })) || [];
    
    // Combine and calculate impact score (games × max(win%, loss%))
    const combined = [...whiteMeaningful, ...blackMeaningful].map(opening => ({
      ...opening,
      score: opening.games * Math.max(opening.winsPercentage, opening.lossesPercentage) / 100
    }));
    
    // Sort by impact score descending
    const sorted = combined.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Add impact rank
    return sorted.slice(0, 20).map((opening, index) => ({
      ...opening,
      impact: index + 1
    }));
  }, [data.meaningfulWhite, data.meaningfulBlack]);
  
  // Function to determine if a deeper move table should be displayed
  const shouldDisplayDepthTable = (whiteData?: any[], blackData?: any[]): boolean => {
    const whiteHighest = whiteData?.length ? 
      Math.max(...whiteData.map(item => item.gamesPercentage)) : 0;
    
    const blackHighest = blackData?.length ? 
      Math.max(...blackData.map(item => item.gamesPercentage)) : 0;
    
    return whiteHighest >= 1 || blackHighest >= 1;
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <RatingDisplay ratings={ratings} variant={variant === 'all' ? undefined : variant} />
      </div>
      
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="full-breakdown">Full Breakdown</TabsTrigger>
        </TabsList>
        
        {/* Highlights Tab Content */}
        <TabsContent value="highlights" className="mt-0">
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-bold mb-4">Your Top 20 Most Meaningful Openings</h2>
              <div>
                <MeaningfulOpeningsTable 
                  data={combinedMeaningful} 
                  totalGames={data.totalWhiteGames + data.totalBlackGames}
                />
              </div>
            </div>
            
            {/* Insights Card */}
            {data.insights && data.insights.length > 0 && (
              <Card className="border-l-4 border-l-chess-purple">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <LightbulbIcon className="h-5 w-5 text-chess-purple" />
                    <CardTitle>Opening Insights</CardTitle>
                  </div>
                  <CardDescription>
                    Key observations based on your opening repertoire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OpeningInsights insights={data.insights} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Full Breakdown Tab Content */}
        <TabsContent value="full-breakdown" className="mt-0">
          <div className="space-y-10">
            {/* 2-Move Openings - Always show */}
            <div>
              <h2 className="text-xl font-bold mb-4">2-Move Openings</h2>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <OpeningsTable 
                  data={data.white2 || []} 
                  title="Top 10 as White - 2 Moves" 
                  totalGames={data.totalWhiteGames}
                />
                <OpeningsTable 
                  data={data.black2 || []} 
                  title="Top 10 as Black - 2 Moves" 
                  totalGames={data.totalBlackGames}
                />
              </div>
            </div>
            
            {/* 3-Move Openings - Always show */}
            <div>
              <h2 className="text-xl font-bold mb-4">3-Move Openings</h2>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <OpeningsTable 
                  data={data.white3 || []} 
                  title="Top 10 as White - 3 Moves" 
                  totalGames={data.totalWhiteGames}
                />
                <OpeningsTable 
                  data={data.black3 || []} 
                  title="Top 10 as Black - 3 Moves" 
                  totalGames={data.totalBlackGames}
                />
              </div>
            </div>
            
            {/* 4-Move Openings - Always show */}
            <div>
              <h2 className="text-xl font-bold mb-4">4-Move Openings</h2>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <OpeningsTable 
                  data={data.white4 || []} 
                  title="Top 10 as White - 4 Moves" 
                  totalGames={data.totalWhiteGames}
                />
                <OpeningsTable 
                  data={data.black4 || []} 
                  title="Top 10 as Black - 4 Moves" 
                  totalGames={data.totalBlackGames}
                />
              </div>
            </div>
            
            {/* 5-Move Openings - Always show */}
            <div>
              <h2 className="text-xl font-bold mb-4">5-Move Openings</h2>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                <OpeningsTable 
                  data={data.white5 || []} 
                  title="Top 10 as White - 5 Moves" 
                  totalGames={data.totalWhiteGames}
                />
                <OpeningsTable 
                  data={data.black5 || []} 
                  title="Top 10 as Black - 5 Moves" 
                  totalGames={data.totalBlackGames}
                />
              </div>
            </div>
            
            {/* 6-Move Openings - Conditional */}
            {shouldDisplayDepthTable(data.white6, data.black6) && (
              <div>
                <h2 className="text-xl font-bold mb-4">6-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  <OpeningsTable 
                    data={data.white6 || []} 
                    title="Top 10 as White - 6 Moves" 
                    totalGames={data.totalWhiteGames}
                  />
                  <OpeningsTable 
                    data={data.black6 || []} 
                    title="Top 10 as Black - 6 Moves" 
                    totalGames={data.totalBlackGames}
                  />
                </div>
              </div>
            )}
            
            {/* 7-Move Openings - Conditional */}
            {shouldDisplayDepthTable(data.white6, data.black6) && shouldDisplayDepthTable(data.white7, data.black7) && (
              <div>
                <h2 className="text-xl font-bold mb-4">7-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  <OpeningsTable 
                    data={data.white7 || []} 
                    title="Top 10 as White - 7 Moves" 
                    totalGames={data.totalWhiteGames}
                  />
                  <OpeningsTable 
                    data={data.black7 || []} 
                    title="Top 10 as Black - 7 Moves" 
                    totalGames={data.totalBlackGames}
                  />
                </div>
              </div>
            )}
            
            {/* 8-Move Openings - Conditional */}
            {shouldDisplayDepthTable(data.white6, data.black6) && 
             shouldDisplayDepthTable(data.white7, data.black7) && 
             shouldDisplayDepthTable(data.white8, data.black8) && (
              <div>
                <h2 className="text-xl font-bold mb-4">8-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  <OpeningsTable 
                    data={data.white8 || []} 
                    title="Top 10 as White - 8 Moves" 
                    totalGames={data.totalWhiteGames}
                  />
                  <OpeningsTable 
                    data={data.black8 || []} 
                    title="Top 10 as Black - 8 Moves" 
                    totalGames={data.totalBlackGames}
                  />
                </div>
              </div>
            )}
            
            {/* 10-Move Openings - Conditional */}
            {shouldDisplayDepthTable(data.white6, data.black6) && 
             shouldDisplayDepthTable(data.white7, data.black7) && 
             shouldDisplayDepthTable(data.white8, data.black8) && 
             shouldDisplayDepthTable(data.white10, data.black10) && (
              <div>
                <h2 className="text-xl font-bold mb-4">10-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  <OpeningsTable 
                    data={data.white10 || []} 
                    title="Top 10 as White - 10 Moves" 
                    totalGames={data.totalWhiteGames}
                  />
                  <OpeningsTable 
                    data={data.black10 || []} 
                    title="Top 10 as Black - 10 Moves" 
                    totalGames={data.totalBlackGames}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpeningsTab;
