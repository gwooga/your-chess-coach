
import { toast } from '@/hooks/use-toast';
import { TimeRange, Platform } from '@/utils/types';
import { Chess } from 'chess.js';

// Convert period formats
const convertTimeRangeToPeriod = (timeRange: TimeRange): string => {
  switch(timeRange) {
    case 'last30': return 'last_30';
    case 'last90': return 'last_90';
    case 'last180': return 'last_180';
    case 'last365': return 'last_365';
    default: return 'last_90';
  }
};

// Parse PGN content and extract games
export const parsePgnContent = (pgnContent: string): any[] => {
  const games: any[] = [];
  let currentGame = '';
  const lines = pgnContent.split('\n');
  
  // Process each line of the PGN file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Empty line marks the end of a game
    if (line.trim() === '' && currentGame.trim() !== '') {
      try {
        // Try to parse and extract game information
        const chess = new Chess();
        chess.load_pgn(currentGame);
        
        // Extract relevant game data
        const headers = chess.header();
        const moves = chess.history({ verbose: true });
        
        // Determine player color and result
        const result = headers.Result;
        let playerColor: 'white' | 'black' = 'white'; // Default
        
        // Check if the white player is our user
        if (headers.White && headers.White.toLowerCase() === headers.White.toLowerCase()) {
          playerColor = 'white';
        } else {
          playerColor = 'black';
        }
        
        // Create a simplified game object
        const gameObj = {
          event: headers.Event || 'Unknown Event',
          site: headers.Site || 'Unknown Site',
          date: headers.Date || 'Unknown Date',
          white: { 
            username: headers.White || 'Unknown White', 
            rating: headers.WhiteElo || '?',
            result: result === '1-0' ? 'win' : (result === '0-1' ? 'loss' : 'draw')
          },
          black: { 
            username: headers.Black || 'Unknown Black', 
            rating: headers.BlackElo || '?',
            result: result === '0-1' ? 'win' : (result === '1-0' ? 'loss' : 'draw')
          },
          result: playerColor === 'white' ? 
            (result === '1-0' ? 'win' : (result === '0-1' ? 'loss' : 'draw')) : 
            (result === '0-1' ? 'win' : (result === '1-0' ? 'loss' : 'draw')),
          timeControl: headers.TimeControl || 'Unknown',
          termination: headers.Termination || '',
          opening: headers.Opening ? { name: headers.Opening } : { name: 'Unknown Opening' },
          moves: moves,
          pgn: currentGame,
          fen: chess.fen()
        };
        
        // Add game to the collection
        games.push(gameObj);
      } catch (e) {
        console.error("Error parsing game:", e);
        // Continue with next game
      }
      
      // Reset for next game
      currentGame = '';
    } else {
      currentGame += line + '\n';
    }
  }
  
  // Handle the last game if there's no final empty line
  if (currentGame.trim() !== '') {
    try {
      const chess = new Chess();
      chess.load_pgn(currentGame);
      
      const headers = chess.header();
      const moves = chess.history({ verbose: true });
      
      const result = headers.Result;
      let playerColor: 'white' | 'black' = 'white'; // Default
      
      // Check if the white player is our user
      if (headers.White && headers.White.toLowerCase() === headers.White.toLowerCase()) {
        playerColor = 'white';
      } else {
        playerColor = 'black';
      }
      
      const gameObj = {
        event: headers.Event || 'Unknown Event',
        site: headers.Site || 'Unknown Site',
        date: headers.Date || 'Unknown Date',
        white: { 
          username: headers.White || 'Unknown White', 
          rating: headers.WhiteElo || '?',
          result: result === '1-0' ? 'win' : (result === '0-1' ? 'loss' : 'draw')
        },
        black: { 
          username: headers.Black || 'Unknown Black', 
          rating: headers.BlackElo || '?',
          result: result === '0-1' ? 'win' : (result === '1-0' ? 'loss' : 'draw')
        },
        result: playerColor === 'white' ? 
          (result === '1-0' ? 'win' : (result === '0-1' ? 'loss' : 'draw')) : 
          (result === '0-1' ? 'win' : (result === '1-0' ? 'loss' : 'draw')),
        timeControl: headers.TimeControl || 'Unknown',
        termination: headers.Termination || '',
        opening: headers.Opening ? { name: headers.Opening } : { name: 'Unknown Opening' },
        moves: moves,
        pgn: currentGame,
        fen: chess.fen()
      };
      
      games.push(gameObj);
    } catch (e) {
      console.error("Error parsing last game:", e);
    }
  }
  
  return games;
};

