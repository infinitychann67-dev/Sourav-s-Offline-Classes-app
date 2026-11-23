import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  PlayCircle,
  Send,
} from 'lucide-react';
import { AppSnapshot } from '../db/sqliteStore';
import { Assignment, Language, StudyMaterial } from '../types/education';
import { calculateCourseProgress } from '../utils/examEngine';
import { pickText, t } from '../utils/i18n';

interface CourseDetailViewProps {
  snapshot: AppSnapshot;
  courseId: string;
  lang: Language;
  onBack: () => void;
  onOpenMaterial: (material: StudyMaterial, courseTitle: string) => void;
  onToggleBookmark: (material: StudyMaterial, courseId: string) => void;
  onToggleChapterComplete: (chapterId: string, courseId: string, nextCompleted: boolean) => void;
  onSubmitAssignment: (assignment: Assignment, answerText: string) => void;
  onStartExam: (examId: string) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  snapshot,
  courseId,
  lang,
  onBack,
  onOpenMaterial,
  onToggleBookmark,
  onToggleChapterComplete,
  onSubmitAssignment,
  onStartExam,
}) => {
  const course = snapshot.courses.find((c) => c.id === courseId);
  const subjects = useMemo(
    () => snapshot.subjects.filter((s) => s.courseId === courseId),
    [snapshot.subjects, courseId]
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id ?? '');
  const [homeworkDrafts, setHomeworkDrafts] = useState<Record<string, string>>({});

  if (!course) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600 dark:text-slate-300 mb-4">Course not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-sm font-semibold cursor-pointer"
        >
          {t('backToCourses', lang)}
        </button>
      </div>
    );
  }

  const activeSubjectId =
    subjects.some((s) => s.id === selectedSubjectId) ? selectedSubjectId : subjects[0]?.id ?? '';

  const chapters = snapshot.chapters.filter((ch) => ch.subjectId === activeSubjectId);
  const courseExams = snapshot.exams.filter((e) => e.courseId === course.id);
  const courseAssignments = snapshot.assignments.filter((a) => a.courseId === course.id);
  const progress = calculateCourseProgress(
    course,
    snapshot.subjects,
    snapshot.chapters,
    snapshot.chapterProgress
  );

  const completedSet = new Set(
    snapshot.chapterProgress.filter((p) => p.completed).map((p) => p.chapterId)
  );
  const bookmarkedMaterialIds = new Set(snapshot.bookmarks.map((b) => b.materialId));
  const courseTitle = pickText(course.titleEn, course.titleBn, lang);

  return (
    <div className="space-y-8 pb-12">
      {/* Back & Course Header Card */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] dark:text-amber-400 hover:underline mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToCourses', lang)}</span>
        </button>

        <div className="rounded-2xl bg-[#0B1F3A] text-white border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs text-amber-300 font-medium mb-2">
              <span>{course.boardName}</span>
              <span aria-hidden="true"> · </span>
              <span>{course.classLevel}</span>
              <span aria-hidden="true"> · </span>
              <span>{course.instructor}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold [text-wrap:balance] mb-2">
              {courseTitle}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {pickText(course.descriptionEn, course.descriptionBn, lang)}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 sm:min-w-[230px]">
            <div className="text-xs text-slate-400 mb-1">
              {lang === 'bn' ? 'কোর্স সমাপ্তি' : 'Completion Status'}
            </div>
            <div className="font-display text-2xl font-bold text-amber-400 tabular-nums">
              {progress.progressPercentage}%
            </div>
            <div className="text-xs text-slate-300 mt-1 tabular-nums">
              {progress.completedChapters} / {progress.totalChapters} {t('chaptersLabel', lang)}
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter Tabs */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subjects.map((subj) => {
            const active = subj.id === activeSubjectId;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => setSelectedSubjectId(subj.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {pickText(subj.titleEn, subj.titleBn, lang)} ({subj.code})
              </button>
            );
          })}
        </div>
      )}

      {/* Chapters List */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white">
          {lang === 'bn' ? 'অধ্যায়ভিত্তিক পাঠ্যবস্তু' : 'Chapter-Wise Study Materials'}
        </h2>

        {chapters.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'এই বিষয়ে এখনো কোনো অধ্যায় যোগ করা হয়নি।'
              : 'No chapters added to this subject yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((ch) => {
              const isDone = completedSet.has(ch.id);
              const chMaterials = snapshot.materials.filter((m) => m.chapterId === ch.id);

              return (
                <div
                  key={ch.id}
                  className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                        <span>{lang === 'bn' ? `অধ্যায় ${ch.chapterNumber}` : `Chapter ${ch.chapterNumber}`}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">{ch.estimatedMinutes} min</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
                        {pickText(ch.titleEn, ch.titleBn, lang)}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {pickText(ch.summaryEn, ch.summaryBn, lang)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleChapterComplete(ch.id, course.id, !isDone)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      <span>{isDone ? t('completedBadge', lang) : t('markCompleted', lang)}</span>
                    </button>
                  </div>

                  {/* Materials inside Chapter */}
                  {chMaterials.length === 0 ? (
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {lang === 'bn'
                        ? 'এই অধ্যায়ে এখনো কোনো PDF বা ভিডিও নেই।'
                        : 'No PDF notes or videos attached yet.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {chMaterials.map((mat) => {
                        const isSaved = bookmarkedMaterialIds.has(mat.id);
                        return (
                          <div
                            key={mat.id}
                            className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0B1F3A] dark:bg-[#1D4ED8]/20 text-amber-400 flex items-center justify-center shrink-0">
                                {mat.type === 'pdf' ? (
                                  <FileText className="w-5 h-5" />
                                ) : (
                                  <PlayCircle className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  <span>{mat.type === 'pdf' ? 'PDF Note' : 'Video Lesson'}</span>
                                  <span aria-hidden="true"> · </span>
                                  <span>{mat.durationOrPages}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                                  {pickText(mat.titleEn, mat.titleBn, lang)}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenMaterial(mat, courseTitle)}
                                className="flex-1 py-2 px-3 rounded-lg bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                              >
                                {mat.type === 'pdf' ? t('openPdfReader', lang) : t('watchVideoLesson', lang)}
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleBookmark(mat, course.id)}
                                aria-label={
                                  isSaved
                                    ? `Remove bookmark for ${mat.titleEn}`
                                    : `Bookmark ${mat.titleEn}`
                                }
                                className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                                  isSaved
                                    ? 'bg-amber-500 border-amber-500 text-slate-950'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Course Assignments & Homework */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#1D4ED8] dark:text-amber-400" />
          <h2 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white">
            {t('assignmentsLabel', lang)}
          </h2>
        </div>

        {courseAssignments.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'কোনো বাড়ির কাজ দেওয়া হয়নি।' : 'No homework assignments posted for this course.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseAssignments.map((asg) => {
              const draft = homeworkDrafts[asg.id] ?? asg.studentSubmissionText ?? '';
              return (
                <div
                  key={asg.id}
                  className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{lang === 'bn' ? 'শেষ তারিখ:' : 'Due:'} {asg.dueDate}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{asg.maxMarks} {lang === 'bn' ? 'নম্বর' : 'Marks'}</span>
                    <span aria-hidden="true"> · </span>
                    <span className={asg.status === 'submitted' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                      {asg.status === 'submitted'
                        ? lang === 'bn' ? 'জমা দেওয়া হয়েছে' : 'Submitted Locally'
                        : lang === 'bn' ? 'বাকি আছে' : 'Pending'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {pickText(asg.titleEn, asg.titleBn, lang)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {pickText(asg.instructionsEn, asg.instructionsBn, lang)}
                  </p>
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) =>
                      setHomeworkDrafts((prev) => ({ ...prev, [asg.id]: e.target.value }))
                    }
                    placeholder={
                      lang === 'bn'
                        ? 'আপনার উত্তর বা নোট এখানে লিখুন (অফলাইনে সংরক্ষিত হবে)...'
                        : 'Type your homework answer or completion note (saved offline)...'
                    }
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => onSubmitAssignment(asg, draft)}
                    disabled={!draft.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{asg.status === 'submitted' ? (lang === 'bn' ? 'উত্তর আপডেট করুন' : 'Update Submission') : (lang === 'bn' ? 'হোমওয়ার্ক জমা দিন' : 'Save Homework Locally')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Linked Course Exams */}
      {courseExams.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'এই কোর্সের পরীক্ষাসমূহ' : 'Course Offline Examinations'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseExams.map((ex) => (
              <div
                key={ex.id}
                className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{ex.examType.toUpperCase()}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{ex.durationMinutes} min</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{ex.totalMarks} Marks</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {pickText(ex.titleEn, ex.titleBn, lang)}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onStartExam(ex.id)}
                  className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {lang === 'bn' ? 'পরীক্ষা দিন' : 'Start Exam'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
