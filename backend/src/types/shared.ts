export interface RefinementSession {
  id: string;
  originalPrompt: string;
  refinedPrompt: string;
  status: 'draft' | 'refining' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  llmProvider: string;
  model?: string;
  questions: Question[];
  answers: Answer[];
  expiresAt: Date;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  category: 'clarity' | 'specificity' | 'context' | 'constraints';
  impact: 'high' | 'medium' | 'low';
  explanation?: string;
  options: string[];
  defaultOption: number;
}

export interface Answer {
  id: string;
  questionId: string;
  response: boolean | string;
  timestamp: Date;
}

export interface LLMProvider {
  id: string;
  name: string;
  displayName: string;
  apiKeyName: string;
  baseUrl?: string;
  supportedModels: string[];
  isEnabled: boolean;
  isAvailable?: boolean;
}

export interface GenerationOptions {
  model?: string;
  maxQuestions?: number;
  temperature?: number;
  categories?: string[];
}

export interface RefinementOptions {
  model?: string;
  temperature?: number;
  explainChanges?: boolean;
}

export interface CreateSessionRequest {
  originalPrompt: string;
  llmProvider: string;
  model?: string;
}

export interface CreateSessionResponse {
  session: RefinementSession;
  questions: Question[];
}

export interface AnswerQuestionRequest {
  sessionId: string;
  questionId: string;
  response: boolean | string;
}

export interface RefinePromptRequest {
  sessionId: string;
  answers: Answer[];
  llmProvider: string;
  model?: string;
}

export interface RefinePromptResponse {
  refinedPrompt: string;
  session: RefinementSession;
  explanation?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: ValidationError[];
}

export enum LLMProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
}

export interface ProviderConfig {
  id: string;
  name: string;
  displayName: string;
  apiKeyName: string;
  baseUrl?: string;
  supportedModels: string[];
  isEnabled: boolean;
  defaultModel?: string;
}

export interface QuestionGenerationPrompt {
  system: string;
  user: string;
}

export interface PromptRefinementContext {
  originalPrompt: string;
  questions: Question[];
  answers: Answer[];
  targetAudience?: string;
  desiredLength?: 'short' | 'medium' | 'long';
  outputFormat?: string;
} 