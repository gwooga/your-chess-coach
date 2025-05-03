import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserForm from './UserForm';
import CoachTab from './CoachTab';
import OpeningsTab from './OpeningsTab';
import { UserInfo, TimeRange, ChessVariant, UserAnalysis, Platform } from '@/utils/types';
import { analyzeChessData } from '@/services/chessAnalysisService';
import { downloadPGN, parsePgnContent } from '@/services/pgnDownloadService';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from '@/utils/ThemeProvider';
import { Progress } from "@/components/ui/progress";
import { toast } from '@/hooks/use-toast';

const ChessAnalyzer: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last90'); // Default to 90 days
  const [activeTab, setActiveTab] = useState<string>("coach");
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const { theme, setTheme } = useTheme();
  
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
        setDownloadProgress
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
      console.log("First 200 chars:", pgnContent.substring(0, 200));
      
      // Parse the uploaded PGN content
      const games = parsePgnContent(pgnContent);
      
      console.log(`Parsed ${games.length} games from PGN content`);
      
      if (games.length === 0) {
        toast({
          title: "No games found",
          description: "No valid games found in the uploaded PGN file",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Processing complete",
        description: `Successfully processed ${games.length} games. Starting analysis...`,
      });
      
      // Set user info for uploaded PGN
      // Try to determine username from the games, fallback to "PGN User"
      let username = "PGN User";
      
      // Try to find a consistent user in the games
      if (games.length > 0) {
        const whitePlayers = games.map(g => g.white && g.white.username ? g.white.username : null).filter(Boolean);
        const blackPlayers = games.map(g => g.black && g.black.username ? g.black.username : null).filter(Boolean);
        
        // Find the most common username
        const allPlayers = [...whitePlayers, ...blackPlayers];
        const playerCounts: {[key: string]: number} = {};
        
        allPlayers.forEach(player => {
          if (player && typeof player === 'string') {
            playerCounts[player] = (playerCounts[player] || 0) + 1;
          }
        });
        
        // Find player with highest count
        let maxCount = 0;
        let mostCommonPlayer = "";
        
        for (const player in playerCounts) {
          if (playerCounts[player] > maxCount) {
            maxCount = playerCounts[player];
            mostCommonPlayer = player;
          }
        }
        
        if (mostCommonPlayer) {
          username = mostCommonPlayer;
        }
      }
      
      const uploadUserInfo: UserInfo = {
        username: username,
        platform: "uploaded" as Platform
      };
      
      setUserInfo(uploadUserInfo);
      setDownloadProgress(100);
      
      // Now analyze the data
      const analysis = await analyzeChessData({ 
        games, 
        info: uploadUserInfo, 
        timeRange: 'last90' // Default time range for uploads
      });
      
      setUserAnalysis(analysis);
      
      toast({
        title: "Analysis complete",
        description: `Successfully analyzed ${games.length} games from your PGN file!`,
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

  const handleTimeRangeChange = async (value: TimeRange) => {
    if (!userInfo) return;
    
    setTimeRange(value);
    setIsLoading(true);
    setDownloadProgress(0);
    
    try {
      toast({
        title: "Updating time range",
        description: `Downloading games for ${userInfo.username} with new time range...`,
      });
      
      // Download the PGN data with the new time range
      const games = await downloadPGN(
        userInfo.username, 
        userInfo.platform, 
        value,
        setDownloadProgress
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-left">Chess Insight Coach</h1>
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      
      {isLoading && (
        <div className="mb-8">
          <p className="mb-2 text-sm text-muted-foreground">
            {downloadProgress < 100 
              ? `Downloading games: ${downloadProgress}%` 
              : "Analyzing games..."}
          </p>
          <Progress value={downloadProgress} className="h-2" />
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
                <Select value={timeRange} onValueChange={(value) => handleTimeRangeChange(value as TimeRange)}>
                  <SelectTrigger className="w-[180px]">
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
              
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
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
              <CoachTab analysis={userAnalysis} />
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
