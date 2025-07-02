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
  const { table, rating } = request.body || {};
  if (!table || !Array.isArray(table) || typeof rating !== 'number') {
    response.status(400).json({ error: 'Missing or invalid table or rating.' });
    return;
  }
  const tableMarkdown = formatTableMarkdown(table);
  const prompt = `You are a chess coach. You will be provided with:  \n\n1. A table of opening statistics for either White or Black, with columns: Opening, Sequence, Games (N), Wins (%), Draws (%), Losses (%).\n2. The student's current Elo rating (e.g. 1500, 1800).\n\nTable:\n${tableMarkdown}\n\nStudent rating: ${rating}\n\nYour task: in 4–6 sentences, produce "Coach's notes" that cover:\n- Key share: why the main line matters (percent of games).\n- Result outlier: any line with win % below 45% or above 60%.\n- Actionable tip: one concrete study or repertoire tweak.\n- Optionally, a tactical motif or pawn-structure theme to drill.\n\nAdapt your language complexity to the student's rating range (rating to rating+100).`;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a world-class chess coach and data analyst.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });
    const aiResponse = completion.choices[0]?.message?.content || 'No response from AI.';
    response.status(200).json({ notes: aiResponse });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate coach notes.', details: error?.response?.data || error.message || error });
  }
} 