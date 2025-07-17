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
  const { table, rating } = request.body || {};
  if (!table || !Array.isArray(table) || typeof rating !== 'number') {
    response.status(400).json({ error: 'Missing or invalid table or rating.' });
    return;
  }
  const tableMarkdown = formatTableMarkdown(table);
  const prompt = `You are a chess coach. You will be provided with:  \n\n1. A table of opening statistics for either White or Black, with columns: Opening, Sequence, Games (N), Wins (%), Draws (%), Losses (%).\n2. The student's current Elo rating (e.g. 1500, 1800).\n\nTable:\n${tableMarkdown}\n\nStudent rating: ${rating}\n\nYour task: in 4–6 bullet points, each 1–3 sentences, produce "Coach's notes" that cover:\n- Key share: why the main line matters (percent of games).\n- Result outlier: any line with win % below 45% or above 60%.\n- Actionable tip: one concrete study or repertoire tweak.\n- Optionally, a tactical motif or pawn-structure theme to drill.\n\nDo NOT repeat the phrase 'Coach's notes' or any header in your output. Output 4-6 clear bullet points, each 1-3 sentences.\n\nAdapt your language complexity to the student's rating range (rating to rating+100).`;
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
    const points = splitIntoPoints(aiResponse);
    response.status(200).json({ notes: points });
  } catch (error: any) {
    console.error('OpenAI API error:', error?.response?.data || error.message || error);
    response.status(500).json({ error: 'Failed to generate coach notes.', details: error?.response?.data || error.message || error });
  }
} 