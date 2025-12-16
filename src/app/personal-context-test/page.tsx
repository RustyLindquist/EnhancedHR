'use client';

import React, { useEffect, useState } from 'react';
import { useCollections } from '@/hooks/useCollections';
import UniversalCollectionCard from '@/components/UniversalCollectionCard';
import { Loader2 } from 'lucide-react';

export default function PersonalContextTestPage() {
    // We pass empty array as we are not testing course saving sync here, just fetching items
    const { fetchCollectionItems } = useCollections([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadItems = async () => {
            setLoading(true);
            try {
                // Fetch 'personal-context' specifically as requested
                const res = await fetchCollectionItems('personal-context');
                setItems(res.items);
            } catch (error) {
                console.error('Failed to load personal context items:', error);
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, [fetchCollectionItems]);

    return (
        <div className="min-h-screen bg-brand-black p-8 text-white">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Personal Context Test</h1>
                <p className="text-slate-400">
                    Testing grid layout with 'repeat(auto-fill, minmax(370px, 1fr))'.
                </p>
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                    <strong>Current Config:</strong> Grid Gap: 24px (gap-6) | Min Card Width: 370px
                </div>
            </header>

            <div className="mb-6 flex gap-4">
                <button
                    onClick={() => {
                        const mocks = Array.from({ length: 5 }).map((_, i) => ({
                            id: `mock-${i}`,
                            itemType: i % 2 === 0 ? 'PROFILE' : 'FILE',
                            title: `Mock Item ${i + 1}`,
                            subtitle: 'Test Description for sizing check',
                            image: i % 2 === 0 ? null : 'https://placehold.co/600x400',
                            isMock: true
                        }));
                        setItems(mocks);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold border border-white/10 transition-colors"
                >
                    Load Mock Data (5 Items)
                </button>
                <button
                    onClick={() => setItems([])}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                >
                    Clear
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-blue-light" size={48} />
                </div>
            ) : (
                <div
                    className="grid gap-6 pb-20"
                    style={{
                        // The exact logic from /cards prototype as requested
                        gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))'
                    }}
                >
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <div key={`${item.itemType}-${item.id}`} className="animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}>
                                <UniversalCollectionCard
                                    item={item}
                                    onRemove={() => console.log('Remove clicked (Mock)', item.id)}
                                    onClick={() => console.log('Card clicked', item.id)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            No Personal Context items found. Add some profiles or files to test.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
