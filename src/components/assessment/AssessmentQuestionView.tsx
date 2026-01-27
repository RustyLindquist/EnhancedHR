'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { QuizQuestion } from '@/types';

interface AssessmentQuestionViewProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    selectedOptionId: string | null;
    showFeedback: boolean;
    onSelectOption: (optionId: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

const AssessmentQuestionView: React.FC<AssessmentQuestionViewProps> = ({
    question,
    questionNumber,
    totalQuestions,
    selectedOptionId,
    showFeedback,
    onSelectOption,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious
}) => {
    const getOptionStyles = (option: { id: string; isCorrect: boolean }) => {
        const isSelected = selectedOptionId === option.id;

        if (showFeedback) {
            // After feedback - show correct/incorrect states
            if (option.isCorrect) {
                return 'bg-green-500/20 border-green-500';
            }
            if (isSelected && !option.isCorrect) {
                return 'bg-red-500/20 border-red-500';
            }
            // Non-selected, non-correct options stay default
            return 'bg-white/5 border-white/10';
        }

        // Before feedback
        if (isSelected) {
            return 'bg-brand-blue-light/20 border-brand-blue-light';
        }

        return 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';
    };

    const getOptionTextColor = (option: { id: string; isCorrect: boolean }) => {
        const isSelected = selectedOptionId === option.id;

        if (showFeedback) {
            if (option.isCorrect) return 'text-green-100';
            if (isSelected && !option.isCorrect) return 'text-red-100';
        }

        if (isSelected) return 'text-white';
        return 'text-slate-300';
    };

    return (
        <div className="flex flex-col">
            {/* Question Header */}
            <div className="text-sm text-slate-400 uppercase tracking-wider mb-4">
                Question {questionNumber} of {totalQuestions}
            </div>

            {/* Question Text */}
            <h3 className="text-2xl font-medium text-white mb-8">
                {question.text}
            </h3>

            {/* Options */}
            <div className="space-y-4">
                {question.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const showCorrectIcon = showFeedback && option.isCorrect;
                    const showIncorrectIcon = showFeedback && isSelected && !option.isCorrect;

                    return (
                        <button
                            key={option.id}
                            onClick={() => !showFeedback && onSelectOption(option.id)}
                            disabled={showFeedback}
                            className={`
                                w-full p-5 rounded-xl border transition-all
                                flex items-center justify-between
                                ${showFeedback ? 'cursor-default' : 'cursor-pointer'}
                                ${getOptionStyles(option)}
                            `}
                        >
                            <span className={getOptionTextColor(option)}>
                                {option.text}
                            </span>
                            {showCorrectIcon && (
                                <CheckCircle size={22} className="text-green-400 flex-shrink-0 ml-4" />
                            )}
                            {showIncorrectIcon && (
                                <XCircle size={22} className="text-red-400 flex-shrink-0 ml-4" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Explanation (shown after feedback if available) */}
            {showFeedback && question.explanation && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-6">
                    <div className="text-brand-blue-light font-bold text-sm uppercase tracking-wider mb-2">
                        Explanation
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        {question.explanation}
                    </p>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                <button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-lg
                        transition-all duration-200 font-medium
                        ${hasPrevious
                            ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                            : 'bg-white/5 text-slate-600 cursor-not-allowed'
                        }
                    `}
                >
                    <ChevronLeft size={18} />
                    Previous
                </button>

                <button
                    onClick={onNext}
                    disabled={!showFeedback || !hasNext}
                    className={`
                        flex items-center gap-2 px-5 py-2.5 rounded-lg
                        transition-all duration-200 font-medium
                        ${showFeedback && hasNext
                            ? 'bg-brand-blue-light hover:bg-white text-brand-black shadow-lg shadow-brand-blue-light/20'
                            : 'bg-white/5 text-slate-600 cursor-not-allowed'
                        }
                    `}
                >
                    Next
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default AssessmentQuestionView;
