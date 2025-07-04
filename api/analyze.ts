import 'dotenv/config';
import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatTableMarkdown(table: any[]): string {
  if (!table.length) return '';
  const headers = Object.keys(table[0]);
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `|${headers.map(() => '---').join('|')}|`;
  const rows = table.map(row => `| ${headers.map(h => row[h]).join(' | ')} |`);
  return [headerRow, separator, ...rows].join('\n');
}

function splitIntoPoints(text: string): string[] {
  // Remove any repeated Coach's Notes header
  let cleaned = text.replace(/\*+Coach'?s? Notes:?.*\n?/gi, '').trim();
  // Try to split by bullet points: lines starting with -, *, or numbered
  const bulletRegex = /^(?:\s*[-*]|\s*\d+\.)\s+/gm;
  const bullets = cleaned.split(bulletRegex).map(s => s.trim()).filter(Boolean);
  if (bullets.length > 1) return bullets;
  // Fallback: split by double newlines (paragraphs)
  const paras = cleaned.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  if (paras.length > 1) return paras;
  // Fallback: split by sentences
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleaned];
  return sentences.map(s => s.trim()).filter(Boolean);
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

  const { username, platform, tables, totalGames, highestRating } = request.body || {};

  if (!username || !tables || !Array.isArray(tables)) {
    response.status(400).json({ error: 'Missing required fields: username, tables.' });
    return;
  }

  // Format all tables for the prompt
  const formattedTables = tables.map((table: any, index: number) => {
    const tableMarkdown = formatTableMarkdown(table.data);
    return `**Table ${index + 1} (${table.tableKey}):**\n${tableMarkdown}`;
  }).join('\n\n');

  // Create the master prompt combining both coach notes and coach summary
  const prompt = `You are a world-class chess coach. You will analyze a student's opening performance data and provide both detailed table-specific notes AND an overall coaching summary.

**Student Information:**
- Username: ${username}
- Platform: ${platform}
- Total Games: ${totalGames}
- Highest Rating: ${highestRating}

**Opening Performance Tables:**
${formattedTables}

**Your task is to provide a JSON response with the following structure:**

{
  "tableNotes": [
    {
      "tableKey": "table_key_here",
      "notes": ["bullet point 1", "bullet point 2", "bullet point 3", "bullet point 4"]
    },
    // ... for each table
  ],
  "coachSummary": {
    "personal_report": "A comprehensive summary of the student's opening performance, highlighting the most significant patterns, strengths, and areas for improvement based on all tables.",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "areas_to_improve": ["1. Specific area with stats", "2. Another area with stats", "3. Third area with stats"],
    "study_recommendations": ["• Focus: specific area - Drill: specific practice - Rationale: why this helps", "• Focus: another area - Drill: another practice - Rationale: why this helps"]
  }
}

**For tableNotes:** Each table should get 4-6 bullet points covering:
- Key share: why the main line matters (percent of games)
- Result outlier: any line with win % below 45% or above 60%
- Actionable tip: one concrete study or repertoire tweak
- Optionally, a tactical motif or pawn-structure theme to drill

**For coachSummary:** Based on ALL tables combined:
- **Personal Report:** Extract 3-4 highest-share lines, note win/loss deviations ≥10 points from 50%
- **Strengths:** 2-3 positive patterns (lines with Win% ≥55% and ≥3% share, repertoire breadth)
- **Areas to Improve:** 3-4 numbered items tied to real stats (lines with Loss% ≥55% and ≥3% share)
- **Study Recommendations:** Bullet points with Focus, Drill, and Rationale, tailored to rating ${highestRating}

**Rating band guidance for recommendations:**
- 600-1000: basics (tactics, mate-in-one, piece safety, simple openings)
- 1001-1400: intermediate tactics, basic endgames, opening ideas
- 1401-1800: positional themes, deep opening prep, rook endings
- 1801-2200+: advanced structures, novelties, psychological edges

Adapt language complexity to the student's rating range. Return only valid JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a world-class chess coach and data analyst.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response from AI.';
    
    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // Try to extract JSON from a possibly verbose response
      const match = aiResponse.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
        } catch (e2) {
          return response.status(500).json({ error: 'AI response was not valid JSON.', raw: aiResponse });
        }
      } else {
        return response.status(500).json({ error: 'AI response was not valid JSON.', raw: aiResponse });
      }
    }

    if (!parsedResponse) {
      return response.status(500).json({ error: 'Failed to parse AI response.' });
    }

    // Ensure tableNotes have the splitIntoPoints format for compatibility
    if (parsedResponse.tableNotes) {
      parsedResponse.tableNotes = parsedResponse.tableNotes.map((tableNote: any) => ({
        ...tableNote,
        notes: Array.isArray(tableNote.notes) ? tableNote.notes : splitIntoPoints(tableNote.notes || '')
      }));
    }

    response.status(200).json({
      summary: parsedResponse.coachSummary,
      tableNotes: parsedResponse.tableNotes
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate analysis.', details: error?.response?.data || error.message || error });
  }
} 