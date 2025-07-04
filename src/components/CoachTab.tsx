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
  const [tableNotes, setTableNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingsList, setOpeningsList] = useState<string[]>([]);
  const [relevantOpenings, setRelevantOpenings] = useState<string[]>([]);
  
  // --- Caching logic ---
  const analysisKey = JSON.stringify({ username, platform, average_rating });
  const lastKeyRef = useRef<string | null>(null);
  const lastSummaryRef = useRef<any | null>(null);
  const lastTableNotesRef = useRef<any[]>([]);
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

  // Helper to extract only the 'All' variant summary tables (max 10 tables, max 10 rows each, 6 columns only)
  function getMinimalSummaryTables(openings: Record<ChessVariant, any>) {
    const allVariant = openings['all'];
    if (!allVariant) return [];
    
    const tableKeys = [
      'white2', 'black2', 'white3', 'black3', 'white4', 'black4', 'white5', 'black5',
      'white6', 'black6', 'white7', 'black7', 'white8', 'black8', 'white10', 'black10',
      'meaningfulWhite', 'meaningfulBlack', 'meaningfulCombined'
    ];
    
    const tables = [];
    for (const key of tableKeys) {
      if (Array.isArray(allVariant[key]) && allVariant[key].length > 0) {
        // Only include the first 10 rows and only the 6 essential columns
        const cleanTable = allVariant[key].slice(0, 10).map((row: any) => ({
          Opening: row.Opening || getOpeningNameBySequence(row.sequence) || 'Unknown',
          Sequence: row.sequence || row.Sequence || '',
          'Games (N)': row.games || row['Games (N)'] || 0,
          'Wins (%)': Math.round(row.winsPercentage || row['Wins (%)'] || 0),
          'Draws (%)': Math.round(row.drawsPercentage || row['Draws (%)'] || 0),
          'Losses (%)': Math.round(row.lossesPercentage || row['Losses (%)'] || 0)
        }));
        tables.push({
          tableKey: key,
          data: cleanTable
        });
      }
    }
    return tables.slice(0, 10); // Max 10 tables
  }

  // Get highest rating
  function getHighestRating(ratings: any) {
    if (!ratings) return 0;
    return Math.max(
      ratings.blitz || 0,
      ratings.rapid || 0,
      ratings.bullet || 0,
      ratings.classical || 0
    );
  }

  // Get total games count
  function getTotalGames(analysis: any) {
    return analysis.totalGames || 0;
  }

  // Helper function to get coach notes for a specific table key
  function getTableNotes(tableKey: string): string[] {
    const tableNote = tableNotes.find(note => note.tableKey === tableKey);
    return tableNote ? tableNote.notes : [];
  }

  useEffect(() => {
    const extracted = extractRelevantOpenings(analysis);
    setRelevantOpenings(extracted);
    if (lastKeyRef.current === analysisKey && lastSummaryRef.current) {
      setCoachSummary(lastSummaryRef.current);
      setTableNotes(lastTableNotesRef.current);
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
      setTableNotes([]);
      try {
        const summaryTables = getMinimalSummaryTables(analysis.openings);
        const payload = {
          username,
          platform,
          tables: summaryTables,
          totalGames: getTotalGames(analysis),
          highestRating: getHighestRating(analysis.ratings)
        };
        console.log('Payload size (bytes):', JSON.stringify(payload).length);
        console.log('Number of tables:', summaryTables.length);
        console.log('Tables:', summaryTables);
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to fetch AI report');
        const data = await res.json();
        setCoachSummary(data.summary);
        setTableNotes(data.tableNotes || []);
        setOpeningsList(data.summary?.openingsList || []);
        setRelevantOpenings(extracted);
        lastKeyRef.current = analysisKey;
        lastSummaryRef.current = data.summary;
        lastTableNotesRef.current = data.tableNotes || [];
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
