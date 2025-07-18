import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

const TEST_MODELS = [
  'deepseek-chat',
  'deepseek-chat-67b',
  'deepseek-chat-33b',
  'deepseek-coder',
  'deepseek-coder-67b',
  'deepseek-coder-33b',
  'deepseek-coder-6.7b'
];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  console.log('Testing DeepSeek models...');
  console.log('API Key present:', !!process.env.DEEPSEEK_API_KEY);

  if (!process.env.DEEPSEEK_API_KEY) {
    response.status(500).json({ 
      error: 'DeepSeek API key not configured.',
      message: 'Please set DEEPSEEK_API_KEY in your environment variables'
    });
    return;
  }

  const results: any[] = [];

  for (const modelName of TEST_MODELS) {
    try {
      console.log(`Testing model: ${modelName}`);
      
      const completion = await generateText({
        model: deepseek(modelName),
        messages: [
          { role: 'user', content: 'Say "Hello!"' }
        ],
        maxTokens: 10,
        temperature: 0.1,
      });

      results.push({
        model: modelName,
        status: 'success',
        response: completion.text
      });
      
      console.log(`✅ Model ${modelName} works!`);
      
    } catch (error: any) {
      results.push({
        model: modelName,
        status: 'error',
        error: error.message || error
      });
      
      console.log(`❌ Model ${modelName} failed:`, error.message);
    }
  }

  const workingModels = results.filter(r => r.status === 'success');
  
  response.status(200).json({
    summary: {
      total_tested: TEST_MODELS.length,
      working_models: workingModels.length,
      failed_models: results.length - workingModels.length
    },
    working_models: workingModels,
    failed_models: results.filter(r => r.status === 'error'),
    all_results: results
  });
} 