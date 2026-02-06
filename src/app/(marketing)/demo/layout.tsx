import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Request a Demo — EnhancedHR.ai',
    description: 'Request a personalized demo of EnhancedHR.ai. See how AI-enhanced learning transforms your HR organization.',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
