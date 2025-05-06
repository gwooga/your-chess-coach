
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RatingDisplay from './RatingDisplay';
import { UserAnalysis, ChessVariant, OpeningData } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChessAdviser from './ChessAdviser';
import CoachSummary from './coach/CoachSummary';
import CoachPerformance from './coach/CoachPerformance';
import CoachOpenings from './coach/CoachOpenings';

interface CoachTabProps {
  analysis: UserAnalysis;
  variant: ChessVariant;
}

const CoachTab: React.FC<CoachTabProps> = ({ analysis, variant }) => {
  const [activeSection, setActiveSection] = useState<string>("summary");
  
  // Get variant-specific data
  const variantData = analysis.openings[variant];
  
  // Calculate overall statistics
  const totalGames = analysis.dayPerformance.reduce((sum, day) => sum + day.games, 0);
  const totalWins = analysis.dayPerformance.reduce((sum, day) => sum + day.wins, 0);
  const totalDraws = analysis.dayPerformance.reduce((sum, day) => sum + day.draws, 0);
  const totalLosses = analysis.dayPerformance.reduce((sum, day) => sum + day.losses, 0);
  
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const drawRate = totalGames > 0 ? Math.round((totalDraws / totalGames) * 100) : 0;
  const lossRate = totalGames > 0 ? Math.round((totalLosses / totalGames) * 100) : 0;
  
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <RatingDisplay ratings={analysis.ratings} variant={variant === 'all' ? undefined : variant} />
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon="clock" 
          color="blue" 
          title="Games Analyzed" 
          value={totalGames.toString()} 
        />
        
        <StatCard 
          icon="trophy" 
          color="green" 
          title="Win Rate" 
          value={`${winRate}%`} 
        />
        
        <StatCard 
          icon="trend-up" 
          color="yellow" 
          title="Draw Rate" 
          value={`${drawRate}%`} 
        />
        
        <StatCard 
          icon="trend-down" 
          color="red" 
          title="Loss Rate" 
          value={`${lossRate}%`} 
        />
      </div>
      
      {/* Coach Tab Navigation */}
      <div className="mb-6">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Coach's Summary</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="openings">Opening Analysis</TabsTrigger>
          </TabsList>
          
          {/* Coach's Summary Content */}
          <TabsContent value="summary" className="mt-6">
            <CoachSummary 
              analysis={analysis} 
              topWhiteOpening={variantData.meaningfulWhite[0] || null}
              topBlackOpening={variantData.meaningfulBlack[0] || null}
              winRate={winRate}
              totalGames={totalGames}
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
          
          {/* Openings Analysis Tab */}
          <TabsContent value="openings" className="mt-6 space-y-8">
            <CoachOpenings 
              variantData={variantData}
              totalGames={variantData.totalWhiteGames + variantData.totalBlackGames}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Simple stat card component for reuse
interface StatCardProps {
  icon: 'clock' | 'trophy' | 'trend-up' | 'trend-down';
  color: 'blue' | 'green' | 'yellow' | 'red';
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, color, title, value }) => {
  const getIcon = () => {
    switch (icon) {
      case 'clock':
        return <div className="rounded-full bg-blue-100 p-3">
          <svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>;
      case 'trophy':
        return <div className="rounded-full bg-green-100 p-3">
          <svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
        </div>;
      case 'trend-up':
        return <div className="rounded-full bg-yellow-100 p-3">
          <svg className="h-6 w-6 text-yellow-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
        </div>;
      case 'trend-down':
        return <div className="rounded-full bg-red-100 p-3">
          <svg className="h-6 w-6 text-red-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 7 9 13 13 9 21 17"/><polyline points="14 17 21 17 21 10"/></svg>
        </div>;
      default:
        return null;
    }
  };

  const bgColor = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    red: "bg-red-50",
  }[color];

  return (
    <Card className={bgColor}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          {getIcon()}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachTab;
