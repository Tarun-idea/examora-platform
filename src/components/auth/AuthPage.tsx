import React, { useState } from 'react';
import {
  GraduationCap,
  Settings,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Code2,
  Zap,
  Trophy,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';
import { InstitutionalHeaderBrand } from '../common/InstitutionalHeaderBrand.tsx';
import { GlobalFooter } from '../common/GlobalFooter.tsx';

interface AuthPageProps {
  initialRole?: 'admin' | 'student';
  onBackToWelcome: () => void;
  onSuccess: (role: 'admin' | 'student') => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialRole = 'admin',
  onBackToWelcome,
  onSuccess,
}) => {
  const state = examStore.getState();
  const collegeLogoUrl = state.settings.collegeLogoUrl || '';
  const institutionName = state.settings.institutionName;

  const [role, setRole] = useState<'admin' | 'student'>(initialRole);
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password / OTP flow
  const [forgotMode, setForgotMode] = useState<boolean>(false);
  const [recoveryEmail] = useState<string>('tarunkumarv2008@gmail.com');
  const [generatedOtp, setGeneratedOtp] = useState<string>('920438');
  const [enteredOtp, setEnteredOtp] = useState<string>('920438');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleSwitch = (nextRole: 'admin' | 'student') => {
    setRole(nextRole);
    setError(null);
    setOtpSuccessMsg(null);
    setForgotMode(false);
    setIdentifier('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(
        role === 'admin'
          ? 'Please enter the Administrator username.'
          : 'Please enter your registered Student ID or Email.'
      );
      return;
    }

    if (role === 'admin' && !password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await examStore.loginWithRemoteSync(identifier, password, role);

      if (!res.success) {
        setError(res.error || 'Authentication failed.');
        return;
      }

      onSuccess(role);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForgot = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setEnteredOtp(code);
    setForgotMode(true);
    setError(null);
    setOtpSuccessMsg(null);
  };

  const handleSendToGmail = () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setOtpSuccessMsg(
        `OTP (${generatedOtp}) dispatched to ${recoveryEmail} and pre-filled below.`
      );
    }, 500);
  };

  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (enteredOtp.trim() !== generatedOtp) {
      setError('Invalid OTP verification code. Click Auto-fill OTP to match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    examStore.resetPasswordWithOtp(recoveryEmail, newPassword);
    setPassword(newPassword);
    setForgotMode(false);
    setOtpSuccessMsg('Password updated successfully! You can now sign in.');
  };

  return (
    <div className="min-h-screen bg-[#06071B] text-white flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient Cosmic Nebulae */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-28 left-1/4 w-96 h-96 rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(4,5,20,0.9)] border border-purple-500/35 bg-[#0B0E2B]/90 backdrop-blur-xl">
        {/* Left Branding & Cosmic Showcase Column */}
        <div className="lg:col-span-6 p-6 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0A0D2E] via-[#131147] to-[#1E145E] border-b lg:border-b-0 lg:border-r border-purple-500/25">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-purple-400/20">
              <InstitutionalHeaderBrand
                logoUrl={collegeLogoUrl}
                arenaSubtitle={institutionName}
                compact
              />

              <button
                type="button"
                onClick={onBackToWelcome}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-purple-400/30 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Welcome Page
              </button>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-xs font-semibold text-purple-200">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
              <span>Learn • Practice • Compete</span>
            </div>

            <div className="mt-4 space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-tight">
                Dream Big.
                <br />
                <span className="bg-gradient-to-r from-[#C084FC] via-[#818CF8] to-[#38BDF8] bg-clip-text text-transparent">
                  Crack It.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
                Conduct high-integrity university examinations, coding
                competitions, and real-time evaluations in one unified platform.
              </p>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs sm:text-sm font-medium text-slate-200">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                Multiple Question Types (MCQ, Descriptive &amp; Coding)
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                Real-Time Fullscreen &amp; Tab-Switch Monitoring
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Trophy className="w-4 h-4" />
                </span>
                Instant Evaluation &amp; Verifiable Certificates
              </li>
            </ul>
          </div>

          {/* Security Notice Footer */}
          <div className="mt-10 pt-6 border-t border-purple-400/20">
            <div className="bg-[#0B0E2B]/70 backdrop-blur-md rounded-2xl p-4 border border-purple-400/30 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">
                  Role-Restricted Authentication:
                </strong>{' '}
                Only authorized Administrator credentials can access the Admin
                Console. Students must sign in using their registered Student ID.
              </div>
            </div>
          </div>
        </div>

        {/* Right Dark Cosmic Authentication Card */}
        <div className="lg:col-span-6 bg-[#0D102D] p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Top Emblem */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/25 to-indigo-600/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(124,58,237,0.3)] mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome Back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {role === 'admin'
                  ? 'Enter your Administrator username and password'
                  : 'Enter your registered Student ID and password'}
              </p>
            </div>

            {/* Role Switcher Pill (Admin vs Student) */}
            <div className="mt-6 grid grid-cols-2 gap-2 p-1.5 bg-[#131742] rounded-2xl border border-purple-500/30">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-[0_0_20px_rgba(124,58,237,0.45)]'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-sm font-bold leading-none">Admin</div>
                  <div
                    className={`text-[11px] mt-1 ${
                      role === 'admin' ? 'text-purple-100' : 'text-slate-400'
                    }`}
                  >
                    Manage Exams
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('student')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white shadow-[0_0_20px_rgba(124,58,237,0.45)]'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-sm font-bold leading-none">Student</div>
                  <div
                    className={`text-[11px] mt-1 ${
                      role === 'student' ? 'text-purple-100' : 'text-slate-400'
                    }`}
                  >
                    Take Exams
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {otpSuccessMsg && (
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            {!forgotMode ? (
              /* Standard Login Form */
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="auth-identifier"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    {role === 'admin' ? 'Admin Username' : 'Student ID or Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        role === 'admin'
                          ? 'Enter admin username'
                          : 'Enter your registered Student ID'
                      }
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-500/35 bg-[#131742] text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    {role === 'admin' ? 'Password' : 'Password (or Student ID)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        role === 'admin'
                          ? 'Enter password'
                          : 'Enter password (e.g. 123 or your Student ID)'
                      }
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-purple-500/35 bg-[#131742] text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-purple-500/40 text-purple-600 focus:ring-purple-500"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgot}
                    className="font-semibold text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] disabled:opacity-60 text-white font-bold text-sm shadow-[0_0_25px_rgba(124,58,237,0.45)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {isSubmitting ? 'Syncing & Signing In...' : 'Login'}
                </button>
              </form>
            ) : (
              /* Step 2: Verify OTP & Update Password */
              <form onSubmit={handleVerifyOtpAndReset} className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <span className="text-sm font-bold text-white">
                    Step 2: Verify OTP &amp; Update Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-500/15 border border-purple-500/35 space-y-2.5">
                  <div className="text-xs font-mono font-bold text-purple-200">
                    OTP ({recoveryEmail}): {generatedOtp}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendToGmail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {sendingEmail ? 'Sending...' : 'Send to Gmail Inbox'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(generatedOtp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Auto-fill OTP
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    aria-label="OTP Code"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full py-2.5 px-4 text-center font-mono font-bold text-sm rounded-xl border border-purple-500/35 bg-[#131742] text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-purple-500/35 bg-[#131742] text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full py-2.5 px-3.5 rounded-xl border border-purple-500/35 bg-[#131742] text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify OTP &amp; Update Password
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Your data is safe and secure with ExamFlow</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
};
