import React from 'react';
import { Bookmark, CheckCircle2, FileText, PlayCircle, Trash2 } from 'lucide-react';
import { AppSnapshot } from '../db/sqliteStore';
import { Language, StudyMaterial } from '../types/education';
import { calculateCourseProgress } from '../utils/examEngine';
import { pickText } from '../utils/i18n';

interface SavedBookmarksViewProps {
  snapshot: AppSnapshot;
  lang: Language;
  onOpenMaterial: (material: StudyMaterial, courseTitle: string) => void;
  onRemoveBookmark: (material: StudyMaterial, courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
}

export const SavedBookmarksView: React.FC<SavedBookmarksViewProps> = ({
  snapshot,
  lang,
  onOpenMaterial,
  onRemoveBookmark,
  onOpenCourse,
}) => {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
          {lang === 'bn' ? 'বুকমার্ক ও আমার অধ্যয়নের অগ্রগতি' : 'Bookmarked Notes & Learning Tracker'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {lang === 'bn'
            ? 'গুরুত্বপূর্ণ নোটস ও ভিডিও ক্লাস এক ক্লিকেই অফলাইনে পড়ুন এবং আপনার অগ্রগতি দেখুন।'
            : 'Quick access to your saved study materials and chapter completion progress stored on this device.'}
        </p>
      </div>

      {/* Bookmarked Notes & Lessons */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-500" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'সংরক্ষিত নোটস ও ভিডিও' : 'Saved Study Resources'} ({snapshot.bookmarks.length})
          </h2>
        </div>

        {snapshot.bookmarks.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'এখনো কোনো নোট বুকমার্ক করা হয়নি। যেকোনো অধ্যায়ের নোট থেকে সংরক্ষণ করুন।'
              : 'No bookmarks yet. Tap the Bookmark icon inside any course chapter or PDF reader.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.bookmarks.map((bm) => {
              const mat = snapshot.materials.find((m) => m.id === bm.materialId);
              const course = snapshot.courses.find((c) => c.id === bm.courseId);
              if (!mat) return null;
              const courseTitle = course ? pickText(course.titleEn, course.titleBn, lang) : '';

              return (
                <div
                  key={bm.id}
                  className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#0B1F3A] text-amber-400 flex items-center justify-center shrink-0">
                      {mat.type === 'pdf' ? <FileText className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {courseTitle}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {pickText(mat.titleEn, mat.titleBn, lang)}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {mat.durationOrPages}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenMaterial(mat, courseTitle)}
                      className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
                    >
                      {lang === 'bn' ? 'খুলুন' : 'Open'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(mat, bm.courseId)}
                      aria-label={`Remove bookmark ${mat.titleEn}`}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Course-by-Course Learning Progress */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'কোর্সভিত্তিক অধ্যায় অগ্রগতি' : 'Learning Progress by Course'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshot.courses.map((course) => {
            const prog = calculateCourseProgress(
              course,
              snapshot.subjects,
              snapshot.chapters,
              snapshot.chapterProgress
            );
            return (
              <div
                key={course.id}
                className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {course.boardName} · {course.classLevel}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {pickText(course.titleEn, course.titleBn, lang)}
                </h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {prog.completedChapters}/{prog.totalChapters} Chapters
                  </span>
                  <span className="font-mono-tabular font-bold text-[#1D4ED8] dark:text-amber-400">
                    {prog.progressPercentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#1D4ED8] dark:bg-amber-400"
                    style={{ width: `${prog.progressPercentage}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCourse(course.id)}
                  className="text-xs font-semibold text-[#1D4ED8] dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'অধ্যায় দেখুন →' : 'Continue Course →'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
