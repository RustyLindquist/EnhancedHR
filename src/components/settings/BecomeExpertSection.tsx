'use client';

import React, { useState } from 'react';
import BecomeExpertBanner from './BecomeExpertBanner';
import ExpertProposalForm from './ExpertProposalForm';
import ExpertApplicationStatus from './ExpertApplicationStatus';

interface Proposal {
    id: string;
    title: string;
    description: string;
    status: string;
    admin_notes?: string;
    created_at: string;
}

interface BecomeExpertSectionProps {
    userId: string;
    fullName: string;
    authorStatus: string | null;
    applicationStatus: string | null;
    applicationSubmittedAt: string | null;
    rejectionNotes: string | null;
    courseProposalTitle: string | null;
    courseProposalDescription: string | null;
    existingTitle?: string;
    existingLinkedIn?: string;
    existingBio?: string;
    proposals: Proposal[];
}

type ViewState = 'banner' | 'form' | 'status';

export default function BecomeExpertSection({
    userId,
    fullName,
    authorStatus,
    applicationStatus,
    applicationSubmittedAt,
    rejectionNotes,
    courseProposalTitle,
    courseProposalDescription,
    existingTitle,
    existingLinkedIn,
    existingBio,
    proposals,
}: BecomeExpertSectionProps) {
    // Determine initial view state based on author_status
    const getInitialView = (): ViewState => {
        if (authorStatus === 'pending') {
            return 'status';
        }
        return 'banner';
    };

    const [viewState, setViewState] = useState<ViewState>(getInitialView());
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Handle successful submission - show status view
    const handleSubmitSuccess = () => {
        setHasSubmitted(true);
        // The form component handles showing the success state
        // After a brief delay, we could transition to status view
        // But for now, the form's internal success state is sufficient
    };

    // Show status view for pending experts
    if (authorStatus === 'pending' || hasSubmitted) {
        // If just submitted, show the form's success state
        // Otherwise show the full status component
        if (hasSubmitted && viewState === 'form') {
            // The form handles its own success state
            return (
                <ExpertProposalForm
                    userId={userId}
                    fullName={fullName}
                    existingTitle={existingTitle}
                    existingLinkedIn={existingLinkedIn}
                    existingBio={existingBio}
                    onSubmitSuccess={handleSubmitSuccess}
                />
            );
        }

        return (
            <ExpertApplicationStatus
                profile={{
                    id: userId,
                    author_status: authorStatus || 'pending',
                    application_status: applicationStatus || 'submitted',
                    application_submitted_at: applicationSubmittedAt || new Date().toISOString(),
                    rejection_notes: rejectionNotes || undefined,
                    course_proposal_title: courseProposalTitle || undefined,
                    course_proposal_description: courseProposalDescription || undefined,
                }}
                proposals={proposals}
                onNewProposal={() => setViewState('form')}
            />
        );
    }

    // Banner → Form flow for non-experts
    if (viewState === 'form') {
        return (
            <ExpertProposalForm
                userId={userId}
                fullName={fullName}
                existingTitle={existingTitle}
                existingLinkedIn={existingLinkedIn}
                existingBio={existingBio}
                onSubmitSuccess={handleSubmitSuccess}
            />
        );
    }

    // Default: Show the banner
    return (
        <BecomeExpertBanner
            onSubmitProposal={() => setViewState('form')}
        />
    );
}
