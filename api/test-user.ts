import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const username = request.query.username as string || 'asxetos58';
  
  try {
    console.log(`🧪 Testing Chess.com user: ${username}`);
    
    // Test 1: Check if user profile exists
    const profileUrl = `https://api.chess.com/pub/player/${username}`;
    const profileResponse = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Chess-Coach-Server/1.0 (chess-coach.xyz)',
      }
    });
    
    console.log(`👤 Profile check: ${profileResponse.status} for ${username}`);
    
    if (!profileResponse.ok) {
      return response.status(200).json({
        username,
        profileExists: false,
        profileStatus: profileResponse.status,
        message: profileResponse.status === 404 ? 'User does not exist' : 'Profile fetch failed'
      });
    }
    
    const profileData = await profileResponse.json();
    
    // Test 2: Check archives
    const archivesUrl = `https://api.chess.com/pub/player/${username}/games/archives`;
    const archivesResponse = await fetch(archivesUrl, {
      headers: {
        'User-Agent': 'Chess-Coach-Server/1.0 (chess-coach.xyz)',
      }
    });
    
    console.log(`📁 Archives check: ${archivesResponse.status} for ${username}`);
    
    let archivesData: any = null;
    if (archivesResponse.ok) {
      archivesData = await archivesResponse.json();
    }
    
    // Test 3: Check specific recent archives
    const testArchives = [
      `https://api.chess.com/pub/player/${username}/games/2025/07/pgn`,
      `https://api.chess.com/pub/player/${username}/games/2025/06/pgn`,
      `https://api.chess.com/pub/player/${username}/games/2025/05/pgn`
    ];
    
    const archiveTests: any[] = [];
    for (const archiveUrl of testArchives) {
      try {
        const archiveResponse = await fetch(archiveUrl, {
          headers: {
            'User-Agent': 'Chess-Coach-Server/1.0 (chess-coach.xyz)',
            'Accept': 'text/plain,application/x-chess-pgn,*/*',
          },
          redirect: 'follow'
        });
        
        console.log(`📅 Archive ${archiveUrl}: ${archiveResponse.status}`);
        
        archiveTests.push({
          url: archiveUrl,
          status: archiveResponse.status,
          exists: archiveResponse.ok,
          contentLength: archiveResponse.ok ? (await archiveResponse.text()).length : 0
        });
      } catch (error: any) {
        archiveTests.push({
          url: archiveUrl,
          status: 'error',
          exists: false,
          error: error.message
        });
      }
    }
    
    return response.status(200).json({
      username,
      profileExists: true,
      profileData: {
        username: profileData.username,
        joined: profileData.joined,
        lastOnline: profileData.last_online,
        status: profileData.status
      },
      archives: {
        status: archivesResponse.status,
        count: archivesData?.archives?.length || 0,
        recent: archivesData?.archives?.slice(-6) || []
      },
      archiveTests,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ User test error:', error.message);
    return response.status(500).json({
      success: false,
      error: 'User test failed',
      details: error.message
    });
  }
} 