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
    duration = 700
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
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [delay])

    const initialTransform = {
        up: 'translateY(24px)',
        down: 'translateY(-24px)',
        left: 'translateX(24px)',
        right: 'translateX(-24px)',
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
