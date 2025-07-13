// Re-export shared types
export * from './shared';

// Backend-specific types
export interface ILLMProvider {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly supportedModels: string[];

  validateApiKey(apiKey: string): Promise<boolean>;
  generateQuestions(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Question[]>;
  refinePrompt(
    originalPrompt: string,
    questions: Question[],
    answers: Answer[],
    options?: RefinementOptions
  ): Promise<string>;
}

export interface SessionStorage {
  createSession(session: RefinementSession): Promise<void>;
  getSession(sessionId: string): Promise<RefinementSession | null>;
  updateSession(sessionId: string, updates: Partial<RefinementSession>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
}

export interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  sessionSecret: string;
  sessionTimeoutHours: number;
  maxQuestionsPerSession: number;
  defaultLLMProvider: string;
  defaultModel: string;
  llmProviders: {
    openai?: {
      apiKey: string;
      baseUrl?: string;
    };
    anthropic?: {
      apiKey: string;
      baseUrl?: string;
    };
    google?: {
      apiKey: string;
      baseUrl?: string;
    };
    ollama?: {
      baseUrl: string;
    };
  };
}

export interface LoggerConfig {
  level: string;
  format: string;
  transports: string[];
}

// Import shared types for convenience
import {
  RefinementSession,
  Question,
  Answer,
  LLMProvider,
  GenerationOptions,
  RefinementOptions,
  CreateSessionRequest,
  CreateSessionResponse,
  AnswerQuestionRequest,
  RefinePromptRequest,
  RefinePromptResponse,
  ApiResponse,
  ErrorResponse,
  LLMProviderType,
  ProviderConfig,
} from './shared'; 