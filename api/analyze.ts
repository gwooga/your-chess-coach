import 'dotenv/config';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Chess } from 'chess.js';

// --- Set aside for now (to be re-incorporated later):
// import { parsePgnContent } from '../src/services/pgnDownloadService.js';
// import { analyzeChessData } from '../src/services/chessAnalysisService.js';
// All custom stats extraction and advanced analysis

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseBasicStats(pgn: string) {
  // Split PGN into games
  const games = pgn.split(/\n\n(?=\[Event )/g).filter(g => g.trim());
  let openingCounts: Record<string, number> = {};
  let win = 0, loss = 0, draw = 0;
  for (const gameText of games) {
    try {
      const chess = new Chess();
      chess.loadPgn(gameText);
      const headers = chess.header();
      // Opening
      const opening = headers.Opening || 'Unknown';
      openingCounts[opening] = (openingCounts[opening] || 0) + 1;
      // Result
      if (headers.Result === '1-0') win++;
      else if (headers.Result === '0-1') loss++;
      else draw++;
    } catch (e) {
      // Ignore parse errors
    }
  }
  // Most common opening
  const mostCommonOpening = Object.entries(openingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  return {
    totalGames: games.length,
    win,
    loss,
    draw,
    mostCommonOpening,
    openingCounts,
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (!process.env.OPENAI_API_KEY) {
    response.status(500).json({ error: 'OpenAI API key not set.' });
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { pgn, username, platform } = request.body || {};

  if (!pgn || !username) {
    response.status(400).json({ error: 'Missing PGN or username.' });
    return;
  }

  // Minimal backend-safe PGN parsing and stats
  const stats = parseBasicStats(pgn);

  const prompt = `You are a world-class chess coach. Here is a summary of the user's real chess data:\n\n` +
    `Username: ${username}\n` +
    `Platform: ${platform}\n` +
    `Total games: ${stats.totalGames}\n` +
    `Wins: ${stats.win}, Losses: ${stats.loss}, Draws: ${stats.draw}\n` +
    `Most common opening: ${stats.mostCommonOpening}\n` +
    `Opening counts: ${JSON.stringify(stats.openingCounts, null, 2)}\n` +
    `\nFocus your analysis and advice on the real data provided above. For fields like phase accuracy, move quality, material swings, conversion rate, and time scramble record, no direct data is available. If you wish, you may mention typical patterns or advice for players of this rating, but do not invent user-specific statistics.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a world-class chess coach and data analyst.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1800,
      temperature: 0.7,
    });
    const aiResponse = completion.choices[0]?.message?.content || 'No response from AI.';
    response.status(200).json({ report: aiResponse, summary: stats });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate analysis.', details: error?.response?.data || error.message || error });
  }
} 