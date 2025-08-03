import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Loader2, Copy, Edit3, Save, X, Download, FileText, Bookmark, Undo, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { useRefinementStore } from '../store/refinementStore';
import { SingleQuestionView } from './SingleQuestionView';
import { LLMErrorModal } from './LLMErrorModal';

export const ChatInterface: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [providers, setProviders] = useState<Array<{ id: string; name: string; isAvailable: boolean }>>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    session,
    questions,
    answers,
    selectedProvider,
    selectedModel,
    llmError,
    answeredCount,
    canRollback,
    promptVersions,
    setSession,
    setQuestions,
    addQuestions,
    setAnswers,
    setCurrentQuestionIndex,
    setLLMError,
    isAutoSubmitting,
    setAutoSubmitting,
    setAutoRefinementCallback,
    setFetchQuestionsCallback,
    savePromptVersion,
    rollbackToPrevious,
    addToRollbackBuffer,
    reset
  } = useRefinementStore();

  const createSessionMutation = useMutation({
    mutationFn: async (promptText: string) => {
      if (!promptText.trim()) {
        throw new Error('Please enter a prompt');
      }
      
      if (!selectedProvider) {
        throw new Error('Please select an LLM provider');
      }

      // Validate provider is available
      const providers = await apiService.getProviders();
      const currentProvider = providers.find(p => p.id === selectedProvider);
      if (!currentProvider || !currentProvider.isAvailable) {
        throw new Error(`Provider '${selectedProvider}' is not available. Please select a different provider.`);
      }

      return apiService.createSession({
        originalPrompt: promptText.trim(),
        llmProvider: selectedProvider,
        model: selectedModel,
      });
    },
    onSuccess: (data) => {
      setSession(data.session);
      setQuestions(data.questions);
      setIsTyping(false);
      toast.success('Questions generated successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create session';
      setIsTyping(false);
      
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

  const generateQuestionsMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No session found');
      
      return apiService.generateQuestions(
        session.refinedPrompt || session.originalPrompt,
        selectedProvider || 'anthropic',
        selectedModel
      );
    },
    onSuccess: (newQuestions) => {
      addQuestions(newQuestions);
      toast.success(`Added ${newQuestions.length} new questions!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to generate new questions';
      console.error('Failed to generate questions:', error);
      toast.error(message);
    },
  });

  const refinePromptMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No session found');
      if (!selectedProvider) throw new Error('No provider selected');
      
      // Add current version to rollback buffer before refining
      const currentPrompt = session.refinedPrompt || session.originalPrompt;
      if (currentPrompt) {
        const currentVersion = {
          id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: currentPrompt,
          timestamp: new Date().toISOString(),
          isManualSave: false,
          versionNumber: 0 // Rollback versions don't need version numbers
        };
        addToRollbackBuffer(currentVersion);
      }
      
      console.log('Refining prompt with:', { 
        sessionId: session.id, 
        answerCount: answers.length,
        provider: selectedProvider,
        model: selectedModel 
      });
      
      return apiService.refinePrompt({
        sessionId: session.id,
        answers: answers,
        llmProvider: selectedProvider,
        model: selectedModel,
      });
    },
    onSuccess: (data) => {
      setSession(data.session);
      setQuestions(data.session.questions);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setAutoSubmitting(false);
      toast.success('Prompt refined successfully! New questions generated.');
    },
    onError: (error: any) => {
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

  // Handle typing with debounce
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    
    if (value.trim().length >= 10) {
      setIsTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout for 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        createSessionMutation.mutate(value);
      }, 2000);
    } else {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Fetch providers on mount
  useEffect(() => {
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

  // Set up auto-refinement callback
  useEffect(() => {
    if (!session || !selectedProvider) {
      setAutoRefinementCallback(null);
      return;
    }
    
    const callback = () => {
      console.log('Auto-refinement triggered');
      if (!refinePromptMutation.isPending) {
        refinePromptMutation.mutate();
      }
    };
    
    setAutoRefinementCallback(callback);
    
    return () => {
      setAutoRefinementCallback(null);
    };
  }, [session?.id, selectedProvider, setAutoRefinementCallback]);

  // Set up fetch questions callback
  useEffect(() => {
    if (!session || !selectedProvider) {
      setFetchQuestionsCallback(null);
      return;
    }
    
    const callback = () => {
      console.log('Fetching new questions triggered');
      if (!generateQuestionsMutation.isPending) {
        generateQuestionsMutation.mutate();
      }
    };
    
    setFetchQuestionsCallback(callback);
    
    return () => {
      setFetchQuestionsCallback(null);
    };
  }, [session?.id, selectedProvider, setFetchQuestionsCallback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    createSessionMutation.mutate(prompt);
  };

  const handleEditPrompt = () => {
    setIsEditingPrompt(true);
    // Edit the latest version (refined or original if no refinement exists)
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt || '';
    setEditedPrompt(latestPrompt);
  };

  const handleSavePrompt = () => {
    if (session) {
      // Save the edited content as the new refined prompt (latest version)
      setSession({ 
        ...session, 
        refinedPrompt: editedPrompt,
        updatedAt: new Date()
      });
      setIsEditingPrompt(false);
      toast.success('Prompt updated!');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
    // Reset to the latest version (what we were editing)
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt || '';
    setEditedPrompt(latestPrompt);
  };

  const handleCopyPrompt = () => {
    // Copy the latest version (refined or original if no refinement exists)
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt;
    if (latestPrompt) {
      navigator.clipboard.writeText(latestPrompt);
      toast.success('Prompt copied to clipboard!');
    }
  };

  const generateFilename = (extension: string) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `prompt_refined_${timestamp}.${extension}`;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt;
    if (latestPrompt) {
      // Format as markdown with heading and content
      const markdownContent = `# Refined Prompt\n\n${latestPrompt}\n\n---\n\n*Generated on ${new Date().toLocaleDateString()} using BlaBlaBlaGPT*`;
      const filename = generateFilename('md');
      downloadFile(markdownContent, filename, 'text/markdown');
      toast.success('Markdown file downloaded!');
    }
  };

  const handleDownloadText = () => {
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt;
    if (latestPrompt) {
      const filename = generateFilename('txt');
      downloadFile(latestPrompt, filename, 'text/plain');
      toast.success('Text file downloaded!');
    }
  };

  const handleSaveVersion = () => {
    const latestPrompt = session?.refinedPrompt || session?.originalPrompt;
    if (latestPrompt && session) {
      const versionNumber = promptVersions.length + 1;
      savePromptVersion(true);
      toast.success(`Prompt saved as v${versionNumber}!`);
    }
  };

  const handleRollback = () => {
    const success = rollbackToPrevious();
    if (success) {
      toast.success('Rolled back to previous version!');
    } else {
      toast.error('No previous version to rollback to');
    }
  };

  const handleStartOver = () => {
    setShowStartOverConfirm(true);
  };

  const handleConfirmStartOver = () => {
    reset(); // Store now preserves provider/model automatically
    setPrompt('');
    setIsEditingPrompt(false);
    setEditedPrompt('');
    setShowStartOverConfirm(false);
    toast.success('Started over! Provider and model settings preserved.');
  };

  const handleCancelStartOver = () => {
    setShowStartOverConfirm(false);
  };

  const handleAutoSubmit = () => {
    refinePromptMutation.mutate();
  };

  const handleLLMErrorRetry = () => {
    setLLMError(null);
    if (session) {
      refinePromptMutation.mutate();
    } else {
      createSessionMutation.mutate(prompt);
    }
  };

  const handleLLMErrorSwitchProvider = () => {
    setLLMError(null);
    // You can navigate to provider selection or show provider selector here
    toast('Please select a different provider from the settings');
  };

  const handleLLMErrorClose = () => {
    setLLMError(null);
  };

  const allQuestionsAnswered = questions.every(q => 
    answers.some(a => a.questionId === q.id)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 h-[calc(100vh-12rem)]">
        {/* Left Side - Prompt Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="section p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 -mt-10">
            <h3 className="text-lg font-semibold text-black">
              Your Prompt
            </h3>
            {refinePromptMutation.isPending && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Auto-refining...</span>
              </div>
            )}
            {session && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyPrompt}
                  className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                  title="Copy prompt"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {!isEditingPrompt ? (
                  <>
                    <button
                      onClick={handleEditPrompt}
                      className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                      title="Edit prompt"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleSaveVersion}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors rounded-md border border-blue-100 bg-blue-50 hover:bg-blue-100"
                      title="Save current version"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRollback}
                      disabled={!canRollback}
                      className={`p-2 transition-colors rounded-md border ${
                        canRollback 
                          ? 'text-orange-600 hover:text-orange-800 border-orange-100 bg-orange-50 hover:bg-orange-100' 
                          : 'text-gray-400 border-gray-100 bg-gray-50 cursor-not-allowed'
                      }`}
                      title={canRollback ? "Rollback to previous version" : "No previous version available"}
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                      title="Download as Markdown"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDownloadText}
                      className="p-2 text-gray-600 hover:text-black transition-colors rounded-md border border-gray-100 bg-white hover:bg-gray-50"
                      title="Download as Text"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors rounded-md border border-red-200 bg-red-50 hover:bg-red-100"
                      title="Start over (reset everything)"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </>
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
            )}
          </div>

          {session && !isEditingPrompt ? (
            <div className="flex-1 space-y-4 overflow-y-auto">
              {refinePromptMutation.isPending && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">
                    🔄 Auto-refining your prompt...
                  </div>
                </div>
              )}
              {session?.refinedPrompt && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-black font-medium text-sm">✨ Refined Prompt</span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border">Latest</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {session.refinedPrompt}
                  </p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-600 font-medium text-sm">📝 Original Prompt</span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {session.originalPrompt}
                </p>
              </div>

              {/* Saved Prompts Section */}
              {promptVersions.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">💾 Saved Prompts</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {promptVersions.map((version) => (
                      <div key={version.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-700 font-medium text-sm">v{version.versionNumber}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(version.timestamp).toLocaleDateString()} {new Date(version.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">
                          {version.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : isEditingPrompt ? (
            <div className="flex-1 flex flex-col space-y-4">
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="flex-1 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                placeholder="Enter your prompt here..."
              />
              <div className="text-sm text-gray-500">
                {editedPrompt.length}/5000 characters
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Type your initial prompt here and watch the questions appear on the right..."
                className="flex-1 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none transition-all duration-200"
                disabled={createSessionMutation.isPending}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {prompt.length}/5000 characters
                </span>
                {prompt.length > 0 && prompt.length < 10 && (
                  <span className="text-sm text-red-600">
                    Minimum 10 characters required
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={createSessionMutation.isPending || !prompt.trim() || prompt.length < 10}
                className="btn btn-primary px-6 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Generate Questions
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* Right Side - Questions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col space-y-6"
        >
          <div className="section pl-2 pr-8 py-8 flex-1 flex flex-col overflow-visible">
            <h3 className="text-lg font-semibold text-black mb-6 -mt-10">
              Refinement Questions
            </h3>
            
            {isTyping || createSessionMutation.isPending ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">
                    {isTyping ? "Generating questions..." : "Processing your prompt..."}
                  </p>
                </div>
              </div>
            ) : questions.length > 0 ? (
              <>
                {allQuestionsAnswered && (
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-500">
                      ✅ All answered
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto">
                  <SingleQuestionView onAutoSubmit={handleAutoSubmit} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-sm">
                    Type a prompt on the left to get started
                  </p>
                </div>
              </div>
            )}
          </div>

          {questions.length > 0 && (
            <div className="section pt-6 border-t border-gray-100">
              {(isAutoSubmitting || allQuestionsAnswered) && (
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-600">
                    {isAutoSubmitting 
                      ? "Auto-generating your refined prompt..."
                      : "All questions answered! Ready to generate your refined prompt."
                    }
                  </p>
                </div>
              )}
              <button
                onClick={() => refinePromptMutation.mutate()}
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
          )}
        </motion.div>
      </div>

      {/* Start Over Confirmation Modal */}
      {showStartOverConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Start Over?</h3>
                <p className="text-sm text-gray-600">This will reset everything</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm mb-3">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Current prompt and all refinements</li>
                <li>• All saved prompt versions</li>
                <li>• Question history and answers</li>
                <li>• Rollback history</li>
              </ul>
              <p className="text-sm text-green-600 mt-3">
                ✓ Your provider and model settings will be preserved.
              </p>
              <p className="text-sm text-red-600 mt-1 font-medium">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelStartOver}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartOver}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

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