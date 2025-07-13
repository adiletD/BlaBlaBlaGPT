// Import shared types
export * from '../../../shared/types';

// Frontend-specific types
export interface AppState {
  session: RefinementSession | null;
  currentStep: 'input' | 'questions' | 'results';
  selectedProvider: string;
  selectedModel?: string;
  questions: Question[];
  answers: Answer[];
  isLoading: boolean;
  error: string | null;
}

export interface QuestionCardProps {
  question: Question;
  answer?: Answer;
  onAnswer: (response: boolean | string) => void;
  isAnswered: boolean;
  disabled?: boolean;
}

export interface ProviderSelectorProps {
  selectedProvider: string;
  selectedModel?: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (model: string) => void;
  providers: LLMProvider[];
  disabled?: boolean;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export interface PromptComparisonProps {
  originalPrompt: string;
  refinedPrompt: string;
  className?: string;
}

export interface NavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange?: (step: number) => void;
  canNavigate?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface FormData {
  prompt: string;
  provider: string;
  model?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  code?: string;
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
} from '../../../shared/types'; 