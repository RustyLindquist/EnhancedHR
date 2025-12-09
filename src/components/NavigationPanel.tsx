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
  Menu,
  X,
  User,
  ImageIcon,
  Flame,
  Bot,
  Briefcase,
  PenTool,
  Clock,
  ArrowLeft,
  Check,
  Upload,
  Brain
} from 'lucide-react';
import { MAIN_NAV_ITEMS, COLLECTION_NAV_ITEMS, CONVERSATION_NAV_ITEMS, BACKGROUND_THEMES } from '../constants';
import { NavItemConfig, BackgroundTheme, Course } from '../types';

interface NavigationPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentTheme: BackgroundTheme;
  onThemeChange: (theme: BackgroundTheme) => void;
  courses: Course[];
  activeCollectionId: string;
  onSelectCollection: (id: string) => void;
  customNavItems?: NavItemConfig[];
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
      group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 mb-1
      ${isActive
            ? 'bg-white/10 border border-white/10 shadow-[0_0_15px_rgba(120,192,240,0.1)] backdrop-blur-sm'
            : 'hover:bg-white/5 border border-transparent hover:border-white/5'}
    `}>
        {showIcon && (
          <div className={`relative flex items-center justify-center ${!isOpen ? 'w-full' : ''}`}>
            <Icon
              size={20}
              className={`
              transition-colors duration-200
              ${isActive ? 'text-brand-blue-light drop-shadow-[0_0_8px_rgba(120,192,240,0.5)]' : (item.color || 'text-slate-400')}
              ${!isActive && 'group-hover:text-slate-200'}
            `}
            />
          </div>
        )}

        {isOpen && (
          <div className="flex-1 flex justify-between items-center ml-3 overflow-hidden">
            <span className={`
              truncate transition-colors 
              ${customTextClass ? customTextClass : (isActive ? 'text-white font-medium' : 'text-slate-400 font-medium group-hover:text-slate-200')}
              text-sm tracking-wide
            `}>
              {item.label}
            </span>
            {count !== undefined && count > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${isActive ? 'bg-brand-blue-light text-brand-black border-brand-blue-light' : 'text-slate-500 bg-white/5 border-white/5 group-hover:text-slate-300'}`}>
                {count}
              </span>
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
  customNavItems
}) => {
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'backgrounds' | 'roles'>('main');
  const [userProfile, setUserProfile] = useState<{ fullName: string, email: string, initials: string, role?: string } | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Demo Accounts Configuration
  const DEMO_ACCOUNTS = [
    { id: 'org_admin', label: 'Org Admin', email: 'demo.admin@enhancedhr.ai', icon: Briefcase, color: 'text-purple-400' },
    { id: 'author', label: 'Instructor', email: 'demo.instructor@enhancedhr.ai', icon: PenTool, color: 'text-brand-orange' },
    { id: 'pending_author', label: 'Pending Instructor', email: 'demo.applicant@enhancedhr.ai', icon: Clock, color: 'text-yellow-400' },
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
          .select('full_name')
          .eq('id', user.id)
          .single();

        const fullName = profile?.full_name || user.user_metadata?.full_name || 'User';
        const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const role = user.user_metadata?.role || user.app_metadata?.role;

        setUserProfile({
          fullName,
          email: user.email || '',
          initials,
          role
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onThemeChange({
        id: 'custom-upload',
        label: 'Custom',
        type: 'custom',
        value: imageUrl
      });
      setIsProfileMenuOpen(false);
    }
  };

  // Helper to count items in collections
  const getCollectionCount = (collectionId: string) => {
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
      bg-white/[0.02] backdrop-blur-xl 
      border-r border-white/10 flex flex-col 
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
          className="absolute -right-3 top-9 bg-[#5694C7] border border-white/20 rounded-full p-1 text-white hover:bg-[#5694C7]/90 hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-8 no-scrollbar">

        {/* Main Navigation (Top) */}
        <div className="px-4 mb-8">
          <div className="space-y-1">
            {filteredNavItems.map(item => (
              <div
                key={item.id}
                onMouseEnter={(e) => handleItemHover(item, e, () => {
                  if (item.id.startsWith('admin/') || item.id === 'admin') {
                    router.push(`/${item.id}`);
                  } else {
                    onSelectCollection(item.id);
                  }
                })}
                onMouseLeave={handleItemLeave}
              >
                <NavItem
                  item={item}
                  isOpen={isOpen}
                  isActive={activeCollectionId === item.id || (item.id === 'academy' && activeCollectionId === 'academy')}
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
          <div className="px-4 mb-8">
            {isOpen && (
              <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest pl-2 drop-shadow-sm">
                My Collections
              </h4>
            )}
            <div className="space-y-1">
              {COLLECTION_NAV_ITEMS.map(item => (
                <div
                  key={item.id}
                  onMouseEnter={(e) => handleItemHover(item, e, () => onSelectCollection(item.id))}
                  onMouseLeave={handleItemLeave}
                >
                  <NavItem
                    item={item}
                    isOpen={isOpen}
                    count={item.id !== 'new' && item.id !== 'company' ? getCollectionCount(item.id) : undefined}
                    isActive={activeCollectionId === item.id}
                    onClick={() => onSelectCollection(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Branding (Flame + Tagline) */}
      <div className={`group flex flex-col items-center justify-center pb-6 transition-opacity duration-500 cursor-default ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="relative w-36 h-36 flex items-center justify-center mb-8 transition-transform duration-700 group-hover:scale-105">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-brand-blue-light/5 blur-3xl rounded-full transition-all duration-700 group-hover:bg-brand-orange/20 group-hover:blur-[50px] group-hover:opacity-100"></div>

          {/* Flame Image */}
          <img
            src="/images/logos/EnhancedHR-logo-mark-flame.png"
            alt="Mark"
            className="h-full w-full object-contain opacity-10 transition-all duration-700 group-hover:opacity-100 group-hover:drop-shadow-[0_0_30px_rgba(255,147,0,0.4)]"
          />
        </div>

        {/* Tagline */}
        <span className="text-[11px] font-black text-[#1e293b] uppercase tracking-[0.2em] drop-shadow-sm select-none transition-all duration-500 group-hover:text-white group-hover:tracking-[0.25em] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          World-Class Learning
        </span>
      </div>

      {/* User Profile Summary (Bottom) */}
      <div
        ref={profileRef}
        className="h-28 flex-shrink-0 p-4 border-t border-white/5 bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm flex items-center justify-center relative"
      >

        {/* --- Popup Menu --- */}
        {isProfileMenuOpen && (
          <div className={`
             absolute bottom-full mb-4 z-[120]
             bg-[#0f141c]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden
             transition-all duration-200 animate-fade-in
             ${isOpen ? 'left-4 w-64' : 'left-20 w-64'}
          `}>
            {menuView === 'main' ? (
              /* MAIN MENU VIEW */
              <div className="py-2">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-sm font-bold text-white">{userProfile?.fullName || 'Loading...'}</p>
                  <p className="text-xs text-slate-400">{userProfile?.email}</p>
                </div>

                <button
                  onClick={() => router.push('/settings/account')}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User size={16} className="mr-3 text-slate-400" />
                  My Account
                </button>

                <button
                  onClick={() => {
                    onSelectCollection('personal-context');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Brain size={16} className="mr-3 text-slate-400" />
                  Personal Context
                </button>

                <button
                  onClick={() => setMenuView('backgrounds')}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center">
                    <ImageIcon size={16} className="mr-3 text-slate-400" />
                    Backgrounds
                  </div>
                  <ChevronRight size={14} className="text-slate-500" />
                </button>

                {/* Admin Dashboard Link */}
                {(userProfile?.role === 'admin' || isImpersonating) && (
                  <button
                    onClick={() => {
                      if (pathname?.startsWith('/admin')) {
                        router.push('/dashboard');
                      } else {
                        router.push('/admin');
                      }
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center">
                      <LayoutDashboard size={16} className="mr-3 text-slate-400" />
                      {pathname?.startsWith('/admin') ? 'Platform Dashboard' : 'Admin Console'}
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                )}



                {/* Admin Role Switcher Entry */}
                {(userProfile?.role === 'admin' || isImpersonating) && (
                  <button
                    onClick={() => setMenuView('roles')}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center">
                      <Flame size={16} className={`mr-3 ${isImpersonating ? 'text-brand-red animate-pulse' : 'text-slate-400'}`} />
                      Switch Role
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                )}

                <div className="h-px bg-white/5 my-1 mx-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm text-brand-red hover:bg-brand-red/10 transition-colors"
                >
                  <LogOut size={16} className="mr-3" />
                  Log Out
                </button>
              </div>
            ) : menuView === 'backgrounds' ? (
              /* BACKGROUNDS SELECTION VIEW */
              <div className="flex flex-col h-full max-h-[400px]">
                <div className="flex items-center px-2 py-3 border-b border-white/5">
                  <button
                    onClick={() => setMenuView('main')}
                    className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors mr-2"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-white">Select Background</span>
                </div>

                <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {BACKGROUND_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onThemeChange(theme)}
                      className={`
                               w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all border border-transparent
                               ${currentTheme.id === theme.id
                          ? 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/20'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }
                            `}
                    >
                      <span>{theme.label}</span>
                      {currentTheme.id === theme.id && <Check size={14} />}
                    </button>
                  ))}

                  <div className="h-px bg-white/10 my-2"></div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Upload size={14} className="mr-2" /> Upload Custom
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            ) : (
              /* ROLES SELECTION VIEW */
              <div className="flex flex-col h-full max-h-[400px]">
                <div className="flex items-center px-2 py-3 border-b border-white/5">
                  <button
                    onClick={() => setMenuView('main')}
                    className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors mr-2"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-white">Switch Role</span>
                </div>

                <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {/* Platform Admin (Exit) */}
                  <button
                    onClick={handleExitView}
                    className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border border-transparent
                                ${!isImpersonating
                        ? 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                            `}
                  >
                    <div className="p-1 rounded bg-brand-red/10 text-brand-red">
                      <Flame size={14} />
                    </div>
                    <span className="flex-1 text-left">Platform Administrator</span>
                    {!isImpersonating && <Check size={14} />}
                  </button>

                  <div className="h-px bg-white/10 my-2 mx-2"></div>
                  <p className="px-2 text-[10px] text-slate-500 uppercase tracking-widest mb-1">Demo Accounts</p>

                  {DEMO_ACCOUNTS.map(account => {
                    const Icon = account.icon;
                    const isActive = userProfile?.email === account.email;
                    return (
                      <button
                        key={account.id}
                        onClick={() => handleSwitchUser(account.email)}
                        className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border border-transparent
                                        ${isActive
                            ? 'bg-brand-blue-light/10 text-brand-blue-light border-brand-blue-light/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }
                                    `}
                      >
                        <div className={`p-1 rounded bg-white/5 ${account.color}`}>
                          <Icon size={14} />
                        </div>
                        <span className="flex-1 text-left">{account.label}</span>
                        {isActive && <Check size={14} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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
                w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0 group-hover:scale-105 transition-transform duration-300
                ${isImpersonating ? 'shadow-[0_0_15px_rgba(220,38,38,0.8)] border-brand-red/50' : ''}
            `}>
              {userProfile?.initials || '...'}
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