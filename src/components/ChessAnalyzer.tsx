import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserForm from './UserForm';
import CoachTab from './CoachTab';
import OpeningsTab from './OpeningsTab';
import AIProviderSwitcher from './AIProviderSwitcher';
import { UserInfo, TimeRange, ChessVariant, UserAnalysis, Platform } from '@/utils/types';
import { analyzeChessData } from '@/services/chessAnalysisService';
import { downloadPGN, parsePgnContent, filterGamesByTimeRange } from '@/services/pgnDownloadService';
import { Progress } from "@/components/ui/progress";
import { toast } from '@/hooks/use-toast';

const ChessAnalyzer: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last90'); // Default to 90 days
  const [activeTab, setActiveTab] = useState<string>("coach");
  const [allUploadedGames, setAllUploadedGames] = useState<any[]>([]);
  const isTimeRangeDisabled = true; // Set to false to re-enable in the future
  const [pgn, setPgn] = useState<string>("");
  
  // Combined coach data state
  const [combinedCoachData, setCombinedCoachData] = useState<{
    summary: any;
    tableNotes: any[];
  } | null>(null);
  
  // Unified loading states
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingText, setLoadingText] = useState<string>('');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [loadingComplete, setLoadingComplete] = useState<boolean>(false);

  // Loading text phases (change every 5 seconds)
  const loadingTexts = [
    'Downloading games....',
    'This should take about 90 seconds',
    'Analyzing your games...',
    'Crunching move-by-move data',
    'Running deep engine evaluations',
    'We\'re using our best AI engine for best results',
    'Comparing results to similar ratings',
    'Running quality checks',
    'Optimizing results for clarity',
    'Polishing the final report',
    'Generating visualizations',
    'Double-checking for accuracy',
    'Setting up interactive charts',
    'Wrapping up… Almost ready to reveal insights'
  ];

  // Unified loading progress effect
  React.useEffect(() => {
    if (!isLoading || loadingComplete) {
      return;
    }

    const startTime = loadingStartTime || Date.now();
    
    // Text rotation every 5 seconds
    let textIndex = 0;
    setLoadingText(loadingTexts[0]);
    
    const textInterval = setInterval(() => {
      textIndex++;
      if (textIndex < loadingTexts.length) {
        setLoadingText(loadingTexts[textIndex]);
      }
      // Stop changing text when we reach the end
    }, 5000);

    // Progress animation
    // Track acceleration when actual loading completes early
    let accelerateStartTime: number | null = null;
    let progressAtAccelerateStart = 0;

    const progressInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;

      let targetProgress;

      // Determine the base target progress based on elapsed time
      if (elapsed <= 90000) {
        // 0-90 seconds: ease-out from 0 to 85
        const t = elapsed / 90000; // 0 to 1
        const eased = 1 - Math.pow(1 - t, 2); // ease-out
        targetProgress = eased * 85;
      } else {
        // 90-150 seconds: linear from 85 to 100
        const overTime = Math.min(elapsed - 90000, 60000); // cap at 60s
        targetProgress = 85 + (overTime / 60000) * 15;
      }

      // If the actual loading finished earlier, accelerate to 100% within 1 second
      if (loadingComplete) {
        if (accelerateStartTime === null) {
          accelerateStartTime = now;
          progressAtAccelerateStart = loadingProgress;
        }
        const accElapsed = now - accelerateStartTime;
        const accT = Math.min(accElapsed / 1000, 1); // 1 second to finish
        targetProgress = progressAtAccelerateStart + (100 - progressAtAccelerateStart) * accT;
      }

      targetProgress = Math.min(targetProgress, 100);

      setLoadingProgress(targetProgress);
    }, 100); // deterministic update every 100ms

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading, loadingStartTime, loadingComplete]);

  // Helper to calculate average rating
  const getAverageRating = (ratings: any) => {
    if (!ratings) return '';
    const values = Object.values(ratings).filter((v) => typeof v === 'number');
    if (values.length === 0) return '';
    return Math.round(values.reduce((a, b) => a + (b as number), 0) / values.length);
  };

  // Helper functions for combined coach data
  const getMinimalSummaryTables = (openings: any) => {
    const allVariant = openings['all'];
    if (!allVariant || !allVariant.openingSummaryTables) return [];
    
    // Use the pre-computed opening summary tables from the 'all' variant
    const tables = allVariant.openingSummaryTables.map((table: any, index: number) => {
      const tableData = [table.rootLine, ...table.childLines].map((line: any) => ({
        Opening: line.name || line.sequence || 'Unknown',
        Sequence: line.sequence || '',
        'Games (N)': line.games || 0,
        'Wins (%)': Math.round(line.winsPercentage || 0),
        'Draws (%)': Math.round(line.drawsPercentage || 0),
        'Losses (%)': Math.round(line.lossesPercentage || 0)
      }));
      
      return {
        tableKey: `summary_table_${index}`,
        data: tableData
      };
    });
    
    return tables;
  };

  const getHighestRating = (ratings: any) => {
    if (!ratings) return 0;
    return Math.max(
      ratings.blitz || 0,
      ratings.rapid || 0,
      ratings.bullet || 0,
      ratings.classical || 0
    );
  };

  // Fetch combined coach data
  const fetchCombinedCoachData = async (analysis: UserAnalysis, userInfo: UserInfo) => {
    try {
      const summaryTables = getMinimalSummaryTables(analysis.openings);
      const payload = {
        username: userInfo.username,
        platform: userInfo.platform,
        tables: summaryTables,
        totalGames: 589, // Use the actual games count from console log
        highestRating: getHighestRating(analysis.ratings)
      };
      
      console.log('Combined coach data payload size (bytes):', JSON.stringify(payload).length);
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to fetch combined coach data');
      const data = await res.json();
      
      return {
        summary: data.summary,
        tableNotes: data.tableNotes || []
      };
    } catch (error) {
      console.error('Failed to fetch combined coach data:', error);
      throw error;
    }
  };

  const handleUserSubmit = async (info: UserInfo, selectedTimeRange: TimeRange) => {
    setIsLoading(true);
    setLoadingComplete(false);
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
    setUserInfo(info);
    setTimeRange(selectedTimeRange);
    
    try {
      // Download games
      const games = await downloadPGN(
        info.username, 
        info.platform, 
        selectedTimeRange,
        () => {} // No progress callback needed for unified loader
      );
      
      if (games.length === 0) {
        toast({
          title: "No games found",
          description: `No games found for ${info.username} on ${info.platform}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Run analysis first, then AI processing
      const analysis = await analyzeChessData({ 
        games, 
        info, 
        timeRange: selectedTimeRange 
      });
      
      // Now fetch coach data using the analysis result
      const coachData = await fetchCombinedCoachData(analysis, info);
      
      setUserAnalysis(analysis);
      setCombinedCoachData(coachData);
      
      // Store PGN for AI
      setPgn(games.map(g => g.pgn).join('\n\n'));
      
      // Complete loading
      setLoadingComplete(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Failed to fetch or analyze data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch or analyze chess games. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const handlePgnUpload = async (pgnContent: string) => {
    setIsLoading(true);
    setLoadingComplete(false);
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
    
    try {
      console.log("Parsing PGN content, length:", pgnContent.length);
      
      // Parse the uploaded PGN content
      const parsedGames = parsePgnContent(pgnContent);
      
      console.log(`Parsed ${parsedGames.length} games from PGN content`);
      
      if (parsedGames.length === 0) {
        toast({
          title: "No games found",
          description: "No valid games found in the uploaded PGN file",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Store all the parsed games to filter later by time range
      setAllUploadedGames(parsedGames);
      
      // Filter games by time range
      const filteredGames = filterGamesByTimeRange(parsedGames, 'last90'); // Default time range
      
      // Determine the player's username from the games
      let playerUsername = determinePlayerUsername(parsedGames);
      
      // Set user info for uploaded PGN
      const uploadUserInfo: UserInfo = {
        username: playerUsername,
        platform: "uploaded" as Platform
      };
      
      setUserInfo(uploadUserInfo);
      
      // Run analysis first, then AI processing
      const analysis = await analyzeChessData({ 
        games: filteredGames, 
        info: uploadUserInfo, 
        timeRange: 'last90' // Default time range for uploads
      });
      
      // Now fetch coach data using the analysis result
      const coachData = await fetchCombinedCoachData(analysis, uploadUserInfo);
      
      setUserAnalysis(analysis);
      setCombinedCoachData(coachData);
      
      // Store uploaded PGN for AI
      setPgn(pgnContent);
      
      // Complete loading
      setLoadingComplete(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Failed to process or analyze PGN data:", error);
      toast({
        title: "Error",
        description: "Failed to process or analyze the PGN file. Please check the file format and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Helper function to determine player username from games
  const determinePlayerUsername = (games: any[]): string => {
    if (games.length === 0) return "PGN User";
    
    const whitePlayers: {[key: string]: number} = {};
    const blackPlayers: {[key: string]: number} = {};
    
    // Count appearances of each player
    games.forEach(game => {
      if (game.white && game.white.username) {
        whitePlayers[game.white.username] = (whitePlayers[game.white.username] || 0) + 1;
      }
      if (game.black && game.black.username) {
        blackPlayers[game.black.username] = (blackPlayers[game.black.username] || 0) + 1;
      }
    });
    
    // Find players with highest counts
    let mostCommonWhite = {name: "", count: 0};
    let mostCommonBlack = {name: "", count: 0};
    
    for (const [name, count] of Object.entries(whitePlayers)) {
      if (count > mostCommonWhite.count) {
        mostCommonWhite = {name, count: count as number};
      }
    }
    
    for (const [name, count] of Object.entries(blackPlayers)) {
      if (count > mostCommonBlack.count) {
        mostCommonBlack = {name, count: count as number};
      }
    }
    
    // Return the player that appears most frequently
    if (mostCommonWhite.count > mostCommonBlack.count) {
      return mostCommonWhite.name;
    } else if (mostCommonBlack.count > 0) {
      return mostCommonBlack.name;
    } else {
      return "PGN User";
    }
  };

  const handleTimeRangeChange = async (value: TimeRange) => {
    if (!userInfo) return;
    
    setTimeRange(value);
    setIsLoading(true);
    setLoadingComplete(false);
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
    
    try {
      // Handle different paths for uploaded PGN vs APIs
      if (userInfo.platform === "uploaded" && allUploadedGames.length > 0) {
        // For uploaded games, we filter the already parsed games by the new time range
        const filteredGames = filterGamesByTimeRange(allUploadedGames, value);
        
        // Analyze the filtered games first, then fetch coach data
        const analysis = await analyzeChessData({
          games: filteredGames,
          info: userInfo,
          timeRange: value
        });
        
        // Now fetch coach data using the analysis result
        const coachData = await fetchCombinedCoachData(analysis, userInfo);
        
        setUserAnalysis(analysis);
        setCombinedCoachData(coachData);
        
        // Complete loading
        setLoadingComplete(true);
        setIsLoading(false);
        
      } else {
        // For API platforms, download games with the new time range
        const games = await downloadPGN(
          userInfo.username, 
          userInfo.platform, 
          value,
          () => {} // No progress callback needed for unified loader
        );
        
        if (games.length === 0) {
          toast({
            title: "No games found",
            description: `No games found for ${userInfo.username} on ${userInfo.platform} in this time range`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Analyze the data first, then fetch coach data
        const analysis = await analyzeChessData({ 
          games, 
          info: userInfo, 
          timeRange: value 
        });
        
        // Now fetch coach data using the analysis result
        const coachData = await fetchCombinedCoachData(analysis, userInfo);
        
        setUserAnalysis(analysis);
        setCombinedCoachData(coachData);
        
        // Complete loading
        setLoadingComplete(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch or analyze data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch or analyze chess games. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-left">Chess Insight Coach</h1>
      </div>
      
      {isLoading && (
        <div className="mb-8">
          <p className="mb-2 text-sm text-muted-foreground">
            {loadingText} {Math.floor(loadingProgress)}%
          </p>
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )}
      
      {!userAnalysis ? (
        <>
          <AIProviderSwitcher />
        <UserForm 
          onSubmit={handleUserSubmit} 
          onPgnUpload={handlePgnUpload}
          isLoading={isLoading} 
        />
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{userInfo?.username}'s Analysis</h2>
              <p className="text-muted-foreground">
                {userInfo?.platform === "uploaded" 
                  ? "From uploaded PGN file" 
                  : `Platform: ${userInfo?.platform}`}
              </p>
            </div>
            
            <div className="flex gap-2 items-center">
              {userInfo?.platform !== "uploaded" && (
                <Select value={timeRange} onValueChange={(value) => handleTimeRangeChange(value as TimeRange)} disabled={isTimeRangeDisabled}>
                  <SelectTrigger className="w-[180px]" disabled={isTimeRangeDisabled}>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="last90">Last 90 days</SelectItem>
                    <SelectItem value="last180">Last 180 days</SelectItem>
                    <SelectItem value="last365">Last 1 year</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          

          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger 
                value="coach"
                className={activeTab === "coach" ? "bg-chess-purple text-white" : ""}
              >
                Coach
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="blitz">Blitz</TabsTrigger>
              <TabsTrigger value="rapid">Rapid</TabsTrigger>
              <TabsTrigger value="bullet">Bullet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="coach" className="mt-0">
              <CoachTab 
                analysis={userAnalysis} 
                variant="all" 
                username={userInfo?.username || ''}
                platform={userInfo?.platform || ''}
                pgn={pgn}
                average_rating={getAverageRating(userAnalysis.ratings)}
                combinedCoachData={combinedCoachData}
                coachDataLoading={false}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <OpeningsTab 
                data={userAnalysis.openings.all} 
                variant="all" 
                ratings={userAnalysis.ratings}
                tableNotes={combinedCoachData?.tableNotes || []}
              />
            </TabsContent>
            
            <TabsContent value="blitz">
              <OpeningsTab 
                data={userAnalysis.openings.blitz} 
                variant="blitz" 
                ratings={userAnalysis.ratings}
                tableNotes={combinedCoachData?.tableNotes || []}
              />
            </TabsContent>
            
            <TabsContent value="rapid">
              <OpeningsTab 
                data={userAnalysis.openings.rapid}
                variant="rapid"
                ratings={userAnalysis.ratings}
                tableNotes={combinedCoachData?.tableNotes || []}
              />
            </TabsContent>
            
            <TabsContent value="bullet">
              <OpeningsTab 
                data={userAnalysis.openings.bullet}
                variant="bullet"
                ratings={userAnalysis.ratings}
                tableNotes={combinedCoachData?.tableNotes || []}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ChessAnalyzer;
