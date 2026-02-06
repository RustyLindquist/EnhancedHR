'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface FadeInProps {
    children: ReactNode
    className?: string
    delay?: number
    direction?: 'up' | 'down' | 'left' | 'right' | 'none'
    duration?: number
}

export default function FadeIn({
    children,
    className = '',
    delay = 0,
    direction = 'up',
    duration = 400
}: FadeInProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        el.style.opacity = '1'
                        el.style.transform = 'translate(0, 0)'
                    }, delay)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [delay])

    const initialTransform = {
        up: 'translateY(12px)',
        down: 'translateY(-12px)',
        left: 'translateX(12px)',
        right: 'translateX(-12px)',
        none: 'translate(0, 0)',
    }

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                transform: initialTransform[direction],
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                willChange: 'opacity, transform',
            }}
        >
            {children}
        </div>
    )
}
