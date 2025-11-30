import React, { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    courseTitle: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, courseId, courseTitle }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("You must be logged in to rate.");

            const { error: insertError } = await supabase
                .from('course_ratings')
                .upsert({
                    user_id: user.id,
                    course_id: courseId,
                    rating: rating,
                    comment: comment
                });

            if (insertError) throw insertError;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setRating(0);
                setComment('');
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to submit rating");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                            <Star size={32} fill="currentColor" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
                        <p className="text-slate-400">Your feedback helps us improve.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Rate this Course</h2>
                        <p className="text-slate-400 text-center mb-8 text-sm">{courseTitle}</p>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        className={`${(hoverRating || rating) >= star ? 'text-brand-orange fill-brand-orange' : 'text-slate-600'} transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your thoughts (optional)..."
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-brand-blue-light/50 focus:outline-none resize-none text-sm"
                            />

                            {error && (
                                <div className="text-red-400 text-xs text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={rating === 0 || isSubmitting}
                                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Review'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RatingModal;
