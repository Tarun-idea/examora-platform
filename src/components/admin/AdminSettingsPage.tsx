import React, { useState, useRef } from 'react';
import {
  Settings,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  UserCheck,
  Calendar,
  Upload,
  GraduationCap,
  Trash2,
  Lock,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { examStore } from '../../services/examStore.ts';

export const AdminSettingsPage: React.FC = () => {
  const state = examStore.getState();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [institutionName, setInstitutionName] = useState<string>(
    state.settings.institutionName
  );
  const [academicSession, setAcademicSession] = useState<string>(
    state.settings.academicSession || '2026 - 2027 Academic Year'
  );
  const [adminName, setAdminName] = useState<string>(state.settings.adminName);
  const [adminEmail, setAdminEmail] = useState<string>(
    state.settings.adminEmail
  );
  const [contactPhone, setContactPhone] = useState<string>(
    state.settings.contactPhone || '+1 (555) 234-5678'
  );
  const [websiteUrl, setWebsiteUrl] = useState<string>(
    state.settings.websiteUrl || 'https://examflow.university.edu'
  );
  const [institutionAddress, setInstitutionAddress] = useState<string>(
    state.settings.institutionAddress ||
      '100 University Avenue, Academic Block B, Innovation Campus'
  );
  const [timezone, setTimezone] = useState<string>(
    state.settings.timezone || 'UTC-05:00 (Eastern Time)'
  );
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string>(
    state.settings.collegeLogoUrl || ''
  );
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Change Password state inside Admin Settings
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCollegeLogoUrl(reader.result);
        examStore.updateSettings({ collegeLogoUrl: reader.result });
        setSavedBanner(
          'Custom College Logo uploaded! Updated across Sidebar, Login Screen, Hall Tickets, and Certificates.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setCollegeLogoUrl('');
    examStore.updateSettings({ collegeLogoUrl: '' });
    setSavedBanner('Restored default ExamFlow Academic Crest.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    examStore.updateSettings({
      institutionName: institutionName.trim() || state.settings.institutionName,
      academicSession: academicSession.trim(),
      adminName: adminName.trim() || state.settings.adminName,
      adminEmail: adminEmail.trim() || state.settings.adminEmail,
      contactPhone: contactPhone.trim(),
      websiteUrl: websiteUrl.trim(),
      institutionAddress: institutionAddress.trim(),
      timezone,
      collegeLogoUrl,
    });
    setSavedBanner(
      'General institution details and official college logo saved across all portals, Hall Tickets, and Certificates.'
    );
  };

  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const res = examStore.changeAdminPassword(
      currentPassword.trim(),
      newPassword.trim(),
      confirmPassword.trim()
    );
    if (!res.success) {
      setPasswordError(res.error || 'Failed to update administrator password.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(
      'Administrator password updated successfully and synced permanently across all devices!'
    );
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              General Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure your Official College / University Logo, General
            Institutional Details, and Administrator Password.
          </p>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSavedBanner(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Official College / University Logo Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">
            Official College / University Logo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your institution logo to display across the Sidebar, Login
            Screen, Student Hall Tickets, and Official Certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-md overflow-hidden shrink-0 border border-slate-200">
            {collegeLogoUrl ? (
              <img
                src={collegeLogoUrl}
                alt="Custom College Logo"
                className="w-full h-full object-contain bg-white p-1"
              />
            ) : (
              <GraduationCap className="w-8 h-8" />
            )}
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="text-xs font-bold text-slate-900">
              {collegeLogoUrl
                ? 'Custom College Emblem Active'
                : 'Default ExamFlow Academic Crest'}
            </div>
            <p className="text-[11px] text-slate-500">
              Upload PNG, JPG, or SVG emblem (recommended square 120×120px).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload College Logo"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Logo Image
              </button>
              {collegeLogoUrl && (
                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Institution Details Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">
            General Institution Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            These details appear across student portals, Hall Tickets, result
            transcripts, and official achievement certificates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label
              htmlFor="setting-institution-name"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Institution / University Name
            </label>
            <input
              id="setting-institution-name"
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Enter institution name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-academic-session"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Academic Session / Term
            </label>
            <input
              id="setting-academic-session"
              type="text"
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              placeholder="e.g., 2026 - 2027 Academic Year"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-timezone"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Default Institutional Timezone
            </label>
            <select
              id="setting-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="UTC-08:00 (Pacific Time)">
                UTC-08:00 (Pacific Time)
              </option>
              <option value="UTC-05:00 (Eastern Time)">
                UTC-05:00 (Eastern Time)
              </option>
              <option value="UTC+00:00 (GMT / London)">
                UTC+00:00 (GMT / London)
              </option>
              <option value="UTC+05:30 (IST / India Standard Time)">
                UTC+05:30 (IST / India Standard Time)
              </option>
              <option value="UTC+08:00 (Singapore / CST)">
                UTC+08:00 (Singapore / CST)
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="setting-admin-name"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Chief Examination Officer Name
            </label>
            <input
              id="setting-admin-name"
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Enter administrator full name"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-admin-email"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Administrator Contact Email
            </label>
            <input
              id="setting-admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@university.edu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-contact-phone"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              Examination Helpdesk Phone
            </label>
            <input
              id="setting-contact-phone"
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-website-url"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Official Portal Website URL
            </label>
            <input
              id="setting-website-url"
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://examflow.university.edu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="setting-address"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Institution Campus / Mailing Address
            </label>
            <input
              id="setting-address"
              type="text"
              value={institutionAddress}
              onChange={(e) => setInstitutionAddress(e.target.value)}
              placeholder="Enter campus address"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Save General Settings
          </button>
        </div>
      </form>

      {/* Change Admin Password Card (Inside Admin Settings Page) */}
      <form
        onSubmit={handleChangeAdminPassword}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900">
              Change Password
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Update the Administrator login password using your current password
            and a new password. Changes sync permanently across all devices.
          </p>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setPasswordSuccess(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="setting-current-password"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Current Password
            </label>
            <input
              id="setting-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-new-password"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              New Password
            </label>
            <input
              id="setting-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="setting-confirm-password"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Confirm New Password
            </label>
            <input
              id="setting-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};

