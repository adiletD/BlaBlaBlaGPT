import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Copy, Edit3, Save, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useRefinementStore } from '../store/refinementStore';
import { apiService } from '../services/api';

export const PromptQuestionLayout: React.FC = () => {
  const { 
    session, 
    questions, 
    answers, 
    updateAnswer, 
    setCurrentStep,
    setSession,
    selectedProvider,
    selectedModel 
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
      setSession({ ...session!, refinedPrompt: data.refinedPrompt });
      setCurrentStep('results');
      toast.success('Prompt refined successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to refine prompt';
      toast.error(message);
    },
  });

  const handleQuestionAnswer = (questionId: string, response: boolean) => {
    updateAnswer(questionId, response);
  };

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

  const allQuestionsAnswered = questions.every(q => 
    answers.some(a => a.questionId === q.id)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Refine Your Prompt
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Review your prompt on the left and answer the questions on the right to help us create a more effective version.
        </p>
      </motion.div>

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
            <div className="bg-gray-50 rounded-lg p-6 min-h-[200px]">
              <p className="text-gray-700 whitespace-pre-wrap">
                {session?.originalPrompt}
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Tip
            </h4>
            <p className="text-sm text-blue-800">
              Answer the questions on the right to help us understand your needs better. 
              You can edit your prompt here if needed before generating the refined version.
            </p>
          </div>
        </motion.div>

        {/* Right Side - Questions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Questions ({answers.length}/{questions.length})
            </h3>
            <div className="text-sm text-gray-500">
              {allQuestionsAnswered ? '✅ All answered' : 'Answer all to continue'}
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => {
              const answer = answers.find(a => a.questionId === question.id);
              const isAnswered = !!answer;
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={`border rounded-lg p-4 ${
                    isAnswered 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isAnswered 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {question.text}
                      </h4>
                      {question.explanation && (
                        <p className="text-xs text-gray-600 mb-3">
                          {question.explanation}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuestionAnswer(question.id, true)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            answer?.response === true
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleQuestionAnswer(question.id, false)}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            answer?.response === false
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleGenerateRefinedPrompt}
              disabled={!allQuestionsAnswered || refinePromptMutation.isPending}
              className="w-full btn btn-primary px-6 py-3 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refinePromptMutation.isPending ? (
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