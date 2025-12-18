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
    const [borderGlowAngle, setBorderGlowAngle] = useState(0);
    const [isDragIntent, setIsDragIntent] = useState(false);
    const mouseDownTimeRef = useRef<number>(0);
    const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
    const dragIntentTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Continuous border animation
    useEffect(() => {
        if (!isHovered) return;

        let animationFrameId: number;
        let lastTimestamp = 0;
        const rotationSpeed = 0.05; // Degrees per millisecond (adjust for speed)

        const animate = (timestamp: number) => {
            if (lastTimestamp === 0) {
                lastTimestamp = timestamp;
            }

            const delta = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            setBorderGlowAngle((prevAngle) => (prevAngle + delta * rotationSpeed) % 360);
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isHovered]);

    // Drag intent detection - defined before handleMouseMove
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;

        mouseDownTimeRef.current = Date.now();
        mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

        // Set a timer to detect drag intent after 200ms of holding
        dragIntentTimerRef.current = setTimeout(() => {
            setIsDragIntent(true);
            onDragIntentChange?.(true);
        }, 200);
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
        // If mouse moves significantly while holding, trigger drag intent immediately
        if (mouseDownPosRef.current && !isDragIntent && dragIntentTimerRef.current) {
            const deltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
            const deltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);

            if (deltaX > 5 || deltaY > 5) {
                clearTimeout(dragIntentTimerRef.current);
                dragIntentTimerRef.current = null;
                setIsDragIntent(true);
                onDragIntentChange?.(true);
            }
        }
    }, [isDragIntent, onDragIntentChange]);

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

    // Generate conic gradient for animated border glow
    const borderGradient = isHovered
        ? `conic-gradient(from ${borderGlowAngle}deg, transparent 0deg, ${glowColor} 60deg, transparent 120deg)`
        : 'none';

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
            {/* Animated border glow overlay */}
            <div
                className="absolute inset-0 rounded-3xl pointer-events-none z-10 transition-opacity duration-300"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: borderGradient,
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
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
