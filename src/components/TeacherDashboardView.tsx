import React, { useEffect, useState } from 'react';
import {
  BookPlus,
  CalendarCheck,
  Database,
  Download,
  FileUp,
  Lock,
  Megaphone,
  PackageCheck,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { ACADEMIC_CATEGORIES } from '../db/seedData';
import { listMediaStats, saveMediaBlob } from '../db/blobStore';
import { AppSnapshot, sqliteStore } from '../db/sqliteStore';
import {
  Announcement,
  Assignment,
  AttendanceRecord,
  AttendanceStatus,
  CategoryId,
  Chapter,
  Course,
  Exam,
  ExamQuestion,
  Language,
  StudyMaterial,
  Subject,
} from '../types/education';
import { pickText, t } from '../utils/i18n';
import {
  serializeExportPackage,
  validateAndParsePackage,
} from '../utils/packageManager';

interface TeacherDashboardViewProps {
  snapshot: AppSnapshot;
  lang: Language;
  unlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onRefresh: () => Promise<void>;
}

type AdminSection =
  | 'overview'
  | 'courses'
  | 'materials'
  | 'exams'
  | 'attendance'
  | 'announcements'
  | 'packages';

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  snapshot,
  lang,
  unlocked,
  onUnlock,
  onLock,
  onRefresh,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [section, setSection] = useState<AdminSection>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mediaStats, setMediaStats] = useState({ count: 0, totalBytes: 0 });

  // Settings state
  const [newPin, setNewPin] = useState('');

  // Course & Subject form state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCat, setCourseCat] = useState<CategoryId>('wbbse');
  const [courseBoard, setCourseBoard] = useState('WBBSE');
  const [courseClass, setCourseClass] = useState('Class 10');
  const [courseTitleEn, setCourseTitleEn] = useState('');
  const [courseTitleBn, setCourseTitleBn] = useState('');
  const [courseDescEn, setCourseDescEn] = useState('');

  const [subjCourseId, setSubjCourseId] = useState(snapshot.courses[0]?.id ?? '');
  const [subjTitleEn, setSubjTitleEn] = useState('');
  const [subjTitleBn, setSubjTitleBn] = useState('');
  const [subjCode, setSubjCode] = useState('');

  // Chapter & Material state
  const [chSubjId, setChSubjId] = useState(snapshot.subjects[0]?.id ?? '');
  const [chNum, setChNum] = useState(1);
  const [chTitleEn, setChTitleEn] = useState('');
  const [chTitleBn, setChTitleBn] = useState('');
  const [chSummaryEn, setChSummaryEn] = useState('');

  const [matChapterId, setMatChapterId] = useState(snapshot.chapters[0]?.id ?? '');
  const [matType, setMatType] = useState<'pdf' | 'video'>('pdf');
  const [matTitleEn, setMatTitleEn] = useState('');
  const [matTitleBn, setMatTitleBn] = useState('');
  const [matBodyText, setMatBodyText] = useState('');
  const [matFormula, setMatFormula] = useState('');
  const [matUploadedFile, setMatUploadedFile] = useState<File | null>(null);

  // Exam & Question state
  const [exCourseId, setExCourseId] = useState(snapshot.courses[0]?.id ?? '');
  const [exTitleEn, setExTitleEn] = useState('');
  const [exTitleBn, setExTitleBn] = useState('');
  const [exType, setExType] = useState<'mcq' | 'written'>('mcq');
  const [exDuration, setExDuration] = useState(15);
  const [exTotalMarks, setExTotalMarks] = useState(20);

  const [qExamId, setQExamId] = useState(snapshot.exams[0]?.id ?? '');
  const [qTextEn, setQTextEn] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qMarks, setQMarks] = useState(5);
  const [qExpEn, setQExpEn] = useState('');

  // Assignment & Attendance state
  const [asgCourseId, setAsgCourseId] = useState(snapshot.courses[0]?.id ?? '');
  const [asgTitleEn, setAsgTitleEn] = useState('');
  const [asgInstEn, setAsgInstEn] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('2026-12-05');
  const [asgMarks, setAsgMarks] = useState(20);

  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attCourseId, setAttCourseId] = useState(snapshot.courses[0]?.id ?? '');
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('present');
  const [attRemarks, setAttRemarks] = useState('');

  // Announcement state
  const [annTitleEn, setAnnTitleEn] = useState('');
  const [annTitleBn, setAnnTitleBn] = useState('');
  const [annBodyEn, setAnnBodyEn] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important'>('important');

  // Import package state
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  useEffect(() => {
    void listMediaStats().then(setMediaStats);
  }, [snapshot]);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(null), 4500);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === snapshot.teacherPin) {
      setPinError('');
      setPinInput('');
      onUnlock();
    } else {
      setPinError(
        lang === 'bn'
          ? 'ভুল PIN। সঠিক শিক্ষক PIN লিখুন।'
          : 'Incorrect PIN. Please enter Master Sourav Bhattacharjee’s Teacher PIN.'
      );
    }
  };

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto my-8 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Confident_Portrait_in_Black_Kurta_4d2dc915.png"
              alt="Master Sourav Bhattacharjee"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover object-top border-2 border-[#0B1F3A] dark:border-amber-400 shadow-xs shrink-0"
            />
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/1000359931_e91baf5c.jpg"
                alt="Pragatir Pathshala Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center scale-[1.12]"
              />
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-amber-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <h1 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white">
          {t('teacherPanelTitle', lang)}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-5">
          {t('teacherPinPrompt', lang)}
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="teacher-pin-input"
              className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {lang === 'bn' ? 'শিক্ষক অ্যাডমিন PIN' : 'Teacher Admin PIN'}
            </label>
            <input
              id="teacher-pin-input"
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono-tabular text-lg tracking-widest text-slate-900 dark:text-white"
            />
          </div>

          {pinError && (
            <div role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {pinError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] hover:bg-[#163663] dark:hover:bg-blue-600 text-white text-sm font-semibold cursor-pointer"
          >
            {t('unlockDashboard', lang)}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {lang === 'bn'
              ? 'ডেমো প্রথমবার প্রবেশের PIN: 2026 (অ্যাডমিন প্যানেল থেকে পরিবর্তনযোগ্য)'
              : 'Initial demo Teacher PIN: 2026 (changeable inside Settings)'}
          </p>
        </form>
      </div>
    );
  }

  // --- Handlers ---
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitleEn.trim()) return;
    const course: Course = {
      id: editingCourseId ?? `course-${Date.now()}`,
      categoryId: courseCat,
      boardName: courseBoard.trim() || 'WBBSE',
      classLevel: courseClass.trim() || 'Class 10',
      titleEn: courseTitleEn.trim(),
      titleBn: courseTitleBn.trim() || courseTitleEn.trim(),
      descriptionEn: courseDescEn.trim() || 'Structured offline curriculum by Master Sourav Bhattacharjee.',
      descriptionBn: courseDescEn.trim() || 'মাস্টার সৌরভ ভট্টাচার্য পরিচালিত অফলাইন পাঠ্যক্রম।',
      instructor: 'Master Sourav Bhattacharjee',
      accentHex: '#1D4ED8',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    await sqliteStore.saveCourse(course);
    setEditingCourseId(null);
    setCourseTitleEn('');
    setCourseTitleBn('');
    setCourseDescEn('');
    await onRefresh();
    notify('Course saved to local SQLite database.');
  };

  const resolvedSubjCourseId = snapshot.courses.some((c) => c.id === subjCourseId)
    ? subjCourseId
    : snapshot.courses[0]?.id ?? '';
  const resolvedChSubjId = snapshot.subjects.some((s) => s.id === chSubjId)
    ? chSubjId
    : snapshot.subjects[0]?.id ?? '';
  const resolvedMatChapterId = snapshot.chapters.some((ch) => ch.id === matChapterId)
    ? matChapterId
    : snapshot.chapters[0]?.id ?? '';
  const resolvedExCourseId = snapshot.courses.some((c) => c.id === exCourseId)
    ? exCourseId
    : snapshot.courses[0]?.id ?? '';
  const resolvedQExamId = snapshot.exams.some((ex) => ex.id === qExamId)
    ? qExamId
    : snapshot.exams[0]?.id ?? '';
  const resolvedAsgCourseId = snapshot.courses.some((c) => c.id === asgCourseId)
    ? asgCourseId
    : snapshot.courses[0]?.id ?? '';
  const resolvedAttCourseId = snapshot.courses.some((c) => c.id === attCourseId)
    ? attCourseId
    : snapshot.courses[0]?.id ?? '';

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSubjCourseId || !subjTitleEn.trim()) return;
    const subj: Subject = {
      id: `subj-${Date.now()}`,
      courseId: resolvedSubjCourseId,
      titleEn: subjTitleEn.trim(),
      titleBn: subjTitleBn.trim() || subjTitleEn.trim(),
      code: subjCode.trim() || 'SUB-01',
      sortOrder: snapshot.subjects.length + 1,
    };
    await sqliteStore.saveSubject(subj);
    setSubjTitleEn('');
    setSubjTitleBn('');
    setSubjCode('');
    await onRefresh();
    notify('Subject added.');
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedChSubjId || !chTitleEn.trim()) return;
    const ch: Chapter = {
      id: `ch-${Date.now()}`,
      subjectId: resolvedChSubjId,
      chapterNumber: chNum,
      titleEn: chTitleEn.trim(),
      titleBn: chTitleBn.trim() || chTitleEn.trim(),
      summaryEn: chSummaryEn.trim() || 'Chapter study material and exercises.',
      summaryBn: chSummaryEn.trim() || 'অধ্যায়ভিত্তিক নোট ও অনুশীলনী।',
      estimatedMinutes: 30,
    };
    await sqliteStore.saveChapter(ch);
    setChTitleEn('');
    setChTitleBn('');
    setChSummaryEn('');
    await onRefresh();
    notify('Chapter saved.');
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedMatChapterId || !matTitleEn.trim()) return;

    let blobKey: string | undefined;
    let mimeType: string | undefined;
    let fileName: string | undefined;
    let fileSizeBytes: number | undefined;
    let durationOrPages = matType === 'pdf' ? 'Offline PDF Note' : 'Offline Video Lesson';

    if (matUploadedFile) {
      blobKey = `blob-${Date.now()}-${matUploadedFile.name}`;
      mimeType = matUploadedFile.type || (matType === 'pdf' ? 'application/pdf' : 'video/mp4');
      fileName = matUploadedFile.name;
      fileSizeBytes = matUploadedFile.size;
      durationOrPages = `${Math.max(1, Math.round(matUploadedFile.size / 1024))} KB · Local File`;
      await saveMediaBlob({
        key: blobKey,
        name: fileName,
        mimeType,
        sizeBytes: fileSizeBytes,
        blob: matUploadedFile,
        updatedAt: new Date().toISOString(),
      });
    }

    const material: StudyMaterial = {
      id: `mat-${Date.now()}`,
      chapterId: resolvedMatChapterId,
      type: matType,
      titleEn: matTitleEn.trim(),
      titleBn: matTitleBn.trim() || matTitleEn.trim(),
      durationOrPages,
      blobKey,
      mimeType,
      fileName,
      fileSizeBytes,
      noteSections:
        matType === 'pdf' && !blobKey
          ? [
              {
                heading: matTitleEn.trim(),
                body:
                  matBodyText.trim() ||
                  'Offline teacher study note authored in Pragatir Pathshala.',
                formula: matFormula.trim() || undefined,
              },
            ]
          : undefined,
      videoSlides:
        matType === 'video' && !blobKey
          ? [
              {
                timestampSec: 0,
                heading: matTitleEn.trim(),
                bullets: (matBodyText.trim() || 'Key concepts covered by Master Sourav Bhattacharjee.')
                  .split('\n')
                  .filter(Boolean),
                formula: matFormula.trim() || undefined,
                diagramKind: 'prism',
              },
            ]
          : undefined,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    await sqliteStore.saveMaterial(material);
    setMatTitleEn('');
    setMatTitleBn('');
    setMatBodyText('');
    setMatFormula('');
    setMatUploadedFile(null);
    await onRefresh();
    notify('Study material stored offline in SQLite & IndexedDB.');
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedExCourseId || !exTitleEn.trim()) return;
    const subj = snapshot.subjects.find((s) => s.courseId === resolvedExCourseId);
    const exam: Exam = {
      id: `exam-${Date.now()}`,
      courseId: resolvedExCourseId,
      subjectId: subj?.id ?? 'subj-general',
      titleEn: exTitleEn.trim(),
      titleBn: exTitleBn.trim() || exTitleEn.trim(),
      examType: exType,
      durationMinutes: exDuration,
      totalMarks: exTotalMarks,
      passingPercentage: 40,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    await sqliteStore.saveExam(exam);
    setExTitleEn('');
    setExTitleBn('');
    setQExamId(exam.id);
    await onRefresh();
    notify('Examination created.');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedQExamId || !qTextEn.trim()) return;
    const q: ExamQuestion = {
      id: `q-${Date.now()}`,
      examId: resolvedQExamId,
      questionTextEn: qTextEn.trim(),
      questionTextBn: qTextEn.trim(),
      optionsEn: [qOptA || 'Option A', qOptB || 'Option B', qOptC || 'Option C', qOptD || 'Option D'],
      optionsBn: [qOptA || 'Option A', qOptB || 'Option B', qOptC || 'Option C', qOptD || 'Option D'],
      correctIndex: qCorrectIdx,
      marks: qMarks,
      explanationEn: qExpEn.trim() || 'Solution verified by Master Sourav Bhattacharjee.',
      explanationBn: qExpEn.trim() || 'মাস্টার সৌরভ ভট্টাচার্য কর্তৃক যাচাইকৃত উত্তর।',
      modelAnswer: qExpEn.trim() || undefined,
    };
    await sqliteStore.saveQuestion(q);
    setQTextEn('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQExpEn('');
    await onRefresh();
    notify('Question added to examination.');
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedAsgCourseId || !asgTitleEn.trim()) return;
    const asg: Assignment = {
      id: `asg-${Date.now()}`,
      courseId: resolvedAsgCourseId,
      chapterId: snapshot.chapters[0]?.id ?? 'ch-general',
      titleEn: asgTitleEn.trim(),
      titleBn: asgTitleEn.trim(),
      instructionsEn: asgInstEn.trim() || 'Complete exercises neatly in your homework notebook.',
      instructionsBn: asgInstEn.trim() || 'খাতায় সুন্দরভাবে অনুশীলনী সমাধান করো।',
      dueDate: asgDueDate,
      maxMarks: asgMarks,
      status: 'pending',
      isDemo: false,
    };
    await sqliteStore.saveAssignment(asg);
    setAsgTitleEn('');
    setAsgInstEn('');
    await onRefresh();
    notify('Homework assignment published.');
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedAttCourseId) return;
    const rec: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: attDate,
      courseId: resolvedAttCourseId,
      studentName: snapshot.studentDisplayName,
      status: attStatus,
      remarks: attRemarks.trim() || undefined,
      isDemo: false,
    };
    await sqliteStore.saveAttendance(rec);
    setAttRemarks('');
    await onRefresh();
    notify('Attendance recorded locally.');
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitleEn.trim() || !annBodyEn.trim()) return;
    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      titleEn: annTitleEn.trim(),
      titleBn: annTitleBn.trim() || annTitleEn.trim(),
      bodyEn: annBodyEn.trim(),
      bodyBn: annBodyEn.trim(),
      targetCategory: 'all',
      priority: annPriority,
      publishedAt: new Date().toISOString(),
      author: 'Master Sourav Bhattacharjee',
      isDemo: false,
    };
    await sqliteStore.saveAnnouncement(ann);
    setAnnTitleEn('');
    setAnnTitleBn('');
    setAnnBodyEn('');
    await onRefresh();
    notify('Announcement published.');
  };

  const handleExportPackage = async (scope: 'full-backup' | 'course-content') => {
    const pkg = await sqliteStore.exportPackage(scope);
    const json = serializeExportPackage(pkg);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pragatir-pathshala-${scope}-${new Date().toISOString().slice(0, 10)}.pragatir.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Exported ${scope} package successfully.`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = validateAndParsePackage(text);
    if (!res.valid || !res.payload) {
      notify(res.error || 'Invalid package file.');
      return;
    }
    await sqliteStore.importPackage(res.payload, importMode);
    await onRefresh();
    notify(
      `Imported ${res.counts?.courses ?? 0} courses, ${res.counts?.materials ?? 0} materials (${importMode} mode).`
    );
    e.target.value = '';
  };

  const sectionTabs: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: lang === 'bn' ? 'ওভারভিউ' : 'Overview', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'courses', label: lang === 'bn' ? 'কোর্স ও বিষয়' : 'Courses & Subjects', icon: <BookPlus className="w-4 h-4" /> },
    { id: 'materials', label: lang === 'bn' ? 'অধ্যায় ও PDF/ভিডিও' : 'Chapters & Media', icon: <FileUp className="w-4 h-4" /> },
    { id: 'exams', label: lang === 'bn' ? 'পরীক্ষা নির্মাতা' : 'Exams & MCQs', icon: <Plus className="w-4 h-4" /> },
    { id: 'attendance', label: lang === 'bn' ? 'উপস্থিতি ও কাজ' : 'Attendance & Homework', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'announcements', label: lang === 'bn' ? 'ঘোষণা' : 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'packages', label: lang === 'bn' ? 'ব্যাকআপ ও প্যাকেজ' : 'Backup & Packages', icon: <PackageCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Studio Header */}
      <div className="rounded-2xl bg-[#0B1F3A] text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/aistudio/Confident_Portrait_in_Black_Kurta_4d2dc915.png"
            alt="Master Sourav Bhattacharjee"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover object-top border-2 border-amber-400/80 shrink-0"
          />
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold">
              {t('teacherPanelTitle', lang)}
            </h1>
            <p className="text-xs text-slate-300">Master Sourav Bhattacharjee · Local SQLite Administration</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLock}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'bn' ? 'লক করুন' : 'Lock Studio'}</span>
        </button>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-900 dark:text-emerald-200"
        >
          {statusMessage}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              section === tab.id
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section 1: Overview & Demo Data Management */}
      {section === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              {lang === 'bn' ? 'ডেমো পাঠ্যসূচি ও লোকাল SQLite ব্যবস্থাপনা' : 'Demonstration Data & SQLite Storage'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'অ্যাপটি প্রাথমিক নমুনা পাঠ্যসূচি (Demo Data) সহ লোড হয়েছে যাতে আপনি সব ফিচার পরীক্ষা করতে পারেন। আসল পাঠদান শুরু করতে চাইলে এক ক্লিকে নমুনা ডেটা মুছে আপনার নিজস্ব কোর্স আপলোড করতে পারেন।'
                : 'This device runs an isolated local SQLite + IndexedDB database pre-populated with clearly labelled Demonstration Data. You may clear demo records at any time to load real teaching materials.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-mono-tabular text-xl font-bold text-[#0B1F3A] dark:text-white">{snapshot.courses.length}</div>
                <div className="text-xs text-slate-500">Courses</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-mono-tabular text-xl font-bold text-[#0B1F3A] dark:text-white">{snapshot.materials.length}</div>
                <div className="text-xs text-slate-500">PDF/Videos</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-mono-tabular text-xl font-bold text-[#0B1F3A] dark:text-white">{snapshot.exams.length}</div>
                <div className="text-xs text-slate-500">Exams</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="font-mono-tabular text-xl font-bold text-[#0B1F3A] dark:text-white">{mediaStats.count}</div>
                <div className="text-xs text-slate-500">Uploaded Blobs</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await sqliteStore.clearDemoData();
                  await onRefresh();
                  notify('All demonstration data cleared. Ready for real teaching materials.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নমুনা ডেটা মুছুন' : 'Clear All Demo Data'}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await sqliteStore.restoreDemoData();
                  await onRefresh();
                  notify('Demonstration curriculum restored.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নমুনা ডেটা পুনরুদ্ধার' : 'Restore Demo Curriculum'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              {lang === 'bn' ? 'শিক্ষক PIN পরিবর্তন' : 'Teacher Security PIN'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current PIN: <span className="font-mono-tabular font-bold">{snapshot.teacherPin}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={lang === 'bn' ? 'নতুন ৪-৬ সংখ্যার PIN' : 'New 4–6 digit PIN'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono-tabular"
              />
              <button
                type="button"
                onClick={async () => {
                  if (newPin.trim().length < 4) return;
                  await sqliteStore.updateSetting('teacher_pin', newPin.trim());
                  setNewPin('');
                  await onRefresh();
                  notify('Teacher PIN updated.');
                }}
                className="px-4 py-2 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'আপডেট' : 'Update PIN'}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                <Database className="w-4 h-4 text-[#1D4ED8]" />
                <span>Offline Storage Engine</span>
              </div>
              <p>SQLite WebAssembly persisted in IndexedDB. Uploaded PDF/Video binary size: {(mediaStats.totalBytes / 1024).toFixed(1)} KB.</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Courses & Subjects CRUD */}
      {section === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveCourse(e)}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3 h-fit"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              {editingCourseId ? 'Edit Course' : 'Add New Course'}
            </h2>
            <select
              aria-label="Academic Category"
              value={courseCat}
              onChange={(e) => setCourseCat(e.target.value as CategoryId)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            >
              {ACADEMIC_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={courseBoard}
                onChange={(e) => setCourseBoard(e.target.value)}
                placeholder="Board (e.g. WBBSE)"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <input
                type="text"
                value={courseClass}
                onChange={(e) => setCourseClass(e.target.value)}
                placeholder="Class (e.g. Class 9)"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
            <input
              type="text"
              required
              value={courseTitleEn}
              onChange={(e) => setCourseTitleEn(e.target.value)}
              placeholder="Course Title (English)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <input
              type="text"
              value={courseTitleBn}
              onChange={(e) => setCourseTitleBn(e.target.value)}
              placeholder="Course Title (Bengali - optional)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <textarea
              rows={2}
              value={courseDescEn}
              onChange={(e) => setCourseDescEn(e.target.value)}
              placeholder="Course description..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                {editingCourseId ? 'Update Course' : 'Create Course'}
              </button>
              {editingCourseId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourseId(null);
                    setCourseTitleEn('');
                    setCourseTitleBn('');
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">Add Subject to Course</h3>
              <select
                aria-label="Course for Subject"
                value={resolvedSubjCourseId}
                onChange={(e) => setSubjCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              >
                {snapshot.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleEn}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={subjTitleEn}
                  onChange={(e) => setSubjTitleEn(e.target.value)}
                  placeholder="Subject Name (EN)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  placeholder="Code (e.g. PHY-09)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={(e) => void handleSaveSubject(e)}
                className="w-full py-2 rounded-xl bg-[#0B1F3A] dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Add Subject
              </button>
            </div>
          </form>

          {/* Existing Courses List */}
          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Manage Courses ({snapshot.courses.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {snapshot.courses.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">
                      {c.boardName} · {c.classLevel} {c.isDemo ? '· Demo' : ''}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {pickText(c.titleEn, c.titleBn, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourseId(c.id);
                        setCourseCat(c.categoryId);
                        setCourseBoard(c.boardName);
                        setCourseClass(c.classLevel);
                        setCourseTitleEn(c.titleEn);
                        setCourseTitleBn(c.titleBn);
                        setCourseDescEn(c.descriptionEn);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await sqliteStore.deleteCourse(c.id);
                        await onRefresh();
                        notify('Course deleted.');
                      }}
                      aria-label={`Delete course ${c.titleEn}`}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Chapters & Study Material (PDF & Video Upload) */}
      {section === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <form
              onSubmit={(e) => void handleSaveChapter(e)}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            >
              <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
                Create Chapter
              </h2>
              <select
                aria-label="Subject for Chapter"
                value={resolvedChSubjId}
                onChange={(e) => setChSubjId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              >
                {snapshot.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titleEn} ({s.code})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  value={chNum}
                  onChange={(e) => setChNum(Number(e.target.value))}
                  placeholder="Ch #"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  required
                  value={chTitleEn}
                  onChange={(e) => setChTitleEn(e.target.value)}
                  placeholder="Chapter Title (EN)"
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <input
                type="text"
                value={chSummaryEn}
                onChange={(e) => setChSummaryEn(e.target.value)}
                placeholder="Chapter summary..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                Add Chapter
              </button>
            </form>

            <form
              onSubmit={(e) => void handleSaveMaterial(e)}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            >
              <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
                Upload PDF Note or Video Lesson (Offline)
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Target Chapter"
                  value={resolvedMatChapterId}
                  onChange={(e) => setMatChapterId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                >
                  {snapshot.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Ch {ch.chapterNumber}: {ch.titleEn}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Material Type"
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as 'pdf' | 'video')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                >
                  <option value="pdf">PDF Study Note</option>
                  <option value="video">Video Lesson</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={matTitleEn}
                onChange={(e) => setMatTitleEn(e.target.value)}
                placeholder="Material Title (English)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <input
                type="text"
                value={matTitleBn}
                onChange={(e) => setMatTitleBn(e.target.value)}
                placeholder="Material Title (Bengali - optional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Attach Local File ({matType === 'pdf' ? '.pdf' : '.mp4 / .webm'}) — optional
                </label>
                <input
                  type="file"
                  accept={matType === 'pdf' ? 'application/pdf,.pdf' : 'video/*,.mp4,.webm'}
                  onChange={(e) => setMatUploadedFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-slate-600 dark:text-slate-300"
                />
              </div>

              <textarea
                rows={3}
                value={matBodyText}
                onChange={(e) => setMatBodyText(e.target.value)}
                placeholder={
                  matType === 'pdf'
                    ? 'Or write study note content directly (auto-generates downloadable PDF)...'
                    : 'Or write bullet points for offline blackboard lesson...'
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <input
                type="text"
                value={matFormula}
                onChange={(e) => setMatFormula(e.target.value)}
                placeholder="Key Formula (optional, e.g. F = ma)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono-tabular"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                Save Study Material Offline
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3 h-fit">
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Stored Materials ({snapshot.materials.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[540px] overflow-y-auto">
              {snapshot.materials.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 uppercase">
                      {m.type} · {m.durationOrPages}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {pickText(m.titleEn, m.titleBn, lang)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await sqliteStore.deleteMaterial(m.id);
                      await onRefresh();
                      notify('Material removed.');
                    }}
                    aria-label={`Delete material ${m.titleEn}`}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Exams & Question Builder */}
      {section === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <form
              onSubmit={(e) => void handleSaveExam(e)}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            >
              <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
                Create Examination (MCQ or Written)
              </h2>
              <select
                aria-label="Course for Exam"
                value={resolvedExCourseId}
                onChange={(e) => setExCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              >
                {snapshot.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleEn}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={exTitleEn}
                onChange={(e) => setExTitleEn(e.target.value)}
                placeholder="Exam Title (English)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  aria-label="Exam Type"
                  value={exType}
                  onChange={(e) => setExType(e.target.value as 'mcq' | 'written')}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                >
                  <option value="mcq">MCQ</option>
                  <option value="written">Written</option>
                </select>
                <input
                  type="number"
                  min={5}
                  value={exDuration}
                  onChange={(e) => setExDuration(Number(e.target.value))}
                  placeholder="Minutes"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
                <input
                  type="number"
                  min={5}
                  value={exTotalMarks}
                  onChange={(e) => setExTotalMarks(Number(e.target.value))}
                  placeholder="Marks"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                Create Exam
              </button>
            </form>

            <form
              onSubmit={(e) => void handleSaveQuestion(e)}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
            >
              <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
                Add Question to Exam
              </h2>
              <select
                aria-label="Target Exam"
                value={resolvedQExamId}
                onChange={(e) => setQExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              >
                {snapshot.exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.titleEn}
                  </option>
                ))}
              </select>
              <textarea
                rows={2}
                required
                value={qTextEn}
                onChange={(e) => setQTextEn(e.target.value)}
                placeholder="Question prompt..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={qOptA} onChange={(e) => setQOptA(e.target.value)} placeholder="Option A" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm" />
                <input type="text" value={qOptB} onChange={(e) => setQOptB(e.target.value)} placeholder="Option B" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm" />
                <input type="text" value={qOptC} onChange={(e) => setQOptC(e.target.value)} placeholder="Option C" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm" />
                <input type="text" value={qOptD} onChange={(e) => setQOptD(e.target.value)} placeholder="Option D" className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Correct Option"
                  value={qCorrectIdx}
                  onChange={(e) => setQCorrectIdx(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                >
                  <option value={0}>Correct: Option A</option>
                  <option value={1}>Correct: Option B</option>
                  <option value={2}>Correct: Option C</option>
                  <option value={3}>Correct: Option D</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={qMarks}
                  onChange={(e) => setQMarks(Number(e.target.value))}
                  placeholder="Marks"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <input
                type="text"
                value={qExpEn}
                onChange={(e) => setQExpEn(e.target.value)}
                placeholder="Explanation / Model Answer"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
              >
                Add Question
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3 h-fit">
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Examinations ({snapshot.exams.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {snapshot.exams.map((ex) => {
                const count = snapshot.questions.filter((q) => q.examId === ex.id).length;
                return (
                  <div key={ex.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-500">
                        {ex.examType.toUpperCase()} · {count} Questions · {ex.totalMarks} Marks
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {pickText(ex.titleEn, ex.titleBn, lang)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await sqliteStore.deleteExam(ex.id);
                        await onRefresh();
                        notify('Exam deleted.');
                      }}
                      aria-label={`Delete exam ${ex.titleEn}`}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Attendance & Homework */}
      {section === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveAttendance(e)}
            className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Record Student Attendance
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <select
                aria-label="Attendance Status"
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value as AttendanceStatus)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <select
              aria-label="Course for Attendance"
              value={resolvedAttCourseId}
              onChange={(e) => setAttCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            >
              {snapshot.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titleEn}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={attRemarks}
              onChange={(e) => setAttRemarks(e.target.value)}
              placeholder="Topic covered or remarks..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
            >
              Save Attendance Record
            </button>
          </form>

          <form
            onSubmit={(e) => void handleSaveAssignment(e)}
            className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Create Assignment / Homework
            </h2>
            <select
              aria-label="Course for Assignment"
              value={resolvedAsgCourseId}
              onChange={(e) => setAsgCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            >
              {snapshot.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titleEn}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={asgTitleEn}
              onChange={(e) => setAsgTitleEn(e.target.value)}
              placeholder="Homework Title"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <textarea
              rows={2}
              value={asgInstEn}
              onChange={(e) => setAsgInstEn(e.target.value)}
              placeholder="Instructions..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={asgDueDate}
                onChange={(e) => setAsgDueDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
              <input
                type="number"
                min={5}
                value={asgMarks}
                onChange={(e) => setAsgMarks(Number(e.target.value))}
                placeholder="Max Marks"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
            >
              Publish Homework
            </button>
          </form>
        </div>
      )}

      {/* Section 6: Announcements */}
      {section === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => void handleSaveAnnouncement(e)}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3 h-fit"
          >
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Post Announcement
            </h2>
            <input
              type="text"
              required
              value={annTitleEn}
              onChange={(e) => setAnnTitleEn(e.target.value)}
              placeholder="Notice Title (English)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <input
              type="text"
              value={annTitleBn}
              onChange={(e) => setAnnTitleBn(e.target.value)}
              placeholder="Notice Title (Bengali - optional)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <textarea
              rows={3}
              required
              value={annBodyEn}
              onChange={(e) => setAnnBodyEn(e.target.value)}
              placeholder="Announcement details..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            />
            <select
              aria-label="Priority"
              value={annPriority}
              onChange={(e) => setAnnPriority(e.target.value as 'normal' | 'important')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm"
            >
              <option value="important">Important Notice</option>
              <option value="normal">General Notice</option>
            </select>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
            >
              Publish Notice
            </button>
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
              Active Announcements ({snapshot.announcements.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {snapshot.announcements.map((ann) => (
                <div key={ann.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      {ann.publishedAt.slice(0, 10)} · {ann.priority}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {pickText(ann.titleEn, ann.titleBn, lang)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {pickText(ann.bodyEn, ann.bodyBn, lang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await sqliteStore.deleteAnnouncement(ann.id);
                      await onRefresh();
                      notify('Announcement deleted.');
                    }}
                    aria-label={`Delete announcement ${ann.titleEn}`}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 7: Backup, Restore & Educational Content Package Export/Import */}
      {section === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              {lang === 'bn' ? 'কনটেন্ট প্যাকেজ এবং লোকাল ব্যাকআপ রপ্তানি' : 'Export Content Packages & Local Backups'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'অফলাইন শিক্ষার্থীদের কাছে পাঠানোর জন্য কোর্স প্যাকেজ (.pragatir.json) তৈরি করুন অথবা পুরো ডিভাইসের SQLite ডেটা ব্যাকআপ রাখুন।'
                : 'Export a shareable Educational Content Package file (.pragatir.json) for students to import offline, or export a Full Device Backup including attendance and exam history.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => void handleExportPackage('course-content')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Course Package</span>
              </button>
              <button
                type="button"
                onClick={() => void handleExportPackage('full-backup')}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#15315B] text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export Full Device Backup</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              {lang === 'bn' ? 'প্যাকেজ বা ব্যাকআপ আমদানি করুন' : 'Import Content Package or Restore Backup'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'যেকোনো .pragatir.json বা .json ফাইল নির্বাচন করে এই ডিভাইসে অফলাইনে লোড করুন।'
                : 'Select a .pragatir.json educational package or backup file to merge new lessons or restore this device.'}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                <span>Merge with existing data</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span>Replace existing data</span>
              </label>
            </div>
            <label className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#1D4ED8] text-sm font-semibold text-[#1D4ED8] dark:text-amber-400 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Choose .pragatir.json Package File</span>
              <input
                type="file"
                accept=".json,.pragatir.json,application/json"
                onChange={(e) => void handleImportFile(e)}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
