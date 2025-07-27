import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Simple test to verify Chess.com proxy is working
  try {
    console.log('🧪 Testing Chess.com proxy...');
    
    // Test with a simple Chess.com API call (Hikaru's archives)
    const testUrl = 'https://api.chess.com/pub/player/hikaru/games/archives';
    const proxyUrl = `/api/chess-proxy?url=${encodeURIComponent(testUrl)}`;
    
    console.log(`🔄 Testing proxy with: ${testUrl}`);
    
    const testResponse = await fetch(`${request.headers.host?.includes('localhost') ? 'http' : 'https'}://${request.headers.host}${proxyUrl}`);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log(`✅ Proxy test successful! Retrieved ${data.archives?.length || 0} archives`);
      
      return response.status(200).json({
        success: true,
        message: 'Chess.com proxy is working correctly!',
        testUrl,
        archivesCount: data.archives?.length || 0,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`❌ Proxy test failed: ${testResponse.status}`);
      return response.status(500).json({
        success: false,
        error: `Proxy returned ${testResponse.status}`,
        testUrl
      });
    }
    
  } catch (error: any) {
    console.error('❌ Chess.com proxy test error:', error.message);
    return response.status(500).json({
      success: false,
      error: 'Proxy test failed',
      details: error.message
    });
  }
} 