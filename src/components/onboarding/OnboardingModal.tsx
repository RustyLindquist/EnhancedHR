'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import AvatarUploadStep from './steps/AvatarUploadStep';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    userId: string;
    userName?: string;
    currentAvatarUrl?: string | null;
}

// Step configuration for extensibility
interface StepConfig {
    id: string;
    title: string;
}

const ONBOARDING_STEPS: StepConfig[] = [
    { id: 'avatar', title: 'Profile Photo' },
    // Future steps can be added here:
    // { id: 'interests', title: 'Your Interests' },
    // { id: 'goals', title: 'Learning Goals' },
];

export default function OnboardingModal({
    isOpen,
    onClose,
    onComplete,
    userId,
    userName,
    currentAvatarUrl,
}: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Last step - complete onboarding
            onComplete();
        }
    };

    const handleSkip = () => {
        // Skip to next step or close if last
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        const step = ONBOARDING_STEPS[currentStep];

        switch (step.id) {
            case 'avatar':
                return (
                    <AvatarUploadStep
                        userId={userId}
                        currentAvatarUrl={currentAvatarUrl}
                        onNext={handleNext}
                        onSkip={handleSkip}
                    />
                );
            // Future steps:
            // case 'interests':
            //     return <InterestsStep onNext={handleNext} onSkip={handleSkip} />;
            default:
                return null;
        }
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Decorative gradient top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue-light via-brand-orange to-brand-blue-light" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Welcome header (only on first step) */}
                {currentStep === 0 && userName && (
                    <div className="pt-8 pb-2 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-blue-light/10 rounded-full mb-3">
                            <Sparkles size={14} className="text-brand-blue-light" />
                            <span className="text-xs font-bold text-brand-blue-light uppercase tracking-wider">
                                Getting Started
                            </span>
                        </div>
                        <h1 className="text-xl font-light text-white">
                            Welcome, <span className="font-bold">{userName.split(' ')[0]}</span>
                        </h1>
                    </div>
                )}

                {/* Step content */}
                <div className="pb-6">
                    {renderStep()}
                </div>

                {/* Progress dots (only if multiple steps) */}
                {ONBOARDING_STEPS.length > 1 && (
                    <div className="flex justify-center gap-2 pb-6">
                        {ONBOARDING_STEPS.map((step, index) => (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(index)}
                                className={`
                                    w-2 h-2 rounded-full transition-all duration-300
                                    ${index === currentStep
                                        ? 'bg-brand-blue-light w-6'
                                        : index < currentStep
                                            ? 'bg-brand-blue-light/50'
                                            : 'bg-white/20'
                                    }
                                `}
                                aria-label={`Go to step ${index + 1}: ${step.title}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
