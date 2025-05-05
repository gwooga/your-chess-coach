
import React, { useState } from 'react';
import ChessAnalyzer from '@/components/ChessAnalyzer';
import { UserInfo, TimeRange } from '@/utils/types';
import UserForm from '@/components/UserForm';
import { fetchChessComData } from '@/services/chessComApi';
import { fetchLichessData } from '@/services/lichessApi';
import { toast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '',
    platform: 'chess.com'
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('last90');
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (_, info: UserInfo, selectedTimeRange: TimeRange) => {
    setIsLoading(true);
    setUserInfo(info);
    setTimeRange(selectedTimeRange);
    
    try {
      console.log(`Fetching games for ${info.username} from ${info.platform} for ${selectedTimeRange}`);
      
      let fetchedData;
      if (info.platform === 'chess.com') {
        fetchedData = await fetchChessComData(info, selectedTimeRange);
      } else {
        fetchedData = await fetchLichessData(info, selectedTimeRange);
      }
      
      console.log(`Received ${fetchedData?.games?.length || 0} games from API`);
      
      if (!fetchedData || !fetchedData.games || fetchedData.games.length === 0) {
        throw new Error(`No games found for ${info.username} on ${info.platform} in the selected time range`);
      }
      
      setGames(fetchedData.games);
      setShowAnalyzer(true);
    } catch (error) {
      console.error('Error fetching game data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch or analyze games. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePgnUpload = (pgnContent: string) => {
    // Process the PGN content and extract games
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
