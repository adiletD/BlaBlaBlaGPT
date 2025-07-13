import React from 'react';
import { motion } from 'framer-motion';
import { useRefinementStore } from '../store/refinementStore';

export const QuestionRefinement: React.FC = () => {
  const { questions, session } = useRefinementStore();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Answer These Questions
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Help us understand your needs better by answering these targeted questions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Original Prompt
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <p className="text-gray-700 italic">
              "{session?.originalPrompt}"
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {question.text}
                  </h4>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mb-4">
                      {question.explanation}
                    </p>
                  )}
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                      Yes
                    </button>
                    <button className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                      No
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="btn btn-primary px-8 py-3 text-lg font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            Generate Refined Prompt
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 