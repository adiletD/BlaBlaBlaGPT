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
        <h2 className="text-3xl font-bold text-black mb-4">
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
        className="card-section p-8"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold text-black mb-4">
            Original Prompt
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-8 shadow-minimal">
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
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-card"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-sm font-medium text-black">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-lg font-medium text-black mb-2">
                    {question.text}
                  </h4>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mb-4">
                      {question.explanation}
                    </p>
                  )}
                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-white text-black rounded-md border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-minimal hover:shadow-interactive">
                      Yes
                    </button>
                    <button className="px-4 py-2 bg-white text-black rounded-md border border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-minimal hover:shadow-interactive">
                      No
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="btn btn-primary px-8 py-3 text-lg font-medium rounded-lg">
            Generate Refined Prompt
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 