import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    console.log('🧪 Testing specific Chess.com archive URLs...');
    
    const testUrls = [
      'https://api.chess.com/pub/player/asxetos58/games/2025/07/pgn',
      'https://api.chess.com/pub/player/asxetos58/games/2025/06/pgn',
      'https://api.chess.com/pub/player/asxetos58/games/2025/05/pgn',
      'https://api.chess.com/pub/player/asxetos58/games/archives'
    ];
    
    const results: any[] = [];
    
    for (const testUrl of testUrls) {
      console.log(`🔄 Testing direct access to: ${testUrl}`);
      
      try {
        const directResponse = await fetch(testUrl, {
          headers: {
            'User-Agent': 'Chess-Coach-Server/1.0 (chess-coach.xyz)',
            'Accept': 'text/plain,application/x-chess-pgn,*/*',
            'Cache-Control': 'no-cache',
          },
          redirect: 'follow'
        });
        
        console.log(`📊 Response status: ${directResponse.status} for ${testUrl}`);
        console.log(`📊 Response headers:`, Object.fromEntries(directResponse.headers.entries()));
        
        if (directResponse.ok) {
          const content = await directResponse.text();
          console.log(`✅ Direct fetch successful for ${testUrl}, content length: ${content.length}`);
          
          results.push({
            url: testUrl,
            status: directResponse.status,
            success: true,
            contentLength: content.length,
            contentPreview: content.substring(0, 200)
          });
        } else {
          const errorText = await directResponse.text().catch(() => 'Unable to read error response');
          console.error(`❌ Direct fetch failed for ${testUrl}: ${directResponse.status}`);
          console.error(`❌ Error body: ${errorText.substring(0, 200)}`);
          
          results.push({
            url: testUrl,
            status: directResponse.status,
            success: false,
            error: errorText.substring(0, 500)
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Exception for ${testUrl}:`, error.message);
        results.push({
          url: testUrl,
          success: false,
          error: error.message
        });
      }
    }
    
    return response.status(200).json({
      success: true,
      message: 'Archive URL testing complete',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Archive test error:', error.message);
    return response.status(500).json({
      success: false,
      error: 'Archive test failed',
      details: error.message
    });
  }
} 