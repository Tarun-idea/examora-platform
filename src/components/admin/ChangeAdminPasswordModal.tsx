import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Mail,
  Send,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';
import { sendAdminOtpGmail } from '../../services/firebase.ts';

interface ChangeAdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangeAdminPasswordModal: React.FC<ChangeAdminPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Gmail OTP Mode State
  const [otpEmail, setOtpEmail] = useState('taruntk2008@gmail.com');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [pendingGmailConfirm, setPendingGmailConfirm] = useState<{
    recipient: string;
    otp: string;
  } | null>(null);
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRequestGmailOtp = () => {
    setErrorMessage('');
    setSuccessMessage('');
    const res = examStore.requestAdminPasswordResetOtp(otpEmail.trim() || 'taruntk2008@gmail.com');
    if (res.success && res.otp) {
      const recipient = res.sentTo || 'taruntk2008@gmail.com';
      setGeneratedOtp(res.otp);
      setOtpInput(''); // Never pre-fill OTP on screen; sent only to Gmail inbox
      setPendingGmailConfirm({ recipient, otp: res.otp });
    } else {
      setErrorMessage(res.error || 'Could not generate OTP code.');
    }
  };

  const handleConfirmSendGmail = async () => {
    if (!pendingGmailConfirm) return;
    const { recipient, otp } = pendingGmailConfirm;
    // Call sendAdminOtpGmail synchronously before unmounting the button so Chrome preserves user gesture activation
    const sendPromise = sendAdminOtpGmail(recipient, otp);
    setIsSendingGmail(true);
    setErrorMessage('');
    setSuccessMessage('');

    const sendRes = await sendPromise;
    setIsSendingGmail(false);
    setPendingGmailConfirm(null);

    if (sendRes.success) {
      setSuccessMessage(
        `6-digit verification code sent to ${recipient}! Check your Gmail inbox and enter the code below.`
      );
    } else {
      setErrorMessage(
        sendRes.error || 'Failed to send verification code via Gmail. Please try again.'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res =
        mode === 'password'
          ? examStore.changeAdminPassword(currentPassword, newPassword, confirmPassword)
          : examStore.verifyOtpAndResetAdminPassword(otpInput, newPassword, confirmPassword);

      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(
          'Administrator password successfully updated! Future logins will use this new password.'
        );
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedOtp(null);
        setOtpInput('');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Change Administrator Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update credentials using your current password or Gmail OTP verification.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'password'
                ? 'bg-white dark:bg-slate-900 text-[#0066FF] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Current Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'otp'
                ? 'bg-white dark:bg-slate-900 text-[#0066FF] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Gmail OTP (taruntk2008)
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'password' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Admin Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="Enter active password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-900"
                />
                <button
                  type="button"
                  disabled={isSendingGmail}
                  onClick={handleRequestGmailOtp}
                  className="px-3 py-2 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Get OTP</span>
                </button>
              </div>

              {pendingGmailConfirm && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Send 6-digit OTP email via Gmail to{' '}
                      <span className="font-mono underline">{pendingGmailConfirm.recipient}</span>?
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSendingGmail}
                      onClick={handleConfirmSendGmail}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                    >
                      {isSendingGmail ? 'Sending via Gmail...' : 'Confirm & Send Email'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingGmailConfirm(null)}
                      className="py-1.5 px-2.5 rounded-lg border border-amber-300 bg-white text-amber-900 font-semibold text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {generatedOtp && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0052D4] truncate">
                    Inbox: <strong className="font-mono">{otpEmail}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSendingGmail}
                    onClick={() =>
                      setPendingGmailConfirm({
                        recipient: otpEmail || 'taruntk2008@gmail.com',
                        otp: generatedOtp,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                  >
                    {isSendingGmail ? 'Sending...' : 'Send / Resend to Gmail'}
                  </button>
                </div>
              )}

              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit OTP from your Gmail inbox"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-center font-bold text-slate-900"
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Admin Password * (minimum 6 characters)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Enter new administrator password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Re-enter new administrator password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0066FF] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating Key...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
