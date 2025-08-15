import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRefinementStore } from '../store/refinementStore';

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
    setAutoSubmitting,
  } = useRefinementStore();

  const [customAnswer, setCustomAnswer] = useState('');
  const [focusedElement, setFocusedElement] = useState<'custom' | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
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
  
  // Get 3 questions for stacked view: previous, current, next
  const getStackedQuestions = () => {
    const stackedQuestions = [];
    
    // Previous question (if exists)
    if (currentQuestionIndex > 0) {
      stackedQuestions.push({
        question: questions[currentQuestionIndex - 1],
        index: currentQuestionIndex - 1,
        position: 'previous' as const
      });
    }
    
    // Current question
    if (currentQuestion) {
      stackedQuestions.push({
        question: currentQuestion,
        index: currentQuestionIndex,
        position: 'current' as const
      });
    }
    
    // Next question (if exists)
    if (currentQuestionIndex < questions.length - 1) {
      stackedQuestions.push({
        question: questions[currentQuestionIndex + 1],
        index: currentQuestionIndex + 1,
        position: 'next' as const
      });
    }
    
    return stackedQuestions;
  };
  
  const stackedQuestions = getStackedQuestions();

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
    setShowCustomInput(false);
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
      // Handle custom input mode exit
      if (showCustomInput && (e.key === 'Escape' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setShowCustomInput(false);
        setCustomAnswer('');
        setFocusedElement(null);
        return;
      }

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
      
      // Answer selection for 3 options - only if not in custom input mode
      else if (e.key === 'ArrowLeft' && currentQuestion?.options && !showCustomInput) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[0]); // First option
      } else if (e.key === 'ArrowRight' && currentQuestion?.options && !showCustomInput) {
        e.preventDefault();
        handleAnswer(currentQuestion.options[2]); // Third option
      } else if (e.key === ' ') {
        e.preventDefault();
        setShowCustomInput(!showCustomInput);
        if (!showCustomInput) {
          setTimeout(() => {
            if (customInputRef.current) {
              customInputRef.current.focus();
            }
          }, 100);
        }
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
  }, [currentQuestionIndex, questions.length, previousQuestion, nextQuestion, handleAnswer, currentQuestion, currentAnswer, onAutoSubmit, setAutoSubmitting, showCustomInput]);

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
      
      {/* Main Content */}
      <div className="w-full">
        {/* Stacked Question Cards */}
        <div className="space-y-4 h-auto" role="main" aria-live="polite">
          {stackedQuestions.map((item) => {
            const { question, index, position } = item;
            const questionAnswer = answers.find(a => a.questionId === question.id);
            const isActive = position === 'current';
            
            // Calculate stacking positions and styling for vertical stacking
            const getCardStyles = () => {
              switch (position) {
                case 'previous':
                  return 'transform scale-95 opacity-70';
                case 'current':
                  return 'transform scale-100 opacity-100 shadow-lg';
                case 'next':
                  return 'transform scale-95 opacity-70';
                default:
                  return '';
              }
            };
            
            return (
              <motion.div
                key={question.id}
                className={`bg-white rounded-xl border-2 border-gray-200 p-4 transition-all duration-300 ${getCardStyles()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: position === 'current' ? 1 : 0.7, y: 0 }}
                style={{
                  boxShadow: position === 'current' 
                    ? '0 8px 20px rgba(0, 0, 0, 0.12)' 
                    : '0 2px 4px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Question Text */}
                <div className="text-center mb-4">
                  <h1 className={`text-sm font-medium text-gray-900 mb-2 ${!isActive ? 'text-gray-600' : ''}`} id={`question-${index}`}>
                    {question.text}
                  </h1>
                </div>

                {/* Answer Options - Only interactive for current question */}
                <div className="space-y-4">
                  <fieldset className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
                    <legend className="sr-only">Choose from the available options for question {index + 1}</legend>
                    {question.options && question.options.map((option, optionIndex) => {
                      const isSelected = questionAnswer?.response === option;
                      const isDefault = optionIndex === (question.defaultOption || 1);
                      
                      const getButtonStyles = () => {
                        if (!isActive) {
                          return isSelected 
                            ? 'bg-gray-200 text-gray-600 border-2 border-gray-400' 
                            : 'bg-gray-100 text-gray-500 border border-gray-300';
                        }
                        return isSelected 
                          ? 'bg-gray-100 text-black border-4 border-black shadow-lg' 
                          : 'bg-white text-black border border-black hover:bg-gray-50';
                      };

                      return (
                        <button
                          key={option}
                          onClick={() => isActive ? handleAnswer(option) : undefined}
                          disabled={!isActive}
                          className={`px-2 py-3 text-xs font-medium rounded-md transition-all duration-200 ${getButtonStyles()} ${isActive ? 'transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300' : 'cursor-default'} min-h-[3rem] flex items-center justify-center text-center leading-tight`}
                          aria-pressed={isSelected}
                          tabIndex={isActive ? 0 : -1}
                        >
                          <span className="break-words hyphens-auto">
                            {option}
                            {isDefault && !isSelected && isActive && (
                              <span className="block text-xs opacity-75 mt-1">(default)</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </fieldset>

                  {/* Custom Answer Input - Only for current question */}
                  {isActive && showCustomInput && (
                    <div className="max-w-xs mx-auto">
                      <form onSubmit={handleCustomSubmit} role="form">
                        <div className="flex gap-2">
                          <input
                            ref={customInputRef}
                            type="text"
                            value={customAnswer}
                            onChange={(e) => setCustomAnswer(e.target.value)}
                            onFocus={() => setFocusedElement('custom')}
                            placeholder="Type custom answer..."
                            className={`flex-1 px-2 py-1 text-xs border-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                              focusedElement === 'custom'
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-300 focus:border-primary-500'
                            }`}
                            aria-label="Provide a custom answer"
                          />
                          <button
                            type="submit"
                            disabled={!customAnswer.trim()}
                            className="px-2 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                            aria-label="Submit custom answer"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                      <div className="text-center mt-1">
                        <span className="text-xs text-gray-400">Press Esc or arrow keys to exit</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Answer Hint - Only for current question */}
                  {isActive && !showCustomInput && (
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Press Space for custom answer</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};