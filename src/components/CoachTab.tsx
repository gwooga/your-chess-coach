
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, ChessVariant, OpeningData } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChessAdviser from './ChessAdviser';
import CoachSummary from './coach/CoachSummary';
import CoachPerformance from './coach/CoachPerformance';
import CoachOpenings from './coach/CoachOpenings';

interface CoachTabProps {
  analysis: UserAnalysis;
  variant: ChessVariant;
}

const CoachTab: React.FC<CoachTabProps> = ({ analysis, variant }) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  
  // Get variant-specific data
  const variantData = analysis.openings[variant];
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <RatingDisplay 
          ratings={analysis.ratings} 
          variant={variant === 'all' ? undefined : variant}
          analysis={analysis}
        />
      </div>
      
      {/* Coach Tab Navigation */}
      <div className="mb-6">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Coach's Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="openings">Opening Analysis</TabsTrigger>
          </TabsList>
          
          {/* Coach's Summary Content */}
          <TabsContent value="summary" className="mt-6">
            <CoachSummary 
              analysis={analysis} 
              topWhiteOpening={variantData.meaningfulWhite?.[0] || null}
              topBlackOpening={variantData.meaningfulBlack?.[0] || null}
              winRate={0} // This will be calculated in CoachSummary
              totalGames={0} // This will be calculated in CoachSummary
            />
            
            {/* Add the Ask Me Anything Section */}
            <ChessAdviser analysis={analysis} />
          </TabsContent>
          
          {/* Performance Content */}
          <TabsContent value="performance" className="mt-6 space-y-8">
            <CoachPerformance 
              analysis={analysis}
            />
          </TabsContent>
          
          {/* Openings Analysis Tab */}
          <TabsContent value="openings" className="mt-6 space-y-8">
            <CoachOpenings 
              variantData={variantData}
              totalGames={variantData.totalWhiteGames + variantData.totalBlackGames}
              variant={variant}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachTab;
