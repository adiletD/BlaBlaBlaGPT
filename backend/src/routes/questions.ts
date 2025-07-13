import { Router, Request, Response } from 'express';
import { promptRefinementService } from '../services/promptRefinementService';
import { validateGenerateQuestions } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// Generate questions for a prompt
router.post('/generate', validateGenerateQuestions, asyncHandler(async (req: Request, res: Response) => {
  const { prompt, llmProvider, model, maxQuestions } = req.body;

  const questions = await promptRefinementService.generateQuestions(prompt, llmProvider, model);

  // Limit questions if maxQuestions is specified
  const limitedQuestions = maxQuestions ? questions.slice(0, maxQuestions) : questions;

  const response: ApiResponse = {
    success: true,
    data: {
      questions: limitedQuestions,
      totalGenerated: questions.length,
      prompt,
      llmProvider,
      model,
    },
    message: 'Questions generated successfully',
  };

  res.json(response);
}));

export default router; 