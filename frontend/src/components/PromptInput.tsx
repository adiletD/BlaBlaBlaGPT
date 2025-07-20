import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import { useRefinementStore } from '../store/refinementStore';

export const PromptInput: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const { 
    selectedProvider, 
    selectedModel, 
    setSession, 
    setCurrentStep, 
    setQuestions, 
    setLoading, 
    setError 
  } = useRefinementStore();

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!prompt.trim()) {
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
        originalPrompt: prompt.trim(),
        llmProvider: selectedProvider,
        model: selectedModel,
      });
    },
    onSuccess: (data) => {
      setSession(data.session);
      setQuestions(data.questions);
      setCurrentStep('questions');
      toast.success('Session created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create session';
      setError(message);
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate();
  };

  const examplePrompts = [
    "Write a blog post about artificial intelligence",
    "Create a marketing email for a new product",
    "Explain quantum computing to a beginner",
    "Generate a creative story about time travel",
    "Draft a professional email to a client",
  ];

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-black mb-4">
          Refine Your Prompt
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter your initial prompt and let our AI help you transform it into a precise, 
          effective instruction through targeted questions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="section-elevated p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-black mb-3">
              Your Initial Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... (e.g., 'Write a blog post about artificial intelligence')"
              className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none transition-all duration-200"
              disabled={createSessionMutation.isPending}
            />
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {prompt.length}/5000 characters
              </span>
              {prompt.length > 0 && prompt.length < 10 && (
                <span className="text-sm text-red-600">
                  Minimum 10 characters required
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={createSessionMutation.isPending || !prompt.trim() || prompt.length < 10}
              className="btn btn-primary px-8 py-3 text-lg font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Start Refinement
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Example prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8"
      >
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2">
            <Lightbulb className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-black">Try these example prompts:</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {examplePrompts.map((example, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              onClick={() => handleExampleClick(example)}
              className="text-left p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-100 transition-all duration-200 text-sm"
              disabled={createSessionMutation.isPending}
            >
              "{example}"
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 