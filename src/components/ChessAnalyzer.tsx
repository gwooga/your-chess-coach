
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { analyzeChessData } from '@/services/chessAnalysisService';
import { Loader2, ArrowLeft } from "lucide-react";
import { UserAnalysis, ChessVariant, UserInfo, TimeRange } from '@/utils/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import OpeningsTab from './OpeningsTab';
import TimeAnalysisTab from './TimeAnalysisTab';
import MoveQualityTab from './MoveQualityTab';
import CoachTab from './CoachTab';

export interface ChessAnalyzerProps {
  onClose: () => void;
  games: any[];
  userInfo: UserInfo;
  timeRange: TimeRange;
}

const ChessAnalyzer: React.FC<ChessAnalyzerProps> = ({ onClose, games, userInfo, timeRange }) => {
  const { toast } = useToast();
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<ChessVariant>("all");

  const analyzeData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const analysis = await analyzeChessData({ games, info: userInfo, timeRange });
      setUserAnalysis(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze data");
      toast({
        title: "Analysis error",
        description: "Failed to analyze chess data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [games, userInfo, timeRange, toast]);

  useEffect(() => {
    if (games && games.length > 0) {
      analyzeData();
    }
  }, [games, analyzeData]);
  
  return (
    <div className="pt-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center space-x-2">
          <Loader2 className="animate-spin h-6 w-6" />
          <p>Analyzing your games...</p>
        </div>
      )}
      
      {error && (
        <div className="text-red-500">Error: {error}</div>
      )}
      
      {userAnalysis && !isLoading && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Analysis Results</h2>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Time Control:</span>
              <Select value={variant} onValueChange={(value: ChessVariant) => setVariant(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="bullet">Bullet</SelectItem>
                  <SelectItem value="blitz">Blitz</SelectItem>
                  <SelectItem value="rapid">Rapid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="coach">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="coach">Coach</TabsTrigger>
              <TabsTrigger value="openings">Openings</TabsTrigger>
              <TabsTrigger value="time">Time Analysis</TabsTrigger>
              <TabsTrigger value="moves">Move Quality</TabsTrigger>
            </TabsList>
            
            <TabsContent value="coach" className="mt-0">
              <CoachTab analysis={userAnalysis} variant={variant} />
            </TabsContent>
            
            <TabsContent value="openings" className="mt-0">
              <OpeningsTab data={userAnalysis.openings[variant]} variant={variant} ratings={userAnalysis.ratings} />
            </TabsContent>

            <TabsContent value="time" className="mt-0">
              <TimeAnalysisTab dayPerformance={userAnalysis.dayPerformance} timePerformance={userAnalysis.timePerformance} />
            </TabsContent>
            
            <TabsContent value="moves" className="mt-0">
              <MoveQualityTab moveQuality={userAnalysis.moveQuality} materialSwings={userAnalysis.materialSwings} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ChessAnalyzer;
