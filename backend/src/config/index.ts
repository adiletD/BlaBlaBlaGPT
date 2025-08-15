import dotenv from 'dotenv';
import { Config, LLMProviderType, ProviderConfig } from '../types';

// Load environment variables
dotenv.config();

const config: Config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24', 10),
  maxQuestionsPerSession: parseInt(process.env.MAX_QUESTIONS_PER_SESSION || '10', 10),
  defaultLLMProvider: process.env.DEFAULT_LLM_PROVIDER || 'anthropic',
  defaultModel: process.env.DEFAULT_MODEL || 'claude-3-5-sonnet-20240620',
  llmProviders: {
    openai: process.env.OPENAI_API_KEY ? {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    } : undefined,
    anthropic: process.env.ANTHROPIC_API_KEY ? {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
    } : undefined,
    google: process.env.GOOGLE_API_KEY ? {
      apiKey: process.env.GOOGLE_API_KEY,
      baseUrl: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    } : undefined,
    ollama: process.env.OLLAMA_BASE_URL ? {
      baseUrl: process.env.OLLAMA_BASE_URL,
    } : undefined,
    groq: process.env.GROQ_API_KEY ? {
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    } : undefined,
  },
};

export const PROVIDER_CONFIGS: Record<LLMProviderType, ProviderConfig> = {
  [LLMProviderType.OPENAI]: {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    apiKeyName: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    supportedModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    isEnabled: true,
    defaultModel: 'gpt-4',
  },
  [LLMProviderType.ANTHROPIC]: {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    apiKeyName: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    supportedModels: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229'
    ],
    isEnabled: true,
    defaultModel: 'claude-3-5-sonnet-20240620',
  },
  [LLMProviderType.GOOGLE]: {
    id: 'google',
    name: 'google',
    displayName: 'Google AI',
    apiKeyName: 'GOOGLE_API_KEY',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    supportedModels: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    isEnabled: true,
    defaultModel: 'gemini-1.5-pro',
  },
  [LLMProviderType.OLLAMA]: {
    id: 'ollama',
    name: 'ollama',
    displayName: 'Ollama (Local)',
    apiKeyName: 'OLLAMA_BASE_URL',
    baseUrl: 'http://localhost:11434',
    supportedModels: ['llama2', 'codellama', 'mistral', 'llama3', 'gemma'],
    isEnabled: true,
    defaultModel: 'llama3',
  },
  [LLMProviderType.GROQ]: {
    id: 'groq',
    name: 'groq',
    displayName: 'Groq',
    apiKeyName: 'GROQ_API_KEY',
    baseUrl: 'https://api.groq.com/openai/v1',
    supportedModels: [
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'moonshotai/kimi-k2-instruct',
      'gemma2-9b-it',
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
    ],
    isEnabled: true,
    defaultModel: 'llama-3.3-70b-versatile',
  },
};

export default config; 