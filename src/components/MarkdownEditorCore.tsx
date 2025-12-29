'use client';

import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    linkPlugin,
    linkDialogPlugin,
    toolbarPlugin,
    BoldItalicUnderlineToggles,
    ListsToggle,
    BlockTypeSelect,
    CreateLink,
    UndoRedo,
    Separator
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

interface MarkdownEditorCoreProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function MarkdownEditorCore({ value, onChange, placeholder }: MarkdownEditorCoreProps) {
    return (
        <div className="markdown-editor-wrapper">
            <MDXEditor
                markdown={value}
                onChange={onChange}
                placeholder={placeholder}
                contentEditableClassName="mdx-editor-content"
                plugins={[
                    headingsPlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    linkPlugin(),
                    linkDialogPlugin(),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                <UndoRedo />
                                <Separator />
                                <BoldItalicUnderlineToggles />
                                <Separator />
                                <BlockTypeSelect />
                                <Separator />
                                <ListsToggle />
                                <Separator />
                                <CreateLink />
                            </>
                        )
                    })
                ]}
            />
            <style jsx global>{`
                .markdown-editor-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .markdown-editor-wrapper .mdxeditor {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }

                .markdown-editor-wrapper .mdxeditor > div:last-child {
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar {
                    background: rgba(120, 192, 240, 0.15);
                    border-bottom: 1px solid rgba(120, 192, 240, 0.2);
                    padding: 0.5rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.25rem;
                    align-items: center;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button {
                    color: #78C0F0 !important;
                    border-radius: 0.375rem;
                    padding: 0.375rem;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button svg {
                    color: #78C0F0 !important;
                    fill: currentColor;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button:hover {
                    background: rgba(120, 192, 240, 0.25);
                    color: white !important;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button:hover svg {
                    color: white !important;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button[data-state="on"] {
                    background: rgba(120, 192, 240, 0.35);
                    color: white !important;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar button[data-state="on"] svg {
                    color: white !important;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar select {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(120, 192, 240, 0.3);
                    color: #78C0F0;
                    border-radius: 0.375rem;
                    padding: 0.375rem 0.5rem;
                    font-size: 0.875rem;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar select:hover {
                    border-color: rgba(120, 192, 240, 0.5);
                    background: rgba(120, 192, 240, 0.1);
                }

                .markdown-editor-wrapper .mdxeditor-toolbar select option {
                    background: #1e293b;
                    color: white;
                }

                .markdown-editor-wrapper .mdxeditor-toolbar [data-separator] {
                    background: rgba(120, 192, 240, 0.3);
                    width: 1px;
                    height: 1.25rem;
                    margin: 0 0.5rem;
                }

                .markdown-editor-wrapper .mdx-editor-content {
                    min-height: 150px;
                    padding: 0.75rem;
                    color: #cbd5e1;
                    font-size: 0.875rem;
                    line-height: 1.625;
                }

                .markdown-editor-wrapper .mdx-editor-content:focus {
                    outline: none;
                }

                .markdown-editor-wrapper .mdx-editor-content h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }

                .markdown-editor-wrapper .mdx-editor-content h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                    margin-top: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .markdown-editor-wrapper .mdx-editor-content h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: white;
                    margin-top: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .markdown-editor-wrapper .mdx-editor-content p {
                    margin-bottom: 0.75rem;
                }

                .markdown-editor-wrapper .mdx-editor-content ul,
                .markdown-editor-wrapper .mdx-editor-content ol {
                    margin-left: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .markdown-editor-wrapper .mdx-editor-content li {
                    margin-bottom: 0.25rem;
                }

                .markdown-editor-wrapper .mdx-editor-content strong {
                    font-weight: 700;
                    color: white;
                }

                .markdown-editor-wrapper .mdx-editor-content em {
                    font-style: italic;
                }

                .markdown-editor-wrapper .mdx-editor-content a {
                    color: #78C0F0;
                    text-decoration: underline;
                }

                .markdown-editor-wrapper .mdx-editor-content blockquote {
                    border-left: 4px solid rgba(120, 192, 240, 0.5);
                    padding-left: 1rem;
                    margin: 0.75rem 0;
                    font-style: italic;
                    color: #94a3b8;
                }

                .markdown-editor-wrapper .mdx-editor-content code {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    font-size: 0.875rem;
                    color: #78C0F0;
                }

                .markdown-editor-wrapper .mdx-editor-content hr {
                    border: none;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    margin: 1rem 0;
                }

                /* Placeholder styling */
                .markdown-editor-wrapper .mdx-editor-content[data-placeholder]::before {
                    color: #475569;
                    font-style: italic;
                }

                /* Link dialog styling */
                .mdxeditor-popup-container {
                    background: #1e293b !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 0.5rem !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
                }

                .mdxeditor-popup-container input {
                    background: rgba(0, 0, 0, 0.3) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    border-radius: 0.375rem !important;
                    padding: 0.5rem !important;
                }

                .mdxeditor-popup-container button {
                    background: rgba(120, 192, 240, 0.2) !important;
                    color: #78C0F0 !important;
                    border-radius: 0.375rem !important;
                    padding: 0.375rem 0.75rem !important;
                }
            `}</style>
        </div>
    );
}
