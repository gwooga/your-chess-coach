import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, ChessVariant, OpeningData } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChessAdviser from './ChessAdviser';
import CoachSummary from './coach/CoachSummary';
import CoachPerformance from './coach/CoachPerformance';
import { getOpeningNameBySequence } from '@/services/chess/openingsDatabase';

interface CoachTabProps {
  analysis: UserAnalysis;
  variant: ChessVariant;
  username: string;
  platform: string;
  pgn: string;
  average_rating: string | number;
  combinedCoachData?: {
    summary: any;
    tableNotes: any[];
  } | null;
  coachDataLoading?: boolean;
}

const CoachTab: React.FC<CoachTabProps> = ({ 
  analysis, 
  variant, 
  username, 
  platform, 
  pgn, 
  average_rating,
  combinedCoachData,
  coachDataLoading
}) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  const [coachSummary, setCoachSummary] = useState<any | null>(null);
  const [tableNotes, setTableNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingsList, setOpeningsList] = useState<string[]>([]);
  const [relevantOpenings, setRelevantOpenings] = useState<string[]>([]);
  
  const variantData = analysis.openings[variant];
  


  // Helper function to extract relevant openings
  const extractRelevantOpenings = (analysis: any) => {
    const allData = analysis.openings?.all;
    if (!allData) return [];
    
    const relevantOpenings = [];
    
    // Check meaningful openings
    if (allData.meaningfulCombined) {
      relevantOpenings.push(...allData.meaningfulCombined.map((opening: any) => opening.sequence));
    }
    
    return relevantOpenings.slice(0, 10);
  };

  // Use provided combined coach data if available
  useEffect(() => {
    if (combinedCoachData) {
      setCoachSummary(combinedCoachData.summary);
      setTableNotes(combinedCoachData.tableNotes);
      setOpeningsList(combinedCoachData.summary?.openingsList || []);
      const extracted = extractRelevantOpenings(analysis);
      setRelevantOpenings(extracted);
      setLoading(false);
      setError(null);
      return;
    }
    
    if (coachDataLoading) {
      setLoading(true);
      setError(null);
      return;
    }
    
    // If no combined data is available, show message
    if (!combinedCoachData && !coachDataLoading) {
      setLoading(false);
      setError("No coaching data available");
    }
  }, [combinedCoachData, coachDataLoading, analysis]);

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Coach's Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          {/* Coach's Summary Content */}
          <TabsContent value="summary" className="mt-6">
            {loading && <div className="mb-4">Loading AI coaching report...</div>}
            {error && <div className="mb-4 text-red-500">{error}</div>}
            {coachSummary && (
              <CoachSummary 
                personalReport={coachSummary.personal_report}
                strengths={coachSummary.strengths}
                areasToImprove={coachSummary.areas_to_improve}
                studyRecommendations={coachSummary.study_recommendations}
              />
            )}
            {/* Add the Ask Me Anything Section */}
            <ChessAdviser analysis={analysis} />
          </TabsContent>
          {/* Performance Content */}
          <TabsContent value="performance" className="mt-6 space-y-8">
            <CoachPerformance 
              analysis={analysis}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachTab;
