import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-slate-500 mb-8">Last Updated: November 29, 2025</p>

            <div className="space-y-8 text-sm leading-relaxed text-slate-300">
                <section>
                    <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, update your profile,
                        or communicate with us. This includes:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                        <li>Name and contact information (email address).</li>
                        <li>Account credentials (encrypted passwords).</li>
                        <li>Payment information (processed securely via Stripe).</li>
                        <li>Learning progress and course activity.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                        <li>Provide, maintain, and improve our services.</li>
                        <li>Process transactions and send related information.</li>
                        <li>Personalize your learning experience (including AI tutoring).</li>
                        <li>Send technical notices, updates, and support messages.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">3. Data Sharing</h2>
                    <p>
                        We do not sell your personal information. We may share your information with:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-400">
                        <li><strong>Service Providers:</strong> Vendors who need access to such information to carry out work on our behalf (e.g., Stripe for payments, Mux for video).</li>
                        <li><strong>Your Organization:</strong> If you access the service through an employer-sponsored account, your employer may view your learning progress.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
                    <p>
                        We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.
                        We use industry-standard encryption for data in transit and at rest.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">5. Your Rights</h2>
                    <p>
                        You have the right to access, correct, or delete your personal information.
                        You can manage your account settings directly within the application or contact us for assistance.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">6. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at privacy@enhancedhr.ai.
                    </p>
                </section>
            </div>
        </div>
    );
}
