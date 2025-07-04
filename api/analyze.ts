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
  const { username, platform, average_rating, relevantOpenings, openings_stats, other_stats } = request.body || {};

  if (!username) {
    response.status(400).json({ error: 'Missing username.' });
    return;
  }

  // Parse openings_stats to extract breakdown by game type
  let openingsStatsObj = {};
  try {
    openingsStatsObj = JSON.parse(openings_stats);
  } catch (e) {
    // fallback: send as string
    openingsStatsObj = openings_stats;
  }
  // Calculate total games by type
  let gameTypeBreakdown = '';
  if (typeof openingsStatsObj === 'object' && openingsStatsObj !== null) {
    const types = ['all', 'blitz', 'rapid', 'bullet', 'classical'];
    gameTypeBreakdown = types
      .map(type => {
        const variant = openingsStatsObj[type];
        if (variant && typeof variant.totalGames === 'number') {
          return `${type.charAt(0).toUpperCase() + type.slice(1)}: ${variant.totalGames}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');
  }

  // Compose the new master prompt (no PGN, only tables, rating, and total games)
  const prompt = `You are a chess coach. You will be provided with:

1. Up to 10 tables of opening statistics for either White or Black, with columns: Opening, Sequence, Games (N), Wins (%), Draws (%), Losses (%).
2. The student's current Elo rating (e.g. 1500, 1800).
3. The student's total number of games.

---

For each table:
In 4–6 bullet points, each 1–3 sentences, produce "Coach's notes" that cover:
- Key share: why the main line matters (percent of games).
- Result outlier: any line with win % below 45% or above 60%.
- Actionable tip: one concrete study or repertoire tweak.
- Optionally, a tactical motif or pawn-structure theme to drill.

Do NOT repeat the phrase 'Coach's notes' or any header in your output. Output 4-6 clear bullet points, each 1-3 sentences.
Adapt your language complexity to the student's rating range (rating to rating+100).

---

Then, based on all the tables together:
Generate a JSON object with the following four fields:

- Personal Coaching Report:
  Summarize the highest-share openings and any striking score gaps. Mention game-length disparity and any optional blunder/clock stats.
  For example:
    - Extract 3-4 highest-share lines from Top20 (using the gamesShare field).
    - Note any line where Win% or Loss% deviates by ≥10 points from 50%.
    - Mention average move-length difference and any auxiliary clock/blunder stat if available.

- Strengths:
  List 2-3 positive patterns (e.g., "wide repertoire", "good gambit score").
  For example:
    - A line with Win% ≥ 55% and ≥3% share
    - High endgame save-rate (if draw% in lost positions is high)
    - Repertoire breadth if no single line >20%

- Areas to Improve:
  Numbered list (3-4 items). Tie each item to real stats (e.g., "–11 vs 4.Bc4 in Classical Sicilian").
  For example:
    - Lines with Loss% ≥ 55% and ≥3% share
    - Any huge share line (≥10%) that is only break-even
    - Clock or blunder issue if computed

- Study Recommendations:
  In bullet points, write Focus, Drill, and Rationale. Tailor drills to the ratingBand (see mapping below, do NOT mention the band explicitly). Link each drill back to an Area-to-Improve item.

Rating band mapping:
- 600-800  → basics (tactics, mate-in-one, piece safety)
- 801-1000 → fundamental tactics + simple openings
- 1001-1200 → intermediate tactics, basic endgames
- 1201-1400 → opening ideas, opposition endgames, time use
- 1401-1600 → positional themes, anti-sideline prep, clock discipline
- 1601-1800 → deep opening patch, rook endings, calculation method
- 1801-2000 → advanced structures, prophylaxis, targeted engine prep
- 2001-2200+ → novelties, long strategic plans, psychological edges

Instructions:
- Do not repeat the raw stats or tables in your output—summarize and interpret them.
- Adapt your language complexity to the student's rating range (from their rating up to rating+100).
- Return only a valid JSON object in your response, with the following structure:

{
  "coach_says": [
    "Coach says for table 1 (as bullet points)",
    "Coach says for table 2 (as bullet points)",
    "... (one for each table, in order)"
  ],
  "summary": {
    "personal_report": "...",
    "strengths": "...",
    "areas_to_improve": "...",
    "study_recommendations": "..."
  }
}

---

Here are the tables:
${JSON.stringify(request.body.tables, null, 2)}

Student rating: ${request.body.rating}
Total games: ${request.body.total_games}`;

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