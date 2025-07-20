import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { useRefinementStore } from '../store/refinementStore';

export const RefinementResults: React.FC = () => {
  const { session, reset } = useRefinementStore();

  const handleCopy = () => {
    if (session?.refinedPrompt) {
      navigator.clipboard.writeText(session.refinedPrompt);
      // toast.success('Copied to clipboard!');
    }
  };

  const handleReset = () => {
    reset();
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
          Your Refined Prompt
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Here's your transformed prompt, refined through AI-powered analysis.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="section-elevated p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Prompt */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">
              Original Prompt
            </h3>
            <div className="bg-white rounded-lg p-4 h-32 overflow-y-auto border border-gray-100">
              <p className="text-gray-700 text-sm">
                {session?.originalPrompt}
              </p>
            </div>
          </div>

          {/* Refined Prompt */}
          <div>
            <h3 className="text-xl font-semibold text-black mb-4">
              Refined Prompt
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 h-32 overflow-y-auto border border-gray-100">
              <p className="text-gray-700 text-sm">
                {session?.refinedPrompt || 'No refined prompt available'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleCopy}
            className="btn btn-primary flex items-center space-x-2 px-6 py-3 rounded-lg"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Refined Prompt</span>
          </button>
          
          <button
            onClick={handleReset}
            className="btn btn-secondary flex items-center space-x-2 px-6 py-3 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Start Over</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}; 