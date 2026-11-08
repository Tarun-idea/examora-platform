import React, { useState } from 'react';
import {
  GraduationCap,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  KeyRound,
  Trophy,
  Award,
} from 'lucide-react';
import { examStore } from '../services/examStore.ts';
import { User } from '../types/exam.ts';
import { ChangeAdminPasswordModal } from './admin/ChangeAdminPasswordModal.tsx';

interface NavbarProps {
  currentUser: User;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => onSelectTab(isAdmin ? 'admin-dashboard' : 'student-dashboard')}
              className="flex items-center gap-2 text-left group focus:outline-hidden shrink-0 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Exam<span className="text-blue-600 dark:text-blue-400">Flow</span>
              </span>
            </button>

            {/* Desktop Navigation Links */}
            {isAdmin ? (
              <nav className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => onSelectTab('admin-dashboard')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onSelectTab('admin-exams')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-exams'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Exams
                </button>
                <button
                  onClick={() => onSelectTab('admin-questions')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-questions'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Questions
                </button>
                <button
                  onClick={() => onSelectTab('admin-subjects')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-subjects'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Subjects
                </button>
                <button
                  onClick={() => onSelectTab('admin-students')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-students'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Students
                </button>
                <button
                  onClick={() => onSelectTab('admin-leaderboard')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-leaderboard'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Leaderboard
                </button>
                <button
                  onClick={() => onSelectTab('admin-evaluations')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-evaluations'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Evaluations
                </button>
                <button
                  onClick={() => onSelectTab('admin-certificates')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-certificates'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Certificates
                </button>
                <button
                  onClick={() => onSelectTab('admin-violations')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    currentTab === 'admin-violations'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Violations
                </button>
              </nav>
            ) : (
              <nav className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => onSelectTab('student-dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'student-dashboard'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onSelectTab('student-exams')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'student-exams'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  My Examinations
                </button>
                <button
                  onClick={() => onSelectTab('student-results')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'student-results'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Published Results
                </button>
              </nav>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Dark / Light Mode"
              aria-label="Toggle Dark / Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800 transition-colors text-left cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                    isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight whitespace-nowrap">
                    {isAdmin ? 'Admin' : currentUser.name.split(' ')[0]}
                  </div>
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${
                      isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isAdmin ? 'Portal' : currentUser.studentId || 'ID-01'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                        isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                      }`}
                    >
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Role</span>
                      <span
                        className={`font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    {!isAdmin && currentUser.studentId && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Student ID</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {currentUser.studentId}
                        </span>
                      </div>
                    )}
                    {currentUser.department && (
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Department</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">
                          {currentUser.department}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Change Admin Password</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        examStore.logout();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out of Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Prominent Log Out Button */}
            <button
              onClick={() => examStore.logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
              title="Log Out of Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Admin Password Modal */}
      <ChangeAdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </header>
  );
};
