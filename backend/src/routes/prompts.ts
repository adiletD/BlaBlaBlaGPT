import { Router, Request, Response } from 'express';
import axios from 'axios';
import { promptRefinementService } from '../services/promptRefinementService';
import { 
  validateCreateSession, 
  validateRefinePrompt, 
  validateSessionId 
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();
import Anthropic from '@anthropic-ai/sdk';



// Create a new refinement session
router.post('/create-session', validateCreateSession, asyncHandler(async (req: Request, res: Response) => {
  const { originalPrompt, llmProvider, model } = req.body;

  const result = await promptRefinementService.createSession({
    originalPrompt,
    llmProvider,
    model,
  });

  const response: ApiResponse = {
    success: true,
    data: result,
    message: 'Session created successfully',
  };

  res.status(201).json(response);
}));

// Get session details
router.get('/session/:sessionId', validateSessionId, asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = await promptRefinementService.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found',
      message: `Session ${sessionId} not found`,
    });
  }

  const response: ApiResponse = {
    success: true,
    data: session,
    message: 'Session retrieved successfully',
  };

  res.json(response);
}));

// Answer a question in a session
router.post('/answer-question', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, questionId, response } = req.body;

  const answer = await promptRefinementService.answerQuestion(sessionId, questionId, response);

  const apiResponse: ApiResponse = {
    success: true,
    data: answer,
    message: 'Question answered successfully',
  };

  res.json(apiResponse);
}));

// Refine the prompt based on answers
router.post('/refine', validateRefinePrompt, asyncHandler(async (req: Request, res: Response) => {
  const result = await promptRefinementService.refinePrompt(req.body);

  const response: ApiResponse = {
    success: true,
    data: result,
    message: 'Prompt refined successfully',
  };

  res.json(response);
}));

// Delete a session
router.delete('/session/:sessionId', validateSessionId, asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  await promptRefinementService.deleteSession(sessionId);

  const response: ApiResponse = {
    success: true,
    message: 'Session deleted successfully',
  };

  res.json(response);
}));

// Get session statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await promptRefinementService.getSessionStats();

  const response: ApiResponse = {
    success: true,
    data: stats,
    message: 'Stats retrieved successfully',
  };

  res.json(response);
}));

// Test API endpoint - Direct API call to test providers
router.post('/test-api', asyncHandler(async (req: Request, res: Response) => {
  const { provider = 'anthropic' } = req.body;
  const model = 'claude-3-5-sonnet-20240620';

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Anthropic API key not configured',
        message: 'The ANTHROPIC_API_KEY environment variable is not set.',
      });
    }

    try {
      console.log('Bypassing Anthropic SDK, making a direct API call with axios.');

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: 'Hello, Claude' }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );

      const msg = response.data;
      console.log('Axios request successful:', msg);

      const apiResponse: ApiResponse = {
        success: true,
        data: {
          provider: 'anthropic',
          model: model,
          response: msg,
          testQuery: "Hello, Claude",
          timestamp: new Date().toISOString()
        },
        message: 'API test successful via Axios',
      };

      res.json(apiResponse);
    } catch (error: any) {
      console.error('API test failed (Axios):', error.response ? error.response.data : error.message);
      
      const response: ApiResponse = {
        success: false,
        error: error.response ? error.response.data : error.message,
        message: `Failed to test ${provider} API via Axios: ${error.message}`,
      };

      res.status(500).json(response);
    }
  } else {
    res.status(400).json({
      success: false,
      error: 'Unsupported provider',
      message: 'Only Anthropic provider is supported for testing at the moment',
    });
  }
}));

export default router; 