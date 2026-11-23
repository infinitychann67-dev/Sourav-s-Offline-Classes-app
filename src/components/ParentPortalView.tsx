import React from 'react';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  HardDrive,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import { AppSnapshot } from '../db/sqliteStore';
import { Language } from '../types/education';
import {
  calculateCourseProgress,
  calculateOverallExamAverage,
  summarizeAttendance,
} from '../utils/examEngine';
import { pickText, t } from '../utils/i18n';

interface ParentPortalViewProps {
  snapshot: AppSnapshot;
  lang: Language;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ snapshot, lang }) => {
  const attendanceSummary = summarizeAttendance(snapshot.attendance);
  const examAverage = calculateOverallExamAverage(snapshot.examAttempts);
  const completedChapters = snapshot.chapterProgress.filter((p) => p.completed).length;
  const totalChapters = snapshot.chapters.length;
  const pendingHomework = snapshot.assignments.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Local Device Storage Transparency */}
      <div className="rounded-2xl bg-[#0B1F3A] text-white p-6 sm:p-8 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-amber-300 mb-1">
              {t('mentorLine', lang)}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              {t('parentPortalTitle', lang)}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {t('parentPortalSub', lang)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-slate-700 px-4 py-3 text-xs text-slate-300 max-w-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
              <HardDrive className="w-4 h-4 shrink-0" />
              <span>{lang === 'bn' ? 'ডিভাইস-ভিত্তিক সংরক্ষণ' : 'Device-Local Record'}</span>
            </div>
            <p className="leading-relaxed">{t('noAutoSyncNote', lang)}</p>
          </div>
        </div>
      </div>

      {/* 4-Column Academic KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('attendanceRate', lang)}</span>
            <CalendarCheck className="w-4 h-4 text-[#1D4ED8] dark:text-amber-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {attendanceSummary.attendancePercentage}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {attendanceSummary.presentDays} {lang === 'bn' ? 'উপস্থিত' : 'Present'} ·{' '}
            {attendanceSummary.lateDays} {lang === 'bn' ? 'বিলম্বে' : 'Late'} ·{' '}
            {attendanceSummary.absentDays} {lang === 'bn' ? 'অনুপস্থিত' : 'Absent'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('examAverage', lang)}</span>
            <Award className="w-4 h-4 text-[#1D4ED8] dark:text-amber-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {examAverage}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {snapshot.examAttempts.length} {lang === 'bn' ? 'টি পরীক্ষা সম্পন্ন' : 'Examinations taken'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('chaptersFinished', lang)}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {completedChapters} / {totalChapters}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'অফলাইন পাঠ্য অগ্রগতি' : 'Syllabus progress'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{lang === 'bn' ? 'বাকি হোমওয়ার্ক' : 'Pending Homework'}</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {pendingHomework}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {snapshot.assignments.length} {lang === 'bn' ? 'টি মোট অ্যাসাইনমেন্ট' : 'Total assignments'}
          </div>
        </div>
      </section>

      {/* Two-column Exam Results & Attendance Register */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Examination Scorecards */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'পরীক্ষার ফলাফল তালিকা' : 'Examination Results & Scorecards'}
          </h2>

          {snapshot.examAttempts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো পরীক্ষার নম্বর নথিভুক্ত হয়নি।' : 'No exam results recorded on this device yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3">{lang === 'bn' ? 'পরীক্ষা' : 'Test Title'}</th>
                    <th className="py-2 px-2">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2 px-2 text-right">{lang === 'bn' ? 'প্রাপ্ত নম্বর' : 'Marks'}</th>
                    <th className="py-2 pl-2 text-right">{lang === 'bn' ? 'মান' : 'Outcome'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {snapshot.examAttempts.map((att) => {
                    const ex = snapshot.exams.find((e) => e.id === att.examId);
                    return (
                      <tr key={att.id}>
                        <td className="py-3 pr-3 font-medium text-slate-900 dark:text-white">
                          {ex ? pickText(ex.titleEn, ex.titleBn, lang) : att.examId}
                        </td>
                        <td className="py-3 px-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                          {att.submittedAt.slice(0, 10)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono-tabular font-semibold">
                          {att.score}/{att.totalMarks} ({att.percentage}%)
                        </td>
                        <td className="py-3 pl-2 text-right text-xs font-semibold">
                          <span
                            className={
                              att.passed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {att.passed ? (lang === 'bn' ? 'উত্তীর্ণ' : 'Pass') : (lang === 'bn' ? 'অতিরিক্ত অনুশীলন' : 'Needs Review')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Attendance Log */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'দৈনিক উপস্থিতি বিবরণী' : 'Attendance Register'}
          </h2>

          {snapshot.attendance.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'কোনো উপস্থিতির তথ্য নেই।' : 'No attendance records logged yet.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
              {snapshot.attendance.map((rec) => {
                const course = snapshot.courses.find((c) => c.id === rec.courseId);
                return (
                  <div key={rec.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                        {rec.date} · {course ? course.boardName : 'Batch'}
                      </div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {rec.remarks || (course ? pickText(course.titleEn, course.titleBn, lang) : rec.studentName)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 capitalize ${
                        rec.status === 'present'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : rec.status === 'late'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {rec.status === 'present'
                        ? lang === 'bn' ? 'উপস্থিত' : 'Present'
                        : rec.status === 'late'
                        ? lang === 'bn' ? 'বিলম্বে' : 'Late'
                        : lang === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Course Progress Breakdown + Teacher Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'কোর্সভিত্তিক পাঠ্যক্রমের অগ্রগতি' : 'Course-Wise Academic Progress'}
          </h2>
          <div className="space-y-4">
            {snapshot.courses.map((course) => {
              const prog = calculateCourseProgress(
                course,
                snapshot.subjects,
                snapshot.chapters,
                snapshot.chapterProgress
              );
              return (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-3">
                      {pickText(course.titleEn, course.titleBn, lang)}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#1D4ED8] dark:text-amber-400 shrink-0">
                      {prog.progressPercentage}% ({prog.completedChapters}/{prog.totalChapters})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#1D4ED8] dark:bg-amber-400"
                      style={{ width: `${prog.progressPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#1D4ED8] dark:text-amber-400" />
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
              {t('teacherAnnouncements', lang)}
            </h2>
          </div>

          {snapshot.announcements.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'কোনো নতুন ঘোষণা নেই।' : 'No announcements posted yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {snapshot.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-mono-tabular">{ann.publishedAt.slice(0, 10)}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{ann.author}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {pickText(ann.titleEn, ann.titleBn, lang)}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {pickText(ann.bodyEn, ann.bodyBn, lang)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
