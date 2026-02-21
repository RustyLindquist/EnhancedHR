'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import DropdownPanel from '@/components/DropdownPanel';
import { QuizQuestion, QuizOption } from '@/types';

interface QuizImportPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: QuizQuestion[]) => void;
    disabled?: boolean;
}

const generateId = () => `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ParseResult {
    questions: QuizQuestion[];
    skippedRows: number;
    warnings: string[];
}

function parseSpreadsheet(data: ArrayBuffer): ParseResult {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error('Spreadsheet has no sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
        throw new Error('Spreadsheet must have a header row and at least one question row');
    }

    // Skip the header row
    const dataRows = rows.slice(1);
    const questions: QuizQuestion[] = [];
    let skippedRows = 0;
    const warnings: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) {
            skippedRows++;
            continue;
        }

        const questionText = String(row[0] ?? '').trim();
        if (!questionText) {
            skippedRows++;
            continue;
        }

        const explanation = String(row[1] ?? '').trim();

        // Columns C onward (index 2+) are answer choices
        const options: QuizOption[] = [];
        let hasCorrectAnswer = false;

        for (let col = 2; col < row.length; col++) {
            const cellValue = row[col];
            if (cellValue == null || String(cellValue).trim() === '' || String(cellValue) === 'NaN') {
                continue;
            }

            let text = String(cellValue).trim();
            let isCorrect = false;

            if (text.startsWith('*')) {
                isCorrect = true;
                hasCorrectAnswer = true;
                text = text.substring(1).trim();
            }

            if (text) {
                options.push({
                    id: generateId(),
                    text,
                    isCorrect
                });
            }
        }

        if (options.length < 2) {
            warnings.push(`Row ${i + 2}: "${questionText.substring(0, 40)}..." skipped — needs at least 2 answer options`);
            skippedRows++;
            continue;
        }

        // Fallback: if no correct answer marked, mark the first option
        if (!hasCorrectAnswer) {
            options[0].isCorrect = true;
            warnings.push(`Row ${i + 2}: No correct answer marked with *, defaulting to first option`);
        }

        questions.push({
            id: generateId(),
            text: questionText,
            options,
            explanation: explanation || undefined
        });
    }

    return { questions, skippedRows, warnings };
}

export default function QuizImportPanel({ isOpen, onClose, onImport, disabled = false }: QuizImportPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ParseResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setFile(null);
        setError(null);
        setResult(null);
        setIsProcessing(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    const validateAndSetFile = useCallback((f: File) => {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const validExtensions = /\.(xlsx|xls)$/i;

        if (!validTypes.includes(f.type) && !validExtensions.test(f.name)) {
            setError('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        if (f.size > 10 * 1024 * 1024) {
            setError('File is too large. Maximum size is 10MB.');
            return;
        }

        setFile(f);
        setError(null);
        setResult(null);
    }, []);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndSetFile(files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSetFile(files[0]);
        }
    };

    const handleImport = useCallback(async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const parseResult = parseSpreadsheet(data);

            if (parseResult.questions.length === 0) {
                setError('No valid questions found in the spreadsheet. Make sure the first sheet has questions with at least 2 answer options each.');
                setIsProcessing(false);
                return;
            }

            setResult(parseResult);
            onImport(parseResult.questions);

            // Close panel after short delay to show success
            setTimeout(() => {
                handleClose();
            }, 800);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse spreadsheet');
        } finally {
            setIsProcessing(false);
        }
    }, [file, onImport, handleClose]);

    const headerActions = (
        <div className="flex items-center gap-3">
            {result && result.questions.length > 0 && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>{result.questions.length} questions imported!</span>
                </div>
            )}
            <button
                onClick={handleImport}
                disabled={!file || isProcessing || disabled}
                className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50"
            >
                {isProcessing ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Upload size={16} />
                        Import Quiz
                    </>
                )}
            </button>
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Quiz Questions"
            icon={FileSpreadsheet}
            iconColor="text-purple-400"
            headerActions={headerActions}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl">
                {/* Left: Instructions + SVG Illustration */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Spreadsheet Format</h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        Create an Excel spreadsheet with your quiz questions, then upload it here.
                        Questions will be added to the end of your existing quiz.
                    </p>

                    {/* SVG Illustration of spreadsheet format */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-6 mb-6">
                        <svg viewBox="0 0 480 220" className="w-full" xmlns="http://www.w3.org/2000/svg">
                            {/* Background grid */}
                            <rect x="0" y="0" width="480" height="220" rx="8" fill="#0f172a" />

                            {/* Header row background */}
                            <rect x="8" y="8" width="464" height="32" rx="4" fill="#7c3aed" opacity="0.2" />

                            {/* Header cells */}
                            <text x="20" y="29" fill="#a78bfa" fontSize="11" fontWeight="bold" fontFamily="monospace">Question</text>
                            <text x="130" y="29" fill="#a78bfa" fontSize="11" fontWeight="bold" fontFamily="monospace">Explanation</text>
                            <text x="260" y="29" fill="#a78bfa" fontSize="11" fontWeight="bold" fontFamily="monospace">Choice 1</text>
                            <text x="360" y="29" fill="#a78bfa" fontSize="11" fontWeight="bold" fontFamily="monospace">Choice 2</text>
                            <text x="440" y="29" fill="#a78bfa" fontSize="11" fontWeight="bold" fontFamily="monospace">...</text>

                            {/* Column dividers */}
                            <line x1="120" y1="8" x2="120" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="250" y1="8" x2="250" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="350" y1="8" x2="350" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="432" y1="8" x2="432" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />

                            {/* Row 1 */}
                            <rect x="8" y="48" width="464" height="36" rx="4" fill="#1e293b" />
                            <text x="20" y="71" fill="#94a3b8" fontSize="10" fontFamily="monospace">What is the...</text>
                            <text x="130" y="71" fill="#64748b" fontSize="10" fontFamily="monospace">The correct...</text>
                            <text x="260" y="71" fill="#94a3b8" fontSize="10" fontFamily="monospace">Option A</text>
                            {/* Correct answer with asterisk */}
                            <rect x="353" y="55" width="75" height="22" rx="4" fill="#22c55e" opacity="0.15" />
                            <text x="358" y="71" fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="monospace">*Option B</text>

                            {/* Row 2 */}
                            <rect x="8" y="92" width="464" height="36" rx="4" fill="#0f172a" />
                            <text x="20" y="115" fill="#94a3b8" fontSize="10" fontFamily="monospace">During exec...</text>
                            <text x="130" y="115" fill="#64748b" fontSize="10" fontFamily="monospace">The correct...</text>
                            {/* Correct answer with asterisk */}
                            <rect x="253" y="99" width="92" height="22" rx="4" fill="#22c55e" opacity="0.15" />
                            <text x="260" y="115" fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="monospace">*Option A</text>
                            <text x="360" y="115" fill="#94a3b8" fontSize="10" fontFamily="monospace">Option B</text>

                            {/* Row 3 */}
                            <rect x="8" y="136" width="464" height="36" rx="4" fill="#1e293b" />
                            <text x="20" y="159" fill="#94a3b8" fontSize="10" fontFamily="monospace">Which of...</text>
                            <text x="130" y="159" fill="#64748b" fontSize="10" fontFamily="monospace">This question...</text>
                            <text x="260" y="159" fill="#94a3b8" fontSize="10" fontFamily="monospace">Option A</text>
                            <text x="360" y="159" fill="#94a3b8" fontSize="10" fontFamily="monospace">Option B</text>
                            {/* Correct answer in a later column */}
                            <rect x="435" y="143" width="30" height="22" rx="4" fill="#22c55e" opacity="0.15" />
                            <text x="440" y="159" fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="monospace">*C</text>

                            {/* Legend */}
                            <rect x="8" y="190" width="12" height="12" rx="3" fill="#22c55e" opacity="0.3" />
                            <text x="26" y="200" fill="#4ade80" fontSize="10" fontFamily="sans-serif">* = Correct answer</text>

                            <text x="180" y="200" fill="#64748b" fontSize="10" fontFamily="sans-serif">Up to 10 answer choices per question</text>
                        </svg>
                    </div>

                    {/* Instructions list */}
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <p className="text-slate-400">First column is the <span className="text-white">question text</span></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <p className="text-slate-400">Second column is an optional <span className="text-white">explanation</span></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <p className="text-slate-400">Remaining columns are <span className="text-white">answer choices</span> (up to 10)</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex-shrink-0 mt-0.5">*</span>
                            <p className="text-slate-400">Mark correct answers with an <span className="text-green-400 font-bold">asterisk (*)</span> at the beginning</p>
                        </div>
                    </div>
                </div>

                {/* Right: File Dropzone */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Upload Spreadsheet</h3>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileInputChange}
                        accept=".xlsx,.xls"
                        className="hidden"
                        disabled={disabled}
                    />

                    {!file ? (
                        <div
                            onClick={() => !disabled && fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                relative p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${isDragging
                                    ? 'border-purple-400 bg-purple-500/10'
                                    : 'border-white/20 hover:border-white/40 bg-white/[0.02]'
                                }
                            `}
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                    <FileSpreadsheet size={28} className="text-purple-400" />
                                </div>
                                <p className="text-white font-medium mb-2">
                                    {isDragging ? 'Drop your spreadsheet here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Excel files (.xlsx, .xls) up to 10MB
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <FileSpreadsheet size={20} className="text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setError(null);
                                        setResult(null);
                                    }}
                                    disabled={disabled || isProcessing}
                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Warnings from parsing */}
                    {result && result.warnings.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-yellow-400 text-sm font-medium mb-2">Warnings:</p>
                            <ul className="space-y-1">
                                {result.warnings.map((w, i) => (
                                    <li key={i} className="text-yellow-400/70 text-xs">{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Help text */}
                    <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Only the first worksheet (tab) in your spreadsheet will be imported.
                            The first row should contain column headers and will be skipped.
                            Questions will be added to the end of your existing quiz.
                        </p>
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
