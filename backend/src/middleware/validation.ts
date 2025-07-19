import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

// Validation schemas
export const createSessionSchema = z.object({
  originalPrompt: z.string()
    .min(10, 'Prompt must be at least 10 characters long')
    .max(5000, 'Prompt must not exceed 5000 characters'),
  llmProvider: z.string()
    .min(1, 'LLM provider is required'),
  model: z.string().optional(),
});

export const answerQuestionSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  questionId: z.string()
    .min(1, 'Question ID is required'),
  response: z.boolean(),
});

export const refinePromptSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
  answers: z.array(z.object({
    id: z.string(),
    questionId: z.string(),
    response: z.union([z.boolean(), z.string()]),
    timestamp: z.string().or(z.date()),
  })),
  llmProvider: z.string()
    .min(1, 'LLM provider is required'),
  model: z.string().optional(),
});

export const generateQuestionsSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters long')
    .max(5000, 'Prompt must not exceed 5000 characters'),
  llmProvider: z.string()
    .min(1, 'LLM provider is required'),
  model: z.string().optional(),
  maxQuestions: z.number()
    .min(1)
    .max(15)
    .optional(),
});

export const sessionIdSchema = z.object({
  sessionId: z.string()
    .uuid('Invalid session ID format'),
});

export const validateApiKeySchema = z.object({
  providerId: z.string()
    .min(1, 'Provider ID is required'),
  apiKey: z.string()
    .min(1, 'API key is required'),
});

// Generic validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, params, and query
      const data = {
        ...req.body,
        ...req.params,
        ...req.query,
      };

      const validatedData = schema.parse(data);
      
      // Replace request data with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR'
        );
      }
      
      next(error);
    }
  };
};

// Specific validation middleware
export const validateCreateSession = validate(createSessionSchema);
export const validateAnswerQuestion = validate(answerQuestionSchema);
export const validateRefinePrompt = validate(refinePromptSchema);
export const validateGenerateQuestions = validate(generateQuestionsSchema);
export const validateSessionId = validate(sessionIdSchema);
export const validateApiKey = validate(validateApiKeySchema);

// Custom validation for specific needs
export const validatePromptLength = (req: Request, res: Response, next: NextFunction) => {
  const { originalPrompt, prompt } = req.body;
  const promptText = originalPrompt || prompt;
  
  if (!promptText) {
    throw new AppError('Prompt is required', 400, 'MISSING_PROMPT');
  }

  if (typeof promptText !== 'string') {
    throw new AppError('Prompt must be a string', 400, 'INVALID_PROMPT_TYPE');
  }

  if (promptText.length < 10) {
    throw new AppError('Prompt must be at least 10 characters long', 400, 'PROMPT_TOO_SHORT');
  }

  if (promptText.length > 5000) {
    throw new AppError('Prompt must not exceed 5000 characters', 400, 'PROMPT_TOO_LONG');
  }

  next();
};

export const validateProvider = (req: Request, res: Response, next: NextFunction) => {
  const { llmProvider } = req.body;
  
  if (!llmProvider) {
    throw new AppError('LLM provider is required', 400, 'MISSING_PROVIDER');
  }

  const validProviders = ['openai', 'anthropic', 'google', 'ollama'];
  if (!validProviders.includes(llmProvider)) {
    throw new AppError(
      `Invalid LLM provider. Must be one of: ${validProviders.join(', ')}`,
      400,
      'INVALID_PROVIDER'
    );
  }

  next();
}; 