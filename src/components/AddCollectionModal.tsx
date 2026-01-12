import React, { useState, useEffect } from 'react';
import { X, Plus, Check, FolderPlus, Layers, Building, Loader2 } from 'lucide-react';
import { Collection, ContextCard } from '../types';
import { getCollectionsForItemAction } from '@/app/actions/collections';

// Org Collection type
interface OrgCollectionInfo {
  id: string;
  label: string;
  color: string;
  item_count: number;
}

interface AddCollectionModalProps {
  item?: ContextCard | null;
  availableCollections: Collection[];
  orgCollections?: OrgCollectionInfo[]; // Organization collections (only shown to org admins)
  isOrgAdmin?: boolean; // Whether user is org admin (can add to org collections)
  onClose: () => void;
  onSave: (selectedCollectionIds: string[], newCollection?: { label: string; color: string }) => void;
}

// Expanded Palette
const COLORS = [
  '#FF2600', '#FF9300', '#FCD116', '#A3E635',
  '#10B981', '#06B6D4', '#78C0F0', '#054C74',
  '#6366F1', '#8B5CF6', '#D946EF', '#EC4899',
  '#F43F5E', '#71717A'
];

const AddCollectionModal: React.FC<AddCollectionModalProps> = ({
  item,
  availableCollections,
  orgCollections = [],
  isOrgAdmin = false,
  onClose,
  onSave
}) => {
  // Start with empty array - will be populated by useEffect
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  // If no item is provided, default to "Creating New" mode, otherwise "Adding" mode
  const [isCreatingNew, setIsCreatingNew] = useState(!item);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState(COLORS[6]); // Default to Brand Blue Light

  // Fetch actual collection memberships from server when modal opens with an item
  useEffect(() => {
    console.log('[AddCollectionModal] useEffect triggered, item:', item?.id, item?.type);
    if (!item) return;

    const fetchCollections = async () => {
      setIsLoadingCollections(true);
      try {
        // Get the item ID - handle different item types
        const itemId = String(item.id);
        console.log('[AddCollectionModal] Fetching collections for item:', itemId, item.type);

        const result = await getCollectionsForItemAction(itemId, item.type);
        console.log('[AddCollectionModal] Server action result:', result);
        console.log('[AddCollectionModal] Available collections:', availableCollections.map(c => ({ id: c.id, label: c.label })));

        if (result.success) {
          console.log('[AddCollectionModal] Setting selectedIds to:', result.collectionIds);
          setSelectedIds(result.collectionIds);
        } else {
          // Fall back to item.collections if fetch fails
          console.log('[AddCollectionModal] Falling back to item.collections:', item.collections);
          setSelectedIds(item.collections || []);
        }
      } catch (error) {
        console.error('Error fetching collections for item:', error);
        // Fall back to item.collections if fetch fails
        setSelectedIds(item.collections || []);
      } finally {
        setIsLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [item]);

  const toggleCollection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(
      selectedIds,
      isCreatingNew && newCollectionName ? { label: newCollectionName, color: newCollectionColor } : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {item ? 'Add to Collection' : 'Manage Collections'}
            </h2>
            {item && <p className="text-xs text-slate-400 mt-1 truncate max-w-[250px]">{item.type === 'INSTRUCTOR' ? item.name : item.title}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-0 max-h-[60vh] overflow-y-auto dropdown-scrollbar">

          {/* Existing Collections List - Only show if we have an item or we are not in create-only mode */}
          {item && (
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                Your Collections
                {isLoadingCollections && <Loader2 size={12} className="animate-spin text-brand-blue-light" />}
              </h3>
              {availableCollections.map(col => (
                <div
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className={`
                          flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300
                          ${selectedIds.includes(col.id)
                      ? 'bg-white/10 border-brand-blue-light/50 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                      : 'bg-transparent border-white/5 hover:border-white/20 hover:bg-white/5'}
                      `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: col.color, color: col.color }}
                    ></div>
                    <span className={`text-sm font-medium ${selectedIds.includes(col.id) ? 'text-white' : 'text-slate-400'}`}>
                      {col.label}
                    </span>
                  </div>
                  <div className={`
                            w-5 h-5 rounded-full border flex items-center justify-center transition-all
                            ${selectedIds.includes(col.id)
                      ? 'bg-brand-blue-light border-brand-blue-light text-brand-black'
                      : 'border-slate-600'}
                        `}>
                    {selectedIds.includes(col.id) && <Check size={12} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Org Collections - Only for Org Admins */}
          {item && isOrgAdmin && orgCollections.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Building size={12} />
                Org Collections
              </h3>
              {orgCollections.map(col => (
                <div
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className={`
                          flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300
                          ${selectedIds.includes(col.id)
                      ? 'bg-white/10 border-slate-400/50 shadow-[0_0_15px_rgba(100,116,139,0.1)]'
                      : 'bg-transparent border-white/5 hover:border-white/20 hover:bg-white/5'}
                      `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: col.color, color: col.color }}
                    ></div>
                    <span className={`text-sm font-medium ${selectedIds.includes(col.id) ? 'text-white' : 'text-slate-400'}`}>
                      {col.label}
                    </span>
                  </div>
                  <div className={`
                            w-5 h-5 rounded-full border flex items-center justify-center transition-all
                            ${selectedIds.includes(col.id)
                      ? 'bg-slate-400 border-slate-400 text-brand-black'
                      : 'border-slate-600'}
                        `}>
                    {selectedIds.includes(col.id) && <Check size={12} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Section */}
          <div className={`border-t border-white/10 pt-4 transition-all duration-300 ${isCreatingNew ? 'bg-white/5 -mx-6 px-6 pb-4 mt-4' : ''}`}>
            {!isCreatingNew ? (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center gap-2 text-brand-blue-light text-sm font-bold hover:text-white transition-colors mb-6"
              >
                <Plus size={16} />
                Create New Collection
              </button>
            ) : (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <FolderPlus size={14} className="text-brand-orange" />
                    New Collection
                  </h3>
                  {/* Only allow cancel if we are in "Add Item" mode where there's something else to do */}
                  {item && (
                    <button
                      onClick={() => setIsCreatingNew(false)}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection Name..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light mb-4"
                  autoFocus
                />

                <div className="flex flex-wrap gap-2 mb-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCollectionColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${newCollectionColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a] scale-110' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer - No Gap from above section */}
        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 z-10 relative">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand-blue-light text-brand-black text-sm font-bold rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(120,192,240,0.4)] transition-all transform active:scale-95"
          >
            {isCreatingNew && !item ? 'Create Collection' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddCollectionModal;