import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#051114] text-slate-300 font-sans selection:bg-brand-blue-light/30">
            <header className="border-b border-white/10 bg-[#0A0D12]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                        Back
                    </Link>
                    <div className="flex items-center gap-2">
                        <Flame size={20} className="text-brand-orange fill-current" />
                        <span className="font-bold text-white tracking-tight">EnhancedHR.ai</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
                <p className="text-slate-500 mb-8">Last Updated: November 29, 2025</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using EnhancedHR.ai ("the Platform"), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
                        <p>
                            EnhancedHR.ai provides an AI-enhanced learning platform for HR professionals, offering online courses,
                            certification tracking, and AI-powered tutoring. We reserve the right to modify, suspend, or discontinue
                            any part of the service at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account credentials.
                            You agree to notify us immediately of any unauthorized use of your account.
                            EnhancedHR.ai is not liable for any loss or damage arising from your failure to protect your password.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Membership & Billing</h2>
                        <p>
                            <strong>Subscriptions:</strong> Services are billed on a subscription basis (Monthly or Annually).
                            You agree to pay all fees associated with your chosen plan.
                        </p>
                        <p className="mt-2">
                            <strong>Cancellation:</strong> You may cancel your subscription at any time via your account settings.
                            Access will continue until the end of the current billing cycle.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. AI & Content Usage</h2>
                        <p>
                            Our platform utilizes Artificial Intelligence to provide tutoring and assistance.
                            While we strive for accuracy, AI responses may occasionally be incorrect or misleading.
                            You should verify critical information independently.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Intellectual Property</h2>
                        <p>
                            All content, including courses, videos, and software, is the property of EnhancedHR.ai or its content licensors.
                            You are granted a limited, non-exclusive, non-transferable license to access the content for personal,
                            non-commercial learning purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Limitation of Liability</h2>
                        <p>
                            To the fullest extent permitted by law, EnhancedHR.ai shall not be liable for any indirect, incidental,
                            special, consequential, or punitive damages, including loss of profits or data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at support@enhancedhr.ai.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
