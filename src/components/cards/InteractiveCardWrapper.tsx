'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface InteractiveCardWrapperProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string; // Custom glow color (defaults based on card type)
    disabled?: boolean; // Disable effects (for dragging)
    onDragIntentChange?: (isDragging: boolean) => void; // Callback when drag intent is detected
}

const InteractiveCardWrapper: React.FC<InteractiveCardWrapperProps> = ({
    children,
    className = '',
    glowColor = 'rgba(120, 192, 240, 0.6)', // Default brand blue light
    disabled = false,
    onDragIntentChange
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const [isDragIntent, setIsDragIntent] = useState(false);
    const mouseDownTimeRef = useRef<number>(0);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
    const dragIntentTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Drag intent detection - defined before handleMouseMove
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;

        mouseDownTimeRef.current = Date.now();
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

        // Enable drag intent immediately on mouse down
        // This allows instant drag-and-drop without waiting
        setIsDragIntent(true);
        onDragIntentChange?.(true);
    }, [disabled, onDragIntentChange]);

    const handleMouseUp = useCallback(() => {
        if (dragIntentTimerRef.current) {
            clearTimeout(dragIntentTimerRef.current);
            dragIntentTimerRef.current = null;
        }

        if (isDragIntent) {
            setIsDragIntent(false);
            onDragIntentChange?.(false);
        }

        mouseDownTimeRef.current = 0;
        mouseDownPosRef.current = null;
    }, [isDragIntent, onDragIntentChange]);

    const handleMouseMoveForDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // No longer needed since drag intent is set immediately on mouse down
        // Keeping function for compatibility but it's now a no-op
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || disabled) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Normalize to -1 to 1 range for tilt effect
        const normalizedX = (x / rect.width - 0.5) * 2;
        const normalizedY = (y / rect.height - 0.5) * 2;

        setMousePosition({ x: normalizedX, y: normalizedY });

        // Also check for drag intent
        handleMouseMoveForDrag(e);
    }, [disabled, handleMouseMoveForDrag]);

    const handleMouseEnter = useCallback(() => {
        if (!disabled) setIsHovered(true);
    }, [disabled]);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
    }, []);

    // Cleanup drag timer on unmount
    useEffect(() => {
        return () => {
            if (dragIntentTimerRef.current) {
                clearTimeout(dragIntentTimerRef.current);
            }
        };
    }, []);

    // Calculate transform based on mouse position (subtle tilt)
    const tiltX = mousePosition.y * -3; // Inverted for natural feel
    const tiltY = mousePosition.x * 3;

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className={`relative ${className}`}
            style={{
                transform: isHovered
                    ? `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
                transition: isHovered
                    ? 'transform 0.1s ease-out'
                    : 'transform 0.3s ease-out',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Animated border glow overlay using CSS animation */}
            <div
                className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    padding: '4px',
                    background: `conic-gradient(from var(--gradient-angle), transparent 0%, ${glowColor} 3%, ${glowColor} 18%, transparent 28%, transparent 100%)`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    animation: 'gradient-rotate 3s linear infinite',
                    zIndex: 60,
                }}
            />

            {/* Spotlight effect that follows mouse */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none z-10 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 0.15 : 0,
                    background: `radial-gradient(600px circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%, ${glowColor}, transparent 40%)`,
                }}
            />

            {/* Card content */}
            {children}
        </div>
    );
};

export default InteractiveCardWrapper;
