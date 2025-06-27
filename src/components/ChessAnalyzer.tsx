import React, { useState } from 'react';
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
  // Track loader timing for intermediate progress
  const loaderRef = React.useRef({
    lastRealProgress: 0,
    lastRealTime: 0,
    intermediateTimeout: null as null | ReturnType<typeof setTimeout>,
    interval: null as null | ReturnType<typeof setInterval>,
    realProgress: 0,
  });

  const progressStepsChessCom = [0, 7, 12, 18, 25, 31, 37, 43, 50, 56, 63, 69, 75, 80, 84, 89, 93, 97, 100];
  const progressStepsLichess = [0, 10, 18, 25, 33, 37, 44, 50, 57, 63, 69, 75, 80, 84, 89, 93, 97, 100];

  // Enhanced setProgress to handle continuous fake-progress
  const setProgressWithContinuousFake = React.useCallback((progress: number) => {
    loaderRef.current.realProgress = progress;
    setDownloadProgress(progress);
  }, []);

  // Continuous fake-progress animation effect
  React.useEffect(() => {
    if (!isLoading) {
      setDisplayedProgress(0);
      if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
      return;
    }
    if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
    loaderRef.current.interval = setInterval(() => {
      setDisplayedProgress((prev) => {
        // If real progress is 100, animate to 100 and stop
        if (loaderRef.current.realProgress >= 100) {
          if (prev < 100) return Math.min(prev + 2, 100);
          if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
          return 100;
        }
        // Choose progress steps array based on platform
        let steps = progressStepsChessCom;
        if (userInfo && userInfo.platform === 'lichess') {
          steps = progressStepsLichess;
        }
        // Find the next expected real progress step
        const currentIdx = steps.findIndex((v) => v === loaderRef.current.realProgress);
        const nextStep = steps[currentIdx + 1] !== undefined ? steps[currentIdx + 1] : 100;
        // Only increment if displayed progress is less than next expected step
        if (prev < nextStep) {
          // Move smoothly, but don't overshoot the next expected step
          return Math.min(prev + 0.5, nextStep);
        }
        // If caught up, just stay
        return prev;
      });
    }, 50);
    return () => {
      if (loaderRef.current.interval) clearInterval(loaderRef.current.interval);
    };
  }, [isLoading, userInfo]);

  const handleUserSubmit = async (info: UserInfo, selectedTimeRange: TimeRange) => {
    setIsLoading(true);
    setUserInfo(info);
    setTimeRange(selectedTimeRange);
    setDownloadProgress(0);
    
    try {
      toast({
        title: "Starting download",
        description: `Downloading games for ${info.username} from ${info.platform}...`,
      });
      
      // Download the PGN data first
      const games = await downloadPGN(
        info.username, 
        info.platform, 
        selectedTimeRange,
        setProgressWithContinuousFake
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
      
      toast({
        title: "Download complete",
        description: `Successfully downloaded ${games.length} games. Starting analysis...`,
      });
      
      // Now analyze the data
      const analysis = await analyzeChessData({ 
        games, 
        info, 
        timeRange: selectedTimeRange 
      });
      
      setUserAnalysis(analysis);
      
      toast({
        title: "Analysis complete",
        description: `Successfully analyzed ${games.length} games for ${info.username}!`,
      });
    } catch (error) {
      console.error("Failed to fetch or analyze data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch or analyze chess games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePgnUpload = async (pgnContent: string) => {
    setIsLoading(true);
    setDownloadProgress(0);
    
    try {
      toast({
        title: "Processing PGN file",
        description: "Parsing uploaded games...",
      });
      
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
      
      toast({
        title: "Processing complete",
        description: `Successfully processed ${parsedGames.length} games. Analyzing ${filteredGames.length} games from the selected time period...`,
      });
      
      // Determine the player's username from the games
      let playerUsername = determinePlayerUsername(parsedGames);
      
      // Set user info for uploaded PGN
      const uploadUserInfo: UserInfo = {
        username: playerUsername,
        platform: "uploaded" as Platform
      };
      
      setUserInfo(uploadUserInfo);
      setDownloadProgress(100);
      
      // Now analyze the data
      const analysis = await analyzeChessData({ 
        games: filteredGames, 
        info: uploadUserInfo, 
        timeRange: 'last90' // Default time range for uploads
      });
      
      setUserAnalysis(analysis);
      
      toast({
        title: "Analysis complete",
        description: `Successfully analyzed ${filteredGames.length} games from your PGN file!`,
      });
    } catch (error) {
      console.error("Failed to process or analyze PGN data:", error);
      toast({
        title: "Error",
        description: "Failed to process or analyze the PGN file. Please check the file format and try again.",
        variant: "destructive",
      });
    } finally {
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
    
    try {
      // Handle different paths for uploaded PGN vs APIs
      if (userInfo.platform === "uploaded" && allUploadedGames.length > 0) {
        // For uploaded games, we filter the already parsed games by the new time range
        const filteredGames = filterGamesByTimeRange(allUploadedGames, value);
        
        toast({
          title: "Filtering games",
          description: `Analyzing ${filteredGames.length} games from the selected time period...`,
        });
        
        setDownloadProgress(100);
        
        // Analyze the filtered games
        const analysis = await analyzeChessData({
          games: filteredGames,
          info: userInfo,
          timeRange: value
        });
        
        setUserAnalysis(analysis);
        
        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${filteredGames.length} games from your PGN file!`,
        });
      } else {
        // For API platforms, download games with the new time range
        toast({
          title: "Updating time range",
          description: `Downloading games for ${userInfo.username} with new time range...`,
        });
        
        const games = await downloadPGN(
          userInfo.username, 
          userInfo.platform, 
          value,
          setProgressWithContinuousFake
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
        
        toast({
          title: "Download complete",
          description: `Successfully downloaded ${games.length} games. Starting analysis...`,
        });
        
        // Now analyze the data
        const analysis = await analyzeChessData({ 
          games, 
          info: userInfo, 
          timeRange: value 
        });
        setUserAnalysis(analysis);
        
        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${games.length} games for ${userInfo.username}!`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch or analyze data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch or analyze chess games. Please try again.",
        variant: "destructive",
      });
    } finally {
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
            {displayedProgress < 100 
              ? `Downloading games: ${Math.floor(displayedProgress)}%` 
              : "Analyzing games..."}
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
              <CoachTab analysis={userAnalysis} variant="all" />
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <OpeningsTab 
                data={userAnalysis.openings.all} 
                variant="all" 
                ratings={userAnalysis.ratings} 
              />
            </TabsContent>
            
            <TabsContent value="blitz">
              <OpeningsTab 
                data={userAnalysis.openings.blitz} 
                variant="blitz" 
                ratings={userAnalysis.ratings} 
              />
            </TabsContent>
            
            <TabsContent value="rapid">
              <OpeningsTab 
                data={userAnalysis.openings.rapid}
                variant="rapid"
                ratings={userAnalysis.ratings}
              />
            </TabsContent>
            
            <TabsContent value="bullet">
              <OpeningsTab 
                data={userAnalysis.openings.bullet}
                variant="bullet"
                ratings={userAnalysis.ratings}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ChessAnalyzer;
