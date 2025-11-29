import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, Layers, MoreHorizontal } from 'lucide-react';

export default async function OrgCollectionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get Org ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

    if (!profile?.org_id) return <div>Access Denied</div>;

    // Fetch Org Collections
    const { data: collections } = await supabase
        .from('user_collections')
        .select('*, collection_items(count)')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Collections</h1>
                    <p className="text-slate-400">Curate learning paths for your team.</p>
                </div>
                <Link
                    href="/org/collections/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                    <Plus size={16} /> New Collection
                </Link>
            </div>

            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collections?.map((collection) => (
                    <div key={collection.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${collection.color || 'bg-brand-blue-light/20'}`}>
                                <Layers size={24} />
                            </div>
                            <button className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{collection.label}</h3>
                        <p className="text-sm text-slate-400 mb-4">{collection.collection_items?.[0]?.count || 0} Courses</p>

                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/5">
                                {collection.is_custom ? 'Custom' : 'System'}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {collections?.length === 0 && (
                    <div className="col-span-3 text-center py-20 border border-dashed border-white/10 rounded-2xl text-slate-500">
                        No collections found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
