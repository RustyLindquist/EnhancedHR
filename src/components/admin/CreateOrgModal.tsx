'use client';

export default function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">Create Organization</h2>
        <p className="text-slate-400 text-sm">Coming soon...</p>
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
