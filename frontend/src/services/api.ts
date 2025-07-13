import axios from 'axios';
import {
  ApiResponse,
  ErrorResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  RefinePromptRequest,
  RefinePromptResponse,
  LLMProvider,
  RefinementSession,
  Question,
  Answer,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error handler for better debugging
const handleApiError = (error: any) => {
  const response = error.response;
  const request = error.request;
  
  if (response) {
    // Server responded with an error status
    const status = response.status;
    const errorData = response.data;
    
    console.error('API Error Response:', {
      status,
      statusText: response.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: errorData,
      headers: response.headers,
    });
    
    // Create a more informative error message
    let message = 'An unexpected error occurred';
    
    if (errorData?.message) {
      message = errorData.message;
    } else if (errorData?.error) {
      message = errorData.error;
    } else {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Authentication failed. Please check your API key.';
          break;
        case 403:
          message = 'Access denied. Please check your permissions.';
          break;
        case 404:
          message = 'Resource not found. The requested service may be unavailable.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        case 503:
          message = 'Service unavailable. Please try again later.';
          break;
        default:
          message = `Server error (${status}). Please try again later.`;
      }
    }
    
    // Add provider-specific context if available
    if (error.config?.url?.includes('/prompts/create-session') && status === 404) {
      message = 'The selected AI provider is currently unavailable. Please try a different provider or check your API key configuration.';
    }
    
    const enhancedError = new Error(message);
    (enhancedError as any).response = response;
    (enhancedError as any).status = status;
    (enhancedError as any).originalError = error;
    
    return Promise.reject(enhancedError);
  } else if (request) {
    // Network error
    console.error('Network Error:', {
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
    });
    
    const networkError = new Error('Network error. Please check your internet connection and try again.');
    (networkError as any).originalError = error;
    return Promise.reject(networkError);
  } else {
    // Request setup error
    console.error('Request Setup Error:', error.message);
    return Promise.reject(error);
  }
};

// Request interceptor with enhanced logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data ? 'Data present' : 'No data',
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`, {
      dataType: typeof response.data,
      hasData: !!response.data,
    });
    return response;
  },
  handleApiError
);

export const apiService = {
  // Provider endpoints
  async getProviders(): Promise<LLMProvider[]> {
    try {
      const response = await api.get<ApiResponse<LLMProvider[]>>('/providers');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch providers:', error);
      throw new Error(error.message || 'Failed to fetch available providers');
    }
  },

  async getProviderConfigs(): Promise<LLMProvider[]> {
    const response = await api.get<ApiResponse<LLMProvider[]>>('/providers/configs');
    return response.data.data || [];
  },

  async getDefaultProvider(): Promise<LLMProvider | null> {
    try {
      const response = await api.get<ApiResponse<LLMProvider>>('/providers/default');
      return response.data.data || null;
    } catch (error: any) {
      console.error('Failed to fetch default provider:', error);
      return null; // Don't throw here, just return null
    }
  },

  async validateApiKey(providerId: string, apiKey: string): Promise<boolean> {
    try {
      const response = await api.post<ApiResponse<{ isValid: boolean }>>('/providers/validate-key', {
        providerId,
        apiKey,
      });
      return response.data.data?.isValid || false;
    } catch (error: any) {
      console.error('API key validation failed:', error);
      return false; // Return false instead of throwing
    }
  },

  // Session endpoints
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    try {
      const response = await api.post<ApiResponse<CreateSessionResponse>>('/prompts/create-session', request);
      if (!response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create session:', error);
      
      // Enhance error message for specific provider issues
      if (error.status === 404) {
        throw new Error(`The ${request.llmProvider} provider is currently unavailable. This might be due to incorrect API configuration or the model "${request.model || 'default'}" not being available. Please try a different provider or check your API key.`);
      }
      
      throw new Error(error.message || 'Failed to create session');
    }
  },

  async getSession(sessionId: string): Promise<RefinementSession> {
    try {
      const response = await api.get<ApiResponse<RefinementSession>>(`/prompts/session/${sessionId}`);
      if (!response.data.data) {
        throw new Error('Session not found');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch session:', error);
      throw new Error(error.message || 'Failed to fetch session');
    }
  },

  async answerQuestion(sessionId: string, questionId: string, response: boolean | string): Promise<Answer> {
    try {
      const apiResponse = await api.post<ApiResponse<Answer>>('/prompts/answer-question', {
        sessionId,
        questionId,
        response,
      });
      if (!apiResponse.data.data) {
        throw new Error('Invalid response format from server');
      }
      return apiResponse.data.data;
    } catch (error: any) {
      console.error('Failed to answer question:', error);
      throw new Error(error.message || 'Failed to answer question');
    }
  },

  async refinePrompt(request: RefinePromptRequest): Promise<RefinePromptResponse> {
    try {
      const response = await api.post<ApiResponse<RefinePromptResponse>>('/prompts/refine', request);
      if (!response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to refine prompt:', error);
      
      // Enhance error message for specific provider issues
      if (error.status === 404) {
        throw new Error(`The ${request.llmProvider} provider is currently unavailable. This might be due to API configuration issues or the model "${request.model || 'default'}" not being available. Please try a different provider.`);
      }
      
      throw new Error(error.message || 'Failed to refine prompt');
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/prompts/session/${sessionId}`);
  },

  // Question endpoints
  async generateQuestions(prompt: string, llmProvider: string, model?: string): Promise<Question[]> {
    try {
      const response = await api.post<ApiResponse<{ questions: Question[] }>>('/questions/generate', {
        prompt,
        llmProvider,
        model,
      });
      return response.data.data?.questions || [];
    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      
      // Enhance error message for specific provider issues
      if (error.status === 404) {
        throw new Error(`The ${llmProvider} provider is currently unavailable. This might be due to API configuration issues or the model "${model || 'default'}" not being available. Please try a different provider.`);
      }
      
      throw new Error(error.message || 'Failed to generate questions');
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Test API endpoint - Direct API call to test providers
  async testApi(provider: string = 'anthropic', model: string = 'claude-3-5-sonnet-20240620'): Promise<any> {
    try {
      console.log(`Testing API with provider: ${provider}, model: ${model}`);
      const response = await api.post<ApiResponse<any>>('/prompts/test-api', {
        provider,
        model,
      });
      return response.data;
    } catch (error: any) {
      console.error('API test failed:', error);
      throw new Error(error.message || 'API test failed');
    }
  },
};

export default apiService; 