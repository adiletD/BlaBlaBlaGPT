import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useRefinementStore } from '../store/refinementStore';
import { Question, Answer } from '../types';

// Add CSS for screen reader only content
const srOnlyStyles = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('sr-only-styles')) {
  const style = document.createElement('style');
  style.id = 'sr-only-styles';
  style.textContent = srOnlyStyles;
  document.head.appendChild(style);
}

interface SingleQuestionViewProps {
  className?: string;
}

export const SingleQuestionView: React.FC<SingleQuestionViewProps> = ({ className = '' }) => {
  const {
    questions,
    answers,
    currentQuestionIndex,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    setCurrentQuestionIndex,
  } = useRefinementStore();

  const [customAnswer, setCustomAnswer] = useState('');
  const [focusedElement, setFocusedElement] = useState<'custom' | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  
  // Use refs for values that change frequently to avoid re-registering event listeners
  const focusedElementRef = useRef(focusedElement);
  const customAnswerRef = useRef(customAnswer);
  
  // Keep refs up to date
  useEffect(() => {
    focusedElementRef.current = focusedElement;
  }, [focusedElement]);
  
  useEffect(() => {
    customAnswerRef.current = customAnswer;
  }, [customAnswer]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Focus management
  useEffect(() => {
    if (focusedElement === 'custom' && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [focusedElement]);

  // Clear custom answer when question changes
  useEffect(() => {
    setCustomAnswer('');
    setFocusedElement(null);
  }, [currentQuestionIndex]);

  const handleAnswer = useCallback((response: boolean | string) => {
    if (!currentQuestion) return;
    
    updateAnswer(currentQuestion.id, response);
    setCustomAnswer('');
    setFocusedElement(null);
    
    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      }
    }, 300);
  }, [currentQuestion, updateAnswer, currentQuestionIndex, questions.length, nextQuestion]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Question navigation
      if (e.key === 'ArrowUp' && currentQuestionIndex > 0) {
        e.preventDefault();
        previousQuestion();
      } else if (e.key === 'ArrowDown' && currentQuestionIndex < questions.length - 1) {
        e.preventDefault();
        nextQuestion();
      }
      
      // Answer selection and immediate submission
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleAnswer(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setFocusedElement('custom');
      }
      
      // Submit custom answer
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedElementRef.current === 'custom' && customAnswerRef.current.trim()) {
          handleAnswer(customAnswerRef.current.trim());
        }
      }
      
      // Auto-focus custom input for regular typing
      else if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9\s]/)) {
        e.preventDefault();
        setFocusedElement('custom');
        setCustomAnswer(e.key);
        // Focus the input after state update
        setTimeout(() => {
          if (customInputRef.current) {
            customInputRef.current.focus();
          }
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions.length, previousQuestion, nextQuestion, handleAnswer]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAnswer.trim()) {
      handleAnswer(customAnswer.trim());
    }
  };

  if (!currentQuestion) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">No questions available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="region" aria-label="Question refinement interface">
      {/* Skip Link */}
      <a
        href="#current-question"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to question
      </a>
      
      <div className="flex gap-6 mb-6">
        {/* Vertical Timeline */}
        <div className="flex flex-col items-center space-y-2 pt-8">
          <div className="text-xs text-gray-500 mb-2">Progress</div>
          <div className="flex flex-col space-y-2" role="group" aria-label="Question progress indicators">
            {questions.map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-4 h-4 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    index === currentQuestionIndex
                      ? 'bg-primary-600 ring-2 ring-primary-200'
                      : answers.find(a => a.questionId === questions[index].id)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                  aria-label={`Go to question ${index + 1}${
                    index === currentQuestionIndex ? ' (current)' : ''
                  }${
                    answers.find(a => a.questionId === questions[index].id) ? ' (answered)' : ' (unanswered)'
                  }`}
                />
                {index < questions.length - 1 && (
                  <div className="w-px h-4 bg-gray-200 mt-1" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Question Navigation */}
          <nav className="flex justify-between items-center mb-6" aria-label="Question navigation">
            <button
              onClick={previousQuestion}
              disabled={isFirstQuestion}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Go to previous question. Currently on question ${currentQuestionIndex + 1} of ${questions.length}`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span aria-live="polite">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            
            <button
              onClick={nextQuestion}
              disabled={isLastQuestion}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Go to next question. Currently on question ${currentQuestionIndex + 1} of ${questions.length}`}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>

      {/* Question Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white"
          role="main"
          aria-live="polite"
          aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center" aria-hidden="true">
                <span className="text-lg font-bold text-primary-600">
                  {currentQuestionIndex + 1}
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4" id="current-question">
              {currentQuestion.text}
            </h1>
            
            {currentQuestion.explanation && (
              <p className="text-gray-600 text-lg max-w-3xl mx-auto" id="question-explanation">
                {currentQuestion.explanation}
              </p>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-6" role="group" aria-labelledby="current-question">
            {/* Yes/No Buttons */}
            <fieldset className="flex justify-center space-x-6">
              <legend className="sr-only">Answer the question with Yes or No</legend>
              <button
                onClick={() => handleAnswer(true)}
                className={`px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 ${
                  currentAnswer?.response === true
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                aria-pressed={currentAnswer?.response === true}
                aria-describedby={currentQuestion.explanation ? "question-explanation" : undefined}
              >
                Yes
              </button>
              
              <button
                onClick={() => handleAnswer(false)}
                className={`px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300 ${
                  currentAnswer?.response === false
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                aria-pressed={currentAnswer?.response === false}
                aria-describedby={currentQuestion.explanation ? "question-explanation" : undefined}
              >
                No
              </button>
            </fieldset>

            {/* Custom Answer Input */}
            <div className="max-w-md mx-auto">
              <form onSubmit={handleCustomSubmit} className="space-y-3" role="form" aria-labelledby="custom-answer-label">
                <label id="custom-answer-label" className="block text-sm font-medium text-gray-700 text-center">
                  Or provide a custom answer:
                </label>
                <div className="flex space-x-3">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    onFocus={() => setFocusedElement('custom')}
                    placeholder="Type your answer..."
                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      focusedElement === 'custom'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 focus:border-primary-500'
                    }`}
                    aria-labelledby="custom-answer-label"
                    aria-describedby={currentQuestion.explanation ? "question-explanation" : undefined}
                  />
                  <button
                    type="submit"
                    disabled={!customAnswer.trim()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Submit custom answer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>

            {/* Current Answer Display */}
            {currentAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm text-blue-800">
                  <strong>Your answer:</strong> {
                    typeof currentAnswer.response === 'boolean' 
                      ? (currentAnswer.response ? 'Yes' : 'No')
                      : currentAnswer.response
                  }
                </p>
              </motion.div>
            )}
          </div>

          {/* Keyboard Navigation Hint */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-4 text-xs text-gray-500" role="complementary" aria-label="Keyboard shortcuts">
              <div className="flex items-center space-x-1">
                <ArrowUp className="h-3 w-3" aria-hidden="true" />
                <ArrowDown className="h-3 w-3" aria-hidden="true" />
                <span>Navigate questions</span>
              </div>
              <div className="flex items-center space-x-1">
                <ChevronLeft className="h-3 w-3" aria-hidden="true" />
                <span>Yes</span>
              </div>
              <div className="flex items-center space-x-1">
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span>No</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>
                <span>Submit custom</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 