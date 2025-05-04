
import React, { useState } from 'react';
import ChessAnalyzer from '@/components/ChessAnalyzer';
import { UserInfo, TimeRange } from '@/utils/types';
import UserForm from '@/components/UserForm';

const Index: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '',
    platform: 'chess.com'
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('last90');
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Updated to match UserForm's onSubmit prop type
  const handleFormSubmit = (games: any[], info: UserInfo, timeRange: TimeRange) => {
    setGames(games);
    setUserInfo(info);
    setTimeRange(timeRange);
    setShowAnalyzer(true);
  };

  const handlePgnUpload = (pgnContent: string) => {
    // Process the PGN content and extract games
    // This is a placeholder - actual PGN processing would happen here
    console.log("PGN content received, length:", pgnContent.length);
    
    // For now, we'll set empty games array which will be processed by the analyzer
    setGames([{ pgn: pgnContent }]);
    setUserInfo({
      username: 'PGN User',
      platform: 'uploaded'
    });
    setShowAnalyzer(true);
  };

  const handleClose = () => {
    setShowAnalyzer(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {!showAnalyzer ? (
        <div className="container mx-auto p-6">
          <h1 className="text-4xl font-bold text-center mb-8">Chess Performance Analyzer</h1>
          <div className="max-w-2xl mx-auto">
            <UserForm 
              onSubmit={handleFormSubmit} 
              onPgnUpload={handlePgnUpload} 
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-6">
          <ChessAnalyzer 
            onClose={handleClose} 
            games={games} 
            userInfo={userInfo} 
            timeRange={timeRange} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
