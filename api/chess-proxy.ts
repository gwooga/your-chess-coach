import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS for your domain
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = request.query;
  
  if (!url || typeof url !== 'string') {
    return response.status(400).json({ error: 'URL parameter required' });
  }

  // Security: Only allow Chess.com API URLs (including redirected domains)
  if (!url.startsWith('https://api.chess.com/') && 
      !url.includes('chess.com') && 
      !url.includes('chesscomfiles.com')) {
    return response.status(403).json({ error: 'Only Chess.com URLs allowed' });
  }

  console.log(`🔄 Proxying Chess.com request: ${url}`);

  try {
    const chessResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Chess-Coach-Server/1.0 (chess-coach.xyz)',
        'Accept': 'text/plain,application/x-chess-pgn,*/*',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow' // Follow redirects automatically
    });

    if (!chessResponse.ok) {
      console.error(`❌ Chess.com API error: ${chessResponse.status} for ${url}`);
      const errorText = await chessResponse.text().catch(() => 'Unable to read error response');
      console.error(`❌ Error response body: ${errorText.substring(0, 200)}`);
      
      return response.status(chessResponse.status).json({ 
        error: `Chess.com API returned ${chessResponse.status}`,
        url: url,
        details: errorText.substring(0, 500)
      });
    }

    const content = await chessResponse.text();
    console.log(`✅ Successfully proxied ${url}, content length: ${content.length}`);
    
    // Set appropriate response headers
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
    
    return response.status(200).send(content);
    
  } catch (error: any) {
    console.error('❌ Chess.com proxy error:', error.message);
    return response.status(500).json({ 
      error: 'Failed to fetch from Chess.com via proxy',
      details: error.message 
    });
  }
}