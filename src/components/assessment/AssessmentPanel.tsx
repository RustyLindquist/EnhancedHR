'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { QuizData } from '@/types';
import { createClient } from '@/lib/supabase/client';
import DropdownPanel from '@/components/DropdownPanel';
import AssessmentQuestionView from './AssessmentQuestionView';
import AssessmentProgressDots from './AssessmentProgressDots';
import AssessmentConfirmDialog from './AssessmentConfirmDialog';
import AssessmentCompletionScreen from './AssessmentCompletionScreen';

interface AssessmentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    lessonId: string;
    lessonTitle: string;
    quizData: QuizData;
    onComplete: (score: number, passed: boolean) => void;
    onContinueToNext: () => void;
    hasNextLesson: boolean;
    savedProgress?: {
        responses: Record<string, string>;
        currentIndex: number;
    };
    onSaveProgress?: (responses: Record<string, string>, currentIndex: number) => void;
}

const AssessmentPanel: React.FC<AssessmentPanelProps> = ({
    isOpen,
    onClose,
    lessonId,
    lessonTitle,
    quizData,
    onComplete,
    onContinueToNext,
    hasNextLesson,
    savedProgress,
    onSaveProgress
}) => {
    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(savedProgress?.currentIndex ?? 0);
    const [responses, setResponses] = useState<Record<string, string>>(savedProgress?.responses ?? {});
    const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [passed, setPassed] = useState<boolean | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize showFeedback for any previously answered questions
    useEffect(() => {
        if (savedProgress?.responses) {
            const initialFeedback: Record<string, boolean> = {};
            Object.keys(savedProgress.responses).forEach(questionId => {
                initialFeedback[questionId] = true;
            });
            setShowFeedback(initialFeedback);
        }
    }, [savedProgress?.responses]);

    // Reset state when panel opens with new data
    useEffect(() => {
        if (isOpen && !savedProgress) {
            setCurrentQuestionIndex(0);
            setResponses({});
            setShowFeedback({});
            setIsSubmitted(false);
            setScore(null);
            setPassed(null);
        }
    }, [isOpen, lessonId, savedProgress]);

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const totalQuestions = quizData.questions.length;
    const allAnswered = Object.keys(responses).length === totalQuestions;
    const hasUnsavedProgress = Object.keys(responses).length > 0 && !isSubmitted;

    // Handlers
    const handleSelectOption = useCallback((optionId: string) => {
        const questionId = currentQuestion.id;
        setResponses(prev => ({
            ...prev,
            [questionId]: optionId
        }));
        setShowFeedback(prev => ({
            ...prev,
            [questionId]: true
        }));
    }, [currentQuestion?.id]);

    const handleNext = useCallback(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [currentQuestionIndex, totalQuestions]);

    const handlePrevious = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    }, [currentQuestionIndex]);

    const handleDotClick = useCallback((index: number) => {
        setCurrentQuestionIndex(index);
    }, []);

    const calculateScore = useCallback(() => {
        let correctCount = 0;
        quizData.questions.forEach(q => {
            const selectedOptionId = responses[q.id];
            const correctOption = q.options.find(o => o.isCorrect);
            if (correctOption && selectedOptionId === correctOption.id) {
                correctCount++;
            }
        });
        return (correctCount / quizData.questions.length) * 100;
    }, [quizData.questions, responses]);

    const handleSubmit = useCallback(async () => {
        if (!allAnswered) return;

        setIsSaving(true);
        const calculatedScore = calculateScore();
        const hasPassingScore = quizData.passingScore != null && quizData.passingScore > 0;
        const isPassed = hasPassingScore ? calculatedScore >= quizData.passingScore! : true;

        setScore(calculatedScore);
        setPassed(isPassed);
        setIsSubmitted(true);

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
                console.error('Error saving assessment attempt:', saveError);
            } else {
                onComplete(calculatedScore, isPassed);
            }
        }
        setIsSaving(false);
    }, [allAnswered, calculateScore, quizData, lessonId, responses, onComplete]);

    const handleCloseAttempt = useCallback(() => {
        if (hasUnsavedProgress) {
            setShowConfirmDialog(true);
        } else {
            onClose();
        }
    }, [hasUnsavedProgress, onClose]);

    const handleSaveAndClose = useCallback(() => {
        if (onSaveProgress) {
            onSaveProgress(responses, currentQuestionIndex);
        }
        setShowConfirmDialog(false);
        onClose();
    }, [onSaveProgress, responses, currentQuestionIndex, onClose]);

    const handleDiscardAndClose = useCallback(() => {
        // Reset state
        setCurrentQuestionIndex(0);
        setResponses({});
        setShowFeedback({});
        setShowConfirmDialog(false);
        onClose();
    }, [onClose]);

    const handleCancelClose = useCallback(() => {
        setShowConfirmDialog(false);
    }, []);

    const handleRetake = useCallback(() => {
        setCurrentQuestionIndex(0);
        setResponses({});
        setShowFeedback({});
        setIsSubmitted(false);
        setScore(null);
        setPassed(null);
    }, []);

    const handleContinueToNext = useCallback(() => {
        onClose();
        // Small delay to allow panel close animation
        setTimeout(() => {
            onContinueToNext();
        }, 100);
    }, [onClose, onContinueToNext]);

    // Calculate correct count for completion screen
    const correctCount = quizData.questions.filter(q => {
        const selectedOptionId = responses[q.id];
        const correctOption = q.options.find(o => o.isCorrect);
        return correctOption && selectedOptionId === correctOption.id;
    }).length;

    // Header actions showing current question
    const headerActions = (
        <span className="text-slate-400 text-sm">
            Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
    );

    return (
        <>
            <DropdownPanel
                isOpen={isOpen}
                onClose={handleCloseAttempt}
                title="Knowledge Assessment"
                icon={ClipboardCheck}
                iconColor="text-brand-blue-light"
                headerActions={headerActions}
            >
                {!isSubmitted ? (
                    <div className="max-w-3xl mx-auto">
                        {/* Progress Dots */}
                        <AssessmentProgressDots
                            questions={quizData.questions}
                            currentIndex={currentQuestionIndex}
                            answeredQuestions={responses}
                            onDotClick={handleDotClick}
                        />

                        {/* Question View */}
                        {currentQuestion && (
                            <AssessmentQuestionView
                                question={currentQuestion}
                                questionNumber={currentQuestionIndex + 1}
                                totalQuestions={totalQuestions}
                                selectedOptionId={responses[currentQuestion.id] ?? null}
                                showFeedback={showFeedback[currentQuestion.id] ?? false}
                                onSelectOption={handleSelectOption}
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                hasNext={currentQuestionIndex < totalQuestions - 1}
                                hasPrevious={currentQuestionIndex > 0}
                            />
                        )}

                        {/* Submit Button - only shown when all questions answered */}
                        {allAnswered && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSaving}
                                    className="px-8 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Submitting...' : 'Submit Assessment'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <AssessmentCompletionScreen
                        score={score ?? 0}
                        passed={passed ?? false}
                        passingScore={quizData.passingScore}
                        totalQuestions={totalQuestions}
                        correctCount={correctCount}
                        onRetake={handleRetake}
                        onContinue={handleContinueToNext}
                        hasNextLesson={hasNextLesson}
                    />
                )}
            </DropdownPanel>

            {/* Confirm Dialog */}
            <AssessmentConfirmDialog
                isOpen={showConfirmDialog}
                onSave={handleSaveAndClose}
                onDiscard={handleDiscardAndClose}
                onCancel={handleCancelClose}
            />
        </>
    );
};

export default AssessmentPanel;
