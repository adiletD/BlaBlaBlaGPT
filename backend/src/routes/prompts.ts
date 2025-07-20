import { Router, Request, Response } from 'express';
import axios from 'axios';
import OpenAI from 'openai';
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
  const { provider = 'anthropic', model } = req.body;

  console.log(`Testing API with provider: ${provider}, model: ${model || 'default'}`);

  try {
    if (provider === 'anthropic') {
      await testAnthropicAPI(res, model);
    } else if (provider === 'groq') {
      await testGroqAPI(res, model);
    } else if (provider === 'openai') {
      await testOpenAIAPI(res, model);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported provider',
        message: `Provider '${provider}' is not supported. Supported providers: anthropic, groq, openai`,
        supportedProviders: ['anthropic', 'groq', 'openai']
      });
    }
  } catch (error: any) {
    console.error(`API test failed for ${provider}:`, error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'API test failed',
      message: `Failed to test ${provider} API: ${error.message}`,
      provider,
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper function to test Anthropic API
async function testAnthropicAPI(res: Response, model?: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const defaultModel = 'claude-3-5-sonnet-20240620';
  const testModel = model || defaultModel;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Anthropic API key not configured',
      message: 'The ANTHROPIC_API_KEY environment variable is not set.',
    });
  }

  console.log(`Testing Anthropic API with model: ${testModel}`);

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: testModel,
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hello! Please respond with a brief greeting.' }],
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
  console.log('Anthropic API test successful');

  const apiResponse: ApiResponse = {
    success: true,
    data: {
      provider: 'anthropic',
      model: testModel,
      response: msg,
      testQuery: "Hello! Please respond with a brief greeting.",
      timestamp: new Date().toISOString(),
      responseText: msg.content?.[0]?.text || 'No text content received'
    },
    message: 'Anthropic API test successful',
  };

  res.json(apiResponse);
}

// Helper function to test Groq API
async function testGroqAPI(res: Response, model?: string) {
  const apiKey = process.env.GROQ_API_KEY;
  const defaultModel = 'llama-3.3-70b-versatile';
  const testModel = model || defaultModel;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'Groq API key not configured',
      message: 'The GROQ_API_KEY environment variable is not set.',
    });
  }

  console.log(`Testing Groq API with model: ${testModel}`);

  // Test using OpenAI-compatible client (recommended way)
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const response = await client.chat.completions.create({
    model: testModel,
    messages: [
      {
        role: 'user',
        content: 'Hello! Please respond with a brief greeting.',
      },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  console.log('Groq API test successful');

  const apiResponse: ApiResponse = {
    success: true,
    data: {
      provider: 'groq',
      model: testModel,
      response: response,
      testQuery: "Hello! Please respond with a brief greeting.",
      timestamp: new Date().toISOString(),
      responseText: response.choices[0]?.message?.content || 'No content received',
      usage: response.usage
    },
    message: 'Groq API test successful',
  };

  res.json(apiResponse);
}

// Helper function to test OpenAI API
async function testOpenAIAPI(res: Response, model?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const defaultModel = 'gpt-4';
  const testModel = model || defaultModel;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured',
      message: 'The OPENAI_API_KEY environment variable is not set.',
    });
  }

  console.log(`Testing OpenAI API with model: ${testModel}`);

  const client = new OpenAI({
    apiKey: apiKey,
  });

  const response = await client.chat.completions.create({
    model: testModel,
    messages: [
      {
        role: 'user',
        content: 'Hello! Please respond with a brief greeting.',
      },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  console.log('OpenAI API test successful');

  const apiResponse: ApiResponse = {
    success: true,
    data: {
      provider: 'openai',
      model: testModel,
      response: response,
      testQuery: "Hello! Please respond with a brief greeting.",
      timestamp: new Date().toISOString(),
      responseText: response.choices[0]?.message?.content || 'No content received',
      usage: response.usage
    },
    message: 'OpenAI API test successful',
  };

  res.json(apiResponse);
}

export default router; 