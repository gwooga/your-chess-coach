import { track } from '@vercel/analytics';

export type TimeRange = 'last30' | 'last90' | 'last180' | 'last365' | 'all';

const BASE_URL = 'https://lichess.org/api';

/** Grab the public profile of a Lichess user */
export async function fetchLichessProfile(username: string) {
  const res = await fetch(`${BASE_URL}/user/${username}`);
  if (!res.ok) throw new Error(`Profile error ${res.status}`);
  return res.json();            // plain JSON
}

const daysBack: Record<Exclude<TimeRange, 'all'>, number> = {
  last30: 30,
  last90: 90,
  last180: 180,
  last365: 365
};

/** Download games in NDJSON and return them as an array */
export async function fetchLichessGames(
  username: string,
  timeRange: TimeRange = 'last90',
  maxGames = 300,
  perfType?: 'bullet' | 'blitz' | 'rapid' | 'classical'
) {
  const url = new URL(`${BASE_URL}/games/user/${username}`);
  if (timeRange !== 'all') {
    const sinceMs = Date.now() - daysBack[timeRange as keyof typeof daysBack] * 86_400_000;
    const since = Math.floor(sinceMs / 1000);
    url.searchParams.set('since', since.toString());
  }
  url.searchParams.set('max', maxGames.toString());
  url.searchParams.set('opening', 'true');
  url.searchParams.set('analyzed', 'true');
  if (perfType) url.searchParams.set('perfType', perfType);

  // Fetch as PGN text
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/x-chess-pgn' }
  });
  if (!res.ok) throw new Error(`Games error ${res.status}`);

  // Return PGN as plain text
  const pgn = await res.text();
  if (!pgn.trim()) {
    console.warn('No games found. Raw response:', pgn.slice(0, 500));
  }
  return pgn;
}

/** Fetch profile + games together */
export async function fetchLichessData(
  username: string,
  timeRange: TimeRange = 'all'
) {
  // Track analysis start
  console.log(`🎯 LICHESS ANALYSIS STARTED: ${username} at ${new Date().toISOString()}`);
  track('Analysis Started', { 
    username: username,
    platform: 'lichess',
    timeRange: timeRange,
    timestamp: new Date().toISOString()
  });
  
  // run calls in parallel
  const [profile, games] = await Promise.all([
    fetchLichessProfile(username),
    fetchLichessGames(username, timeRange)
  ]);
  
  // Track analysis completion
  console.log(`✅ LICHESS ANALYSIS COMPLETED: ${username} - Games fetched successfully`);
  track('Analysis Completed', { 
    username: username,
    platform: 'lichess',
    timeRange: timeRange,
    timestamp: new Date().toISOString()
  });
  
  return { profile, games };
}

