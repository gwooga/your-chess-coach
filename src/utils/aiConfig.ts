export type AIProvider = 'openai' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  openai: {
    apiKey: string;
    model: string;
  };
  deepseek: {
    apiKey: string;
    model: string;
  };
}

// Default configuration
export const defaultAIConfig: AIConfig = {
  provider: 'deepseek', // Default to DeepSeek
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4o',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: 'deepseek-chat',
  },
};

// Get current AI configuration - Always use DeepSeek for now
export const getAIConfig = (): AIConfig => {
  // Always return DeepSeek configuration
  return {
    ...defaultAIConfig,
    provider: 'deepseek'
  };
};

// Set AI provider - Always use DeepSeek for now
export const setAIProvider = (provider: AIProvider) => {
  // Always use DeepSeek - ignore provider parameter for now
  defaultAIConfig.provider = 'deepseek';
};

// Get current provider - Always returns DeepSeek for now
export const getCurrentProvider = (): AIProvider => {
  return 'deepseek';
};

// Get current provider's API key
export const getCurrentAPIKey = (): string => {
  const config = getAIConfig();
  return config[config.provider].apiKey;
};

// Get current provider's model
export const getCurrentModel = (): string => {
  const config = getAIConfig();
  return config[config.provider].model;
}; 