import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Settings, Zap, TestTube, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { ChatInterface } from '../components/ChatInterface';
import { ProviderSelector } from '../components/ProviderSelector';
import { useRefinementStore } from '../store/refinementStore';
import { LLMProvider } from '../types';

export const HomePage: React.FC = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);

  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    initializeProvider,
    validateAndUpdateModel,
  } = useRefinementStore();

  const { data: providers = [], isLoading: providersLoading } = useQuery<LLMProvider[]>({
    queryKey: ['providers'],
    queryFn: apiService.getProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: defaultProvider } = useQuery<LLMProvider | null>({
    queryKey: ['default-provider'],
    queryFn: apiService.getDefaultProvider,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize provider when default provider is loaded or providers change
  useEffect(() => {
    if (defaultProvider && providers.length > 0) {
      // Check if default provider is available
      const isDefaultAvailable = providers.some(p => p.id === defaultProvider.id && p.isAvailable);
      
      if (isDefaultAvailable) {
        initializeProvider(defaultProvider.id);
        // Validate and update model selection
        validateAndUpdateModel(defaultProvider.supportedModels);
      } else {
        // Fallback to first available provider
        const firstAvailable = providers.find(p => p.isAvailable);
        if (firstAvailable) {
          initializeProvider(firstAvailable.id);
          validateAndUpdateModel(firstAvailable.supportedModels);
        }
      }
    } else if (providers.length > 0 && !selectedProvider) {
      // Fallback if no default provider configured
      const firstAvailable = providers.find(p => p.isAvailable);
      if (firstAvailable) {
        initializeProvider(firstAvailable.id);
        validateAndUpdateModel(firstAvailable.supportedModels);
      }
    }
  }, [defaultProvider, providers, selectedProvider, initializeProvider, validateAndUpdateModel]);

  // Validate selected provider and model are still available
  useEffect(() => {
    if (selectedProvider && providers.length > 0) {
      const currentProvider = providers.find(p => p.id === selectedProvider);
      if (!currentProvider || !currentProvider.isAvailable) {
        // Provider is no longer available, switch to first available
        const firstAvailable = providers.find(p => p.isAvailable);
        if (firstAvailable) {
          setSelectedProvider(firstAvailable.id);
          validateAndUpdateModel(firstAvailable.supportedModels);
        }
      } else {
        // Provider is available, validate the model
        validateAndUpdateModel(currentProvider.supportedModels);
      }
    }
  }, [providers, selectedProvider, setSelectedProvider, validateAndUpdateModel]);

  const handleTestApi = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    setShowTestResult(false);

    try {
      const result = await apiService.testApi(selectedProvider || 'groq', selectedModel);
      setTestResult(result);
      setShowTestResult(true);
      console.log('Test API Result:', result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message,
        message: 'API test failed',
      });
      setShowTestResult(true);
      console.error('API test error:', error);
    } finally {
      setIsTestingApi(false);
    }
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-3 lg:py-0 lg:h-16 gap-3 lg:gap-0">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">BlaBlaBlaGPT</h1>
            </div>
            
            {/* Provider selector and test button in header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-full sm:w-auto">
                <ProviderSelector
                  providers={providers}
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  onProviderChange={setSelectedProvider}
                  onModelChange={setSelectedModel}
                  disabled={providersLoading}
                />
              </div>
              
              {/* Test API Button */}
              <button
                onClick={handleTestApi}
                disabled={isTestingApi || !selectedProvider}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap w-full sm:w-auto justify-center sm:justify-start"
              >
                {isTestingApi ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test API
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Test Result Modal */}
      {showTestResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  API Test Result
                </h3>
                <button
                  onClick={() => setShowTestResult(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-md ${testResult?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-3 ${testResult?.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className={`text-sm font-medium ${testResult?.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult?.success ? 'Success' : 'Failed'}
                    </p>
                  </div>
                  <p className={`text-sm mt-1 ${testResult?.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult?.message}
                  </p>
                </div>
                
                {testResult?.success && testResult?.data && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Provider: {testResult.data.provider}</h4>
                      <h4 className="text-sm font-medium text-gray-700">Model: {testResult.data.model}</h4>
                      <h4 className="text-sm font-medium text-gray-700">Query: {testResult.data.testQuery}</h4>
                    </div>
                    
                    {testResult.data.response && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                        <div className="bg-gray-50 rounded-md p-3">
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                            {testResult.data.response.content?.[0]?.text || JSON.stringify(testResult.data.response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {testResult?.error && (
                  <div className="bg-red-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-red-700 mb-2">Error:</h4>
                    <p className="text-sm text-red-600">{testResult.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">


        {/* Main content area */}
        <ChatInterface />

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>Transform your prompts into precise, effective instructions</p>
        </footer>
      </main>
    </div>
  );
}; 