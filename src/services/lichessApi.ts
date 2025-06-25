export type TimeRange = 'last30' | 'last90' | 'last180' | 'all';

const BASE_URL = 'https://lichess.org/api';

/** Grab the public profile of a Lichess user */
export async function fetchLichessProfile(username: string) {
  const res = await fetch(`${BASE_URL}/user/${username}`);
  if (!res.ok) throw new Error(`Profile error ${res.status}`);
  return res.json();            // plain JSON
}

/** Download games in NDJSON and return them as an array */
export async function fetchLichessGames(
  username: string,
  timeRange: TimeRange = 'all',
  maxGames = 300,
  perfType?: 'bullet' | 'blitz' | 'rapid' | 'classical'
) {
  // work out the "since" cutoff in ms
  const daysBack: Record<TimeRange, number> = {
    last30: 30,
    last90: 90,
    last180: 180,
    all: 365
  };
  const sinceMs = Date.now() - daysBack[timeRange] * 86_400_000;
  const since = Math.floor(sinceMs / 1000); // convert ms to seconds

  // build URL safely
  const url = new URL(`${BASE_URL}/games/user/${username}`);
  url.searchParams.set('since', since.toString());
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

