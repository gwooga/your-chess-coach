
import { toast } from '@/hooks/use-toast';
import { UserInfo, TimeRange } from '@/utils/types';

// Lichess API endpoints
const BASE_URL = 'https://lichess.org/api';

// Fetch user profile data
export const fetchLichessProfile = async (username: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${username}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess profile: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Lichess profile:', error);
    throw error;
  }
};

// Fetch user's games with optional parameters
export const fetchLichessGames = async (
  username: string,
  timeRange: TimeRange,
  maxGames = 300
): Promise<any[]> => {
  try {
    // Calculate since parameter based on timeRange
    const now = new Date();
    
    // Calculate proper date cutoffs based on actual days rather than months
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
    
    const since = cutoffDate.getTime();
    
    // Construct the API URL with parameters
    const url = `${BASE_URL}/games/user/${username}?since=${since}&max=${maxGames}&perfType=bullet,blitz,rapid,classical&opening=true&analyzed=true&pgnInJson=true`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess games: ${response.status}`);
    }
    
    // Lichess API returns ndjson (newline delimited JSON)
    const text = await response.text();
    const games = text
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));
    
    return games;
  } catch (error) {
    console.error('Error fetching Lichess games:', error);
    throw error;
  }
};

// Fetch user's performance stats
export const fetchLichessPerformance = async (username: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${username}/perf/bullet,blitz,rapid,classical`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lichess performance: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Lichess performance:', error);
    throw error;
  }
};

// Main function to fetch all Lichess data for a user
export const fetchLichessData = async (userInfo: UserInfo, timeRange: TimeRange): Promise<any> => {
  const username = userInfo.username;
  
  try {
    toast({
      title: "Fetching Lichess data",
      description: `Analyzing ${username}'s Lichess games...`,
    });
    
    // Fetch profile and games in parallel
    const [profile, games] = await Promise.all([
      fetchLichessProfile(username),
      fetchLichessGames(username, timeRange)
    ]);
    
    toast({
      title: "Lichess analysis complete",
      description: `Successfully analyzed ${games.length} games from Lichess!`,
    });
    
    return {
      profile,
      games
    };
  } catch (error) {
    console.error('Error in fetchLichessData:', error);
    toast({
      title: "Error fetching Lichess data",
      description: "Failed to fetch or analyze Lichess games. Please check the username and try again.",
      variant: "destructive",
    });
    throw error;
  }
};
