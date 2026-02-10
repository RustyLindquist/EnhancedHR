'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  User,
  Flame,
  Briefcase,
  PenTool,
  Clock,
  ArrowLeft,
  Check,
  Brain,
  Layers, // Added Layers icon for custom collections
  Building,
  Plus,
  Shield,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { MAIN_NAV_ITEMS, COLLECTION_NAV_ITEMS, CONVERSATION_NAV_ITEMS } from '../constants';
import { NavItemConfig, BackgroundTheme, Course, Collection } from '../types';
import { hasPublishedOrgCourses } from '@/app/actions/org-courses';
import { switchPlatformAdminOrg, getOrgSelectorData } from '@/app/actions/org';

// Animated Count Badge with warm glow effect on count change
const AnimatedCountBadge: React.FC<{
  count: number;
  isActive: boolean;
}> = ({ count, isActive }) => {
  const [isGlowing, setIsGlowing] = useState(false);
  const prevCountRef = useRef<number>(count);

  useEffect(() => {
    // Only trigger glow if count actually changed (not on initial mount)
    if (prevCountRef.current !== count && prevCountRef.current !== undefined) {
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  return (
    <span
      className={`
        relative text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 overflow-visible
        ${isActive
          ? 'bg-brand-blue-light text-brand-black border-brand-blue-light'
          : 'text-slate-500 bg-white/5 border-white/5 group-hover:text-slate-300'
        }
      `}
    >
      {/* Warm glow effect layer - extends beyond bounds for organic circular glow */}
      {isGlowing && (
        <span className="absolute -inset-2 rounded-full animate-count-glow pointer-events-none" />
      )}
      {/* Count number */}
      <span className="relative z-10">{count}</span>
    </span>
  );
};

// Org Collection type for nav display
interface OrgCollectionNav {
  id: string;
  label: string;
  color: string;
  item_count: number;
}

interface NavigationPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  courses: Course[];
  activeCollectionId: string;
  onSelectCollection: (id: string) => void;
  customNavItems?: NavItemConfig[];
  className?: string;
  collectionCounts?: Record<string, number>; // New prop for total counts
  customCollections?: Collection[]; // Added custom collections prop
  orgMemberCount?: number; // Count of org members for "Manage Users" badge
  orgCollections?: OrgCollectionNav[]; // Organization collections
  orgId?: string; // Organization ID for org course visibility checks
}

const NavItem: React.FC<{
  item: NavItemConfig;
  isOpen: boolean;
  showIcon?: boolean;
  customTextClass?: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}> = ({
  item,
  isOpen,
  showIcon = true,
  customTextClass,
  count,
  isActive,
  onClick
}) => {
    const Icon = item.icon;

    return (
      <div
        onClick={onClick}
        className={`
      group flex items-center px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 mb-0.5
      ${isActive
            ? 'bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(120,192,240,0.1)] backdrop-blur-sm'
            : 'hover:bg-white/5 border border-transparent hover:border-white/5'}
    `}>
        {showIcon && (
          <div className={`relative flex items-center justify-center ${!isOpen ? 'w-full' : ''}`}>
            <Icon
              size={18}
              className={`
              transition-colors duration-200
              ${isActive ? 'text-brand-blue-light drop-shadow-[0_0_8px_rgba(120,192,240,0.5)]' : (item.color || 'text-slate-400')}
              ${!isActive && 'group-hover:text-slate-200'}
            `}
            />
          </div>
        )}

        {isOpen && (
          <div className="flex-1 flex justify-between items-center ml-3 min-w-0">
            {/* Label wrapper with overflow-hidden for truncation */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <span className={`
                block truncate transition-colors
                ${customTextClass ? customTextClass : (isActive ? 'text-white font-medium' : 'text-slate-400 font-medium group-hover:text-slate-200')}
                text-sm tracking-wide
              `}>
                {item.label}
              </span>
            </div>
            {/* Badge container - allows glow overflow */}
            {count !== undefined && count > 0 && (
              <div className="flex-shrink-0 ml-2 overflow-visible">
                <AnimatedCountBadge count={count} isActive={isActive} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  isOpen,
  setIsOpen,
  currentTheme,
  onThemeChange,
  courses,
  activeCollectionId,
  onSelectCollection,
  customNavItems,
  className,
  collectionCounts,
  customCollections = [], // Default to empty array
  orgMemberCount,
  orgCollections = [], // Default to empty array
  orgId
}) => {
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);

  const [menuView, setMenuView] = useState<'main' | 'roles'>('main');
  const [userProfile, setUserProfile] = useState<{ fullName: string, email: string, initials: string, role?: string, membershipStatus?: string, authorStatus?: string, isSales?: boolean, avatarUrl?: string | null, org_id?: string | null } | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [hasOrgCourses, setHasOrgCourses] = useState(false);
  const [orgSelectorData, setOrgSelectorData] = useState<{
    isPlatformAdmin: boolean;
    currentOrgId: string | null;
    currentOrgName: string | null;
    organizations: { id: string; name: string; slug: string; memberCount: number }[];
  } | null>(null);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Demo Accounts Configuration
  const DEMO_ACCOUNTS = [
    { id: 'org_admin', label: 'Org Admin', email: 'demo.admin@enhancedhr.ai', icon: Briefcase, color: 'text-purple-400' },
    { id: 'author', label: 'Expert', email: 'demo.instructor@enhancedhr.ai', icon: PenTool, color: 'text-brand-orange' },
    { id: 'pending_author', label: 'Pending Expert', email: 'demo.applicant@enhancedhr.ai', icon: Clock, color: 'text-yellow-400' },
    { id: 'employee', label: 'Employee', email: 'demo.employee@enhancedhr.ai', icon: Users, color: 'text-brand-blue-light' },
    { id: 'user', label: 'Individual User', email: 'demo.user@enhancedhr.ai', icon: User, color: 'text-slate-400' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, membership_status, author_status, is_sales, avatar_url, org_id')
          .eq('id', user.id)
          .single();

        const fullName = profile?.full_name || user.user_metadata?.full_name || 'User';
        const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

        // Prioritize profile role, fallback to metadata
        const role = profile?.role || user.user_metadata?.role || user.app_metadata?.role;
        const membershipStatus = profile?.membership_status;
        const authorStatus = profile?.author_status;

        setUserProfile({
          fullName,
          email: user.email || '',
          initials,
          role,
          membershipStatus,
          authorStatus,
          isSales: profile?.is_sales || false,
          avatarUrl: profile?.avatar_url,
          org_id: profile?.org_id
        });

        // Check for impersonation
        const backupSession = sessionStorage.getItem('admin_backup_session');
        if (backupSession) {
          setIsImpersonating(true);
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch org selector data for platform admins
  useEffect(() => {
    const fetchOrgData = async () => {
      if (userProfile?.role === 'admin') {
        const data = await getOrgSelectorData();
        setOrgSelectorData(data);
      }
    };
    fetchOrgData();
  }, [userProfile?.role]);

  // Listen for avatar updates from onboarding or settings
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<{ url: string }>) => {
      setUserProfile(prev => prev ? { ...prev, avatarUrl: event.detail.url } : prev);
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate as EventListener);
    };
  }, []);

  // Check for published org courses (for employees to see nav item)
  useEffect(() => {
    const checkOrgCourses = async () => {
      if (!orgId || !userProfile) return;

      // Org admins and platform admins always see org courses
      const isOrgAdmin = userProfile.membershipStatus === 'org_admin' || userProfile.role === 'admin';
      if (isOrgAdmin) {
        setHasOrgCourses(true);
        return;
      }

      // For employees, check if org has published courses
      if (userProfile.membershipStatus === 'employee') {
        const result = await hasPublishedOrgCourses(orgId);
        setHasOrgCourses(result.hasPublished);
      }
    };

    checkOrgCourses();
  }, [orgId, userProfile?.membershipStatus, userProfile?.role]);

  // Groups are now managed through the Users and Groups collection, not the nav panel

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSwitchUser = async (email: string) => {
    try {
      // 1. Save current session if not already saved (i.e., if we are the real admin)
      if (!isImpersonating) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          sessionStorage.setItem('admin_backup_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }));
        }
      }

      // 2. Sign in as target user
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
      });

      if (error) throw error;

      // 3. Reload to apply changes
      window.location.reload();

    } catch (error) {
      console.error('Error switching user:', error);
      alert(`Failed to switch user: ${(error as Error).message}`);
    }
  };

  const handleExitView = async () => {
    const backupSessionStr = sessionStorage.getItem('admin_backup_session');
    if (!backupSessionStr) return;

    try {
      const { access_token, refresh_token } = JSON.parse(backupSessionStr);

      // 1. Sign out of the demo account first to ensure clean state
      await supabase.auth.signOut();

      // 2. Restore Admin Session
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('Session restoration returned no session');
      }

      // Clear backup
      sessionStorage.removeItem('admin_backup_session');

      // Reload to reset state
      window.location.reload();

    } catch (error) {
      console.error('Failed to restore admin session:', error);
      // Show more detailed error to help debugging
      alert(`Failed to restore admin session: ${(error as Error).message}. Please log in again.`);
      sessionStorage.removeItem('admin_backup_session');
      window.location.href = '/login';
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (isSwitchingOrg || orgId === orgSelectorData?.currentOrgId) {
      setIsOrgDropdownOpen(false);
      return;
    }
    setIsSwitchingOrg(true);
    try {
      const result = await switchPlatformAdminOrg(orgId);
      if (result.success) {
        setIsOrgDropdownOpen(false);
        window.location.reload();
      } else {
        console.error('Failed to switch org:', result.error);
      }
    } finally {
      setIsSwitchingOrg(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        setMenuView('main');
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Helper to count items in collections
  const getCollectionCount = (collectionId: string) => {
    if (collectionCounts && collectionCounts[collectionId] !== undefined) {
      return collectionCounts[collectionId];
    }
    return courses.filter(c => c.collections.includes(collectionId)).length;
  };

  // Filter Nav Items based on Role (or use custom items)
  const filteredNavItems = customNavItems || MAIN_NAV_ITEMS.filter(item => {
    if (item.role === 'admin') {
      return userProfile?.role === 'admin';
    }
    return true;
  });

  const [hoveredItem, setHoveredItem] = useState<{ id: string, top: number, label: string, onClick: () => void } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleItemHover = (item: NavItemConfig, e: React.MouseEvent, onClick: () => void) => {
    if (isOpen) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredItem({
      id: item.id,
      top: rect.top,
      label: item.label,
      onClick
    });
  };

  const handleItemLeave = () => {
    if (isOpen) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100); // Small delay to allow moving to the tooltip
  };

  return (
    <div className={`
      ${isOpen ? 'w-72' : 'w-20'} 
      flex-shrink-0 
      ${className || 'bg-white/[0.02] backdrop-blur-xl border-r border-white/10'}
      flex flex-col 
      transition-all duration-300 ease-in-out z-[100] h-full
      shadow-[5px_0_30px_0_rgba(0,0,0,0.3)]
      relative
    `}>
      {/* Floating Hover Label (Portal-like behavior but fixed) */}
      {!isOpen && hoveredItem && (
        <div
          className="fixed left-20 z-[150] bg-[#0f141c] border border-white/10 rounded-r-xl py-2.5 px-4 shadow-xl flex items-center animate-fade-in cursor-pointer hover:bg-white/5 transition-colors"
          style={{ top: hoveredItem.top, height: '44px' }} // Match NavItem height roughly
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            hoveredItem.onClick();
            setHoveredItem(null);
          }}
        >
          <span className="text-sm font-medium text-white whitespace-nowrap">
            {hoveredItem.label}
          </span>
        </div>
      )}

      {/* Logo Area */}
      <div className="h-24 flex-shrink-0 flex items-center justify-center relative px-4 border-b border-white/5">
        <div
          onClick={() => router.push('/')}
          className="flex items-center justify-center cursor-pointer group w-full px-4 h-full"
        >
          {isOpen ? (
            <img
              src="/images/logos/EnhancedHR-logo-no-mark.png"
              alt="EnhancedHR"
              className="h-16 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_15px_rgba(120,192,240,0.3)] p-0.5"
            />
          ) : (
            <img
              src="/images/logos/EnhancedHR-logo-mark-flame.png"
              alt="EnhancedHR"
              className="h-8 w-auto object-contain transition-all duration-300 drop-shadow-[0_0_15px_rgba(120,192,240,0.3)]"
            />
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-9 bg-white/10 border border-white/10 rounded-full p-1 text-white/40 hover:bg-[#5694C7] hover:border-white/20 hover:text-white hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar relative z-10">

        {/* Main Navigation (Top) */}
        <div className="px-4 mb-4">
          <div className="space-y-1">
            {(customNavItems || MAIN_NAV_ITEMS).filter(item => {
              if (item.id === 'my-org') {
                return userProfile?.role === 'employee' || userProfile?.role === 'org_admin' || userProfile?.membershipStatus === 'org_admin' || userProfile?.membershipStatus === 'employee' || userProfile?.role === 'admin';
              }
              return true;
            }).map(item => (
              <div key={item.id} onMouseEnter={(e) => handleItemHover(item, e, () => {
                if (item.id.startsWith('admin/') || item.id === 'admin') {
                  router.push(`/${item.id}`);
                } else {
                  onSelectCollection(item.id);
                }
              })} onMouseLeave={handleItemLeave}>
                <NavItem
                  item={item}
                  isOpen={isOpen}
                  count={['personal-context', 'conversations'].includes(item.id) ? getCollectionCount(item.id) : undefined}
                  isActive={activeCollectionId === item.id}
                  onClick={() => {
                    if (item.id.startsWith('admin/') || item.id === 'admin') {
                      router.push(`/${item.id}`);
                    } else {
                      onSelectCollection(item.id);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Collections (Only show if not in custom mode) */}
        {!customNavItems && (
          <div className="px-4 mb-4">
            {isOpen && (
              <div className="flex items-center justify-between w-full mb-2 pl-2 pr-1">
                <button
                  onClick={() => setCollectionsExpanded(!collectionsExpanded)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest drop-shadow-sm hover:text-slate-400 transition-colors"
                >
                  <span>My Collections</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${collectionsExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
                <button
                  onClick={() => onSelectCollection('new')}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-400 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-[0_0_10px_rgba(120,192,240,0.15)] transition-all duration-200"
                >
                  <Plus size={10} />
                  New
                </button>
              </div>
            )}
            <div className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${collectionsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="space-y-1">
                <div className="space-y-1">
                  {(() => {
                    // Sort custom collections alphabetically
                    const sortedCustom = [...(customCollections || [])]
                      .filter(c => c.isCustom) // Ensure only custom ones
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map(c => ({
                        id: c.id,
                        label: c.label,
                        icon: Layers, // Default icon for custom
                        color: c.color ? `text-[${c.color}]` : 'text-slate-400'
                      } as NavItemConfig));

                    const finalItems = [
                      ...COLLECTION_NAV_ITEMS,
                      ...sortedCustom,
                    ];

                    return finalItems.map(item => (
                      <div
                        key={item.id}
                        onMouseEnter={(e) => handleItemHover(item, e, () => onSelectCollection(item.id))}
                        onMouseLeave={handleItemLeave}
                      >
                        <NavItem
                          item={item}
                          isOpen={isOpen}
                          count={item.id !== 'new' ? getCollectionCount(item.id) : undefined}
                          isActive={activeCollectionId === item.id}
                          onClick={() => onSelectCollection(item.id)}
                        />
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organization features are now accessed through the My Organization hub page */}
      </div>

      {/* User Profile Summary (Bottom) */}
      <div
        ref={profileRef}
        className="h-28 flex-shrink-0 p-4 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm flex items-center justify-center relative z-20"
      >

        {/* --- Popup Menu --- */}
        {isProfileMenuOpen && (
          <div className={`
             absolute bottom-full mb-4 z-[120]
             transition-all duration-300 animate-fade-in
             ${isOpen ? 'left-4 w-72' : 'left-20 w-72'}
          `}>
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-b from-brand-blue-light/20 via-brand-blue-light/5 to-transparent rounded-3xl blur-xl opacity-60" />

            {/* Animated Border Container */}
            <div className="relative rounded-2xl p-[2px] ai-prompt-border">
              {/* Main container with glassmorphism */}
              <div className="relative bg-gradient-to-b from-slate-800/95 to-slate-900/98 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_-10px_rgba(120,192,240,0.15)] overflow-hidden">
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-blue-light/40 to-transparent" />

              {menuView === 'main' ? (
                /* MAIN MENU VIEW */
                <div>
                  {/* User Info Section */}
                  <div className="px-5 pt-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      {/* Avatar with ring */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-brand-blue-light/50 to-brand-blue/30 rounded-full blur-sm" />
                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden ring-2 ring-brand-blue-light/30 ring-offset-2 ring-offset-slate-900">
                          {userProfile?.avatarUrl ? (
                            <img
                              src={userProfile.avatarUrl}
                              alt={userProfile.fullName || 'Profile'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base">{userProfile?.initials || '...'}</span>
                          )}
                        </div>
                      </div>
                      {/* Name and email */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white truncate">{userProfile?.fullName || 'Loading...'}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{userProfile?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2 px-2">
                    <button
                      onClick={() => router.push('/settings/account')}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-blue-light/20 transition-colors">
                        <User size={16} className="text-slate-400 group-hover:text-brand-blue-light transition-colors" />
                      </div>
                      My Account
                    </button>

                    <button
                      onClick={() => {
                        router.push('/settings');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-blue-light/20 transition-colors">
                        <Settings size={16} className="text-slate-400 group-hover:text-brand-blue-light transition-colors" />
                      </div>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        onSelectCollection('help');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-brand-blue-light/20 transition-colors">
                        <HelpCircle size={16} className="text-slate-400 group-hover:text-brand-blue-light transition-colors" />
                      </div>
                      Help
                    </button>

                    {/* Expert Console Link - For experts (pending, approved, rejected) and platform admins */}
                    {((userProfile?.authorStatus && userProfile.authorStatus !== 'none') || userProfile?.role === 'admin') && (
                      <button
                        onClick={() => {
                          router.push('/author');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center mr-3 group-hover:bg-brand-orange/20 transition-colors">
                            <PenTool size={16} className="text-brand-orange" />
                          </div>
                          Expert Console
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    {/* Sales Console Link - For sales users and platform admins */}
                    {(userProfile?.isSales || userProfile?.role === 'admin') && (
                      <button
                        onClick={() => {
                          router.push('/sales');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3 group-hover:bg-amber-500/20 transition-colors">
                            <TrendingUp size={16} className="text-amber-500" />
                          </div>
                          Sales Console
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    {/* Platform Dashboard Link - Show when in Expert Console */}
                    {pathname?.startsWith('/author') && (
                      <button
                        onClick={() => {
                          router.push('/dashboard');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-brand-blue-light/10 flex items-center justify-center mr-3 group-hover:bg-brand-blue-light/20 transition-colors">
                            <LayoutDashboard size={16} className="text-brand-blue-light" />
                          </div>
                          Platform Dashboard
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    {/* Platform Dashboard Link - Always show for admins (except when already shown above) */}
                    {(userProfile?.role === 'admin' || isImpersonating) && !pathname?.startsWith('/author') && (
                      <button
                        onClick={() => {
                          router.push('/dashboard');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-brand-blue-light/10 flex items-center justify-center mr-3 group-hover:bg-brand-blue-light/20 transition-colors">
                            <LayoutDashboard size={16} className="text-brand-blue-light" />
                          </div>
                          Platform Dashboard
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    {/* Admin Console Link - Always show for admins */}
                    {(userProfile?.role === 'admin' || isImpersonating) && (
                      <button
                        onClick={() => {
                          router.push('/admin');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center mr-3 group-hover:bg-brand-orange/20 transition-colors">
                            <Shield size={16} className="text-brand-orange" />
                          </div>
                          Admin Console
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}

                    {/* Admin Role Switcher Entry */}
                    {(userProfile?.role === 'admin' || isImpersonating) && (
                      <button
                        onClick={() => setMenuView('roles')}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${isImpersonating ? 'bg-brand-red/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <Flame size={16} className={`${isImpersonating ? 'text-brand-red animate-pulse' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                          </div>
                          Switch Role
                        </div>
                        <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                      </button>
                    )}
                  </div>

                  {/* Sign Out Section */}
                  <div className="px-2 pb-3 pt-1">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
                        <LogOut size={16} className="text-red-400 group-hover:text-red-300 transition-colors" />
                      </div>
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* ROLES SELECTION VIEW */
                <div className="flex flex-col h-full max-h-[420px]">
                  {/* Header with back button */}
                  <div className="flex items-center px-4 py-4 border-b border-white/10">
                    <button
                      onClick={() => setMenuView('main')}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all mr-3"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="text-base font-semibold text-white">Switch Role</span>
                  </div>

                  <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {/* Platform Admin (Exit) */}
                    <button
                      onClick={handleExitView}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                        ${!isImpersonating
                          ? 'bg-brand-blue-light/15 text-brand-blue-light border border-brand-blue-light/30'
                          : 'text-slate-300 hover:bg-white/10 border border-transparent hover:border-white/10'}
                      `}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${!isImpersonating ? 'bg-brand-red/20' : 'bg-brand-red/10'}`}>
                        <Flame size={18} className="text-brand-red" />
                      </div>
                      <span className="flex-1 text-left">Platform Administrator</span>
                      {!isImpersonating && <Check size={16} className="text-brand-blue-light" />}
                    </button>

                    {/* Org Selector for Platform Admins */}
                    {userProfile?.role === 'admin' && orgSelectorData && orgSelectorData.organizations.length > 0 && (
                      <div className="mt-2 ml-12 relative">
                        <button
                          onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                          disabled={isSwitchingOrg}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          <span className="truncate">
                            {orgSelectorData.currentOrgId === userProfile?.org_id
                              ? 'Your Org As Platform Admin'
                              : orgSelectorData.currentOrgName || 'Select Organization'}
                          </span>
                          <ChevronDown size={14} className={`ml-2 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOrgDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f172a] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                            {orgSelectorData.organizations.map((org) => (
                              <button
                                key={org.id}
                                onClick={() => handleSwitchOrg(org.id)}
                                disabled={isSwitchingOrg}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all ${
                                  org.id === orgSelectorData.currentOrgId
                                    ? 'bg-brand-blue-light/10 text-brand-blue-light'
                                    : 'text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                <span className="truncate">{org.name}</span>
                                <span className="text-slate-500 ml-2">{org.memberCount}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="py-2">
                      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <p className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Demo Accounts</p>

                    {DEMO_ACCOUNTS.map(account => {
                      const Icon = account.icon;
                      const isActive = userProfile?.email === account.email;
                      return (
                        <button
                          key={account.id}
                          onClick={() => handleSwitchUser(account.email)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                            ${isActive
                              ? 'bg-brand-blue-light/15 text-brand-blue-light border border-brand-blue-light/30'
                              : 'text-slate-300 hover:bg-white/10 border border-transparent hover:border-white/10'
                            }
                          `}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-white/5'} ${account.color}`}>
                            <Icon size={18} />
                          </div>
                          <span className="flex-1 text-left">{account.label}</span>
                          {isActive && <Check size={16} className="text-brand-blue-light" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        <div
          className={`
             relative group flex items-center ${!isOpen ? 'justify-center' : 'w-full'} 
             cursor-pointer p-3 rounded-2xl transition-all duration-500
             overflow-hidden
           `}
          onClick={() => {
            setIsProfileMenuOpen(!isProfileMenuOpen);
            if (isProfileMenuOpen) setMenuView('main'); // Reset to main when closing
          }}
        >

          {/* --- Portal Glow Effect Background --- */}
          <div className={`absolute inset-0 bg-brand-blue-light/10 opacity-0 group-hover:opacity-100 ${isProfileMenuOpen ? 'opacity-100 bg-white/10' : ''} transition-opacity duration-500 blur-xl`}></div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand-blue-light/30 rounded-full blur-[25px] opacity-0 group-hover:opacity-60 transition-all duration-700 mix-blend-screen"></div>

          {/* Border/Container that appears on hover */}
          <div className={`absolute inset-0 rounded-2xl border border-white/5 group-hover:border-white/20 group-hover:bg-white/5 ${isProfileMenuOpen ? 'border-brand-blue-light/30 bg-white/5' : ''} transition-all duration-500`}></div>

          {/* Content */}
          <div className="relative z-10 flex items-center">
            <div className={`
                w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden
                ${isImpersonating ? 'shadow-[0_0_15px_rgba(220,38,38,0.8)] border-brand-red/50' : ''}
            `}>
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.fullName || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                userProfile?.initials || '...'
              )}
            </div>
            {isOpen && (
              <div className="ml-3 overflow-hidden flex-1">
                <p className={`text-base font-semibold text-white truncate drop-shadow-sm group-hover:text-brand-blue-light transition-colors ${isProfileMenuOpen ? 'text-brand-blue-light' : ''}`}>
                  {userProfile?.fullName || 'Loading...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;