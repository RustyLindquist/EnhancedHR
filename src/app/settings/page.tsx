'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Palette, Check, Upload } from 'lucide-react';
import StandardPageLayout from '@/components/StandardPageLayout';
import CanvasHeader from '@/components/CanvasHeader';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import { BackgroundTheme } from '@/types';

interface UserSettings {
    enable_insights: boolean;
    auto_insights: boolean;
}

interface SettingToggleProps {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    isLoading?: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
    label,
    description,
    enabled,
    onChange,
    isLoading = false
}) => {
    return (
        <div className="flex items-start justify-between gap-6 py-4">
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">{label}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                disabled={isLoading}
                className={`
                    relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0
                    ${enabled
                        ? 'bg-emerald-500/30 border border-emerald-500/50'
                        : 'bg-white/10 border border-white/20'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/40'}
                `}
            >
                <div
                    className={`
                        absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200
                        ${enabled
                            ? 'left-6 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                            : 'left-0.5 bg-slate-400'
                        }
                    `}
                />
            </button>
        </div>
    );
};

interface SettingsSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ icon, title, children }) => {
    return (
        <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-brand-blue-light/10 text-brand-blue-light">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                {children}
            </div>
        </section>
    );
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>({
        enable_insights: true,
        auto_insights: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const supabase = createClient();
    const { currentTheme, setTheme, themes } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setTheme({
                id: 'custom-upload',
                label: 'Custom',
                type: 'custom',
                value: imageUrl
            });
        }
    };

    // Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('enable_insights, auto_insights')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setSettings({
                        enable_insights: profile.enable_insights ?? true,
                        auto_insights: profile.auto_insights ?? false
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [supabase]);

    const updateSetting = async (key: keyof UserSettings, value: boolean) => {
        setIsSaving(key);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('profiles')
                .update({ [key]: value })
                .eq('id', user.id);

            if (error) throw error;

            setSettings(prev => ({ ...prev, [key]: value }));
        } catch (error) {
            console.error('Error updating setting:', error);
            // Revert on error
            setSettings(prev => ({ ...prev }));
        } finally {
            setIsSaving(null);
        }
    };

    if (isLoading) {
        return (
            <StandardPageLayout activeNavId="settings">
                <CanvasHeader context="Settings" title="Settings" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-blue-light border-t-transparent rounded-full animate-spin" />
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout activeNavId="settings">
            <CanvasHeader context="Settings" title="Settings" />

            <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 mt-[60px] relative z-10 custom-scrollbar">
                <div className="max-w-3xl mx-auto animate-fade-in">

                    {/* Appearance Section */}
                    <SettingsSection
                        icon={<Palette size={24} />}
                        title="Appearance"
                    >
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-1">Background Theme</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                Choose a background theme for your workspace. Your selection will be saved and applied across all pages.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {themes.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => setTheme(theme)}
                                        className={`
                                            flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border
                                            ${currentTheme.id === theme.id
                                                ? 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/30 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <span>{theme.label}</span>
                                        {currentTheme.id === theme.id && <Check size={16} />}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                                >
                                    <Upload size={16} />
                                    Upload Custom Background
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Custom backgrounds are session-only and won&apos;t persist after refresh
                                </p>
                            </div>
                        </div>
                    </SettingsSection>

                    {/* Prometheus AI Section */}
                    <SettingsSection
                        icon={<Brain size={24} />}
                        title="Prometheus AI"
                    >
                        <div className="divide-y divide-white/5">
                            <SettingToggle
                                label="Enable AI Insights"
                                description="When enabled, Prometheus will identify key insights during your conversation, which can then be saved to your Personal Context Collection, helping the AI to give more accurate and relevant replies."
                                enabled={settings.enable_insights}
                                onChange={(value) => updateSetting('enable_insights', value)}
                                isLoading={isSaving === 'enable_insights'}
                            />
                            <SettingToggle
                                label="Auto-Save AI Insights"
                                description="This will allow Prometheus to automatically save insights about you to your Personal Context Collection. You can always find, refine, or remove these insights from your Personal Context Collection."
                                enabled={settings.auto_insights}
                                onChange={(value) => updateSetting('auto_insights', value)}
                                isLoading={isSaving === 'auto_insights'}
                            />
                        </div>
                    </SettingsSection>

                </div>
            </div>
        </StandardPageLayout>
    );
}
