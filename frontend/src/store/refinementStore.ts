import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RefinementSession, Question, Answer } from '../types';

interface RefinementState {
  session: RefinementSession | null;
  currentStep: 'input' | 'questions' | 'results';
  selectedProvider: string;
  selectedModel?: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  isLoading: boolean;
  error: string | null;
  llmError: {
    message: string;
    provider: string;
    model?: string;
    details?: string;
    type?: 'api_error' | 'auth_error' | 'rate_limit' | 'model_error' | 'network_error' | 'unknown';
  } | null;
  isAutoSubmitting: boolean;
  answeredCount: number;
  autoRefinementCallback: (() => void) | null;
}

interface RefinementActions {
  setSession: (session: RefinementSession | null) => void;
  setCurrentStep: (step: 'input' | 'questions' | 'results') => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model?: string) => void;
  setQuestions: (questions: Question[]) => void;
  setAnswers: (answers: Answer[]) => void;
  addAnswer: (answer: Answer) => void;
  updateAnswer: (questionId: string, response: boolean | string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLLMError: (error: RefinementState['llmError']) => void;
  setAutoSubmitting: (autoSubmitting: boolean) => void;
  setAutoRefinementCallback: (callback: (() => void) | null) => void;
  reset: () => void;
  initializeProvider: (defaultProvider: string) => void;
  validateAndUpdateModel: (availableModels: string[]) => void;
}

const initialState: RefinementState = {
  session: null,
  currentStep: 'input',
  selectedProvider: '',
  selectedModel: undefined,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  isLoading: false,
  error: null,
  llmError: null,
  isAutoSubmitting: false,
  answeredCount: 0,
  autoRefinementCallback: null,
};

export const useRefinementStore = create<RefinementState & RefinementActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSession: (session) => set({ session }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setQuestions: (questions) => set({ questions, answeredCount: 0 }),
      setAnswers: (answers) => set({ answers, answeredCount: 0 }),
      addAnswer: (answer) =>
        set((state) => ({
          answers: [...state.answers.filter((a) => a.questionId !== answer.questionId), answer],
        })),
      updateAnswer: (questionId, response) => {
        const { answers, autoRefinementCallback } = get();
        const existingAnswer = answers.find((a) => a.questionId === questionId);
        const isNewAnswer = !existingAnswer;
        
        const newAnswer: Answer = {
          id: existingAnswer?.id || `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          questionId,
          response,
          timestamp: new Date(),
        };
        
        const newAnswers = [...answers.filter((a) => a.questionId !== questionId), newAnswer];
        const newAnsweredCount = isNewAnswer ? get().answeredCount + 1 : get().answeredCount;
        
        set((state) => ({
          answers: newAnswers,
          answeredCount: newAnsweredCount,
        }));
        
        // Trigger auto-refinement every 5th answer
        if (isNewAnswer && newAnsweredCount > 0 && newAnsweredCount % 5 === 0 && autoRefinementCallback) {
          console.log(`Auto-refining after ${newAnsweredCount} answers`);
          setTimeout(() => {
            autoRefinementCallback();
          }, 1000); // Small delay for better UX
        }
      },
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setLLMError: (llmError) => set({ llmError }),
      setAutoSubmitting: (autoSubmitting) => set({ isAutoSubmitting: autoSubmitting }),
      setAutoRefinementCallback: (callback) => set({ autoRefinementCallback: callback }),
      reset: () => set({ ...initialState }),
      initializeProvider: (defaultProvider) => {
        const { selectedProvider } = get();
        if (!selectedProvider) {
          set({ selectedProvider: defaultProvider });
        }
      },
      validateAndUpdateModel: (availableModels) => {
        const { selectedModel } = get();
        
        // If no model selected or current model is not available, select the first available model
        if (!selectedModel || !availableModels.includes(selectedModel)) {
          const newModel = availableModels.length > 0 ? availableModels[0] : undefined;
          if (newModel !== selectedModel) {
            console.log(`Updating model from ${selectedModel} to ${newModel}`);
            set({ selectedModel: newModel });
          }
        }
      },
    }),
    {
      name: 'refinement-store',
      version: 1, // Add version to force cache invalidation when needed
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
        selectedModel: state.selectedModel,
      }),
    }
  )
); 