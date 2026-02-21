'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle, HelpCircle, Upload } from 'lucide-react';
import { QuizData, QuizQuestion, QuizOption } from '@/types';
import QuizImportPanel from '@/components/admin/QuizImportPanel';

interface QuizBuilderProps {
    initialData?: QuizData;
    onChange: (quizData: QuizData) => void;
    disabled?: boolean;
}

const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const createDefaultOption = (isCorrect: boolean = false): QuizOption => ({
    id: generateId(),
    text: '',
    isCorrect
});

const createDefaultQuestion = (): QuizQuestion => ({
    id: generateId(),
    text: '',
    options: [
        createDefaultOption(true),
        createDefaultOption(false)
    ],
    explanation: ''
});

const createDefaultQuizData = (): QuizData => ({
    questions: [createDefaultQuestion()]
});

export default function QuizBuilder({ initialData, onChange, disabled = false }: QuizBuilderProps) {
    // Use a key derived from initialData to reset state when parent resets
    const initialKey = useMemo(() => JSON.stringify(initialData), [initialData]);
    const [quizData, setQuizData] = useState<QuizData>(() => initialData || createDefaultQuizData());
    const [stateKey, setStateKey] = useState(initialKey);

    // Reset state when initialData changes (parent panel reopens)
    if (initialKey !== stateKey) {
        setStateKey(initialKey);
        setQuizData(initialData || createDefaultQuizData());
    }

    // Import panel state
    const [showImportPanel, setShowImportPanel] = useState(false);

    // Notify parent of changes
    const updateQuizData = useCallback((newData: QuizData) => {
        setQuizData(newData);
        onChange(newData);
    }, [onChange]);

    // Passing score handlers
    const handlePassingScoreChange = useCallback((value: string) => {
        if (value === '') {
            updateQuizData({ ...quizData, passingScore: undefined });
            return;
        }
        const score = Math.min(100, Math.max(0, parseInt(value) || 0));
        updateQuizData({ ...quizData, passingScore: score });
    }, [quizData, updateQuizData]);

    // Question handlers
    const addQuestion = useCallback(() => {
        updateQuizData({
            ...quizData,
            questions: [...quizData.questions, createDefaultQuestion()]
        });
    }, [quizData, updateQuizData]);

    const removeQuestion = useCallback((questionIndex: number) => {
        if (quizData.questions.length <= 1) return;
        const newQuestions = quizData.questions.filter((_, i) => i !== questionIndex);
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const moveQuestion = useCallback((questionIndex: number, direction: 'up' | 'down') => {
        const newQuestions = [...quizData.questions];
        const targetIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
        if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
        [newQuestions[questionIndex], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[questionIndex]];
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const updateQuestionText = useCallback((questionIndex: number, text: string) => {
        const newQuestions = [...quizData.questions];
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], text };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const updateQuestionExplanation = useCallback((questionIndex: number, explanation: string) => {
        const newQuestions = [...quizData.questions];
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], explanation };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    // Option handlers
    const addOption = useCallback((questionIndex: number) => {
        const newQuestions = [...quizData.questions];
        newQuestions[questionIndex] = {
            ...newQuestions[questionIndex],
            options: [...newQuestions[questionIndex].options, createDefaultOption(false)]
        };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const removeOption = useCallback((questionIndex: number, optionIndex: number) => {
        const question = quizData.questions[questionIndex];
        if (question.options.length <= 2) return;

        const newQuestions = [...quizData.questions];
        const newOptions = question.options.filter((_, i) => i !== optionIndex);

        // If we removed the correct option, make the first one correct
        if (!newOptions.some(o => o.isCorrect)) {
            newOptions[0] = { ...newOptions[0], isCorrect: true };
        }

        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const updateOptionText = useCallback((questionIndex: number, optionIndex: number, text: string) => {
        const newQuestions = [...quizData.questions];
        const newOptions = [...newQuestions[questionIndex].options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], text };
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    const setCorrectOption = useCallback((questionIndex: number, optionIndex: number) => {
        const newQuestions = [...quizData.questions];
        const newOptions = newQuestions[questionIndex].options.map((option, i) => ({
            ...option,
            isCorrect: i === optionIndex
        }));
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options: newOptions };
        updateQuizData({ ...quizData, questions: newQuestions });
    }, [quizData, updateQuizData]);

    // Import handler — appends imported questions to existing ones
    const handleImportQuestions = useCallback((importedQuestions: QuizQuestion[]) => {
        updateQuizData({
            ...quizData,
            questions: [...quizData.questions, ...importedQuestions]
        });
        setShowImportPanel(false);
    }, [quizData, updateQuizData]);

    return (
        <div className="space-y-6">
            {/* Passing Score */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-purple-400" />
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Passing Score <span className="text-slate-600 font-normal normal-case">(optional)</span>
                    </label>
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={quizData.passingScore ?? ''}
                        onChange={(e) => handlePassingScoreChange(e.target.value)}
                        disabled={disabled}
                        placeholder="—"
                        className="w-24 p-3 rounded-lg bg-white/5 border border-white/10 text-white text-center font-medium outline-none focus:border-purple-500/50 disabled:opacity-50 placeholder-slate-600"
                    />
                    <span className="text-slate-400">%</span>
                </div>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                    {quizData.passingScore
                        ? <>The passing score helps learners assess their understanding. It does <span className="text-slate-400">not</span> prevent lesson completion—learners can retry as many times as they like.</>
                        : <>Leave blank to show learners their score without a pass/fail threshold. Learners will still see how they performed on each question.</>
                    }
                </p>
            </div>

            {/* Questions */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Questions ({quizData.questions.length})
                    </h3>
                    <button
                        onClick={() => setShowImportPanel(true)}
                        disabled={disabled}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 text-xs font-medium transition-all disabled:opacity-50"
                    >
                        <Upload size={14} />
                        Import Questions
                    </button>
                </div>

                {quizData.questions.map((question, qIndex) => (
                    <div
                        key={question.id}
                        className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4"
                    >
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-bold">
                                    {qIndex + 1}
                                </span>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Question
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => moveQuestion(qIndex, 'up')}
                                    disabled={disabled || qIndex === 0}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move up"
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    onClick={() => moveQuestion(qIndex, 'down')}
                                    disabled={disabled || qIndex === quizData.questions.length - 1}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move down"
                                >
                                    <ChevronDown size={16} />
                                </button>
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    disabled={disabled || quizData.questions.length <= 1}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ml-2"
                                    title="Delete question"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Question Text */}
                        <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                            disabled={disabled}
                            placeholder="Enter your question..."
                            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                        />

                        {/* Options */}
                        <div className="space-y-2 pl-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Answer Options
                                </span>
                                <span className="text-xs text-slate-600">
                                    — Check the circle next to the correct answer
                                </span>
                            </div>
                            {question.options.map((option, oIndex) => (
                                <div
                                    key={option.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                        option.isCorrect
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-white/[0.02] border-white/10'
                                    }`}
                                >
                                    <button
                                        onClick={() => setCorrectOption(qIndex, oIndex)}
                                        disabled={disabled}
                                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            option.isCorrect
                                                ? 'border-green-500 bg-green-500'
                                                : 'border-slate-500 hover:border-green-500/50'
                                        }`}
                                        title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
                                    >
                                        {option.isCorrect && <CheckCircle size={12} className="text-white" />}
                                    </button>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                                        disabled={disabled}
                                        placeholder={`Option ${oIndex + 1}`}
                                        className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none disabled:opacity-50"
                                    />
                                    <button
                                        onClick={() => removeOption(qIndex, oIndex)}
                                        disabled={disabled || question.options.length <= 2}
                                        className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Remove option"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => addOption(qIndex)}
                                disabled={disabled}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                            >
                                <Plus size={14} />
                                Add Option
                            </button>
                        </div>

                        {/* Explanation */}
                        <div className="pl-4">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                Explanation (optional)
                            </span>
                            <textarea
                                value={question.explanation || ''}
                                onChange={(e) => updateQuestionExplanation(qIndex, e.target.value)}
                                disabled={disabled}
                                placeholder="Explain why this answer is correct..."
                                rows={2}
                                className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none resize-none focus:border-purple-500/50 disabled:opacity-50"
                            />
                            <p className="mt-1.5 text-[11px] text-slate-600">
                                Shown after the learner submits their answer—use this to reinforce the concept or explain why the correct answer is right.
                            </p>
                        </div>
                    </div>
                ))}

                {/* Add Question Button */}
                <button
                    onClick={addQuestion}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/10 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={18} />
                    Add Question
                </button>
            </div>

            {/* Quiz Import Panel */}
            <QuizImportPanel
                isOpen={showImportPanel}
                onClose={() => setShowImportPanel(false)}
                onImport={handleImportQuestions}
                disabled={disabled}
            />
        </div>
    );
}
