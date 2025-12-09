import React, { useState, useEffect } from 'react';
import { X, Save, FileText, User, Upload, Brain } from 'lucide-react';
import { ContextItemType, UserContextItem, ProfileDetails } from '../types';
import { createContextItem, updateContextItem } from '../app/actions/context';
import GlobalTopPanel from './GlobalTopPanel';

interface TopContextPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeCollectionId: string;
    itemToEdit?: UserContextItem | null;
    initialType?: ContextItemType; // For "Add Context" vs "Add File"
    userId: string;
}

const TopContextPanel: React.FC<TopContextPanelProps> = ({
    isOpen,
    onClose,
    activeCollectionId,
    itemToEdit,
    initialType = 'CUSTOM_CONTEXT',
    userId
}) => {
    const [title, setTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    // Mock File State
    const [selectedMockFile, setSelectedMockFile] = useState<string | null>(null);
    // Profile Fields
    const [profileData, setProfileData] = useState<ProfileDetails['content']>({});

    const [isSaving, setIsSaving] = useState(false);
    const [itemType, setItemType] = useState<ContextItemType>(initialType);

    // Reset or Load on Open
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setItemType(itemToEdit.type);
                setTitle(itemToEdit.title);
                if (itemToEdit.type === 'CUSTOM_CONTEXT' || itemToEdit.type === 'AI_INSIGHT') {
                    setTextContent((itemToEdit.content as any).text || (itemToEdit.content as any).insight || '');
                } else if (itemToEdit.type === 'PROFILE') {
                    setProfileData(itemToEdit.content);
                }
            } else {
                // New Item
                setItemType(initialType);
                setTitle('');
                setTextContent('');
                setSelectedMockFile(null);
                setProfileData({});
            }
        }
    }, [isOpen, itemToEdit, initialType]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let contentToSave: any = {};

            if (itemType === 'CUSTOM_CONTEXT') {
                contentToSave = { text: textContent };
            } else if (itemType === 'AI_INSIGHT') {
                // Usually not editable via this panel deeply, but we allow text edit
                contentToSave = { ...itemToEdit?.content, insight: textContent };
            } else if (itemType === 'PROFILE') {
                contentToSave = profileData;
            } else if (itemType === 'FILE') {
                // Mock File Save for now - just title/metadata
                contentToSave = {
                    fileName: selectedMockFile || title || 'Uploaded Document',
                    fileType: 'mock',
                    url: '#'
                };
                if (!title) setTitle(selectedMockFile || 'Uploaded Document');
            }

            let collectionIdToSave = activeCollectionId;
            if (activeCollectionId === 'personal-context') {
                collectionIdToSave = ''; // Server action handles empty string as null for global
            }

            if (itemToEdit && itemToEdit.id !== 'virtual-profile-placeholder') {
                await updateContextItem(itemToEdit.id, {
                    title: title || 'Untitled',
                    content: contentToSave
                });
            } else {
                // Create new (or handle virtual profile becoming real)
                await createContextItem({
                    collection_id: collectionIdToSave === 'personal-context' ? null : collectionIdToSave,
                    type: itemType,
                    title: title || (itemType === 'PROFILE' ? 'My Profile' : 'Untitled Context'),
                    content: contentToSave
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save context", error);
            alert("Failed to save context item.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Header Title ---
    const renderTitle = () => (
        <>
            <div className={`p-2 rounded-lg ${itemType === 'PROFILE' ? 'bg-brand-green/10 text-brand-green' :
                itemType === 'AI_INSIGHT' ? 'bg-purple-500/10 text-purple-400' :
                    itemType === 'FILE' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                {itemType === 'PROFILE' && <User size={20} />}
                {itemType === 'AI_INSIGHT' && <Brain size={20} />}
                {itemType === 'CUSTOM_CONTEXT' && <FileText size={20} />}
                {itemType === 'FILE' && <Upload size={20} />}
            </div>
            <h2 className="text-xl font-bold text-white">
                {itemToEdit && itemToEdit.id !== 'virtual-profile-placeholder' ? 'Edit Context Item' : 'Add Context Item'}
            </h2>
        </>
    );

    // --- Header Actions ---
    const renderHeaderActions = () => (
        <button
            onClick={handleSave}
            disabled={isSaving}
            className="
                flex items-center gap-2 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wide
                bg-brand-blue-light text-brand-black hover:bg-white transition-colors shadow-[0_0_20px_rgba(120,192,240,0.3)]
                disabled:opacity-50 disabled:cursor-not-allowed
            "
        >
            {isSaving ? 'Saving...' : 'Save'}
            {!isSaving && <Save size={14} />}
        </button>
    );

    return (
        <GlobalTopPanel
            isOpen={isOpen}
            onClose={onClose}
            title={renderTitle()}
            headerActions={renderHeaderActions()}
        >
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Title Input */}
                {itemType !== 'PROFILE' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                            {itemType === 'AI_INSIGHT' ? 'Insight Source' : 'Title / Identifier'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={itemType === 'AI_INSIGHT'}
                            placeholder="e.g. Project Alpha Specs"
                            className={`w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-brand-blue-light transition-all text-lg
                                   ${itemType === 'AI_INSIGHT' ? 'opacity-60 cursor-not-allowed' : ''}
                               `}
                        />
                        {itemType === 'AI_INSIGHT' && (
                            <p className="text-[10px] text-purple-400 mt-2 flex items-center gap-1">
                                <Brain size={12} />
                                Extracted from conversation
                            </p>
                        )}
                    </div>
                )}

                {/* Content Editors */}
                {(itemType === 'CUSTOM_CONTEXT' || itemType === 'AI_INSIGHT') && (
                    <div className="h-[300px]">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Context / Insight</label>
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            placeholder="Enter detailed context here..."
                            className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-brand-blue-light transition-all resize-none text-base leading-relaxed font-light"
                        />
                        <p className="text-xs text-slate-500 mt-2 text-right">Press Enter for new line.</p>
                    </div>
                )}

                {itemType === 'PROFILE' && (
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { k: 'role', l: 'Role / Job Title' },
                            { k: 'yearsInRole', l: 'Years in Role' },
                            { k: 'yearsInCompany', l: 'Years in Company' },
                            { k: 'yearsInHR', l: 'Years in HR' },
                            { k: 'linkedInUrl', l: 'LinkedIn URL' },
                            { k: 'objectives', l: 'Objectives & Goals' },
                            { k: 'measuresOfSuccess', l: 'Measures of Success' },
                            { k: 'directReports', l: 'Number of Direct Reports' },
                            { k: 'areasOfConcern', l: 'Current Areas of Concern' },
                            { k: 'areasOfInterest', l: 'Current Areas of Interest' },
                        ].map(({ k, l }) => (
                            <div key={k}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">{l}</label>
                                <input
                                    type="text"
                                    value={(profileData as any)[k] || ''}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, [k]: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-brand-green transition-all"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {itemType === 'FILE' && (
                    selectedMockFile ? (
                        <div className="border border-white/10 bg-white/5 rounded-2xl p-6 flex items-center justify-between group animate-fade-in-up">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{selectedMockFile}</h3>
                                    <p className="text-xs text-slate-400">Ready to upload</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMockFile(null)}
                                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => setSelectedMockFile('example-document.pdf')}
                            className="border-2 border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-slate-500 hover:border-brand-blue-light/50 hover:bg-white/5 transition-all cursor-pointer group"
                        >
                            <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-slate-400 group-hover:text-brand-blue-light" />
                            </div>
                            <p className="text-lg font-medium text-slate-300">Drag and drop file here</p>
                            <p className="text-sm opacity-50 mt-2 mb-6">Support for PDF, DOCX, TXT</p>
                            <button className="px-6 py-2 bg-white/10 rounded-full text-sm font-bold text-white hover:bg-white/20 transition-colors">
                                Browse Files
                            </button>
                        </div>
                    )
                )}
            </div>
        </GlobalTopPanel>
    );
};

export default TopContextPanel;
