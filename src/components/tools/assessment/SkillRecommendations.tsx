'use client';

import React from 'react';
import { GraduationCap, Code, Heart, Briefcase, ExternalLink } from 'lucide-react';
import { getCategoryColor, AssessmentData } from '@/lib/assessment-parser';

interface SkillRecommendationsProps {
    skillRecommendations: AssessmentData['skillRecommendations'];
}

const categoryIcons = {
    technical: Code,
    soft: Heart,
    domain: Briefcase
};

const categoryLabels = {
    technical: 'Technical Skills',
    soft: 'Soft Skills',
    domain: 'Domain Knowledge'
};

const SkillRecommendations: React.FC<SkillRecommendationsProps> = ({ skillRecommendations }) => {
    // Group skills by category
    const groupedSkills = skillRecommendations.reduce((acc, skill) => {
        const category = skill.category || 'domain';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(skill);
        return acc;
    }, {} as Record<string, typeof skillRecommendations>);

    const categories = ['technical', 'soft', 'domain'] as const;

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <GraduationCap size={20} className="text-teal-400" />
                Recommended Skills to Develop
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((category) => {
                    const skills = groupedSkills[category] || [];
                    const Icon = categoryIcons[category];
                    const color = getCategoryColor(category);
                    const label = categoryLabels[category];

                    if (skills.length === 0) return null;

                    return (
                        <div
                            key={category}
                            className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-5"
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <Icon size={20} style={{ color }} />
                                </div>
                                <div>
                                    <h4 className="text-white font-medium text-sm">{label}</h4>
                                    <span className="text-xs text-slate-500">{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Skills List */}
                            <div className="space-y-3">
                                {skills.map((skill, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded-lg bg-white/5 border border-white/5"
                                    >
                                        <span className="text-white text-sm font-medium block mb-1">
                                            {skill.skill}
                                        </span>

                                        {/* Linked Courses */}
                                        {skill.courses && skill.courses.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {skill.courses.map((course, idx) => (
                                                    <a
                                                        key={idx}
                                                        href="#"
                                                        className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors group"
                                                    >
                                                        <GraduationCap size={12} />
                                                        <span className="group-hover:underline">{course}</span>
                                                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Academy CTA */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-teal-600/10 border border-teal-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap size={24} className="text-teal-400" />
                        <div>
                            <h4 className="text-white font-medium text-sm">Explore the Academy</h4>
                            <p className="text-xs text-slate-400">Find courses to develop these skills</p>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-colors">
                        Browse Courses
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillRecommendations;
