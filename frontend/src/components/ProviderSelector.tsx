import React from 'react';
import { ChevronDown, Bot, Zap } from 'lucide-react';
import { LLMProvider } from '../types';

interface ProviderSelectorProps {
  providers: LLMProvider[];
  selectedProvider: string;
  selectedModel?: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
}) => {
  const currentProvider = providers.find(p => p.id === selectedProvider);
  const availableModels = currentProvider?.supportedModels || [];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const providerId = e.target.value;
    
    // Validate provider is available
    const provider = providers.find(p => p.id === providerId);
    if (!provider) {
      console.error(`Provider '${providerId}' not found`);
      return;
    }
    
    if (!provider.isAvailable) {
      console.error(`Provider '${providerId}' is not available`);
      return;
    }
    
    onProviderChange(providerId);
    
    // Auto-select first available model for the provider
    if (provider.supportedModels.length > 0) {
      onModelChange(provider.supportedModels[0]);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(e.target.value);
  };

  if (providers.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <Bot className="h-4 w-4" />
        <span>No providers available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
      <div className="flex items-center space-x-2">
        <Zap className="h-4 w-4 text-primary-600" />
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Provider:</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative w-full sm:w-auto min-w-[120px]">
          <select
            value={selectedProvider}
            onChange={handleProviderChange}
            disabled={disabled}
            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <option value="">Select provider...</option>
            {providers
              .filter(provider => provider.isAvailable)
              .map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.displayName}
                </option>
              ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Model selector */}
        {currentProvider && availableModels.length > 0 && (
          <div className="relative w-full sm:w-auto min-w-[160px]">
            <select
              value={selectedModel || ''}
              onChange={handleModelChange}
              disabled={disabled}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              <option value="">Select model...</option>
              {availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Provider status indicator */}
      {currentProvider && (
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${currentProvider.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500 hidden sm:inline">
            {currentProvider.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      )}
      
      {/* Show warning if no provider selected */}
      {!selectedProvider && (
        <div className="flex items-center space-x-1 text-amber-600">
          <span className="text-xs">No provider selected</span>
        </div>
      )}
    </div>
  );
}; 