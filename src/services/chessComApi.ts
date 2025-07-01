import { toast } from '../hooks/use-toast';
import { UserInfo, TimeRange } from '../utils/types';

// Chess.com API endpoints
const BASE_URL = 'https://api.chess.com/pub';

// Fetch user profile data
export const fetchChessComProfile = async (username: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/player/${username}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com profile: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Chess.com profile:', error);
    throw error;
  }
};

// Fetch user stats data
export const fetchChessComStats = async (username: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/player/${username}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com stats: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Chess.com stats:', error);
    throw error;
  }
};

// Fetch user game archives
export const fetchChessComGameArchives = async (username: string): Promise<string[]> => {
  try {
    const response = await fetch(`${BASE_URL}/player/${username}/games/archives`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com game archives: ${response.status}`);
    }
    const data = await response.json();
    return data.archives;
  } catch (error) {
    console.error('Error fetching Chess.com game archives:', error);
    throw error;
  }
};

// Fetch games from a specific archive
export const fetchChessComGames = async (archiveUrl: string): Promise<any> => {
  try {
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Chess.com games: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Chess.com games from ${archiveUrl}:`, error);
    throw error;
  }
};

// Filter archives based on time range
const filterArchivesByTimeRange = (archives: string[], timeRange: TimeRange): string[] => {
  const now = new Date();
  
  // Calculate the correct date range based on selected option
  let cutoffDate = new Date();
  
  if (timeRange === 'last30') {
    // For last 30 days, go back 30 days from today
    cutoffDate.setDate(now.getDate() - 30);
  } else if (timeRange === 'last90') {
    // For last 90 days, go back 90 days from today
    cutoffDate.setDate(now.getDate() - 90);
  } else if (timeRange === 'last180') {
    // For last 180 days, go back 180 days from today
    cutoffDate.setDate(now.getDate() - 180);
  } else {
    // For last 365 days, go back 365 days from today
    cutoffDate.setDate(now.getDate() - 365);
  }
  
  return archives.filter(archive => {
    // Chess.com archives format: .../YYYY/MM
    const parts = archive.split('/');
    const year = parseInt(parts[parts.length - 2]);
    const month = parseInt(parts[parts.length - 1]) - 1; // 0-based months
    
    // Get first day of the month for the archive
    const archiveDate = new Date(year, month, 1);
    
    // Get last day of the month for proper comparison
    const lastDayArchive = new Date(year, month + 1, 0);
    
    // If the last day of the month is after our cutoff, include this archive
    return lastDayArchive >= cutoffDate;
  });
};

// Main function to fetch all Chess.com data for a user
export const fetchChessComData = async (userInfo: UserInfo, timeRange: TimeRange): Promise<any> => {
  const username = userInfo.username;
  
  try {
    toast({
      title: "Fetching Chess.com data",
      description: `Analyzing ${username}'s Chess.com games...`,
    });
    
    // Fetch profile and stats in parallel
    const [profile, stats] = await Promise.all([
      fetchChessComProfile(username),
      fetchChessComStats(username)
    ]);
    
    // Fetch game archives and filter by time range
    const allArchives = await fetchChessComGameArchives(username);
    const filteredArchives = filterArchivesByTimeRange(allArchives, timeRange);
    
    // Fetch games from filtered archives (limit to most recent to avoid rate limiting)
    const maxArchivesToFetch = 3; // Adjust based on rate limits
    const recentArchives = filteredArchives.slice(-maxArchivesToFetch);
    
    // Fetch games from each archive
    const gamesPromises = recentArchives.map(archive => fetchChessComGames(archive));
    const gamesResults = await Promise.all(gamesPromises);
    
    // Combine all games into one array
    const allGames = gamesResults.flatMap(result => result.games || []);
    
    toast({
      title: "Chess.com analysis complete",
      description: `Successfully analyzed ${allGames.length} games from Chess.com!`,
    });
    
    return {
      profile,
      stats,
      games: allGames,
    };
  } catch (error) {
    console.error('Error in fetchChessComData:', error);
    toast({
      title: "Error fetching Chess.com data",
      description: "Failed to fetch or analyze Chess.com games. Please check the username and try again.",
      variant: "destructive",
    });
    throw error;
  }
};
