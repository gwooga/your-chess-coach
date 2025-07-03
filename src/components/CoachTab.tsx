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
}

const CoachTab: React.FC<CoachTabProps> = ({ analysis, variant, username, platform, pgn, average_rating }) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  const [coachSummary, setCoachSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingsList, setOpeningsList] = useState<string[]>([]);
  const [relevantOpenings, setRelevantOpenings] = useState<string[]>([]);
  
  // --- Caching logic ---
  const analysisKey = JSON.stringify({ pgn, username, platform, average_rating });
  const lastKeyRef = useRef<string | null>(null);
  const lastSummaryRef = useRef<any | null>(null);
  const lastOpeningsListRef = useRef<string[] | null>(null);
  const lastRelevantOpeningsRef = useRef<string[] | null>(null);
  
  const variantData = analysis.openings[variant];
  
  function extractRelevantOpenings(analysis: any): string[] {
    const variants: ChessVariant[] = ['all', 'blitz', 'rapid', 'bullet'];
    const names = new Set<string>();
    variants.forEach(variant => {
      const openingsData = analysis.openings?.[variant];
      if (openingsData) {
        Object.keys(openingsData).forEach(key => {
          if (Array.isArray(openingsData[key])) {
            openingsData[key].forEach((opening: any) => {
              if (opening && opening.sequence) names.add(getOpeningNameBySequence(opening.sequence));
            });
          }
        });
      }
    });
    return Array.from(names);
  }

  // Helper to extract only the summary tables (max 10 tables per variant, max 10 rows per table)
  function getSummaryTables(openings: Record<ChessVariant, any>) {
    const variants: ChessVariant[] = ['all', 'blitz', 'rapid', 'bullet'];
    const result: Record<string, any> = {};
    for (const variant of variants) {
      if (!openings[variant]) continue;
      result[variant] = {};
      // List the table keys you want (edit as needed)
      const tableKeys = [
        'white2', 'black2', 'white3', 'black3', 'white4', 'black4', 'white5', 'black5',
        'white6', 'black6', 'white7', 'black7', 'white8', 'black8', 'white10', 'black10',
        'meaningfulWhite', 'meaningfulBlack', 'meaningfulCombined'
      ];
      for (const key of tableKeys) {
        if (Array.isArray(openings[variant][key])) {
          result[variant][key] = openings[variant][key].slice(0, 10);
        }
      }
      // Optionally include totals/insights if you use them in the UI
      if (typeof openings[variant].totalWhiteGames === 'number')
        result[variant].totalWhiteGames = openings[variant].totalWhiteGames;
      if (typeof openings[variant].totalBlackGames === 'number')
        result[variant].totalBlackGames = openings[variant].totalBlackGames;
      if (Array.isArray(openings[variant].insights))
        result[variant].insights = openings[variant].insights;
    }
    return result;
  }

  useEffect(() => {
    const extracted = extractRelevantOpenings(analysis);
    setRelevantOpenings(extracted);
    if (lastKeyRef.current === analysisKey && lastSummaryRef.current) {
      setCoachSummary(lastSummaryRef.current);
      setOpeningsList(lastOpeningsListRef.current || []);
      setRelevantOpenings(lastRelevantOpeningsRef.current || []);
      setLoading(false);
      setError(null);
      return;
    }
    const fetchCoachSummary = async () => {
      setLoading(true);
      setError(null);
      setCoachSummary(null);
      try {
        const summaryTables = getSummaryTables(analysis.openings);
        const payload = {
          username,
          platform,
          average_rating,
          relevantOpenings: extracted,
          openings_stats: JSON.stringify(summaryTables),
          other_stats: JSON.stringify({
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
            phaseAccuracy: analysis.phaseAccuracy,
            timePerformance: analysis.timePerformance,
            dayPerformance: analysis.dayPerformance,
            conversionRate: analysis.conversionRate,
          })
        };
        console.log('Payload size (bytes):', JSON.stringify(payload).length);
        console.log('openings_stats size:', payload.openings_stats.length);
        console.log('other_stats size:', payload.other_stats.length);
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to fetch AI report');
        const data = await res.json();
        setCoachSummary(data.summary);
        setOpeningsList(data.summary?.openingsList || []);
        setRelevantOpenings(extracted);
        lastKeyRef.current = analysisKey;
        lastSummaryRef.current = data.summary;
        lastOpeningsListRef.current = data.summary?.openingsList || [];
        lastRelevantOpeningsRef.current = extracted;
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchCoachSummary();
  }, [analysisKey, analysis]);

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
