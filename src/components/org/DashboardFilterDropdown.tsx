'use client';

import React, { useState, useMemo } from 'react';
import { Users, Sparkles, ChevronDown, Check, Search } from 'lucide-react';

interface DashboardFilterDropdownProps {
  selectedGroupId: string | null; // null = All Employees
  groups: {
    id: string;
    name: string;
    memberCount: number;
    isDynamic?: boolean;
  }[];
  onGroupChange: (groupId: string | null) => void;
}

const DashboardFilterDropdown: React.FC<DashboardFilterDropdownProps> = ({
  selectedGroupId,
  groups,
  onGroupChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const showSearch = groups.length > 10;

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const selectedName = selectedGroup?.name || 'All Employees';

  const handleSelect = (groupId: string | null) => {
    onGroupChange(groupId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              selectedGroupId
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {selectedGroup?.isDynamic ? (
                <Sparkles size={16} />
              ) : (
                <Users size={16} />
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Analyzing
              </p>
              <p className="font-bold text-sm text-white truncate max-w-[200px]">
                {selectedName}
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Dropdown Panel */}
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl max-h-96 overflow-hidden">
            {/* Search (if needed) */}
            {showSearch && (
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto max-h-80 dropdown-scrollbar">
              <div className="p-2">
                {/* All Employees Option */}
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-colors ${
                    selectedGroupId === null
                      ? 'bg-brand-blue-light/10 text-brand-blue-light'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedGroupId === null
                        ? 'bg-brand-blue-light/20 text-brand-blue-light'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      <Users size={16} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">All Employees</p>
                      <p className="text-xs text-slate-500">
                        Organization-wide data
                      </p>
                    </div>
                  </div>
                  {selectedGroupId === null && (
                    <Check size={16} className="text-brand-blue-light" />
                  )}
                </button>

                {/* Separator */}
                {filteredGroups.length > 0 && (
                  <div className="my-2 h-px bg-white/10" />
                )}

                {/* Group Options */}
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleSelect(group.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-purple-500/10 text-purple-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedGroupId === group.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-white/10 text-slate-400'
                      }`}>
                        {group.isDynamic ? (
                          <Sparkles size={16} />
                        ) : (
                          <Users size={16} />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{group.name}</p>
                          {group.isDynamic && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-wider border border-purple-500/30">
                              <Sparkles size={8} />
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Users size={10} />
                          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                    {selectedGroupId === group.id && (
                      <Check size={16} className="text-purple-400" />
                    )}
                  </button>
                ))}

                {/* No Results */}
                {filteredGroups.length === 0 && searchQuery && (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500">No groups found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardFilterDropdown;
