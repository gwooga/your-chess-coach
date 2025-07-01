import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsePgnContent } from '../src/services/pgnDownloadService';
import { analyzeChessData } from '../src/services/chessAnalysisService';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { pgn, username, platform, timeRange = 'all' } = request.body || {};

  if (!pgn || !username) {
    response.status(400).json({ error: 'Missing PGN or username.' });
    return;
  }

  // 1. Parse PGN to games array
  const games = parsePgnContent(pgn);

  // 2. Build user info object
  const userInfo = { username, platform };

  // 3. Analyze games to get summary
  let summary;
  try {
    summary = await analyzeChessData({ games, info: userInfo, timeRange });
  } catch (err: any) {
    response.status(500).json({ error: 'Failed to analyze games.', details: err.message });
    return;
  }

  // 4. Remove strengths, weaknesses, recommendations, insights from summary for now
  const { strengths, weaknesses, recommendations, insights, ...summaryForLog } = summary;

  // 5. Log the summary for inspection
  console.log('UserAnalysis summary (excluding strengths, weaknesses, recommendations, insights):', summaryForLog);

  // 6. Return the summary for inspection (do not call OpenAI yet)
  response.status(200).json({ summary: summaryForLog });
} 