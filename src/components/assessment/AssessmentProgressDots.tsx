'use client';

import React from 'react';
import { QuizQuestion } from '@/types';

interface AssessmentProgressDotsProps {
    questions: QuizQuestion[];
    currentIndex: number;
    answeredQuestions: Record<string, string>;
    onDotClick: (index: number) => void;
}

const AssessmentProgressDots: React.FC<AssessmentProgressDotsProps> = ({
    questions,
    currentIndex,
    answeredQuestions,
    onDotClick
}) => {
    const getDotState = (question: QuizQuestion, index: number) => {
        const isCurrent = index === currentIndex;
        const selectedOptionId = answeredQuestions[question.id];
        const isAnswered = !!selectedOptionId;

        if (isAnswered) {
            const correctOption = question.options.find(opt => opt.isCorrect);
            const isCorrect = correctOption && selectedOptionId === correctOption.id;
            return { isAnswered, isCorrect, isCurrent };
        }

        return { isAnswered: false, isCorrect: false, isCurrent };
    };

    const getDotStyles = (question: QuizQuestion, index: number) => {
        const { isAnswered, isCorrect, isCurrent } = getDotState(question, index);

        let baseStyles = 'w-3 h-3 rounded-full transition-all duration-200 cursor-pointer';

        if (isCurrent) {
            // Current question - add ring effect
            baseStyles += ' ring-2 ring-offset-2 ring-offset-[#0f172a]';

            if (isAnswered) {
                if (isCorrect) {
                    return `${baseStyles} bg-green-500 ring-green-500/50`;
                } else {
                    return `${baseStyles} bg-red-500 ring-red-500/50`;
                }
            }
            return `${baseStyles} bg-brand-blue-light ring-brand-blue-light/50`;
        }

        // Not current
        if (isAnswered) {
            if (isCorrect) {
                return `${baseStyles} bg-green-500 hover:bg-green-400`;
            } else {
                return `${baseStyles} bg-red-500 hover:bg-red-400`;
            }
        }

        return `${baseStyles} bg-white/20 hover:bg-white/30`;
    };

    return (
        <div className="flex justify-center items-center gap-3 my-6">
            {questions.map((question, index) => (
                <button
                    key={question.id}
                    onClick={() => onDotClick(index)}
                    className={getDotStyles(question, index)}
                    aria-label={`Go to question ${index + 1}`}
                    aria-current={index === currentIndex ? 'step' : undefined}
                />
            ))}
        </div>
    );
};

export default AssessmentProgressDots;
