import 'dotenv/config';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parsePgnContent } from './src/services/pgnDownloadService';
import { analyzeChessData } from '../src/services/chessAnalysisService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  // 4. Only keep real fields in the response
  const { ratings, openings, dayPerformance, timePerformance } = summary;
  const realSummary = { ratings, openings, dayPerformance, timePerformance };

  // 5. Build the OpenAI prompt
  const prompt = `You are a world-class chess coach. Here is a summary of the user's real chess data:\n\n` +
    `Ratings: ${JSON.stringify(ratings, null, 2)}\n` +
    `Openings: ${JSON.stringify(openings, null, 2)}\n` +
    `Day performance: ${JSON.stringify(dayPerformance, null, 2)}\n` +
    `Time performance: ${JSON.stringify(timePerformance, null, 2)}\n` +
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
    response.status(200).json({ report: aiResponse, summary: realSummary });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate analysis.', details: error?.response?.data || error.message || error });
  }
} 