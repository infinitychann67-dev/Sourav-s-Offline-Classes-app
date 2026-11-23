import { useCallback, useEffect, useState } from 'react';
import { CourseDetailView } from './components/CourseDetailView';
import { ExamsCenterView } from './components/ExamsCenterView';
import { ExploreCoursesView } from './components/ExploreCoursesView';
import { OfflinePdfModal } from './components/OfflinePdfModal';
import { OfflineVideoModal } from './components/OfflineVideoModal';
import { ParentPortalView } from './components/ParentPortalView';
import { SavedBookmarksView } from './components/SavedBookmarksView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { TopBarAndNav } from './components/TopBarAndNav';
import { AppSnapshot, sqliteStore } from './db/sqliteStore';
import {
  AppTab,
  Assignment,
  ExamAttempt,
  Language,
  StudyMaterial,
  ThemeMode,
} from './types/education';
import { t } from './utils/i18n';

export default function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('explore');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [pendingExamId, setPendingExamId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<{
    material: StudyMaterial;
    courseTitle: string;
    courseId: string;
  } | null>(null);
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('pragatir_lang');
    return saved === 'bn' ? 'bn' : 'en';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('pragatir_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pragatir_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pragatir_lang', lang);
  }, [lang]);

  const refreshSnapshot = useCallback(async () => {
    try {
      const snap = await sqliteStore.getSnapshot();
      setSnapshot(snap);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to initialize offline SQLite storage.'
      );
    }
  }, []);

  useEffect(() => {
    void refreshSnapshot();
  }, [refreshSnapshot]);

  const handleToggleBookmark = async (material: StudyMaterial, courseId: string) => {
    await sqliteStore.toggleBookmark({
      id: `bm-${material.id}`,
      materialId: material.id,
      chapterId: material.chapterId,
      courseId,
      createdAt: new Date().toISOString(),
    });
    await refreshSnapshot();
  };

  const handleToggleChapterComplete = async (
    chapterId: string,
    courseId: string,
    nextCompleted: boolean
  ) => {
    await sqliteStore.toggleChapterProgress(chapterId, courseId, nextCompleted);
    await refreshSnapshot();
  };

  const handleSubmitAssignment = async (assignment: Assignment, answerText: string) => {
    await sqliteStore.saveAssignment({
      ...assignment,
      status: 'submitted',
      studentSubmissionText: answerText.trim(),
      submittedAt: new Date().toISOString(),
    });
    await refreshSnapshot();
  };

  const handleSaveAttempt = async (attempt: ExamAttempt) => {
    await sqliteStore.saveExamAttempt(attempt);
    await refreshSnapshot();
  };

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab !== 'explore') {
      setSelectedCourseId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resolveCourseForMaterial = (material: StudyMaterial): string => {
    if (!snapshot) return '';
    const ch = snapshot.chapters.find((c) => c.id === material.chapterId);
    const subj = ch ? snapshot.subjects.find((s) => s.id === ch.subjectId) : undefined;
    return subj?.courseId ?? '';
  };

  const isActiveMaterialBookmarked = Boolean(
    activeMaterial &&
      snapshot?.bookmarks.some((b) => b.materialId === activeMaterial.material.id)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060D1A] text-slate-900 dark:text-slate-100 pb-20 md:pb-0">
      <TopBarAndNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
        theme={theme}
        onToggleTheme={() => setTheme((m) => (m === 'light' ? 'dark' : 'light'))}
        teacherUnlocked={teacherUnlocked}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {loadError ? (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-6 text-center">
            <h2 className="text-lg font-bold text-rose-800 dark:text-rose-200">
              Offline Database Error
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">{loadError}</p>
            <button
              type="button"
              onClick={() => void refreshSnapshot()}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              Retry Initialization
            </button>
          </div>
        ) : !snapshot ? (
          <div className="space-y-6 py-8">
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          </div>
        ) : activeTab === 'explore' && selectedCourseId ? (
          <CourseDetailView
            snapshot={snapshot}
            courseId={selectedCourseId}
            lang={lang}
            onBack={() => setSelectedCourseId(null)}
            onOpenMaterial={(material, courseTitle) =>
              setActiveMaterial({
                material,
                courseTitle,
                courseId: selectedCourseId,
              })
            }
            onToggleBookmark={(mat, cId) => void handleToggleBookmark(mat, cId)}
            onToggleChapterComplete={(chId, cId, next) =>
              void handleToggleChapterComplete(chId, cId, next)
            }
            onSubmitAssignment={(asg, text) => void handleSubmitAssignment(asg, text)}
            onStartExam={(examId) => {
              setPendingExamId(examId);
              setActiveTab('exams');
            }}
          />
        ) : activeTab === 'explore' ? (
          <ExploreCoursesView
            snapshot={snapshot}
            lang={lang}
            onOpenCourse={(courseId) => {
              setSelectedCourseId(courseId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToExams={() => handleSelectTab('exams')}
          />
        ) : activeTab === 'exams' ? (
          <ExamsCenterView
            snapshot={snapshot}
            lang={lang}
            initialExamId={pendingExamId}
            onClearInitialExam={() => setPendingExamId(null)}
            onSaveAttempt={handleSaveAttempt}
          />
        ) : activeTab === 'saved' ? (
          <SavedBookmarksView
            snapshot={snapshot}
            lang={lang}
            onOpenMaterial={(material, courseTitle) =>
              setActiveMaterial({
                material,
                courseTitle,
                courseId: resolveCourseForMaterial(material),
              })
            }
            onRemoveBookmark={(mat, cId) => void handleToggleBookmark(mat, cId)}
            onOpenCourse={(cId) => {
              setSelectedCourseId(cId);
              setActiveTab('explore');
            }}
          />
        ) : activeTab === 'parent' ? (
          <ParentPortalView snapshot={snapshot} lang={lang} />
        ) : (
          <TeacherDashboardView
            snapshot={snapshot}
            lang={lang}
            unlocked={teacherUnlocked}
            onUnlock={() => setTeacherUnlocked(true)}
            onLock={() => setTeacherUnlocked(false)}
            onRefresh={refreshSnapshot}
          />
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#091222] mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-semibold text-[#0B1F3A] dark:text-white">
              {t('appTitle', lang)}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{t('mentorLine', lang)}</span>
          </div>
          <div>{t('noAutoSyncNote', lang)}</div>
        </div>
      </footer>

      {/* Offline PDF & Video Modals */}
      {activeMaterial && activeMaterial.material.type === 'pdf' && (
        <OfflinePdfModal
          material={activeMaterial.material}
          courseTitle={activeMaterial.courseTitle}
          lang={lang}
          isBookmarked={isActiveMaterialBookmarked}
          onToggleBookmark={() =>
            void handleToggleBookmark(activeMaterial.material, activeMaterial.courseId)
          }
          onClose={() => setActiveMaterial(null)}
        />
      )}

      {activeMaterial && activeMaterial.material.type === 'video' && (
        <OfflineVideoModal
          material={activeMaterial.material}
          courseTitle={activeMaterial.courseTitle}
          lang={lang}
          isBookmarked={isActiveMaterialBookmarked}
          onToggleBookmark={() =>
            void handleToggleBookmark(activeMaterial.material, activeMaterial.courseId)
          }
          onClose={() => setActiveMaterial(null)}
        />
      )}
    </div>
  );
}
