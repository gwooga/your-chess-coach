
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

// Helper function to parse PGN date format to JavaScript Date
const parsePgnDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.includes('????')) return null;
  
  // Handle format like "2024.07.04"
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  return null;
};

// Filter games by time range
const filterGamesByTimeRange = (games: any[], timeRange: TimeRange): any[] => {
  if (timeRange === 'all') return games;
  
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
  
  return games.filter(game => {
    const gameDate = parsePgnDate(game.date);
    if (!gameDate) return true; // Include games with invalid dates
    return gameDate >= cutoffDate;
  });
};

// Parse PGN content and extract games
export const parsePgnContent = (pgnContent: string): any[] => {
  const games: any[] = [];
  // Split the PGN content by the standard separator for new games
  const gameTexts = pgnContent.split(/\n\n\[Event /);
  
  console.log(`Found ${gameTexts.length} potential games in PGN content`);
  
  // Process each game
  for (let i = 0; i < gameTexts.length; i++) {
    let gameText = gameTexts[i];
    
    // For all games except the first one, we need to add back the [Event tag
    if (i > 0) {
      gameText = '[Event ' + gameText;
    }
    
    // Skip empty games
    if (!gameText.trim()) continue;
    
    // Skip fragments that don't look like a game
    if (!gameText.includes('[') || !gameText.includes(']')) continue;
    
    try {
      // Create a new Chess instance for each game
      const chess = new Chess();
      
      // Clean the PGN before loading - remove comments and annotations
      let cleanedPgn = gameText
        .replace(/\{[^}]*\}/g, '') // Remove comments in curly braces
        .replace(/%[^\s\n]*/g, '') // Remove %eval, %clk annotations
        .replace(/\$\d+/g, '');    // Remove numeric annotation glyphs
      
      // Load PGN - the chess.js library will handle the parsing
      try {
        chess.loadPgn(cleanedPgn);
      } catch (parseError) {
        console.error(`Error loading game ${i+1}:`, parseError);
        
        // Perform additional cleanup if standard loading fails
        cleanedPgn = cleanedPgn
          .replace(/\([^)]*\)/g, '') // Remove variations in parentheses
          .replace(/\s\d+\s?\.+\s?/g, ' '); // Remove move numbers
        
        try {
          chess.loadPgn(cleanedPgn);
        } catch (secondError) {
          console.error(`Failed to load game ${i+1} even after cleanup:`, secondError);
          continue; // Skip this game
        }
      }
      
      // Extract headers
      const headers = chess.header();
      
      // Determine result
      let result = 'draw';
      if (headers.Result === '1-0') result = 'win';
      else if (headers.Result === '0-1') result = 'loss';
      
      // Determine player color (will be improved in handlePgnUpload)
      const playerColor = 'white'; // Default assumption
      
      // Create game object
      const gameObj = {
        event: headers.Event || 'Unknown Event',
        site: headers.Site || 'Unknown Site',
        date: headers.Date || 'Unknown Date',
        white: { 
          username: headers.White || 'Unknown White', 
          rating: headers.WhiteElo || '?',
          result: headers.Result === '1-0' ? 'win' : (headers.Result === '0-1' ? 'loss' : 'draw')
        },
        black: { 
          username: headers.Black || 'Unknown Black', 
          rating: headers.BlackElo || '?',
          result: headers.Result === '0-1' ? 'win' : (headers.Result === '1-0' ? 'loss' : 'draw')
        },
        result,
        time_control: headers.TimeControl || 'Unknown',
        termination: headers.Termination || '',
        opening: headers.Opening ? { name: headers.Opening } : { name: 'Unknown Opening' },
        moves: chess.history({ verbose: true }),
        pgn: chess.pgn(),
        fen: chess.fen()
      };
      
      // Add game to collection
      games.push(gameObj);
      
    } catch (e) {
      console.error("Error processing game:", e);
      // Continue with next game
    }
  }
  
  console.log(`Successfully parsed ${games.length} games from PGN content`);
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
  } else if (platform === 'lichess') {
    return downloadLichessPGN(username, timeRange, setProgress);
  } else {
    // For uploaded files, return an empty array since we handle them separately
    return [];
  }
};
