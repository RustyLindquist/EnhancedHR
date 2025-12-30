'use client';

import React, { useState, useTransition } from 'react';
import {
    Award,
    GraduationCap,
    Briefcase,
    Star,
    BookOpen,
    Trophy,
    Plus,
    X,
    Loader2,
    GripVertical,
    Pencil,
    Check,
    LucideIcon
} from 'lucide-react';
import {
    ExpertCredential,
    CredentialType,
    createCredential,
    updateCredential,
    deleteCredential,
    adminCreateCredential,
    adminUpdateCredential,
    adminDeleteCredential
} from '@/app/actions/credentials';

// Icon mapping for credential types
export const credentialTypeConfig: Record<CredentialType, { icon: LucideIcon; label: string; color: string }> = {
    certification: { icon: Award, label: 'Certification', color: 'text-amber-400' },
    degree: { icon: GraduationCap, label: 'Degree', color: 'text-blue-400' },
    experience: { icon: Briefcase, label: 'Experience', color: 'text-green-400' },
    expertise: { icon: Star, label: 'Expertise', color: 'text-purple-400' },
    publication: { icon: BookOpen, label: 'Publication', color: 'text-pink-400' },
    achievement: { icon: Trophy, label: 'Achievement', color: 'text-orange-400' },
};

interface CredentialsEditorProps {
    credentials: ExpertCredential[];
    onCredentialsChange?: (credentials: ExpertCredential[]) => void;
    isAdmin?: boolean;
    expertId?: string; // Required for admin mode
    readOnly?: boolean;
}

export default function CredentialsEditor({
    credentials: initialCredentials,
    onCredentialsChange,
    isAdmin = false,
    expertId,
    readOnly = false,
}: CredentialsEditorProps) {
    const [credentials, setCredentials] = useState<ExpertCredential[]>(initialCredentials);
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // New credential form state
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<CredentialType>('certification');

    // Edit form state
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState<CredentialType>('certification');

    const handleAdd = () => {
        if (!newTitle.trim()) return;
        setError(null);

        startTransition(async () => {
            const result = isAdmin && expertId
                ? await adminCreateCredential(expertId, { title: newTitle.trim(), type: newType })
                : await createCredential({ title: newTitle.trim(), type: newType });

            if (result.success && result.credential) {
                const updated = [...credentials, result.credential];
                setCredentials(updated);
                onCredentialsChange?.(updated);
                setNewTitle('');
                setNewType('certification');
                setIsAdding(false);
            } else {
                setError(result.error || 'Failed to add credential');
            }
        });
    };

    const handleUpdate = (credentialId: string) => {
        if (!editTitle.trim()) return;
        setError(null);

        startTransition(async () => {
            const result = isAdmin
                ? await adminUpdateCredential(credentialId, { title: editTitle.trim(), type: editType })
                : await updateCredential(credentialId, { title: editTitle.trim(), type: editType });

            if (result.success) {
                const updated = credentials.map(c =>
                    c.id === credentialId ? { ...c, title: editTitle.trim(), type: editType } : c
                );
                setCredentials(updated);
                onCredentialsChange?.(updated);
                setEditingId(null);
            } else {
                setError(result.error || 'Failed to update credential');
            }
        });
    };

    const handleDelete = (credentialId: string) => {
        setError(null);

        startTransition(async () => {
            const result = isAdmin
                ? await adminDeleteCredential(credentialId)
                : await deleteCredential(credentialId);

            if (result.success) {
                const updated = credentials.filter(c => c.id !== credentialId);
                setCredentials(updated);
                onCredentialsChange?.(updated);
            } else {
                setError(result.error || 'Failed to delete credential');
            }
        });
    };

    const startEdit = (credential: ExpertCredential) => {
        setEditingId(credential.id);
        setEditTitle(credential.title);
        setEditType(credential.type);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
        setEditType('certification');
    };

    const TypeSelector = ({
        value,
        onChange,
        disabled
    }: {
        value: CredentialType;
        onChange: (type: CredentialType) => void;
        disabled?: boolean;
    }) => (
        <div className="flex flex-wrap gap-2">
            {(Object.keys(credentialTypeConfig) as CredentialType[]).map((type) => {
                const config = credentialTypeConfig[type];
                const Icon = config.icon;
                const isSelected = value === type;

                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => onChange(type)}
                        disabled={disabled}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${isSelected
                                ? `bg-white/10 border-2 border-white/30 ${config.color}`
                                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <Icon size={14} />
                        <span>{config.label}</span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Credentials List */}
            <div className="space-y-2">
                {credentials.length === 0 && !isAdding && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-center">
                        No credentials added yet
                    </div>
                )}

                {credentials.map((credential) => {
                    const config = credentialTypeConfig[credential.type];
                    const Icon = config.icon;
                    const isEditing = editingId === credential.id;

                    if (isEditing) {
                        return (
                            <div
                                key={credential.id}
                                className="p-4 rounded-xl bg-white/5 border border-white/20 space-y-3"
                            >
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Credential title"
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-white/30"
                                    disabled={isPending}
                                    autoFocus
                                />
                                <TypeSelector
                                    value={editType}
                                    onChange={setEditType}
                                    disabled={isPending}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={cancelEdit}
                                        disabled={isPending}
                                        className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(credential.id)}
                                        disabled={isPending || !editTitle.trim()}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/20 text-brand-blue-light text-xs font-medium hover:bg-brand-blue-light/30 transition-colors disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={credential.id}
                            className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                        >
                            {!readOnly && (
                                <GripVertical size={14} className="text-slate-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className={`p-1.5 rounded-lg bg-white/5 ${config.color}`}>
                                <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-white text-sm">{credential.title}</span>
                                <span className="ml-2 text-slate-500 text-xs">{config.label}</span>
                            </div>
                            {!readOnly && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(credential)}
                                        disabled={isPending}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(credential.id)}
                                        disabled={isPending}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add New Credential */}
            {!readOnly && (
                <>
                    {isAdding ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-brand-blue-light/30 space-y-3">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Enter credential (e.g., SHRM-SCP, MBA, 15+ Years Experience)"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-white/30"
                                disabled={isPending}
                                autoFocus
                            />
                            <TypeSelector
                                value={newType}
                                onChange={setNewType}
                                disabled={isPending}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewTitle('');
                                        setNewType('certification');
                                    }}
                                    disabled={isPending}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={isPending || !newTitle.trim()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-orange/20 text-brand-orange text-xs font-medium hover:bg-brand-orange/30 transition-colors disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                    Add Credential
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="text-sm">Add Credential</span>
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

// Display-only component for showing credentials with icons (for Academy pages)
export function CredentialsDisplay({ credentials }: { credentials: ExpertCredential[] }) {
    return (
        <div className="space-y-2">
            {credentials.map((credential) => {
                const config = credentialTypeConfig[credential.type];
                const Icon = config.icon;

                return (
                    <div
                        key={credential.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5"
                    >
                        <Icon size={14} className={config.color} />
                        <span className="text-sm text-white">{credential.title}</span>
                    </div>
                );
            })}
        </div>
    );
}
