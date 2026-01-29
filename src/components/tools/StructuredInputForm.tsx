'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, ChevronDown, ChevronUp, X, Loader2, ArrowRight } from 'lucide-react';

export interface StructuredInput {
    roleTitle: string;
    jobDescriptionFile?: File;
    jobDescriptionText?: string;
    industry?: string;
    companySize?: 'small' | 'medium' | 'large' | 'enterprise';
    employeesInRole?: number;
    aiAdoptionLevel?: 'low' | 'medium' | 'high' | 'advanced';
}

interface StructuredInputFormProps {
    onSubmit: (input: StructuredInput, formattedContext: string) => void;
    isLoading?: boolean;
}

const companySizes = [
    { value: 'small', label: 'Small (<100 employees)' },
    { value: 'medium', label: 'Medium (100-500 employees)' },
    { value: 'large', label: 'Large (500-2,000 employees)' },
    { value: 'enterprise', label: 'Enterprise (2,000+ employees)' }
];

const aiAdoptionLevels = [
    { value: 'low', label: 'Low - Minimal AI usage' },
    { value: 'medium', label: 'Medium - Some AI tools adopted' },
    { value: 'high', label: 'High - Significant AI integration' },
    { value: 'advanced', label: 'Advanced - AI-first organization' }
];

const StructuredInputForm: React.FC<StructuredInputFormProps> = ({
    onSubmit,
    isLoading = false
}) => {
    const [roleTitle, setRoleTitle] = useState('');
    const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
    const [jobDescriptionText, setJobDescriptionText] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [industry, setIndustry] = useState('');
    const [companySize, setCompanySize] = useState<string>('');
    const [employeesInRole, setEmployeesInRole] = useState<string>('');
    const [aiAdoptionLevel, setAiAdoptionLevel] = useState('');

    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type)) {
            setParseError('Please upload a PDF, DOCX, or TXT file');
            return;
        }

        // Validate file size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
            setParseError('File size must be less than 25MB');
            return;
        }

        setJobDescriptionFile(file);
        setParseError(null);
        setIsParsingFile(true);

        try {
            // Parse file content using the API
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/parse-file', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to parse file');
            }

            const data = await response.json();
            if (data.text) {
                setJobDescriptionText(data.text);
            } else {
                throw new Error('No text content extracted');
            }
        } catch (error) {
            console.error('[StructuredInputForm] File parse error:', error);
            // If API doesn't exist, read as text for txt files
            if (file.type === 'text/plain') {
                const text = await file.text();
                setJobDescriptionText(text);
            } else {
                setParseError('Could not parse file. Please paste the job description manually.');
            }
        } finally {
            setIsParsingFile(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const removeFile = () => {
        setJobDescriptionFile(null);
        setJobDescriptionText('');
        setParseError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatContext = (): string => {
        const parts: string[] = [`Please analyze the role: **${roleTitle}**`];

        if (industry) parts.push(`Industry: ${industry}`);
        if (companySize) {
            const sizeLabel = companySizes.find(s => s.value === companySize)?.label || companySize;
            parts.push(`Company Size: ${sizeLabel}`);
        }
        if (employeesInRole) parts.push(`Employees in this role: ${employeesInRole}`);
        if (aiAdoptionLevel) {
            const levelLabel = aiAdoptionLevels.find(l => l.value === aiAdoptionLevel)?.label || aiAdoptionLevel;
            parts.push(`Current AI Adoption: ${levelLabel}`);
        }
        if (jobDescriptionText) {
            parts.push(`\n---\n**Job Description:**\n${jobDescriptionText}`);
        }

        return parts.join('\n');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!roleTitle.trim()) return;

        const input: StructuredInput = {
            roleTitle: roleTitle.trim(),
            jobDescriptionFile: jobDescriptionFile || undefined,
            jobDescriptionText: jobDescriptionText || undefined,
            industry: industry || undefined,
            companySize: companySize as StructuredInput['companySize'] || undefined,
            employeesInRole: employeesInRole ? parseInt(employeesInRole, 10) : undefined,
            aiAdoptionLevel: aiAdoptionLevel as StructuredInput['aiAdoptionLevel'] || undefined
        };

        onSubmit(input, formatContext());
    };

    const isValid = roleTitle.trim().length > 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Title - Required */}
            <div>
                <label className="block text-sm font-medium text-white mb-2">
                    Role Title <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior Financial Analyst"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                    disabled={isLoading}
                />
            </div>

            {/* Job Description Upload - Optional */}
            <div>
                <label className="block text-sm font-medium text-white mb-2">
                    Job Description <span className="text-slate-500">(optional)</span>
                </label>

                {!jobDescriptionFile ? (
                    <div
                        className={`
                            border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
                            ${isDragOver
                                ? 'border-teal-500 bg-teal-500/10'
                                : 'border-white/20 hover:border-white/30 hover:bg-white/5'
                            }
                        `}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={24} className={`mx-auto mb-2 ${isDragOver ? 'text-teal-400' : 'text-slate-400'}`} />
                        <p className="text-sm text-slate-400">
                            Drag & drop a PDF or DOCX file, or <span className="text-teal-400">click to browse</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Max 25MB</p>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                    <FileText size={20} className="text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-white font-medium truncate max-w-[200px]">
                                        {jobDescriptionFile.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {(jobDescriptionFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            {isParsingFile ? (
                                <Loader2 size={20} className="text-teal-400 animate-spin" />
                            ) : (
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {jobDescriptionText && (
                            <p className="mt-2 text-xs text-green-400">
                                Content extracted successfully
                            </p>
                        )}
                    </div>
                )}

                {parseError && (
                    <p className="mt-2 text-xs text-red-400">{parseError}</p>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                />
            </div>

            {/* Advanced Options Toggle */}
            <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Additional Context (optional)
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    {/* Industry */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Industry
                        </label>
                        <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g., Financial Services, Healthcare, Technology"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Company Size */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Company Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {companySizes.map((size) => (
                                <button
                                    key={size.value}
                                    type="button"
                                    onClick={() => setCompanySize(companySize === size.value ? '' : size.value)}
                                    className={`
                                        px-3 py-2 rounded-lg text-xs font-medium transition-all
                                        ${companySize === size.value
                                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
                                        }
                                    `}
                                    disabled={isLoading}
                                >
                                    {size.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Employees in Role */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Number of Employees in This Role
                        </label>
                        <input
                            type="number"
                            value={employeesInRole}
                            onChange={(e) => setEmployeesInRole(e.target.value)}
                            placeholder="e.g., 25"
                            min="1"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                            disabled={isLoading}
                        />
                    </div>

                    {/* AI Adoption Level */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Current AI Adoption Level
                        </label>
                        <select
                            value={aiAdoptionLevel}
                            onChange={(e) => setAiAdoptionLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500/50"
                            disabled={isLoading}
                        >
                            <option value="">Select level...</option>
                            {aiAdoptionLevels.map((level) => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`
                    w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all
                    ${isValid && !isLoading
                        ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                    }
                `}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Starting Assessment...
                    </>
                ) : (
                    <>
                        Start Assessment
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
        </form>
    );
};

export default StructuredInputForm;
