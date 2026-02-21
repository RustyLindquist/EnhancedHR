'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, ArrowRight, RotateCw } from 'lucide-react';

interface AssessmentCompletionScreenProps {
    score: number;  // 0-100
    passed: boolean;
    passingScore?: number | null;  // e.g., 80 — optional
    totalQuestions: number;
    correctCount: number;
    onRetake: () => void;
    onContinue: () => void;
    hasNextLesson: boolean;
}

const AssessmentCompletionScreen: React.FC<AssessmentCompletionScreenProps> = ({
    score,
    passed,
    passingScore,
    totalQuestions,
    correctCount,
    onRetake,
    onContinue,
    hasNextLesson
}) => {
    const hasPassingScore = passingScore != null && passingScore > 0;
    const [displayScore, setDisplayScore] = useState(0);
    const [showScore, setShowScore] = useState(false);

    // Animated score counter
    useEffect(() => {
        // Delay before starting the score animation
        const showTimer = setTimeout(() => {
            setShowScore(true);
        }, 300);

        // Animate the score counting up
        const duration = 1200;
        const startTime = Date.now() + 500; // Additional delay for score counter
        const targetScore = Math.round(score);

        const animateScore = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 0) {
                requestAnimationFrame(animateScore);
                return;
            }
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setDisplayScore(Math.round(targetScore * easeOut));

            if (progress < 1) {
                requestAnimationFrame(animateScore);
            }
        };

        requestAnimationFrame(animateScore);

        return () => clearTimeout(showTimer);
    }, [score]);

    return (
        <div className="animate-fade-in flex flex-col items-center justify-center py-12 px-6">
            <div className="max-w-lg mx-auto text-center">
                {/* Score Circle */}
                <div
                    className={`
                        relative w-48 h-48 mx-auto mb-8
                        ${showScore ? 'animate-scale-in' : 'opacity-0'}
                    `}
                    style={{ animationDelay: '100ms' }}
                >
                    {/* Outer ring with glow */}
                    <div
                        className={`
                            absolute inset-0 rounded-full border-8
                            ${hasPassingScore
                                ? (passed
                                    ? 'border-green-500 animate-green-glow'
                                    : 'border-orange-500')
                                : 'border-brand-blue-light'
                            }
                        `}
                    />

                    {/* Inner circle background */}
                    <div className="absolute inset-2 rounded-full bg-brand-black/80" />

                    {/* Score display */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-baseline">
                            <span
                                className={`
                                    text-6xl font-bold
                                    ${hasPassingScore
                                        ? (passed ? 'text-green-400' : 'text-orange-400')
                                        : 'text-brand-blue-light'}
                                `}
                            >
                                {displayScore}
                            </span>
                            <span
                                className={`
                                    text-2xl font-bold ml-1
                                    ${hasPassingScore
                                        ? (passed ? 'text-green-400/70' : 'text-orange-400/70')
                                        : 'text-brand-blue-light/70'}
                                `}
                            >
                                %
                            </span>
                        </div>
                    </div>
                </div>

                {/* Icon */}
                <div
                    className={`
                        mb-6
                        ${showScore ? 'animate-celebrate' : 'opacity-0'}
                    `}
                    style={{ animationDelay: '400ms' }}
                >
                    {hasPassingScore ? (
                        passed ? (
                            <Trophy
                                size={40}
                                className="mx-auto text-green-400"
                            />
                        ) : (
                            <RotateCw
                                size={40}
                                className="mx-auto text-orange-400"
                            />
                        )
                    ) : (
                        <Trophy
                            size={40}
                            className="mx-auto text-brand-blue-light"
                        />
                    )}
                </div>

                {/* Result Message */}
                <div
                    className={`
                        mb-4
                        ${showScore ? 'animate-count-up' : 'opacity-0'}
                    `}
                    style={{ animationDelay: '500ms' }}
                >
                    <h2
                        className={`
                            text-3xl font-bold mb-4
                            ${hasPassingScore
                                ? (passed ? 'text-green-400' : 'text-orange-400')
                                : 'text-brand-blue-light'}
                        `}
                    >
                        {hasPassingScore
                            ? (passed ? 'Congratulations!' : 'Assessment Complete')
                            : 'Assessment Complete'}
                    </h2>

                    <p className="text-slate-300 text-lg mb-2">
                        You scored {correctCount} out of {totalQuestions} questions correct
                    </p>

                    {hasPassingScore && (
                        <p className="text-slate-500 text-sm">
                            Passing score: {passingScore}%
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div
                    className={`
                        flex flex-col sm:flex-row gap-4 justify-center mt-10
                        ${showScore ? 'animate-count-up' : 'opacity-0'}
                    `}
                    style={{ animationDelay: '700ms' }}
                >
                    {/* Retake Button */}
                    <button
                        onClick={onRetake}
                        className="
                            flex items-center justify-center gap-2
                            px-8 py-3 rounded-full font-bold
                            bg-white/10 hover:bg-white/20 text-white
                            transition-all duration-200 hover:scale-105
                        "
                    >
                        <RefreshCw size={18} />
                        Retake Assessment
                    </button>

                    {/* Continue Button */}
                    <button
                        onClick={onContinue}
                        className="
                            flex items-center justify-center gap-2
                            px-8 py-3 rounded-full font-bold
                            bg-brand-blue-light hover:bg-white text-brand-black
                            transition-all duration-200 hover:scale-105
                        "
                    >
                        {hasNextLesson ? 'Continue to Next Lesson' : 'Return to Course'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentCompletionScreen;
