'use client';

import React from 'react';
import { AssessmentData } from '@/lib/assessment-parser';
import DisruptionRiskGauge from './DisruptionRiskGauge';
import RoleEvolutionTimeline from './RoleEvolutionTimeline';
import TaskBreakdownChart from './TaskBreakdownChart';
import ActionCards from './ActionCards';
import SkillRecommendations from './SkillRecommendations';

interface AssessmentRendererProps {
    assessment: AssessmentData;
    roleTitle?: string;
    animate?: boolean;
}

const AssessmentRenderer: React.FC<AssessmentRendererProps> = ({
    assessment,
    roleTitle,
    animate = true
}) => {
    return (
        <div className="w-full space-y-10 py-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                        Role Disruption Assessment
                    </span>
                </div>
                {roleTitle && (
                    <h2 className="text-2xl font-bold text-white">
                        {roleTitle}
                    </h2>
                )}
            </div>

            {/* Risk Gauge - Centered */}
            <div className="flex justify-center">
                <DisruptionRiskGauge
                    score={assessment.disruptionScore}
                    riskLevel={assessment.riskLevel}
                    timelineImpact={assessment.timelineImpact}
                    animate={animate}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Timeline */}
            {assessment.timeline && (
                <RoleEvolutionTimeline timeline={assessment.timeline} />
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Task Breakdown */}
            {assessment.taskBreakdown && (
                <TaskBreakdownChart taskBreakdown={assessment.taskBreakdown} />
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Action Cards */}
            {(assessment.immediateActions?.length > 0 || assessment.strategicRecommendations?.length > 0) && (
                <ActionCards
                    immediateActions={assessment.immediateActions || []}
                    strategicRecommendations={assessment.strategicRecommendations || []}
                />
            )}

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Skill Recommendations */}
            {assessment.skillRecommendations?.length > 0 && (
                <SkillRecommendations skillRecommendations={assessment.skillRecommendations} />
            )}
        </div>
    );
};

export default AssessmentRenderer;
