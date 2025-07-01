import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, ChessVariant, OpeningData } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChessAdviser from './ChessAdviser';
import CoachSummary from './coach/CoachSummary';
import CoachPerformance from './coach/CoachPerformance';

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
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- Caching logic ---
  // Create a key based on the relevant data
  const analysisKey = JSON.stringify({ pgn, username, platform, average_rating });
  // Ref to store last key and report
  const lastKeyRef = useRef<string | null>(null);
  const lastReportRef = useRef<string | null>(null);
  
  // Get variant-specific data
  const variantData = analysis.openings[variant];
  
  // Fetch AI report only if analysisKey changes
  useEffect(() => {
    if (activeSection !== 'summary') return;
    if (lastKeyRef.current === analysisKey && lastReportRef.current) {
      setAiReport(lastReportRef.current);
      setLoading(false);
      setError(null);
      return;
    }
    const fetchAIReport = async () => {
      setLoading(true);
      setError(null);
      setAiReport(null);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pgn,
            username,
            platform,
            average_rating,
            openings_stats: JSON.stringify(analysis.openings),
            other_stats: JSON.stringify({
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              recommendations: analysis.recommendations,
              phaseAccuracy: analysis.phaseAccuracy,
              timePerformance: analysis.timePerformance,
              dayPerformance: analysis.dayPerformance,
              conversionRate: analysis.conversionRate,
            })
          })
        });
        if (!res.ok) throw new Error('Failed to fetch AI report');
        const data = await res.json();
        setAiReport(data.report);
        lastKeyRef.current = analysisKey;
        lastReportRef.current = data.report;
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAIReport();
  }, [activeSection, analysisKey, analysis]);

  // Helper to render the AI report in sections
  const renderAISections = (report: string) => {
    // Simple split by section headers (improve as needed)
    const sections = report.split(/\n(?=\d+\.|Coach Analysis|Strengths|Areas to Improve|Study Recommendations)/g);
    return (
      <div className="space-y-8 mb-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="prose max-w-none" style={{ whiteSpace: 'pre-wrap' }}>{section.trim()}</div>
          </div>
        ))}
      </div>
    );
  };

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
            {aiReport && renderAISections(aiReport)}
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
        </Tabs>
      </div>
    </div>
  );
};

export default CoachTab;
