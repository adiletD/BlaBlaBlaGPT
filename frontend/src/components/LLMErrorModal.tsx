import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw, Settings, ChevronDown, ChevronRight } from 'lucide-react';

interface LLMErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    message: string;
    provider: string;
    model?: string;
    details?: string;
    type?: 'api_error' | 'auth_error' | 'rate_limit' | 'model_error' | 'network_error' | 'unknown';
  };
  onRetry: () => void;
  onSwitchProvider: () => void;
  availableProviders: Array<{ id: string; name: string; isAvailable: boolean }>;
}

export const LLMErrorModal: React.FC<LLMErrorModalProps> = ({
  isOpen,
  onClose,
  error,
  onRetry,
  onSwitchProvider,
  availableProviders,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'auth_error':
        return '🔐';
      case 'rate_limit':
        return '⏰';
      case 'network_error':
        return '🌐';
      case 'model_error':
        return '🤖';
      default:
        return '⚠️';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'auth_error':
        return 'Authentication Failed';
      case 'rate_limit':
        return 'Rate Limit Exceeded';
      case 'network_error':
        return 'Network Connection Issue';
      case 'model_error':
        return 'Model Unavailable';
      default:
        return 'AI Provider Error';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'auth_error':
        return 'The API key for this provider is invalid or expired. Please check your configuration.';
      case 'rate_limit':
        return 'You have exceeded the rate limit for this provider. Please wait a moment or try a different provider.';
      case 'network_error':
        return 'Unable to connect to the AI provider. Please check your internet connection.';
      case 'model_error':
        return `The selected model "${error.model}" is not available or supported by ${error.provider}.`;
      default:
        return 'An unexpected error occurred while generating questions. This might be a temporary issue.';
    }
  };

  const getRecommendations = () => {
    switch (error.type) {
      case 'auth_error':
        return [
          'Check your API key configuration',
          'Verify the API key has the correct permissions',
          'Try switching to a different provider',
        ];
      case 'rate_limit':
        return [
          'Wait a few minutes before retrying',
          'Consider upgrading your API plan',
          'Switch to a different provider',
        ];
      case 'network_error':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Switch to a different provider',
        ];
      case 'model_error':
        return [
          'Try switching to a different model',
          'Switch to a different provider',
          'Check if the model name is correct',
        ];
      default:
        return [
          'Try again in a few moments',
          'Switch to a different provider',
          'Check your network connection',
        ];
    }
  };

  const availableAlternatives = availableProviders.filter(
    p => p.isAvailable && p.id !== error.provider
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getErrorIcon()}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getErrorTitle()}
                </h3>
                <p className="text-sm text-gray-500">
                  Provider: {error.provider} {error.model && `(${error.model})`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Error Description */}
            <div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {getErrorDescription()}
              </p>
            </div>

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm font-mono">
                {error.message}
              </p>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Recommended Actions:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {getRecommendations().map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Available Alternatives */}
            {availableAlternatives.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Available Alternatives:
                </h4>
                <div className="space-y-1">
                  {availableAlternatives.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center space-x-2 text-sm text-green-700"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{provider.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            {error.details && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {showDetails ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>Technical Details</span>
                </button>
                {showDetails && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {error.details}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {availableAlternatives.length > 0 && (
              <button
                onClick={onSwitchProvider}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Switch Provider</span>
              </button>
            )}
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}; 