import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
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
  onAutoSubmit?: () => void;
}

export const SingleQuestionView: React.FC<SingleQuestionViewProps> = ({ className = '', onAutoSubmit }) => {
  const {
    questions,
    answers,
    currentQuestionIndex,
    updateAnswer,
    nextQuestion,
    previousQuestion,
    setCurrentQuestionIndex,
    isAutoSubmitting,
    setAutoSubmitting,
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

  // Set default answer to middle option if no answer exists
  useEffect(() => {
    if (currentQuestion && !currentAnswer && currentQuestion.options && currentQuestion.options.length > 0) {
      const defaultOptionIndex = currentQuestion.defaultOption || 1;
      const defaultOptionValue = currentQuestion.options[defaultOptionIndex];
      updateAnswer(currentQuestion.id, defaultOptionValue);
    }
  }, [currentQuestion, currentAnswer, updateAnswer]);

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
    
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    
    if (isLastQuestion && onAutoSubmit) {
      // Auto-submit for last question
      setAutoSubmitting(true);
      setTimeout(() => {
        onAutoSubmit();
      }, 400);
    } else {
      // Auto-advance to next question
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          nextQuestion();
        }
      }, 300);
    }
  }, [currentQuestion, updateAnswer, currentQuestionIndex, questions.length, nextQuestion, onAutoSubmit, setAutoSubmitting]);

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
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        
        if (isLastQuestion) {
          // On last question, arrow down should trigger auto-submit
          if (currentAnswer && onAutoSubmit) {
            // Already have an answer, trigger auto-submit directly
            setAutoSubmitting(true);
            setTimeout(() => {
              onAutoSubmit();
            }, 400);
          } else if (currentQuestion?.options && onAutoSubmit) {
            // No answer yet, select default option which will trigger auto-submit
            const defaultOptionIndex = currentQuestion.defaultOption || 1;
            const defaultOptionValue = currentQuestion.options[defaultOptionIndex];
            handleAnswer(defaultOptionValue);
          }
        } else {
          // Not last question, go to next question as normal
          nextQuestion();
        }
      }
      
      // Answer selection for 3 options
      else if (e.key === 'ArrowLeft' && currentQuestion?.options) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[0]); // First option
      } else if (e.key === 'ArrowRight' && currentQuestion?.options) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[2]); // Third option
      } else if (e.key === ' ' && currentQuestion?.options) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[1]); // Middle option (space bar)
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
  }, [currentQuestionIndex, questions.length, previousQuestion, nextQuestion, handleAnswer, currentQuestion, currentAnswer, onAutoSubmit, setAutoSubmitting]);

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
      
      <div className="flex gap-4 mb-4">
        {/* Vertical Timeline */}
        <div className="flex flex-col items-center space-y-1 pt-6">
          <div className="text-xs text-gray-500 mb-1">Progress</div>
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


      {/* Question Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className=""
          role="main"
          aria-live="polite"
        >
          <div className="text-center mb-4">
            
            <h1 className="text-lg font-semibold text-gray-900 mb-3" id="current-question">
              {currentQuestion.text}
            </h1>
          </div>

          {/* Answer Options */}
          <div className="space-y-4" role="group" aria-labelledby="current-question">
            {/* 3 Option Buttons */}
            <fieldset className="flex justify-center space-x-3">
              <legend className="sr-only">Choose from the available options</legend>
              {currentQuestion.options && currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer?.response === option;
                const isDefault = index === (currentQuestion.defaultOption || 1);
                
                // Color scheme based on position
                const getButtonStyles = () => {
                  if (index === 0) {
                    // First option - blue theme
                    return isSelected 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200';
                  } else if (index === 1) {
                    // Middle option - green theme (default)
                    return isSelected 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200';
                  } else {
                    // Third option - purple theme
                    return isSelected 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200';
                  }
                };
                
                const getRingColor = () => {
                  if (index === 0) return 'focus:ring-blue-300';
                  if (index === 1) return 'focus:ring-green-300';
                  return 'focus:ring-purple-300';
                };

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className={`px-6 py-3 text-base font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 ${getButtonStyles()} ${getRingColor()}`}
                    aria-pressed={isSelected}
                  >
                    {option}
                    {isDefault && !isSelected && (
                      <span className="ml-2 text-xs opacity-75">(default)</span>
                    )}
                  </button>
                );
              })}
            </fieldset>

            {/* Custom Answer Input */}
            <div className="max-w-md mx-auto">
              <form onSubmit={handleCustomSubmit} role="form">
                <div className="flex space-x-3">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    onFocus={() => setFocusedElement('custom')}
                    placeholder="Or provide a custom answer..."
                    className={`flex-1 px-3 py-2 border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      focusedElement === 'custom'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 focus:border-primary-500'
                    }`}
                    aria-label="Provide a custom answer"
                  />
                  <button
                    type="submit"
                    disabled={!customAnswer.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Submit custom answer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>

            {/* Auto-Submit Status */}
            {isAutoSubmitting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 bg-green-50 rounded-lg border border-green-200 max-w-md mx-auto"
                role="status"
                aria-live="polite"
              >
                <p className="text-sm text-green-800">
                  ✨ <strong>Auto-generating refined prompt...</strong>
                </p>
              </motion.div>
            )}


          </div>


        </motion.div>
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
}; 