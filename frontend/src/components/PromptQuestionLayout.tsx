import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Copy, Edit3, Save, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRefinementStore } from '../store/refinementStore';
import { apiService } from '../services/api';
import { SingleQuestionView } from './SingleQuestionView';
import { LLMErrorModal } from './LLMErrorModal';

export const PromptQuestionLayout: React.FC = () => {
  const { 
    session, 
    questions, 
    answers, 
    llmError,
    setCurrentStep,
    setSession,
    setAnswers,
    setQuestions,
    setCurrentQuestionIndex,
    setLLMError,
    selectedProvider,
    selectedModel,
    isAutoSubmitting,
    setAutoSubmitting
  } = useRefinementStore();

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(session?.originalPrompt || '');
  const [providers, setProviders] = useState<Array<{ id: string; name: string; isAvailable: boolean }>>([]);

  // Fetch providers on mount
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providerData = await apiService.getProviders();
        setProviders(providerData.map(p => ({ id: p.id, name: p.displayName, isAvailable: p.isAvailable ?? false })));
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };
    fetchProviders();
  }, []);

  const refinePromptMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No session found');
      
      return apiService.refinePrompt({
        sessionId: session.id,
        answers: answers,
        llmProvider: selectedProvider,
        model: selectedModel,
      });
    },
    onSuccess: (data) => {
      // Update session with refined prompt and new questions
      setSession(data.session);
      setQuestions(data.session.questions);
      // Clear previous answers to start fresh with new questions
      setAnswers([]);
      // Reset to first question
      setCurrentQuestionIndex(0);
      // Reset auto-submit state
      setAutoSubmitting(false);
      toast.success('Prompt refined successfully! New questions generated.');
    },
    onError: (error: any) => {
      // Reset auto-submit state on error
      setAutoSubmitting(false);
      const message = error.response?.data?.message || error.message || 'Failed to refine prompt';
      
      // Check if this is an LLM-related error
      const isLLMError = message.includes('API key') || 
                        message.includes('rate limit') || 
                        message.includes('model') ||
                        message.includes('connect to') ||
                        message.includes('provider') ||
                        message.includes('parse questions') ||
                        message.includes('OpenAI') ||
                        message.includes('Anthropic') ||
                        message.includes('Groq');

      if (isLLMError) {
        // Determine error type based on message content
        let errorType: 'api_error' | 'auth_error' | 'rate_limit' | 'model_error' | 'network_error' | 'unknown' = 'unknown';
        if (message.includes('API key') || message.includes('invalid') || message.includes('expired')) {
          errorType = 'auth_error';
        } else if (message.includes('rate limit')) {
          errorType = 'rate_limit';
        } else if (message.includes('model') || message.includes('not available')) {
          errorType = 'model_error';
        } else if (message.includes('connect') || message.includes('network')) {
          errorType = 'network_error';
        } else {
          errorType = 'api_error';
        }

        setLLMError({
          message,
          provider: selectedProvider,
          model: selectedModel,
          type: errorType,
          details: error.response?.data?.details || error.stack,
        });
      } else {
        toast.error(message);
      }
    },
  });



  const handleEditPrompt = () => {
    setIsEditingPrompt(true);
    setEditedPrompt(session?.originalPrompt || '');
  };

  const handleSavePrompt = () => {
    if (session) {
      setSession({ ...session, originalPrompt: editedPrompt });
      setIsEditingPrompt(false);
      toast.success('Prompt updated!');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
    setEditedPrompt(session?.originalPrompt || '');
  };

  const handleCopyPrompt = () => {
    if (session?.originalPrompt) {
      navigator.clipboard.writeText(session.originalPrompt);
      toast.success('Prompt copied to clipboard!');
    }
  };

  const handleLLMErrorRetry = () => {
    setLLMError(null);
    refinePromptMutation.mutate();
  };

  const handleLLMErrorSwitchProvider = () => {
    setLLMError(null);
    toast('Please select a different provider from the settings');
  };

  const handleLLMErrorClose = () => {
    setLLMError(null);
  };

  const handleGenerateRefinedPrompt = () => {
    refinePromptMutation.mutate();
  };

  const handleAutoSubmit = () => {
    refinePromptMutation.mutate();
  };

  const allQuestionsAnswered = questions.every(q => 
    answers.some(a => a.questionId === q.id)
  );

  return (
    <div className="max-w-7xl mx-auto">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side - Prompt Display/Edit */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="section p-8 border-r border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-black">
              Your Prompt
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyPrompt}
                className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                title="Copy prompt"
              >
                <Copy className="h-4 w-4" />
              </button>
              {!isEditingPrompt ? (
                <button
                  onClick={handleEditPrompt}
                  className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                  title="Edit prompt"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex space-x-1">
                  <button
                    onClick={handleSavePrompt}
                    className="p-2 text-green-700 hover:text-green-800 transition-colors rounded-md border border-green-100 bg-green-50 hover:bg-green-100"
                    title="Save changes"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-red-700 hover:text-red-800 transition-colors rounded-md border border-red-100 bg-red-50 hover:bg-red-100"
                    title="Cancel edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEditingPrompt ? (
            <div className="space-y-4">
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                placeholder="Enter your prompt here..."
              />
              <div className="text-sm text-gray-500">
                {editedPrompt.length}/5000 characters
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session?.refinedPrompt && (
                <div className="bg-gray-50 rounded-lg p-6 min-h-[200px] border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-black font-medium">✨ Refined Prompt</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border">Latest</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {session.refinedPrompt}
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg p-6 min-h-[200px] border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-600 font-medium">📝 Original Prompt</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {session?.originalPrompt}
                </p>
              </div>
            </div>
          )}


        </motion.div>

        {/* Right Side - Questions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="section p-8">
            {allQuestionsAnswered && (
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500">
                  ✅ All answered
                </div>
              </div>
            )}
            
            <SingleQuestionView onAutoSubmit={handleAutoSubmit} />
          </div>

          <div className="section p-8 border-t border-gray-100">
            {(isAutoSubmitting || allQuestionsAnswered) && (
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">
                  {isAutoSubmitting 
                    ? "Auto-generating your refined prompt..."
                    : "All questions answered! Ready to generate your refined prompt."
                  }
                </p>
              </div>
            )}
            <button
              onClick={handleGenerateRefinedPrompt}
              disabled={refinePromptMutation.isPending || isAutoSubmitting}
              className="w-full btn btn-primary px-6 py-3 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutoSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Auto-generating...
                </>
              ) : refinePromptMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate Refined Prompt
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* LLM Error Modal */}
      {llmError && (
        <LLMErrorModal
          isOpen={!!llmError}
          onClose={handleLLMErrorClose}
          error={llmError}
          onRetry={handleLLMErrorRetry}
          onSwitchProvider={handleLLMErrorSwitchProvider}
          availableProviders={providers}
        />
      )}
    </div>
  );
}; 