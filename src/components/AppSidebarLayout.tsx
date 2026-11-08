import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  ClipboardCheck,
  Award,
  Trophy,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  ChevronDown,
  Clock,
  CheckCircle2,
  X,
  Code2,
  Calendar,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, examStore } from '../services/examStore.ts';
import { InstitutionalHeaderBrand } from './common/InstitutionalHeaderBrand.tsx';
import { GlobalFooter } from './common/GlobalFooter.tsx';

interface AppSidebarLayoutProps {
  currentUser: UserProfile;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppSidebarLayout: React.FC<AppSidebarLayoutProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onLogout,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'admin';
  const state = examStore.getState();
  const collegeLogoUrl = state.settings.collegeLogoUrl || '';

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-students', label: 'Students', icon: Users },
    { id: 'admin-subjects', label: 'Subjects', icon: BookOpen },
    { id: 'admin-exams', label: 'Examinations', icon: FileText },
    { id: 'admin-questions', label: 'Question Bank', icon: HelpCircle },
    { id: 'admin-evaluations', label: 'Evaluation', icon: ClipboardCheck },
    { id: 'admin-leaderboard', label: 'Results', icon: Trophy },
    { id: 'admin-certificates', label: 'Certificates', icon: Award },
    { id: 'admin-violations', label: 'Violations', icon: ShieldAlert },
    { id: 'admin-settings', label: 'Settings', icon: Settings },
  ];

  const studentNavItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-exams', label: 'My Examinations', icon: FileText },
    { id: 'student-upcoming', label: 'Upcoming Exams', icon: Clock },
    { id: 'student-history', label: 'Exam History', icon: CheckCircle2 },
    { id: 'student-results', label: 'Published Results', icon: Trophy },
    { id: 'student-certificates', label: 'Certificates', icon: Award },
    { id: 'student-profile', label: 'Student Profile', icon: Users },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (isAdmin) {
      if (q.includes('student') || q.includes('stu')) {
        onSelectTab('admin-students');
      } else if (q.includes('subject') || q.includes('python') || q.includes('dbms')) {
        onSelectTab('admin-subjects');
      } else if (q.includes('question') || q.includes('mcq')) {
        onSelectTab('admin-questions');
      } else if (q.includes('violation') || q.includes('tab')) {
        onSelectTab('admin-violations');
      } else if (q.includes('eval') || q.includes('grade') || q.includes('sub')) {
        onSelectTab('admin-evaluations');
      } else if (q.includes('cert')) {
        onSelectTab('admin-certificates');
      } else {
        onSelectTab('admin-exams');
      }
    } else {
      if (q.includes('result') || q.includes('score')) {
        onSelectTab('student-results');
      } else if (q.includes('cert')) {
        onSelectTab('student-certificates');
      } else if (q.includes('prof')) {
        onSelectTab('student-profile');
      } else if (q.includes('upcom')) {
        onSelectTab('student-upcoming');
      } else if (q.includes('hist')) {
        onSelectTab('student-history');
      } else {
        onSelectTab('student-exams');
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#07081C] text-slate-100 flex flex-col">
      {/* Sleek Full-Width Top Header Bar (No Middle Divider Lines or Box Frames) */}
      <header className="shrink-0 z-50 bg-[#080B24]/95 backdrop-blur-xl border-b border-purple-500/25 px-4 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            type="button"
            aria-label="Toggle Sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-[#131742] border border-purple-500/30 text-slate-200 hover:bg-purple-500/20 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <InstitutionalHeaderBrand
            logoUrl={collegeLogoUrl}
            arenaSubtitle={isAdmin ? 'Admin Arena' : 'Student Arena'}
          />
        </div>

        {/* Center-Right Search & Controls */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4 min-w-0">
          <form
            onSubmit={handleGlobalSearchSubmit}
            className="relative flex-1 max-w-md min-w-[180px]"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything (exams, students, subjects)..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[#11163F] border border-purple-500/35 focus:border-cyan-400 text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </form>

          {/* Right Header Controls: Date Pill, Notifications & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Current Date Pill (Matching "Mon, Nov 17, 2025" in Template) */}
            <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#131742] border border-purple-500/30 text-xs font-semibold text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{formattedToday}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-xl bg-[#131742] border border-purple-500/30 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {state.activities.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {state.activities.length > 9
                      ? '9+'
                      : state.activities.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-88 bg-[#0E1132] rounded-2xl shadow-2xl border border-purple-500/40 p-4 z-[100]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/20">
                    <span className="text-xs font-extrabold text-white">
                      Recent Platform Notifications ({state.activities.length})
                    </span>
                    <div className="flex items-center gap-3">
                      {state.activities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => examStore.clearAllActivities()}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-[11px] font-semibold text-purple-300 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-purple-500/15">
                    {state.activities.length > 0 ? (
                      state.activities.map((act) => (
                        <div
                          key={act.id}
                          className="py-2.5 flex items-start justify-between gap-2.5 text-xs group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-slate-100 font-medium leading-snug">
                              {act.text}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {act.timeAgo}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove notification"
                            title="Remove notification"
                            onClick={() => examStore.deleteActivity(act.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications at the moment.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-[#131742] border border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-white leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-purple-300 mt-0.5 uppercase">
                    {isAdmin ? 'Administrator' : currentUser.studentId || 'Student'}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0E1132] rounded-2xl shadow-2xl border border-purple-500/40 p-2 z-[100]">
                  <div className="px-3 py-2 border-b border-purple-500/20">
                    <div className="text-xs font-bold text-white">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectTab(isAdmin ? 'admin-settings' : 'student-profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-purple-500/20 transition-colors cursor-pointer mt-1"
                  >
                    {isAdmin ? 'General Settings' : 'Student Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Below-Header Body: Left Sidebar + Right Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Cosmic Violet-Indigo Sidebar (Fixed in Screen) */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } h-full bg-[#090B24] border-r border-purple-500/25 text-white flex flex-col justify-between transition-all duration-200 shrink-0 select-none z-20 overflow-y-auto`}
        >
          {/* Navigation Menu */}
          <nav aria-label="Sidebar Navigation" className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#38BDF8]/90 text-white shadow-[0_0_22px_rgba(124,58,237,0.5)] border border-cyan-300/30'
                      : 'text-slate-300 hover:bg-purple-500/15 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom Sidebar Footer */}
          <div className="p-3.5 border-t border-purple-500/20 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-purple-500/30 text-slate-200 hover:text-red-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Page Viewport (Scrolls Independently with Global Footer at Bottom) */}
        <main className="flex-1 h-full overflow-y-auto min-w-0 flex flex-col justify-between">
          <div className="p-6 flex-1">{children}</div>
          <GlobalFooter className="mt-8" />
        </main>
      </div>
    </div>
  );
};

