import OpenAI from 'openai';
import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { getCurrentProvider, getCurrentAPIKey, getCurrentModel, AIProvider } from '@/utils/aiConfig';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = getCurrentAPIKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// Initialize DeepSeek client
const getDeepSeekClient = () => {
  const apiKey = getCurrentAPIKey();
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }
  return deepseek;
};

// Convert messages to OpenAI format
const convertToOpenAIMessages = (messages: AIMessage[]) => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
};

// Convert messages to DeepSeek format
const convertToDeepSeekMessages = (messages: AIMessage[]) => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
};

// Make OpenAI API call
const callOpenAI = async (request: AICompletionRequest): Promise<AICompletionResponse> => {
  const client = getOpenAIClient();
  const model = getCurrentModel();
  
  const completion = await client.chat.completions.create({
    model,
    messages: convertToOpenAIMessages(request.messages),
    max_tokens: request.maxTokens || 3000,
    temperature: request.temperature || 0.7,
  });

  const content = completion.choices[0]?.message?.content || 'No response from AI.';
  
  return {
    content,
    provider: 'openai',
    model,
  };
};

// Make DeepSeek API call
const callDeepSeek = async (request: AICompletionRequest): Promise<AICompletionResponse> => {
  const model = getCurrentModel();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DeepSeek API key not found in environment variables');
  }
  
  console.log('Making DeepSeek API call with model:', model);
  
  try {
    const completion = await generateText({
      model: deepseek(model),
      messages: convertToDeepSeekMessages(request.messages),
      maxTokens: request.maxTokens || 3000,
      temperature: request.temperature || 0.7,
    });

    const content = completion.text || 'No response from AI.';
    
    return {
      content,
      provider: 'deepseek',
      model,
    };
  } catch (error) {
    console.error('DeepSeek API call failed:', error);
    throw error;
  }
};

// Main function to make AI API calls
export const makeAICompletion = async (request: AICompletionRequest): Promise<AICompletionResponse> => {
  const provider = getCurrentProvider();
  
  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(request);
      case 'deepseek':
        return await callDeepSeek(request);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    throw error;
  }
};

// Helper function to create a simple completion
export const createCompletion = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number,
  temperature?: number
): Promise<AICompletionResponse> => {
  return makeAICompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens,
    temperature,
  });
}; 