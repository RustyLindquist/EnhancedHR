'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { QuizData, QuizQuestion, UserAssessmentAttempt } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface QuizPlayerProps {
    lessonId: string;
    quizData: QuizData;
    onComplete?: (score: number, passed: boolean) => void;
}

const QuizPlayer: React.FC<QuizPlayerProps> = ({ lessonId, quizData, onComplete }) => {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        if (submitted) return;
        setResponses(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async () => {
        // Validation: Ensure all questions answered
        if (Object.keys(responses).length < quizData.questions.length) {
            setError('Please answer all questions before submitting.');
            return;
        }
        setError(null);
        setIsSaving(true);

        // Calculate Score
        let correctCount = 0;
        quizData.questions.forEach(q => {
            const selectedOptionId = responses[q.id];
            const correctOption = q.options.find(o => o.isCorrect);
            if (correctOption && selectedOptionId === correctOption.id) {
                correctCount++;
            }
        });

        const calculatedScore = (correctCount / quizData.questions.length) * 100;
        const isPassed = calculatedScore >= quizData.passingScore;

        setScore(calculatedScore);
        setPassed(isPassed);
        setSubmitted(true);

        // Save to Supabase
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error: saveError } = await supabase
                .from('user_assessment_attempts')
                .insert({
                    user_id: user.id,
                    lesson_id: lessonId,
                    score: calculatedScore,
                    responses: responses,
                    passed: isPassed
                });

            if (saveError) {
                console.error('Error saving quiz attempt:', saveError);
                setError('Failed to save results. Please try again.');
            } else {
                if (onComplete) onComplete(calculatedScore, isPassed);
            }
        }
        setIsSaving(false);
    };

    const handleRetry = () => {
        setResponses({});
        setSubmitted(false);
        setScore(0);
        setPassed(false);
        setError(null);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-black/40 border border-white/10 rounded-2xl animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Knowledge Check</h2>
                <p className="text-slate-400">
                    Pass with {quizData.passingScore}% or higher to complete this lesson.
                </p>
            </div>

            {/* Questions List */}
            <div className="space-y-8">
                {quizData.questions.map((q, index) => {
                    const isCorrect = submitted && responses[q.id] === q.options.find(o => o.isCorrect)?.id;
                    const isWrong = submitted && !isCorrect;

                    return (
                        <div key={q.id} className={`p-6 rounded-xl border transition-colors ${submitted
                                ? isCorrect
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-red-500/5 border-red-500/20'
                                : 'bg-white/5 border-white/5'
                            }`}>
                            <h3 className="text-lg font-medium text-white mb-4 flex gap-3">
                                <span className="text-slate-500">{index + 1}.</span>
                                {q.text}
                            </h3>

                            <div className="space-y-3 pl-8">
                                {q.options.map((option) => {
                                    const isSelected = responses[q.id] === option.id;
                                    const showCorrect = submitted && option.isCorrect;
                                    const showWrong = submitted && isSelected && !option.isCorrect;

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(q.id, option.id)}
                                            disabled={submitted}
                                            className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group ${showCorrect
                                                    ? 'bg-green-500/20 border-green-500 text-green-100'
                                                    : showWrong
                                                        ? 'bg-red-500/20 border-red-500 text-red-100'
                                                        : isSelected
                                                            ? 'bg-brand-blue-light/20 border-brand-blue-light text-white'
                                                            : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <span>{option.text}</span>
                                            {showCorrect && <CheckCircle size={20} className="text-green-400" />}
                                            {showWrong && <XCircle size={20} className="text-red-400" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {submitted && q.explanation && (
                                <div className="mt-4 ml-8 p-4 bg-white/5 rounded-lg border border-white/10 text-sm text-slate-300">
                                    <span className="font-bold text-white block mb-1">Explanation:</span>
                                    {q.explanation}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Actions */}
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
                {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {!submitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-8 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? 'Submitting...' : 'Submit Answers'} <ArrowRight size={18} />
                    </button>
                ) : (
                    <div className="text-center animate-fade-in">
                        <div className="mb-4">
                            <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-1">Your Score</p>
                            <p className={`text-4xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                {score.toFixed(0)}%
                            </p>
                            <p className="text-white mt-2">
                                {passed ? 'Congratulations! You passed.' : 'Keep trying. You can do this!'}
                            </p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 rounded-full bg-white/10 text-white font-bold uppercase tracking-wider hover:bg-white/20 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={16} /> Retry Quiz
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPlayer;
