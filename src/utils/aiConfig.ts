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
    model: 'deepseek-chat-67b',
  },
};

// Get current AI configuration
export const getAIConfig = (): AIConfig => {
  // You can extend this to read from localStorage, environment variables, or user preferences
  return defaultAIConfig;
};

// Set AI provider
export const setAIProvider = (provider: AIProvider) => {
  // In a real app, you might want to save this to localStorage or a database
  defaultAIConfig.provider = provider;
};

// Get current provider
export const getCurrentProvider = (): AIProvider => {
  return getAIConfig().provider;
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