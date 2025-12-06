'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Renders markdown content with proper styling for AI chat contexts.
 * Supports GitHub Flavored Markdown (tables, strikethrough, etc.)
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Headings
                    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-white">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1 text-white">{children}</h4>,

                    // Paragraphs
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

                    // Lists
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,

                    // Code
                    code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                            return (
                                <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-brand-blue-light" {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={`${className} block bg-black/30 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => <pre className="my-2">{children}</pre>,

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-brand-blue-light/50 pl-4 my-2 italic text-slate-300">
                            {children}
                        </blockquote>
                    ),

                    // Links
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-blue-light hover:underline">
                            {children}
                        </a>
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full border border-white/10 rounded-lg">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-white/5">{children}</tr>,
                    th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 text-sm">{children}</td>,

                    // Horizontal Rule
                    hr: () => <hr className="my-4 border-white/10" />,

                    // Strong and Em
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
