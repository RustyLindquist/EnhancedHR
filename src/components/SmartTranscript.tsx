import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TranscriptSegment {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
    speaker: string;
}

interface SmartTranscriptProps {
    currentTime: number;
    onSeek: (time: number) => void;
    segments?: TranscriptSegment[]; // Optional for now, will use mock if not provided
}

const MOCK_TRANSCRIPT: TranscriptSegment[] = [
    { id: '1', startTime: 0, endTime: 5, text: "Welcome to this lesson on Strategic HR Management.", speaker: "Instructor" },
    { id: '2', startTime: 5, endTime: 12, text: "Today we're going to talk about how to align your HR strategy with the overall business goals of your organization.", speaker: "Instructor" },
    { id: '3', startTime: 12, endTime: 20, text: "Many HR professionals struggle with this because they get bogged down in the day-to-day administrative tasks.", speaker: "Instructor" },
    { id: '4', startTime: 20, endTime: 28, text: "But if you want to be a true strategic partner, you need to lift your head up and look at the big picture.", speaker: "Instructor" },
    { id: '5', startTime: 28, endTime: 35, text: "We'll cover three key frameworks that will help you do exactly that.", speaker: "Instructor" },
    { id: '6', startTime: 35, endTime: 45, text: "First, we'll look at the SWOT analysis. Then we'll dive into the Balanced Scorecard.", speaker: "Instructor" },
    { id: '7', startTime: 45, endTime: 55, text: "And finally, we'll discuss the concept of Human Capital Readiness.", speaker: "Instructor" },
    { id: '8', startTime: 55, endTime: 65, text: "So let's get started.", speaker: "Instructor" },
];

const SmartTranscript: React.FC<SmartTranscriptProps> = ({ currentTime, onSeek, segments = MOCK_TRANSCRIPT }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (activeSegmentRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const activeElement = activeSegmentRef.current;

            const containerHeight = container.clientHeight;
            const activeTop = activeElement.offsetTop;
            const activeHeight = activeElement.clientHeight;

            // Scroll so the active element is roughly in the middle
            container.scrollTo({
                top: activeTop - containerHeight / 2 + activeHeight / 2,
                behavior: 'smooth'
            });
        }
    }, [currentTime]);

    return (
        <div className="flex flex-col h-full bg-[#0f172a]/30 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileTextIcon size={14} className="text-brand-blue-light" /> Transcript
                </h3>
                <button className="text-xs text-slate-400 hover:text-white transition-colors">
                    Download PDF
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {segments.map((segment) => {
                    const isActive = currentTime >= segment.startTime && currentTime < segment.endTime;

                    return (
                        <div
                            key={segment.id}
                            ref={isActive ? activeSegmentRef : null}
                            onClick={() => onSeek(segment.startTime)}
                            className={`
                p-3 rounded-lg cursor-pointer transition-all duration-200
                ${isActive
                                    ? 'bg-brand-blue-light/10 border border-brand-blue-light/20 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                    : 'hover:bg-white/5 border border-transparent'}
              `}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-brand-blue-light' : 'text-slate-500'}`}>
                                    {segment.speaker}
                                </span>
                                <span className="text-[10px] font-mono text-slate-600 flex items-center gap-1">
                                    <Clock size={10} /> {formatTime(segment.startTime)}
                                </span>
                            </div>
                            <p className={`text-sm leading-relaxed ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {segment.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper for icon
const FileTextIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default SmartTranscript;
