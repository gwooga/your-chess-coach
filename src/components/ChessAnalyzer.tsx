
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserForm from './UserForm';
import CoachTab from './CoachTab';
import OpeningsTab from './OpeningsTab';
import { UserInfo, TimeRange, ChessVariant, UserAnalysis } from '@/utils/types';
import { fetchUserData } from '@/services/chessAnalysisService';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from '@/utils/ThemeProvider';

const ChessAnalyzer: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('last90'); // Changed default to 90 days
  const [activeTab, setActiveTab] = useState<string>("coach");
  const { theme, setTheme } = useTheme();
  
  const handleUserSubmit = async (info: UserInfo) => {
    setIsLoading(true);
    setUserInfo(info);
    
    try {
      const analysis = await fetchUserData(info, timeRange);
      setUserAnalysis(analysis);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeRangeChange = async (value: TimeRange) => {
    if (!userInfo) return;
    
    setTimeRange(value);
    setIsLoading(true);
    
    try {
      const analysis = await fetchUserData(userInfo, value);
      setUserAnalysis(analysis);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
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
      
      {!userAnalysis ? (
        <UserForm onSubmit={handleUserSubmit} isLoading={isLoading} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{userInfo?.username}'s Analysis</h2>
              <p className="text-muted-foreground">Platform: {userInfo?.platform}</p>
            </div>
            
            <div className="flex gap-2 items-center">
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
