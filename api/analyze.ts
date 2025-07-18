import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCompletion } from '../src/services/aiService';

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
  console.log('API Key check:', !!process.env.DEEPSEEK_API_KEY);
  
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key not found in environment variables');
    response.status(500).json({ error: 'DeepSeek API key not configured.' });
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
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
    const prompt = `You are a world-class chess coach. You will analyze a player's opening performance data (sometime playing as black and sometimes playing as white) and provide both detailed table-specific notes AND an overall coaching summary.

**Player Information:**
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
    "personal_report": "A comprehensive summary of your opening performance, highlighting the most significant patterns, strengths, and areas for improvement based on all tables.",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "areas_to_improve": ["Specific area with stats", "Another area with stats", "Third area with stats"],
    "study_recommendations": ["Focus: specific area - Drill: specific practice - Rationale: why this helps", "Focus: another area - Drill: another practice - Rationale: why this helps"]
  }
}

**IMPORTANT LANGUAGE GUIDELINES:**
- Always use second person ("you", "your") instead of third person ("the student", "the player")
- Write as if speaking directly to the player
- Be conversational and personal in tone

**For tableNotes:** Each table should get 4-6 bullet points with actionable insights:
- Mention the significance of the main line (percent of games)
- Highlight any line with win % below 45% or above 60%
- Provide one concrete study or repertoire suggestion
- Optionally include a tactical motif or pawn-structure theme to practice

**For coachSummary:** Based on ALL tables combined:

- **Personal Report:**  
  Summarize your highest-share openings and any striking score gaps. Use second person throughout.
  For example:  
    - Extract 3-4 highest-share lines from your repertoire
    - Note any line where your Win% or Loss% deviates by ≥10 points from 50%
    - Mention patterns in your game length or performance trends

- **Strengths:**  
  List 2-3 positive patterns in your play (e.g., "strong repertoire breadth", "excellent gambit results").  
  For example:  
    - A line where you score Win% ≥ 55% and ≥3% share  
    - High endgame save-rate (if draw% in difficult positions is high)  
    - Repertoire breadth if no single line >20%

- **Areas to Improve:**  
  List 3-4 items as bullet points (not numbered). Tie each item to real stats from your games.
  For example:  
    - Lines where you lose ≥ 55% and ≥3% share  
    - Any high-frequency line (≥10%) where you're only breaking even  
    - Specific openings that need attention

- **Study Recommendations:**  
  Bullet points with Focus, Drill, and Rationale. Tailor drills to the rating level. Link each drill back to an Area-to-Improve item.

**Rating band guidance for recommendations:**
- 600-1000: basics (tactics, mate-in-one, piece safety, simple openings)
- 1001-1400: intermediate tactics, basic endgames, opening ideas
- 1401-1800: positional themes, deep opening prep, rook endings
- 1801-2200+: advanced structures, novelties, psychological edges

Adapt language complexity to the player's rating range. Always use second person language. Return only valid JSON.`;

    console.log('Making AI API call...');
    const completion = await createCompletion(
      'You are a world-class chess coach and data analyst.',
      prompt,
      3000,
      0.7
    );

    const aiResponse = completion.content;
    console.log('AI response received, length:', aiResponse.length);
    
    let parsedResponse: any = null;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error('JSON parse error:', e);
      // Try to extract JSON from a possibly verbose response
      const match = aiResponse.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResponse = JSON.parse(match[0]);
        } catch (e2) {
          console.error('JSON extraction failed:', e2);
          return response.status(500).json({ error: 'AI response was not valid JSON.', raw: aiResponse });
        }
      } else {
        console.error('No JSON found in response');
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

    console.log('Sending successful response');
    response.status(200).json({
      summary: parsedResponse.coachSummary,
      tableNotes: parsedResponse.tableNotes
    });
  } catch (error: any) {
    console.error('AI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ 
      error: 'Failed to generate analysis.', 
      details: error?.response?.data || error.message || error,
      stack: error?.stack
    });
  }
} 