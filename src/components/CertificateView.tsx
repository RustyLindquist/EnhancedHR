'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import CertificatePDF from './CertificatePDF';
import { CertificateDetails } from '@/lib/certificates';
import { Download, CheckCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface CertificateViewProps {
    details: CertificateDetails;
}

const CertificateView: React.FC<CertificateViewProps> = ({ details }) => {
    return (
        <div className="min-h-screen bg-[#051114] flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#054C74]/20 via-[#0A0D12] to-black z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>

            <div className="relative z-10 max-w-3xl w-full text-center">

                {/* Verified Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-8 animate-fade-in-up">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Officially Verified</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight animate-fade-in-up delay-100">
                    Certificate of Completion
                </h1>
                <p className="text-slate-400 mb-12 animate-fade-in-up delay-200">
                    Issued to <span className="text-white font-bold">{details.recipientName}</span> on {details.completionDate}
                </p>

                {/* Certificate Preview Card */}
                <div className="bg-white p-8 rounded-xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 mb-12 border-8 border-[#054C74] relative group">
                    <div className="border-2 border-[#78C0F0] p-8 flex flex-col items-center">
                        <img src="/images/logos/EnhancedHR-logo.png" alt="EnhancedHR" className="h-12 w-auto object-contain mb-8" />
                        <p className="text-slate-500 uppercase tracking-widest text-xs mb-4">This certifies that</p>
                        <h3 className="text-3xl font-bold text-black mb-4 font-serif">{details.recipientName}</h3>
                        <p className="text-slate-500 uppercase tracking-widest text-xs mb-4">Has successfully completed</p>
                        <h4 className="text-xl font-bold text-[#054C74] mb-8">{details.courseTitle}</h4>
                        <div className="flex justify-between w-full mt-8 border-t pt-4">
                            <div className="text-left">
                                <p className="text-xs text-slate-400">Date</p>
                                <p className="text-sm font-bold text-slate-700">{details.completionDate}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">ID</p>
                                <p className="text-sm font-bold text-slate-700">{details.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-lg">
                        <PDFDownloadLink
                            document={
                                <CertificatePDF
                                    recipientName={details.recipientName}
                                    courseTitle={details.courseTitle}
                                    completionDate={details.completionDate}
                                    certificateId={details.id}
                                    duration={details.duration}
                                />
                            }
                            fileName={`certificate-${details.id}.pdf`}
                            className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            {({ blob, url, loading, error }) =>
                                loading ? 'Generating PDF...' : <><Download size={18} /> Download PDF</>
                            }
                        </PDFDownloadLink>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 animate-fade-in-up delay-300">
                    <PDFDownloadLink
                        document={
                            <CertificatePDF
                                recipientName={details.recipientName}
                                courseTitle={details.courseTitle}
                                completionDate={details.completionDate}
                                certificateId={details.id}
                                duration={details.duration}
                            />
                        }
                        fileName={`certificate-${details.id}.pdf`}
                        className="bg-brand-orange text-white px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-brand-orange/90 transition-colors flex items-center gap-2 shadow-lg shadow-brand-orange/20"
                    >
                        {({ blob, url, loading, error }) =>
                            loading ? 'Loading...' : <><Download size={20} /> Download Certificate</>
                        }
                    </PDFDownloadLink>
                </div>

                <div className="mt-12">
                    <Link href="/" className="text-slate-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-0.5">
                        Return to EnhancedHR.ai
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default CertificateView;
