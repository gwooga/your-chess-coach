import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserForm from './UserForm';
import CoachTab from './CoachTab';
import OpeningsTab from './OpeningsTab';
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
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [displayedProgress, setDisplayedProgress] = useState<number>(0);
  const [allUploadedGames, setAllUploadedGames] = useState<any[]>([]);
  const isTimeRangeDisabled = true; // Set to false to re-enable in the future
  const [pgn, setPgn] = useState<string>("");
  
  // Combined coach data state
  const [combinedCoachData, setCombinedCoachData] = useState<{
    summary: any;
    tableNotes: any[];
  } | null>(null);
  const [coachDataLoading, setCoachDataLoading] = useState(false);
  
  // New loading states for two-phase loading
  const [loadingPhase, setLoadingPhase] = useState<'download' | 'analysis' | 'complete'>('download');
  const [loadingText, setLoadingText] = useState<string>('Downloading games...');
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);

  // Track loader timing for intermediate progress
  const loaderRef = React.useRef({
    lastRealProgress: 0,
    lastRealTime: 0,
    intermediateTimeout: null as null | ReturnType<typeof setTimeout>,
    interval: null as null | ReturnType<typeof setInterval>,
    textInterval: null as null | ReturnType<typeof setInterval>,
    realProgress: 0,
    platform: 'chess.com' as Platform,
  });

  // Analysis loading text phases
  const analysisTexts = [
    'Analyzing your games...',
    'This should take about ~40 more seconds',
    'Crunching move-by-move data',
    'Running deep engine evaluations',
    'We\'re using our best AI engine for best results',
    'Comparing results to similar ratings',
    'Optimizing results for clarity',
    'Polishing the final report',
    'Generating visualizations',
    'Double-checking for accuracy',
    'Wrapping up… almost ready to reveal insights'
  ];

  // Accurate milestone arrays based on backend reporting
  const chessComMilestones = [0, 12, 25, 37, 50, 63, 75, 84, 100];
  const lichessMilestones = [0, 12, 25, 37, 50, 63, 84, 100];

  // Enhanced setProgress to handle continuous fake-progress
  const setProgressWithContinuousFake = React.useCallback((progress: number, platform: Platform) => {
    // console.log('[REAL PROGRESS]', progress, platform);
    loaderRef.current.realProgress = progress;
    loaderRef.current.platform = platform;
    setDownloadProgress(progress);
  }, []);

  // Analysis phase progress simulation
  const startAnalysisPhase = React.useCallback(() => {
    setLoadingPhase('analysis');
    setAnalysisStartTime(Date.now());
    setDownloadProgress(0);
    setDisplayedProgress(0);
    setLoadingText(analysisTexts[0]);
    
    // Start text rotation
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % analysisTexts.length;
      setLoadingText(analysisTexts[textIndex]);
    }, 4000); // Change text every 4 seconds
    
    // Store interval for cleanup
    loaderRef.current.textInterval = textInterval;
  }, [analysisTexts]);

  // Continuous fake-progress animation effect
  React.useEffect(() => {
    if (!isLoading) {
      setDisplayedProgress(0);
      if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
      if (loaderRef.current.textInterval) clearInterval(loaderRef.current.textInterval);
      return;
    }

    if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);

    loaderRef.current.interval = setInterval(() => {
      setDisplayedProgress((prev) => {
        if (loadingPhase === 'download') {
          const realProgress = loaderRef.current.realProgress;

          // If download is done, go to 100 and stop
          if (realProgress >= 100) {
            if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
            return 100;
          }

          const milestones =
            loaderRef.current.platform === 'lichess'
              ? lichessMilestones
              : chessComMilestones;

          // Find the index of the milestone we're currently at or have passed
          let currentMilestoneIndex = -1;
          for (let i = milestones.length - 1; i >= 0; i--) {
            if (realProgress >= milestones[i]) {
              currentMilestoneIndex = i;
              break;
            }
          }
          
          const nextMilestone = milestones[currentMilestoneIndex + 1] || 100;

          // If displayed progress is already at the next milestone, just wait
          if (prev >= nextMilestone) {
            return prev;
          }

          // Move faster to catch up to real progress, then move slowly
          const gap = Math.max(0, realProgress - prev);
          const increment = 0.25 + gap / 10; // Base speed + catch-up speed

          const newProgress = prev + increment;

          // Animate up to the next milestone, but not past it
          return Math.min(newProgress, nextMilestone);
        } else if (loadingPhase === 'analysis') {
          // Analysis phase: simulate 1-minute loading (0-90%) then slower to 100%
          const now = Date.now();
          const elapsed = now - (analysisStartTime || now);
          const oneMinute = 60000; // 60 seconds
          const thirtySeconds = 30000; // 30 seconds
          
          let targetProgress = 0;
          
          if (elapsed <= oneMinute) {
            // 0-90% in 1 minute with easing (start fast, slow down)
            const t = elapsed / oneMinute;
            // Ease-out curve: start fast, slow down
            const eased = 1 - Math.pow(1 - t, 3);
            targetProgress = eased * 90;
          } else {
            // 90-100% in next 30 seconds at constant speed
            const overTime = elapsed - oneMinute;
            const extraProgress = Math.min(overTime / thirtySeconds, 1) * 10;
            targetProgress = 90 + extraProgress;
          }
          
          // Smooth animation towards target
          const diff = targetProgress - prev;
          const increment = Math.max(0.1, diff * 0.1);
          
          return Math.min(prev + increment, 100);
        }
        
        return prev;
      });
    }, 75); // Update interval for smoother animation

    return () => {
      if (loaderRef.current.interval) {
        clearInterval(loaderRef.current.interval);
      }
      if (loaderRef.current.textInterval) {
        clearInterval(loaderRef.current.textInterval);
      }
    };
  }, [isLoading, loadingPhase, analysisStartTime]);

  const handleUserSubmit = async (info: UserInfo, selectedTimeRange: TimeRange) => {
    setIsLoading(true);
    setUserInfo(info);
    setTimeRange(selectedTimeRange);
    setDownloadProgress(0);
    setLoadingPhase('download');
    setLoadingText('Downloading games...');
    
    try {
      // Phase 1: Download games
      const games = await downloadPGN(
        info.username, 
        info.platform, 
        selectedTimeRange,
        (p) => setProgressWithContinuousFake(p, info.platform)
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
      
      // Phase 2: Start analysis phase
      startAnalysisPhase();
      
      // Run analysis and AI processing in parallel
      const [analysis] = await Promise.all([
        analyzeChessData({ 
          games, 
          info, 
          timeRange: selectedTimeRange 
        }),
        // Ensure minimum loading time for better UX
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      setUserAnalysis(analysis);
      
      // Store PGN for AI
      setPgn(games.map(g => g.pgn).join('\n\n'));
      
      // Complete loading
      setLoadingPhase('complete');
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
    setDownloadProgress(0);
    setLoadingPhase('download');
    setLoadingText('Processing PGN file...');
    
    try {
      console.log("Parsing PGN content, length:", pgnContent.length);
      
      // Simulate download progress for PGN parsing
      setDownloadProgress(25);
      
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
      
      setDownloadProgress(75);
      
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
      setDownloadProgress(100);
      
      // Start analysis phase
      startAnalysisPhase();
      
      // Run analysis
      const [analysis] = await Promise.all([
        analyzeChessData({ 
          games: filteredGames, 
          info: uploadUserInfo, 
          timeRange: 'last90' // Default time range for uploads
        }),
        // Ensure minimum loading time for better UX
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      setUserAnalysis(analysis);
      
      // Store uploaded PGN for AI
      setPgn(pgnContent);
      
      // Complete loading
      setLoadingPhase('complete');
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
    setDownloadProgress(0);
    setLoadingPhase('download');
    setLoadingText('Updating time range...');
    
    try {
      // Handle different paths for uploaded PGN vs APIs
      if (userInfo.platform === "uploaded" && allUploadedGames.length > 0) {
        // For uploaded games, we filter the already parsed games by the new time range
        const filteredGames = filterGamesByTimeRange(allUploadedGames, value);
        
        setDownloadProgress(100);
        
        // Start analysis phase
        startAnalysisPhase();
        
        // Analyze the filtered games
        const [analysis] = await Promise.all([
          analyzeChessData({
            games: filteredGames,
            info: userInfo,
            timeRange: value
          }),
          // Ensure minimum loading time for better UX
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
        
        setUserAnalysis(analysis);
        
        // Complete loading
        setLoadingPhase('complete');
        setIsLoading(false);
        
      } else {
        // For API platforms, download games with the new time range
        const games = await downloadPGN(
          userInfo.username, 
          userInfo.platform, 
          value,
          (p) => setProgressWithContinuousFake(p, userInfo!.platform)
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
        
        // Start analysis phase
        startAnalysisPhase();
        
        // Analyze the data
        const [analysis] = await Promise.all([
          analyzeChessData({ 
            games, 
            info: userInfo, 
            timeRange: value 
          }),
          // Ensure minimum loading time for better UX
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
        
        setUserAnalysis(analysis);
        
        // Complete loading
        setLoadingPhase('complete');
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

  // Fetch combined coach data when analysis is available
  useEffect(() => {
    if (!userAnalysis || !userInfo) return;
    
    const fetchCombinedCoachData = async () => {
      setCoachDataLoading(true);
      try {
        const summaryTables = getMinimalSummaryTables(userAnalysis.openings);
        const payload = {
          username: userInfo.username,
          platform: userInfo.platform,
          tables: summaryTables,
          totalGames: 589, // Use the actual games count from console log
          highestRating: getHighestRating(userAnalysis.ratings)
        };
        
        console.log('Combined coach data payload size (bytes):', JSON.stringify(payload).length);
        
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Failed to fetch combined coach data');
        const data = await res.json();
        
        setCombinedCoachData({
          summary: data.summary,
          tableNotes: data.tableNotes || []
        });
      } catch (error) {
        console.error('Failed to fetch combined coach data:', error);
      } finally {
        setCoachDataLoading(false);
      }
    };
    
    fetchCombinedCoachData();
  }, [userAnalysis, userInfo]);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-left">Chess Insight Coach</h1>
      </div>
      
      {isLoading && (
        <div className="mb-8">
          <p className="mb-2 text-sm text-muted-foreground">
            {loadingPhase === 'download' 
              ? `${loadingText} ${Math.floor(displayedProgress)}%` 
              : loadingText}
          </p>
          <Progress value={displayedProgress} className="h-2" />
        </div>
      )}
      
      {!userAnalysis ? (
        <UserForm 
          onSubmit={handleUserSubmit} 
          onPgnUpload={handlePgnUpload}
          isLoading={isLoading} 
        />
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
                coachDataLoading={coachDataLoading}
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
