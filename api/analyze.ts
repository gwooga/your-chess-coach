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
  const openingsList: string[] = [];
  for (const gameText of games) {
    try {
      const chess = new Chess();
      chess.loadPgn(gameText);
      const headers = chess.header();
      // Opening
      const opening = headers.Opening || 'Unknown';
      openingCounts[opening] = (openingCounts[opening] || 0) + 1;
      openingsList.push(opening);
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
    openingsList,
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

  // Accept all relevant data from the request
  const { pgn, username, platform, average_rating, relevantOpenings, openings_stats, other_stats } = request.body || {};

  if (!pgn || !username) {
    response.status(400).json({ error: 'Missing PGN or username.' });
    return;
  }

  // Compose the new prompt
  const prompt = `You are a world-class chess coach. You will be provided with a detailed summary of a student's real chess data, including their rating, recent game statistics, opening performance tables, and the full PGN of their games.\n\nYour task:\nBased on all the data provided, generate a JSON object with the following four fields:\n\n---\n\n### Personal Coaching Report  \n- Summarize the highest-share openings and any striking score gaps.  \n- Mention game-length disparity and any optional blunder/clock stats.  \n- For example:  \n  - Extract **3-4 highest-share lines** from Top20 (using the gamesShare field).  \n  - Note any line where Win% or Loss% deviates by ≥10 points from 50%.  \n  - Mention average move-length difference and any auxiliary clock/blunder stat if available.\n\n### Strengths  \n- List 2-3 positive patterns (e.g., "wide repertoire", "good gambit score").  \n- For example:  \n  - A line with Win% ≥ 55% and ≥3% share  \n  - High endgame save-rate (if draw% in lost positions is high)  \n  - Repertoire breadth if no single line >20%\n\n### Areas to Improve  \n- Numbered list (3-4 items).  \n- Tie each item to real stats (e.g., "–11 vs 4.Bc4 in Classical Sicilian").  \n- For example:  \n  - Lines with Loss% ≥ 55% and ≥3% share  \n  - Any huge share line (≥10%) that is only break-even  \n  - Clock or blunder issue if computed\n\n### Study Recommendations  \n- In bullet points, write Focus, Drill, and Rationale.  \n- Tailor drills to the **ratingBand** (see mapping below, do NOT mention the band explicitly).  \n- Link each drill back to an Area-to-Improve item.\n\n**Rating band mapping:**  \n- 600-800  → basics (tactics, mate-in-one, piece safety)  \n- 801-1000 → fundamental tactics + simple openings  \n- 1001-1200 → intermediate tactics, basic endgames  \n- 1201-1400 → opening ideas, opposition endgames, time use  \n- 1401-1600 → positional themes, anti-sideline prep, clock discipline  \n- 1601-1800 → deep opening patch, rook endings, calculation method  \n- 1801-2000 → advanced structures, prophylaxis, targeted engine prep  \n- 2001-2200+ → novelties, long strategic plans, psychological edges\n\n**Instructions:**  \n- Do not repeat the raw stats or tables in your output—summarize and interpret them.\n- Adapt your language complexity to the student's rating range (from their rating up to rating+100).\n- Return only a valid JSON object in your response, with the four fields described above.\n\n**Student data:**\n- Username: ${username}\n- Platform: ${platform}\n- Rating: ${average_rating}\n- Relevant Openings: ${JSON.stringify(relevantOpenings, null, 2)}\n- Openings Stats: ${openings_stats}\n- Other Stats: ${other_stats}\n- PGN: ${pgn.substring(0, 2000)}${pgn.length > 2000 ? '\n...PGN truncated for length...' : ''}`;

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
    let summary = null;
    try {
      summary = JSON.parse(aiResponse);
    } catch (e) {
      // Try to extract JSON from a possibly verbose response
      const match = aiResponse.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          summary = JSON.parse(match[0]);
        } catch (e2) {
          return response.status(500).json({ error: 'AI response was not valid JSON.', raw: aiResponse });
        }
      } else {
        return response.status(500).json({ error: 'AI response was not valid JSON.', raw: aiResponse });
      }
    }
    response.status(200).json({ summary });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate analysis.', details: error?.response?.data || error.message || error });
  }
} 