import { toast } from '../hooks/use-toast';
import { TimeRange, Platform } from '../utils/types';
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

// Filter games by time range - now exported
export const filterGamesByTimeRange = (games: any[], timeRange: TimeRange): any[] => {
  // If no timerange specified or invalid value, return all games
  if (!timeRange) return games;
  
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

// Parse PGN content and extract games with improved error handling
export const parsePgnContent = (pgnContent: string): any[] => {
  const games: any[] = [];
  let successfulGames = 0;
  let failedGames = 0;
  console.log("Starting PGN parsing, content length:", pgnContent.length);
  
  try {
    // Try to normalize line endings for consistent parsing
    const normalizedContent = pgnContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    // Split the PGN content by the standard separator for new games
    // First look for double newline + [Event pattern
    let gameTexts: string[] = [];
    
    // Try different splitting strategies to handle various PGN formats
    if (normalizedContent.includes('\n\n[Event ')) {
      gameTexts = normalizedContent.split(/\n\n\[Event /);
      console.log("Split by standard double newline + Event tag, found:", gameTexts.length);
    } else if (normalizedContent.includes('\n[Event ')) {
      // Some files use single newline before [Event
      gameTexts = normalizedContent.split(/\n\[Event /);
      console.log("Split by single newline + Event tag, found:", gameTexts.length);
    } else {
      // Try more aggressive splitting if we can't find standard separators
      const eventMatches = normalizedContent.match(/\[Event[^\]]+\]/g) || [];
      if (eventMatches.length > 0) {
        console.log("Using regex matching for Event tags, found:", eventMatches.length);
        
        // Extract game blocks using regex
        const gameBlocks = [];
        let currentPos = 0;
        
        for (let i = 0; i < eventMatches.length; i++) {
          const eventPos = normalizedContent.indexOf(eventMatches[i], currentPos);
          if (eventPos !== -1) {
            if (i > 0) {
              const gameText = normalizedContent.substring(currentPos, eventPos);
              gameBlocks.push(gameText);
            }
            currentPos = eventPos;
          }
        }
        
        // Add the last game block
        gameBlocks.push(normalizedContent.substring(currentPos));
        gameTexts = gameBlocks;
      } else {
        // Last resort: try to find all header tags to identify game boundaries
        console.log("No standard game separators found, trying header tag matching");
        const headerRegex = /\[\w+\s+"[^"]*"\]/g;
        const headerMatches = [...normalizedContent.matchAll(headerRegex)];
        
        if (headerMatches.length > 0) {
          console.log("Found header tags:", headerMatches.length);
          
          // Find sequences of header tags to identify game starts
          let lastPos = 0;
          let gameStart = -1;
          const positions = [];
          
          for (const match of headerMatches) {
            const pos = match.index as number;
            
            // If this header is far from the last one, it might be a new game
            if (pos - lastPos > 100) {
              if (gameStart !== -1) {
                positions.push(gameStart);
              }
              gameStart = pos;
            }
            
            lastPos = pos;
          }
          
          // Add the last game start
          if (gameStart !== -1) {
            positions.push(gameStart);
          }
          
          // Extract game texts based on positions
          if (positions.length > 0) {
            gameTexts = positions.map((pos, i) => {
              const end = i < positions.length - 1 ? positions[i + 1] : normalizedContent.length;
              return normalizedContent.substring(pos, end);
            });
          }
        }
      }
    }
    
    console.log(`Found ${gameTexts.length} potential games in PGN content using splitting`);
    
    // Process each game
    for (let i = 0; i < gameTexts.length; i++) {
      let gameText = gameTexts[i];
      
      // For all games except the first one when using standard splitting, we need to add back the [Event tag
      if (i > 0 && !gameText.trim().startsWith('[') && normalizedContent.includes('\n\n[Event ')) {
        gameText = '[Event ' + gameText;
      }
      
      // Skip empty games or very small fragments that are unlikely to be valid
      if (!gameText.trim() || gameText.length < 20) continue;
      
      // Skip fragments that don't look like a game
      if (!gameText.includes('[') || !gameText.includes(']')) continue;
      
      try {
        // Create a new Chess instance for each game
        const chess = new Chess();
        
        // Attempt to load the PGN. chess.js is strict and may throw errors.
        chess.loadPgn(gameText);
        
        // Extract headers
        const headers = chess.header();
        
        // Determine result
        let result = 'draw';
        if (headers.Result === '1-0') result = 'win';
        else if (headers.Result === '0-1') result = 'loss';
        
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
        successfulGames++;
      } catch (e: any) {
        failedGames++;
        // Log the failed game and error for debugging, but continue processing
        console.warn(`Skipping game #${i + 1} due to parsing error: ${e.message}`);
        // Optionally log the problematic PGN content
        // console.log("Problematic PGN:", gameText);
      }
    }
  } catch (e) {
    console.error("Critical error during PGN parsing:", e);
    toast({
      title: "Parsing error",
      description: "Failed to parse the uploaded file. Please check the file format.",
      variant: "destructive",
    });
  }
  
  console.log(`Parsing complete. Successfully parsed: ${successfulGames} games. Failed: ${failedGames} games.`);
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
    // Granular progress steps
    const progressSteps = [0, 12, 25, 37, 50, 63, 75, 84, 100];
    let stepIdx = 0;
    setProgress(progressSteps[stepIdx++]);
    const total = filteredArchives.length;
    for (let i = 0; i < total; i++) {
      const archiveUrl = filteredArchives[i];
      // Calculate which progress step to use
      const progressIndex = Math.min(
        Math.floor(((i + 1) / total) * (progressSteps.length - 2)) + 1,
        progressSteps.length - 2
      );
      setProgress(progressSteps[progressIndex]);
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
    setProgress(progressSteps[progressSteps.length - 1]);
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
    // Granular progress steps
    const progressSteps = [0, 12, 25, 37, 50, 63, 75, 84, 100];
    let stepIdx = 0;
    setProgress(progressSteps[stepIdx++]); // 0
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
    setProgress(progressSteps[stepIdx++]); // 12
    const sinceTs = Math.floor(since.getTime());
    const untilTs = Math.floor(now.getTime());
    // Build Lichess API URL
    const apiUrl = `https://lichess.org/api/games/user/${username}?since=${sinceTs}&max=300&opening=true&perfType=bullet,blitz,rapid,classical&pgnInJson=true`;
    setProgress(progressSteps[stepIdx++]); // 25
    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/x-chess-pgn' }
    });
    setProgress(progressSteps[stepIdx++]); // 37
    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess games (${response.status})`);
    }
    setProgress(progressSteps[stepIdx++]); // 50
    const pgnText = await response.text();
    setProgress(progressSteps[stepIdx++]); // 63
    // Use your existing PGN parser
    const games = parsePgnContent(pgnText);
    setProgress(progressSteps[progressSteps.length - 2]); // 84
    setProgress(progressSteps[progressSteps.length - 1]); // 100
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
