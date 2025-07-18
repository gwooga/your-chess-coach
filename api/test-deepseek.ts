import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  console.log('Testing DeepSeek API...');
  console.log('API Key present:', !!process.env.DEEPSEEK_API_KEY);

  if (!process.env.DEEPSEEK_API_KEY) {
    response.status(500).json({ 
      error: 'DeepSeek API key not configured.',
      message: 'Please set DEEPSEEK_API_KEY in your environment variables'
    });
    return;
  }

  try {
    console.log('Making test DeepSeek API call...');
    
    const completion = await generateText({
      model: deepseek('deepseek-chat-67b'),
      messages: [
        { role: 'user', content: 'Say "Hello from DeepSeek!" and nothing else.' }
      ],
      maxTokens: 50,
      temperature: 0.1,
    });

    console.log('DeepSeek API call successful');
    
    response.status(200).json({
      success: true,
      response: completion.text,
      model: 'deepseek-chat-67b'
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