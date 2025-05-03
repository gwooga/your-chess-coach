
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpeningsTable from './OpeningsTable';
import RatingDisplay from './RatingDisplay';
import { OpeningsTableData, ChessVariant, Rating } from '@/utils/types';
import OpeningInsights from './OpeningInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon } from 'lucide-react';
import MeaningfulOpeningsTable from './MeaningfulOpeningsTable';

interface OpeningsTabProps {
  data: OpeningsTableData;
  variant: ChessVariant;
  ratings: Rating;
}

const OpeningsTab: React.FC<OpeningsTabProps> = ({ data, variant, ratings }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>("highlights");
  
  // Helper function to determine if a table should be displayed
  // Only display tables that have at least one opening with 1% or more games
  const shouldDisplayTable = (tableData?: any[]): boolean => {
    if (!tableData || tableData.length === 0) return false;
    return tableData.some(item => item.gamesPercentage >= 1);
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
              <h2 className="text-xl font-bold mb-4">Your Most Meaningful Openings</h2>
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {shouldDisplayTable(data.meaningfulWhite) && (
                  <MeaningfulOpeningsTable 
                    data={data.meaningfulWhite || []} 
                    title="Most Impactful as White" 
                    totalGames={data.totalWhiteGames}
                  />
                )}
                {shouldDisplayTable(data.meaningfulBlack) && (
                  <MeaningfulOpeningsTable 
                    data={data.meaningfulBlack || []} 
                    title="Most Impactful as Black" 
                    totalGames={data.totalBlackGames}
                  />
                )}
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
            {shouldDisplayTable(data.white2) || shouldDisplayTable(data.black2) ? (
              <div>
                <h2 className="text-xl font-bold mb-4">2-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {shouldDisplayTable(data.white2) && (
                    <OpeningsTable 
                      data={data.white2 || []} 
                      title="Top 10 as White - 2 Moves" 
                      totalGames={data.totalWhiteGames}
                    />
                  )}
                  {shouldDisplayTable(data.black2) && (
                    <OpeningsTable 
                      data={data.black2 || []} 
                      title="Top 10 as Black - 2 Moves" 
                      totalGames={data.totalBlackGames}
                    />
                  )}
                </div>
              </div>
            ) : null}
            
            {shouldDisplayTable(data.white3) || shouldDisplayTable(data.black3) ? (
              <div>
                <h2 className="text-xl font-bold mb-4">3-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {shouldDisplayTable(data.white3) && (
                    <OpeningsTable 
                      data={data.white3} 
                      title="Top 10 as White - 3 Moves" 
                      totalGames={data.totalWhiteGames}
                    />
                  )}
                  {shouldDisplayTable(data.black3) && (
                    <OpeningsTable 
                      data={data.black3} 
                      title="Top 10 as Black - 3 Moves" 
                      totalGames={data.totalBlackGames}
                    />
                  )}
                </div>
              </div>
            ) : null}
            
            {shouldDisplayTable(data.white4) || shouldDisplayTable(data.black4) ? (
              <div>
                <h2 className="text-xl font-bold mb-4">4-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {shouldDisplayTable(data.white4) && (
                    <OpeningsTable 
                      data={data.white4 || []} 
                      title="Top 10 as White - 4 Moves" 
                      totalGames={data.totalWhiteGames}
                    />
                  )}
                  {shouldDisplayTable(data.black4) && (
                    <OpeningsTable 
                      data={data.black4 || []} 
                      title="Top 10 as Black - 4 Moves" 
                      totalGames={data.totalBlackGames}
                    />
                  )}
                </div>
              </div>
            ) : null}
            
            {shouldDisplayTable(data.white5) || shouldDisplayTable(data.black5) ? (
              <div>
                <h2 className="text-xl font-bold mb-4">5-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {shouldDisplayTable(data.white5) && (
                    <OpeningsTable 
                      data={data.white5} 
                      title="Top 10 as White - 5 Moves" 
                      totalGames={data.totalWhiteGames}
                    />
                  )}
                  {shouldDisplayTable(data.black5) && (
                    <OpeningsTable 
                      data={data.black5} 
                      title="Top 10 as Black - 5 Moves" 
                      totalGames={data.totalBlackGames}
                    />
                  )}
                </div>
              </div>
            ) : null}
            
            {(data.white7 && data.white7.length > 0) || (data.black7 && data.black7.length > 0) ? (
              <div>
                <h2 className="text-xl font-bold mb-4">7-Move Openings</h2>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.white7 && data.white7.length > 0 && (
                    <OpeningsTable 
                      data={data.white7} 
                      title="Top 10 as White - 7 Moves" 
                      totalGames={data.totalWhiteGames}
                    />
                  )}
                  {data.black7 && data.black7.length > 0 && (
                    <OpeningsTable 
                      data={data.black7} 
                      title="Top 10 as Black - 7 Moves" 
                      totalGames={data.totalBlackGames}
                    />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OpeningsTab;
