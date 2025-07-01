import 'dotenv/config';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { pgn, username, platform, average_rating, openings_stats, other_stats } = request.body || {};

  if (!pgn || !username) {
    response.status(400).json({ error: 'Missing PGN or username.' });
    return;
  }

  // Improved, structured prompt
  const prompt = `You are a world-class chess coach. Analyze the following chess games and player data for the user "${username}" (rating: ${average_rating || 'unknown'}, platform: ${platform || 'unknown'}). The games are in PGN format, and you have access to their opening stats, win/loss rates, and other performance data.

Your job is to provide a highly personalized, actionable, and motivating coaching report. Adapt your advice to the user's level (see rating band below), using language and concepts they will understand, or just slightly above their current level. Use all available data (openings, time management, game length, win/loss patterns, etc.) to make your analysis as insightful as possible.

Break down your report into these four sections:

1. Coach Analysis
- Summarize the user's most-played openings and any striking score gaps (e.g., "–11 vs 4.Bc4 in Classical Sicilian").
- Mention any notable patterns in game length, time management, or blunder rates.
- Highlight any unique trends or statistical signals you find.

2. Strengths
- List 2-4 positive patterns or habits, with supporting stats (e.g., "Strong results in gambit positions", "Consistent performance on Mondays").

3. Areas to Improve
- List 3-4 specific, actionable improvement areas, each tied to real stats or patterns (e.g., "Low win rate in endgames", "Struggles with time trouble in blitz").

4. Study Recommendations
- Present a table with columns: Focus | Drill | Rationale.
- Choose drills appropriate to the user's rating band (see mapping below), but do NOT mention the band explicitly.
- Make the recommendations practical and motivating.

Rating Band Mapping (for your reference, do NOT mention band explicitly):
- 600-800  → basics (tactics, mate-in-one, piece safety)
- 801-1000 → fundamental tactics + simple openings
- 1001-1200 → intermediate tactics, basic endgames
- 1201-1400 → opening ideas, opposition endgames, time use
- 1401-1600 → positional themes, anti-sideline prep, clock discipline
- 1601-1800 → deep opening patch, rook endings, calculation method
- 1801-2000 → advanced structures, prophylaxis, targeted engine prep
- 2001-2200+ → novelties, long strategic plans, psychological edges

Format your output with clear section headers and, where appropriate, use tables or bullet points for readability. Be concise but thorough, and make your advice as actionable and encouraging as possible.

Here is the user's data:
- PGN: ${pgn}
- Openings stats: ${openings_stats || 'N/A'}
- Other stats: ${other_stats || 'N/A'}
`;

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
    response.status(200).json({ report: aiResponse });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate analysis.', details: error?.response?.data || error.message || error });
  }
} 