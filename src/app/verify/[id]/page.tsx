import { fetchCertificate } from '@/lib/certificates';
import CertificateView from '@/components/CertificateView';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
    params: {
        id: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const certificate = await fetchCertificate(params.id);

    if (!certificate) {
        return {
            title: 'Certificate Not Found | EnhancedHR.ai'
        };
    }

    return {
        title: `Certificate: ${certificate.courseTitle} | EnhancedHR.ai`,
        description: `Verified certificate for ${certificate.recipientName} for completing ${certificate.courseTitle}.`,
    };
}

export default async function VerifyPage({ params }: PageProps) {
    const certificate = await fetchCertificate(params.id);

    if (!certificate) {
        notFound();
    }

    return <CertificateView details={certificate} />;
}
