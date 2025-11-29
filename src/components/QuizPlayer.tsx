'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react';

interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    text: string;
    options: Option[];
    explanation?: string;
}

interface QuizData {
    questions: Question[];
    passingScore?: number;
}

interface QuizPlayerProps {
    quizData: QuizData;
    onComplete: (score: number, passed: boolean) => void;
}

export default function QuizPlayer({ quizData, onComplete }: QuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    const currentQuestion = quizData.questions[currentIndex];
    const totalQuestions = quizData.questions.length;

    const handleOptionSelect = (optionId: string) => {
        if (isAnswered) return;
        setSelectedOptionId(optionId);
    };

    const handleSubmit = () => {
        if (!selectedOptionId) return;

        const selectedOption = currentQuestion.options.find(o => o.id === selectedOptionId);
        const isCorrect = selectedOption?.isCorrect || false;

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setIsAnswered(true);
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOptionId(null);
            setIsAnswered(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setShowResults(true);
        const finalScore = score + (isAnswered && currentQuestion.options.find(o => o.id === selectedOptionId)?.isCorrect ? 0 : 0); // Score is already updated
        // Wait, score is updated on submit.
        const percentage = (score / totalQuestions) * 100;
        const passed = percentage >= (quizData.passingScore || 70);
        onComplete(percentage, passed);
    };

    const handleRetry = () => {
        setCurrentIndex(0);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setScore(0);
        setShowResults(false);
    };

    if (showResults) {
        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = percentage >= (quizData.passingScore || 70);

        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Trophy size={48} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{passed ? 'Quiz Passed!' : 'Keep Trying!'}</h2>
                <p className="text-slate-400 mb-8">You scored {percentage}% ({score}/{totalQuestions})</p>

                <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                    <RotateCcw size={18} /> Retry Quiz
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col justify-center p-8 animate-fade-in">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    <span>Question {currentIndex + 1} of {totalQuestions}</span>
                    <span>Score: {score}</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-brand-blue-light transition-all duration-500"
                        style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Question */}
            <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                {currentQuestion.text}
            </h2>

            {/* Options */}
            <div className="space-y-4 mb-8">
                {currentQuestion.options.map(option => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = option.isCorrect;

                    let className = "w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ";

                    if (isAnswered) {
                        if (isCorrect) {
                            className += "bg-green-500/10 border-green-500/50 text-green-400";
                        } else if (isSelected && !isCorrect) {
                            className += "bg-red-500/10 border-red-500/50 text-red-400";
                        } else {
                            className += "bg-white/5 border-white/5 text-slate-500 opacity-50";
                        }
                    } else {
                        if (isSelected) {
                            className += "bg-brand-blue-light/10 border-brand-blue-light text-white";
                        } else {
                            className += "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20";
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.id)}
                            disabled={isAnswered}
                            className={className}
                        >
                            <span>{option.text}</span>
                            {isAnswered && isCorrect && <CheckCircle size={20} />}
                            {isAnswered && isSelected && !isCorrect && <XCircle size={20} />}
                        </button>
                    );
                })}
            </div>

            {/* Feedback & Actions */}
            <div className="h-24">
                {isAnswered ? (
                    <div className="animate-fade-in">
                        {currentQuestion.explanation && (
                            <div className="mb-4 p-4 bg-white/5 rounded-lg text-sm text-slate-300 border-l-2 border-brand-blue-light">
                                <span className="font-bold text-brand-blue-light block mb-1">Explanation:</span>
                                {currentQuestion.explanation}
                            </div>
                        )}
                        <button
                            onClick={handleNext}
                            className="float-right flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold hover:bg-white transition-colors"
                        >
                            {currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOptionId}
                        className="float-right px-6 py-3 rounded-full bg-brand-orange text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-orange/80 transition-colors"
                    >
                        Submit Answer
                    </button>
                )}
            </div>
        </div>
    );
}
