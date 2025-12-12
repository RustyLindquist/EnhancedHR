import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts (optional, using standard fonts for now)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        border: '10px solid #054C74', // Brand Blue
    },
    borderInner: {
        width: '100%',
        height: '100%',
        border: '2px solid #78C0F0', // Brand Light Blue
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 36,
        marginBottom: 20,
        color: '#052333',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    subHeader: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    recipient: {
        fontSize: 28,
        color: '#000000',
        marginBottom: 10,
        fontWeight: 'bold',
        fontFamily: 'Helvetica-Bold',
    },
    courseTitle: {
        fontSize: 24,
        color: '#054C74',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
    },
    text: {
        fontSize: 12,
        color: '#334155',
        marginBottom: 5,
        textAlign: 'center',
    },
    date: {
        fontSize: 12,
        color: '#334155',
        marginTop: 30,
        marginBottom: 40,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginTop: 40,
    },
    signatureBlock: {
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: '1px solid #000',
        paddingTop: 10,
        width: 200,
    },
    signatureText: {
        fontSize: 10,
        color: '#64748b',
    },
    logo: {
        width: 150,
        height: 50,
        marginBottom: 30,
        objectFit: 'contain',
    },
    id: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 8,
        color: '#cbd5e1',
    },
});

interface CertificateProps {
    recipientName: string;
    courseTitle: string;
    completionDate: string;
    certificateId: string;
    duration: string;
}

const CertificatePDF: React.FC<CertificateProps> = ({
    recipientName,
    courseTitle,
    completionDate,
    certificateId,
    duration
}) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.borderInner}>

                {/* Logo Placeholder */}
                <Image src="/images/logos/EnhancedHR-logo.png" style={styles.logo} />

                <Text style={styles.subHeader}>Certificate of Completion</Text>

                <Text style={styles.text}>This certifies that</Text>
                <Text style={styles.recipient}>{recipientName}</Text>

                <Text style={styles.text}>has successfully completed the course</Text>
                <Text style={styles.courseTitle}>{courseTitle}</Text>

                <Text style={styles.text}>Duration: {duration}</Text>
                <Text style={styles.date}>Completed on {completionDate}</Text>

                <View style={styles.signatureRow}>
                    <View style={styles.signatureBlock}>
                        <Text style={{ fontFamily: 'Helvetica-Oblique', fontSize: 14, marginBottom: 5 }}>Rusty Lindquist</Text>
                        <Text style={styles.signatureText}>Founder, EnhancedHR.ai</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={{ fontFamily: 'Helvetica-Oblique', fontSize: 14, marginBottom: 5 }}>EnhancedHR Team</Text>
                        <Text style={styles.signatureText}>Course Expert</Text>
                    </View>
                </View>

                <Text style={styles.id}>ID: {certificateId}</Text>
            </View>
        </Page>
    </Document>
);

export default CertificatePDF;
