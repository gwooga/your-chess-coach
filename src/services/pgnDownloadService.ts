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
        // Try with default settings first
        try {
          chess.loadPgn(gameText);
        } catch (fenError) {
          // If FEN error, try to load with a more lenient approach
          if (fenError.message && fenError.message.includes('Invalid FEN')) {
            // Try loading just the moves without validation
            const chess2 = new Chess();
            // Skip this game if we can't parse it properly
            continue;
          } else {
            throw fenError;
          }
        }
        
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
    console.error('Parsing error: Failed to parse the uploaded file. Please check the file format.');
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
    // Use proxy to avoid QUIC protocol errors with Chess.com
    const proxyArchivesUrl = `/api/chess-proxy?url=${encodeURIComponent(archivesUrl)}`;
    const archivesResponse = await fetch(proxyArchivesUrl);
    
    if (!archivesResponse.ok) {
      throw new Error(`Failed to fetch Chess.com archives via proxy (${archivesResponse.status})`);
    }
    
    const archivesData = await archivesResponse.json();
    const archives = archivesData.archives;
    
    if (!archives || archives.length === 0) {
      console.error(`No game archives found for ${username} on Chess.com`);
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
    const GAME_LIMIT = 1000; // Stop fetching once we have 1000+ games
    
    // Granular progress steps
    const progressSteps = [0, 12, 25, 37, 50, 63, 75, 84, 100];
    let stepIdx = 0;
    setProgress(progressSteps[stepIdx++]);
    
    // Fetch all filtered archives (last 3 months worth)
    const archivesToFetch = filteredArchives;
    
    console.log(`Fetching from ${archivesToFetch.length} Chess.com archives out of ${filteredArchives.length} available (last 3 months, limit: ${GAME_LIMIT} games)`);
    
    // Process archives in parallel for better performance
    const archivePromises = archivesToFetch.map(async (archiveUrl, index) => {
      // Calculate which progress step to use
      const progressIndex = Math.min(
        Math.floor(((index + 1) / archivesToFetch.length) * (progressSteps.length - 2)) + 1,
        progressSteps.length - 2
      );
      setProgress(progressSteps[progressIndex]);

      // Try fetching with minimal retries for performance
      let retryCount = 0;
      const maxRetries = 1; // Reduced from 2 for speed
      
      while (retryCount <= maxRetries) {
        try {
          // Use proxy to avoid QUIC protocol errors with Chess.com
          const proxyUrl = `/api/chess-proxy?url=${encodeURIComponent(archiveUrl + '/pgn')}`;
          const pgnResponse = await fetch(proxyUrl);
          
          if (pgnResponse.ok) {
            const pgnText = await pgnResponse.text();
            const games = parsePgnContent(pgnText);
            console.log(`Archive ${archiveUrl}: ${games.length} games parsed`);
            return games;
          } else if (pgnResponse.status === 404 || pgnResponse.status >= 500) {
            // Don't retry 404s (archive doesn't exist) or 500s (server errors)
            console.log(`Archive ${archiveUrl}: No games available (${pgnResponse.status})`);
            return [];
          } else if (pgnResponse.status === 502 || pgnResponse.status === 504) {
            // Handle connection terminated or timeout errors
            console.log(`Archive ${archiveUrl}: Connection issue (${pgnResponse.status}) - likely too many games or server busy`);
            return [];
          } else {
            console.error(`Failed to fetch PGN from ${archiveUrl} via proxy: ${pgnResponse.status}`);
            return [];
          }
        } catch (error) {
          retryCount++;
          if (retryCount <= maxRetries) {
            console.log(`Retrying ${archiveUrl} via proxy (attempt ${retryCount})...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay
          } else {
            console.log(`Failed to fetch ${archiveUrl} via proxy after ${maxRetries} retries`);
            return [];
          }
        }
      }
      return [];
    });

    // Wait for all archives to complete and combine results
    const archiveResults = await Promise.all(archivePromises);
    
    // Combine all games and show totals
    let successfulArchives = 0;
    let failedArchives = 0;
    
    archiveResults.forEach((games, index) => {
      if (games.length > 0) {
        successfulArchives++;
        console.log(`✅ Archive ${archivesToFetch[index]}: ${games.length} games`);
      } else {
        failedArchives++;
        console.log(`❌ Archive ${archivesToFetch[index]}: Failed or empty`);
      }
      allGames.push(...games);
    });
    
    // Apply game limit after collection (much faster than checking during parallel execution)
    if (allGames.length > GAME_LIMIT) {
      console.log(`🎯 Limiting games from ${allGames.length} to ${GAME_LIMIT} for performance`);
      allGames.splice(GAME_LIMIT); // Keep only first 1000 games
    }
    
    console.log(`📊 Archive Summary: ${successfulArchives}/${archivesToFetch.length} successful, ${allGames.length} total games`);
    
    // Step 4: Filter games by the exact date range (not just by month)
    let includedCount = 0;
    let excludedCount = 0;
    
    const filteredGames = allGames.filter(game => {
      const gameDate = parsePgnDate(game.date);
      if (!gameDate) {
        includedCount++;
        return true; // Include games with invalid dates
      }
      
      const isInRange = gameDate >= cutoffDate;
      if (isInRange) {
        includedCount++;
      } else {
        excludedCount++;
      }
      return isInRange;
    });
    
    console.log(`Date filtering: ${includedCount} included, ${excludedCount} excluded`);
    
    console.log(`Chess.com download: Found ${allGames.length} total games, ${filteredGames.length} within date range`);
    console.log(`Date range: ${cutoffDate.toISOString()} to ${now.toISOString()}`);
    
    // Log game type breakdown
    const gameTypes = filteredGames.reduce((acc, game) => {
      const timeControl = game.time_control || 'unknown';
      acc[timeControl] = (acc[timeControl] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Game types found:', gameTypes);
    
    setProgress(progressSteps[progressSteps.length - 1]);
    return filteredGames;
  } catch (error) {
    console.error("Error downloading Chess.com PGN:", error);
    console.error('Download failed: Failed to download games from Chess.com');
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
    console.error('Download failed: Failed to download games from Lichess');
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
