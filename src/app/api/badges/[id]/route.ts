import { fetchCertificate } from '@/lib/certificates';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const certificate = await fetchCertificate(params.id);

    if (!certificate) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Open Badges v2.0 Standard
    const badgeData = {
        "@context": "https://w3id.org/openbadges/v2",
        "type": "Assertion",
        "id": `https://enhancedhr.ai/api/badges/${certificate.id}`,
        "recipient": {
            "type": "email",
            "hashed": true,
            "salt": "enhancedhr-salt", // In production, use real salt
            "identity": "sha256$..." // In production, hash the user's email
        },
        "issuedOn": new Date(certificate.completionDate).toISOString(),
        "badge": {
            "type": "BadgeClass",
            "id": `https://enhancedhr.ai/badges/course/${certificate.courseId}`,
            "name": certificate.courseTitle,
            "description": `Certificate of Completion for ${certificate.courseTitle}`,
            "image": "https://enhancedhr.ai/images/badge-placeholder.png",
            "criteria": {
                "narrative": "The recipient has successfully completed all modules and assessments for this course."
            },
            "issuer": {
                "type": "Profile",
                "id": "https://enhancedhr.ai",
                "name": "EnhancedHR.ai",
                "url": "https://enhancedhr.ai",
                "email": "learning@enhancedhr.ai"
            }
        },
        "verification": {
            "type": "HostedBadge",
            "url": `https://enhancedhr.ai/verify/${certificate.id}`
        }
    };

    return NextResponse.json(badgeData);
}