// Download PGN file for Chess.com user
const downloadChessComPGN = async (
  username: string, 
  timeRange: TimeRange,
  setProgress: (progress: number) => void
): Promise<any[]> => {
  try {
    // Step 1: Get archives
    const archivesUrl = `https://api.chess.com/pub/player/${username}/games/archives`;
    const archivesResponse = await fetch(archivesUrl);
    
    if (!archivesResponse.ok) {
      throw new Error(`Failed to fetch Chess.com archives (${archivesResponse.status})`);
    }
    
    const archivesData = await archivesResponse.json();
    const archives = archivesData.archives;
    
    if (!archives || archives.length === 0) {
      toast({
        title: "No archives found",
        description: `No game archives found for ${username} on Chess.com`,
        variant: "destructive",
      });
      return [];
    }
    
    // Step 2: Calculate date range based on time period
    const now = new Date();
    let cutoffDate = new Date();
    
    if (timeRange === 'last30') {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timeRange === 'last90') {
      cutoffDate.setDate(now.getDate() - 90);
    } else if (timeRange === 'last180') {
      cutoffDate.setDate(now.getDate() - 180);
    } else {
      cutoffDate.setDate(now.getDate() - 365);
    }
    
    // Filter archives by date
    const filteredArchives = archives.filter((archive: string) => {
      // Extract year and month from archive URL (format: .../YYYY/MM)
      const parts = archive.split('/');
      const year = parseInt(parts[parts.length - 2]);
      const month = parseInt(parts[parts.length - 1]) - 1; // 0-based months
      
      // Get last day of the month for proper comparison
      const lastDayArchive = new Date(year, month + 1, 0);
      
      // If the last day of the month is after our cutoff, include this archive
      return lastDayArchive >= cutoffDate;
    });
    
    // Sort archives by date (most recent first)
    filteredArchives.sort().reverse();
    
    // Step 3: Download PGN from each archive
    const allGames: any[] = [];
    
    for (let i = 0; i < filteredArchives.length; i++) {
      const archiveUrl = filteredArchives[i];
      setProgress(Math.round((i / filteredArchives.length) * 100));
      
      try {
        const pgnResponse = await fetch(`${archiveUrl}/pgn`);
        
        if (pgnResponse.ok) {
          const pgnText = await pgnResponse.text();
          const games = parsePgnContent(pgnText);
          allGames.push(...games);
        } else {
          console.error(`Failed to fetch PGN from ${archiveUrl}: ${pgnResponse.status}`);
        }
      } catch (error) {
        console.error(`Error fetching from ${archiveUrl}:`, error);
      }
    }
    
    setProgress(100);
    
    return allGames;
  } catch (error) {
    console.error("Error downloading Chess.com PGN:", error);
    toast({
      title: "Download failed",
      description: `Failed to download games from Chess.com: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return [];
  }
};

// Download PGN file for Lichess user
const downloadLichessPGN = async (
  username: string, 
  timeRange: TimeRange,
  setProgress: (progress: number) => void
): Promise<any[]> => {
  try {
    // Calculate date range
    const now = new Date();
    let since = new Date();
    
    if (timeRange === 'last30') {
      since.setDate(now.getDate() - 30);
    } else if (timeRange === 'last90') {
      since.setDate(now.getDate() - 90);
    } else if (timeRange === 'last180') {
      since.setDate(now.getDate() - 180);
    } else {
      since.setDate(now.getDate() - 365);
    }
    
    const sinceTs = Math.floor(since.getTime());
    const untilTs = Math.floor(now.getTime());
    
    // Build Lichess API URL
    const apiUrl = `https://lichess.org/api/games/user/${username}?since=${sinceTs}&max=300&opening=true&perfType=bullet,blitz,rapid,classical&pgnInJson=true`;
    
    setProgress(10);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess games (${response.status})`);
    }
    
    // Lichess API returns ndjson (newline delimited JSON)
    const text = await response.text();
    setProgress(60);
    
    const games = text
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index, array) => {
        // Update progress as we process each game
        setProgress(60 + Math.round(40 * (index / array.length)));
        return JSON.parse(line);
      });
    
    setProgress(100);
    
    return games;
  } catch (error) {
    console.error("Error downloading Lichess PGN:", error);
    toast({
      title: "Download failed",
      description: `Failed to download games from Lichess: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return [];
  }
};

// Main function for downloading PGN files
export const downloadPGN = async (
  username: string, 
  platform: Platform, 
  timeRange: TimeRange,
  setProgress: (progress: number) => void
): Promise<any[]> => {
  if (platform === 'chess.com') {
    return downloadChessComPGN(username, timeRange, setProgress);
  } else {
    return downloadLichessPGN(username, timeRange, setProgress);
  }
};
