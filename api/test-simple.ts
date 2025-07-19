import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  console.log('Testing simple DeepSeek API call...');
  console.log('API Key present:', !!process.env.DEEPSEEK_API_KEY);

  if (!process.env.DEEPSEEK_API_KEY) {
    response.status(500).json({ 
      error: 'DeepSeek API key not configured.',
      message: 'Please set DEEPSEEK_API_KEY in your environment variables'
    });
    return;
  }

  try {
    console.log('Making direct DeepSeek API call...');
    
    const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from DeepSeek!" and nothing else.' }
        ],
        max_tokens: 50,
        temperature: 0.1,
        stream: false
      })
    });

    console.log('API Response status:', apiResponse.status);
    
    const data = await apiResponse.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
    
    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status} - ${JSON.stringify(data)}`);
    }

    console.log('DeepSeek API call successful');
    
    response.status(200).json({
      success: true,
      response: data.choices?.[0]?.message?.content || 'No response content',
      model: 'deepseek-chat',
      status: apiResponse.status,
      headers: Object.fromEntries(apiResponse.headers.entries())
    });
  } catch (error: any) {
    console.error('DeepSeek API test failed:', error);
    
    response.status(500).json({
      error: 'DeepSeek API test failed',
      details: error.message || error,
      message: 'Check your API key and try again'
    });
  }
} 