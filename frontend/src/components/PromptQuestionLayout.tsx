import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Copy, Edit3, Save, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRefinementStore } from '../store/refinementStore';
import { apiService } from '../services/api';
import { SingleQuestionView } from './SingleQuestionView';

export const PromptQuestionLayout: React.FC = () => {
  const { 
    session, 
    questions, 
    answers, 
    setCurrentStep,
    setSession,
    setAnswers,
    setQuestions,
    setCurrentQuestionIndex,
    selectedProvider,
    selectedModel,
    isAutoSubmitting,
    setAutoSubmitting
  } = useRefinementStore();

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(session?.originalPrompt || '');

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
      toast.error(message);
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


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Prompt Display/Edit */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Your Prompt
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyPrompt}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy prompt"
              >
                <Copy className="h-4 w-4" />
              </button>
              {!isEditingPrompt ? (
                <button
                  onClick={handleEditPrompt}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit prompt"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex space-x-1">
                  <button
                    onClick={handleSavePrompt}
                    className="p-2 text-green-600 hover:text-green-700 transition-colors"
                    title="Save changes"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-red-600 hover:text-red-700 transition-colors"
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
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Enter your prompt here..."
              />
              <div className="text-sm text-gray-500">
                {editedPrompt.length}/5000 characters
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session?.refinedPrompt && (
                <div className="bg-green-50 rounded-lg p-6 min-h-[200px] border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-600 font-medium">✨ Refined Prompt</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Latest</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {session.refinedPrompt}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-6 min-h-[200px]">
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
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Questions ({answers.length}/{questions.length})
              </h3>
              <div className="text-sm text-gray-500">
                {allQuestionsAnswered ? '✅ All answered' : `${answers.length} of ${questions.length} answered`}
              </div>
            </div>
            
            <SingleQuestionView onAutoSubmit={handleAutoSubmit} />
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                {isAutoSubmitting 
                  ? "Auto-generating your refined prompt..."
                  : allQuestionsAnswered 
                  ? "All questions answered! Ready to generate your refined prompt."
                  : "You can generate a refined prompt at any time, even with partial answers."
                }
              </p>
            </div>
            <button
              onClick={handleGenerateRefinedPrompt}
              disabled={refinePromptMutation.isPending || isAutoSubmitting}
              className="w-full btn btn-primary px-6 py-3 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}; 