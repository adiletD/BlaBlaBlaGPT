import { Router, Request, Response } from 'express';
import { llmProviderFactory } from '../providers';
import { validateApiKey } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// Get all available providers
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const providers = llmProviderFactory.getAvailableProviders();

  const response: ApiResponse = {
    success: true,
    data: providers,
    message: 'Providers retrieved successfully',
  };

  res.json(response);
}));

// Get all provider configurations (including unavailable ones)
router.get('/configs', asyncHandler(async (req: Request, res: Response) => {
  const configs = llmProviderFactory.getAllProviderConfigs();

  const response: ApiResponse = {
    success: true,
    data: configs,
    message: 'Provider configurations retrieved successfully',
  };

  res.json(response);
}));

// Get default provider configuration
router.get('/default', asyncHandler(async (req: Request, res: Response) => {
  const defaultProvider = llmProviderFactory.getDefaultProvider();
  
  if (!defaultProvider) {
    return res.status(404).json({
      success: false,
      error: 'No default provider available',
      message: 'No providers are configured or available',
    });
  }

  const response: ApiResponse = {
    success: true,
    data: {
      id: defaultProvider.id,
      name: defaultProvider.name,
      displayName: defaultProvider.displayName,
      supportedModels: defaultProvider.supportedModels,
      defaultModel: defaultProvider.supportedModels[0],
      isAvailable: true,
    },
    message: 'Default provider retrieved successfully',
  };

  res.json(response);
}));

// Get specific provider details
router.get('/:providerId', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;

  const provider = llmProviderFactory.getProvider(providerId);
  
  if (!provider) {
    return res.status(404).json({
      success: false,
      error: 'Provider not found',
      message: `Provider ${providerId} not found or not available`,
    });
  }

  const response: ApiResponse = {
    success: true,
    data: {
      id: provider.id,
      name: provider.name,
      displayName: provider.displayName,
      supportedModels: provider.supportedModels,
      isAvailable: true,
    },
    message: 'Provider details retrieved successfully',
  };

  res.json(response);
}));

// Validate API key for a provider
router.post('/validate-key', validateApiKey, asyncHandler(async (req: Request, res: Response) => {
  const { providerId, apiKey } = req.body;

  const isValid = await llmProviderFactory.validateProviderApiKey(providerId, apiKey);

  const response: ApiResponse = {
    success: true,
    data: {
      providerId,
      isValid,
    },
    message: isValid ? 'API key is valid' : 'API key is invalid',
  };

  res.json(response);
}));

// Get provider status
router.get('/:providerId/status', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;

  const isAvailable = llmProviderFactory.hasProvider(providerId);
  
  const response: ApiResponse = {
    success: true,
    data: {
      providerId,
      isAvailable,
    },
    message: 'Provider status retrieved successfully',
  };

  res.json(response);
}));

// Get supported models for a provider
router.get('/:providerId/models', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;

  const provider = llmProviderFactory.getProvider(providerId);
  
  if (!provider) {
    return res.status(404).json({
      success: false,
      error: 'Provider not found',
      message: `Provider ${providerId} not found or not available`,
    });
  }

  const response: ApiResponse = {
    success: true,
    data: {
      providerId,
      models: provider.supportedModels,
    },
    message: 'Supported models retrieved successfully',
  };

  res.json(response);
}));

export default router; 