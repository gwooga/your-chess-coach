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
  // build URL safely
  const url = new URL(`${BASE_URL}/games/user/${username}`);
  if (timeRange !== 'all') {
    const sinceMs = Date.now() - daysBack[timeRange as keyof typeof daysBack] * 86_400_000;
    const since = Math.floor(sinceMs / 1000); // convert ms to seconds
    url.searchParams.set('since', since.toString());
  }
  url.searchParams.set('max', maxGames.toString());
  url.searchParams.set('opening', 'true');
  url.searchParams.set('analyzed', 'true');
  url.searchParams.set('pgnInJson', 'true');
  if (perfType) url.searchParams.set('perfType', perfType);

  // request NDJSON
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/x-ndjson' }
  });
  if (!res.ok) throw new Error(`Games error ${res.status}`);

  // parse each NDJSON line
  const raw = await res.text();
  const games = raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));

  if (games.length === 0) {
    console.warn('No games found. Raw response:', raw.slice(0, 500));
  }

  // enrich with player color and result
  return games.map((g: any) => {
    const isBlack =
      g.players?.black?.user?.name?.toLowerCase() === username.toLowerCase();
    const result =
      (g.winner === 'white' && !isBlack) || (g.winner === 'black' && isBlack)
        ? 'win'
        : g.winner
        ? 'loss'
        : 'draw';
    return { ...g, playerColor: isBlack ? 'black' : 'white', result };
  });
}

/** Fetch profile + games together */
export async function fetchLichessData(
  username: string,
  timeRange: TimeRange = 'all'
) {
  // run calls in parallel
  const [profile, games] = await Promise.all([
    fetchLichessProfile(username),
    fetchLichessGames(username, timeRange)
  ]);
  return { profile, games };
}

