import React, { useState, useEffect } from 'react';
import { examStore } from './services/examStore.ts';
import { resolveUiTheme } from './utils/uiThemes.ts';
import { WelcomeLandingPage } from './components/welcome/WelcomeLandingPage.tsx';
import { AuthPage } from './components/auth/AuthPage.tsx';
import { AppSidebarLayout } from './components/AppSidebarLayout.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { ExamManagement } from './components/admin/ExamManagement.tsx';
import { QuestionBank } from './components/admin/QuestionBank.tsx';
import { SubjectManagement } from './components/admin/SubjectManagement.tsx';
import { StudentManagement } from './components/admin/StudentManagement.tsx';
import { LeaderboardPage } from './components/admin/LeaderboardPage.tsx';
import { EvaluationStation } from './components/admin/EvaluationStation.tsx';
import { CertificateManagement } from './components/admin/CertificateManagement.tsx';
import { ViolationMonitoring } from './components/admin/ViolationMonitoring.tsx';
import { AdminSettingsPage } from './components/admin/AdminSettingsPage.tsx';
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { ExamEnvironment } from './components/student/ExamEnvironment.tsx';
import { StudentResultsView } from './components/student/StudentResultsView.tsx';

export function App() {
  const [storeState, setStoreState] = useState(() => examStore.getState());
  const [showWelcomePage, setShowWelcomePage] = useState<boolean>(true);
  const [authInitialRole, setAuthInitialRole] = useState<'admin' | 'student'>('admin');

  const [currentTab, setCurrentTab] = useState<string>('admin-dashboard');
  const [selectedQuestionExamId, setSelectedQuestionExamId] = useState<string | undefined>(
    undefined
  );
  const [openCreateExamInit, setOpenCreateExamInit] = useState<boolean>(false);

  // Active live exam session or result inspection for student
  const [activeExamSessionId, setActiveExamSessionId] = useState<string | null>(null);
  const [viewingResultAttemptId, setViewingResultAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = examStore.subscribe(() => {
      setStoreState({ ...examStore.getState() });
    });
    return unsub;
  }, []);

  // Sync UI Theme Color (9 Templates) & Dark Mode on root html element across all pages
  const activeUiThemeObj = resolveUiTheme(storeState.settings.uiTheme);
  const isDarkMode = !activeUiThemeObj.isLight;
  const accentColor = storeState.settings.accentColor || 'blue';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-accent', accentColor);
    document.documentElement.setAttribute('data-ui-theme', activeUiThemeObj.id);
    document.documentElement.setAttribute(
      'data-theme-mode',
      activeUiThemeObj.isLight ? 'light' : 'dark'
    );
  }, [isDarkMode, accentColor, activeUiThemeObj.id, activeUiThemeObj.isLight]);

  // Poll for Timed Auto-Publishing of scheduled exam results every 15 seconds
  useEffect(() => {
    examStore.checkTimedAutoPublish();
    const timer = setInterval(() => {
      examStore.checkTimedAutoPublish();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Keep currentTab aligned when user switches between Admin and Student
  useEffect(() => {
    if (storeState.currentUser.role === 'admin' && currentTab.startsWith('student-')) {
      setCurrentTab('admin-dashboard');
      setActiveExamSessionId(null);
      setViewingResultAttemptId(null);
    } else if (storeState.currentUser.role === 'student' && currentTab.startsWith('admin-')) {
      setCurrentTab('student-dashboard');
    }
  }, [storeState.currentUser.role]);

  const currentUser = storeState.currentUser;
  const isAdmin = currentUser.role === 'admin';

  // =========================================================
  // STAGE 1 & STAGE 2: UNAUTHENTICATED WORKFLOW
  // =========================================================
  if (!storeState.isAuthenticated) {
    if (showWelcomePage) {
      return (
        <WelcomeLandingPage
          onNavigateToLogin={(role = 'admin') => {
            setAuthInitialRole(role);
            setShowWelcomePage(false);
          }}
        />
      );
    }

    return (
      <AuthPage
        initialRole={authInitialRole}
        onBackToWelcome={() => setShowWelcomePage(true)}
        onSuccess={(role) => {
          const freshState = examStore.getState();
          setStoreState({ ...freshState });
          setCurrentTab(role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => examStore.toggleThemeMode()}
      />
    );
  }

  // =========================================================
  // PROCTORED EXAM ENVIRONMENT (FULL-SCREEN LOCK FOR STUDENT)
  // =========================================================
  const activeSessionExam = activeExamSessionId
    ? storeState.exams.find((e) => e.id === activeExamSessionId)
    : undefined;
  const isSessionExamDraft =
    activeSessionExam &&
    String(activeSessionExam.status || '').trim().toLowerCase() === 'draft';

  if (!isAdmin && activeExamSessionId && !isSessionExamDraft) {
    return (
      <ExamEnvironment
        examId={activeExamSessionId}
        studentId={currentUser.id}
        onExit={() => setActiveExamSessionId(null)}
        onViewResults={(attemptId) => {
          setActiveExamSessionId(null);
          setViewingResultAttemptId(attemptId);
        }}
      />
    );
  }

  // =========================================================
  // STAGE 3: STRUCTURED SIDEBAR & DASHBOARD SHELL
  // =========================================================
  return (
    <AppSidebarLayout
      currentUser={currentUser}
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        setOpenCreateExamInit(false);
        setViewingResultAttemptId(null);
      }}
      onLogout={() => {
        examStore.logout();
        setShowWelcomePage(false);
      }}
    >
      {isAdmin ? (
        <>
          {currentTab === 'admin-dashboard' && (
            <AdminDashboard
              onNavigate={(tab) => {
                setCurrentTab(tab);
                setOpenCreateExamInit(false);
              }}
              onOpenCreateExam={() => {
                setOpenCreateExamInit(true);
                setCurrentTab('admin-exams');
              }}
            />
          )}

          {currentTab === 'admin-exams' && (
            <ExamManagement
              viewMode="exams"
              showCreateModalInit={openCreateExamInit}
              onNavigateToQuestions={(examId) => {
                setSelectedQuestionExamId(examId);
                setCurrentTab('admin-questions');
              }}
            />
          )}

          {currentTab === 'admin-questions' && (
            <QuestionBank initialExamId={selectedQuestionExamId} />
          )}

          {currentTab === 'admin-subjects' && <SubjectManagement />}

          {currentTab === 'admin-students' && <StudentManagement />}

          {currentTab === 'admin-evaluations' && (
            <EvaluationStation viewMode="evaluations" />
          )}

          {currentTab === 'admin-leaderboard' && <LeaderboardPage />}

          {currentTab === 'admin-certificates' && <CertificateManagement />}

          {currentTab === 'admin-violations' && <ViolationMonitoring />}

          {currentTab === 'admin-settings' && <AdminSettingsPage />}
        </>
      ) : viewingResultAttemptId ? (
        <StudentResultsView
          attemptId={viewingResultAttemptId}
          onBack={() => setViewingResultAttemptId(null)}
        />
      ) : (
        <StudentDashboard
          currentUser={currentUser}
          activeTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onStartExam={(examId) => {
            const targetExam = examStore
              .getState()
              .exams.find((e) => e.id === examId);
            if (
              !targetExam ||
              String(targetExam.status || '').trim().toLowerCase() === 'draft'
            ) {
              return;
            }
            examStore.startOrResumeAttempt(examId, currentUser.id, false);
            setActiveExamSessionId(examId);
          }}
          onViewResults={(attemptId) => setViewingResultAttemptId(attemptId)}
        />
      )}
    </AppSidebarLayout>
  );
}

export default App;
