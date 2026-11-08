import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  ShieldCheck,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  examStore,
  Subject,
  ALL_SECTIONS,
  normalizeAndDedupeSections,
} from '../../services/examStore.ts';

export const SubjectManagement: React.FC = () => {
  const state = examStore.getState();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([
    ...ALL_SECTIONS,
  ]);
  const [webcamProctoring, setWebcamProctoring] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleSection = (sec: string) => {
    setSelectedCohorts((prev) =>
      prev.includes(sec)
        ? prev.filter((s) => s !== sec)
        : normalizeAndDedupeSections([...prev, sec])
    );
  };

  const openAddModal = () => {
    setEditingSubjectId(null);
    setCode('');
    setName('');
    setDescription('');
    setStatus('Active');
    setSelectedCohorts([...ALL_SECTIONS]);
    setWebcamProctoring(true);
    setShowModal(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubjectId(sub.id);
    setCode(sub.code);
    setName(sub.name);
    setDescription(sub.description);
    setStatus(sub.status);
    setSelectedCohorts(normalizeAndDedupeSections(sub.cohorts));
    setWebcamProctoring(sub.webcamProctoring);
    setShowModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingSubjectId) {
      examStore.updateSubject(editingSubjectId, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description:
          description.trim() ||
          'Core academic subject curriculum for scheduled assessments.',
        status,
        cohorts: selectedCohorts.length > 0 ? selectedCohorts : ['A'],
        webcamProctoring,
      });
      setSuccessMsg(`Updated subject "${name.trim()}" (${code.trim().toUpperCase()}).`);
    } else {
      examStore.addSubject({
        code,
        name,
        description:
          description.trim() ||
          'Core academic subject curriculum for scheduled assessments.',
        cohorts: selectedCohorts,
        webcamProctoring,
      });
      setSuccessMsg(`Created new subject "${name.trim()}" (${code.trim().toUpperCase()}).`);
    }

    setCode('');
    setName('');
    setDescription('');
    setEditingSubjectId(null);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = examStore.deleteSubject(id);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Subject deleted.');
    }
  };

  return (
    <div className="space-y-6 max-w-[1480px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900">
              Subject &amp; Curriculum Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create and edit academic subjects, assigned student cohorts (Section A–L), and
            confidential proctoring policies.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.subjects.map((sub) => {
          const examCount = state.exams.filter((e) => e.subjectId === sub.id).length;
          return (
            <div
              key={sub.id}
              className="bg-[#0E1132] rounded-2xl border border-purple-500/30 p-6 shadow-lg flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold text-cyan-300">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                        sub.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <button
                      type="button"
                      aria-label={`Edit ${sub.name}`}
                      onClick={() => openEditModal(sub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${sub.name}`}
                      onClick={() => handleDelete(sub.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-extrabold text-white mt-2">
                  {sub.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-4 border-t border-purple-500/20 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Assigned Sections:</span>
                  <span className="font-bold text-white">
                    {normalizeAndDedupeSections(sub.cohorts).join(', ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Linked Examinations:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {examCount} exam(s)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Webcam &amp; Audio Audit
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      examStore.updateSubject(sub.id, {
                        webcamProctoring: !sub.webcamProctoring,
                      })
                    }
                    className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border transition-colors cursor-pointer ${
                      sub.webcamProctoring
                        ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/35'
                        : 'bg-rose-500/25 border-rose-400/50 text-rose-200 hover:bg-rose-500/35'
                    }`}
                  >
                    {sub.webcamProctoring ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">
                {editingSubjectId ? 'Edit Academic Subject' : 'Add Academic Subject'}
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => {
                  setEditingSubjectId(null);
                  setShowModal(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. CS101, PY202, DB301"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Curriculum Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'Active' | 'Inactive')
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Python Programming, Database Management"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief curriculum description or syllabus overview..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Assigned Student Sections (A – L)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCohorts([...ALL_SECTIONS])}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Select All (A–L)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCohorts(['A'])}
                      className="font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Reset to Sec A
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-6 gap-1.5">
                  {ALL_SECTIONS.map((sec) => {
                    const active = selectedCohorts.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => toggleSection(sec)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confidential Webcam & Audio Proctoring Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Confidential Webcam &amp; Audio Proctoring
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Periodic 60s camera snapshot auditing with multi-face / no-face
                      detection.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWebcamProctoring(!webcamProctoring)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-colors cursor-pointer ${
                    webcamProctoring
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                      : 'bg-rose-500/25 border-rose-400/50 text-rose-200'
                  }`}
                >
                  {webcamProctoring ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubjectId(null);
                    setShowModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingSubjectId ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
