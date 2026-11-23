import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Megaphone,
  Search,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ACADEMIC_CATEGORIES } from '../db/seedData';
import { AppSnapshot } from '../db/sqliteStore';
import { CategoryId, Course, Language } from '../types/education';
import { calculateCourseProgress } from '../utils/examEngine';
import { pickText, t } from '../utils/i18n';

interface ExploreCoursesViewProps {
  snapshot: AppSnapshot;
  lang: Language;
  onOpenCourse: (courseId: string) => void;
  onGoToExams: () => void;
}

export const ExploreCoursesView: React.FC<ExploreCoursesViewProps> = ({
  snapshot,
  lang,
  onOpenCourse,
  onGoToExams,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return snapshot.courses.filter((course) => {
      if (selectedCategory !== 'all' && course.categoryId !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        course.titleEn.toLowerCase().includes(q) ||
        course.titleBn.toLowerCase().includes(q) ||
        course.boardName.toLowerCase().includes(q) ||
        course.classLevel.toLowerCase().includes(q) ||
        course.descriptionEn.toLowerCase().includes(q)
      );
    });
  }, [snapshot.courses, selectedCategory, searchQuery]);

  const totalChapters = snapshot.chapters.length;
  const completedChapters = snapshot.chapterProgress.filter((p) => p.completed).length;
  const overallProgress =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const categoryImageFor = (catId: CategoryId): string => {
    const found = ACADEMIC_CATEGORIES.find((c) => c.id === catId);
    return found?.imageUrl ?? '/src/assets/images/cat_school_boards_1795449192524.jpg';
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('course-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Institutional Hero Section (2-column stretched split) */}
      <section className="rounded-2xl overflow-hidden bg-[#0B1F3A] text-white border border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="text-xs font-medium text-amber-300 tracking-wide mb-3">
              {t('mentorLine', lang)} · {lang === 'bn' ? 'অফলাইন অ্যান্ড্রয়েড এডটেক' : 'Offline Android EdTech'}
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold leading-tight text-white [text-wrap:balance] mb-4">
              {t('heroTitle', lang)}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mb-7">
              {t('heroSubtitle', lang)}
            </p>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t('startLearning', lang)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onGoToExams}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t('takePracticeExam', lang)}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] bg-[#0B1F3A] overflow-hidden flex items-end">
            <img
              src="/assets/aistudio/Confident_Portrait_in_Black_Kurta_4d2dc915.png"
              alt="Master Sourav Bhattacharjee — Founder & Educator, Pragatir Pathshala"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/20 to-transparent lg:bg-gradient-to-r lg:from-[#0B1F3A] lg:via-[#0B1F3A]/15 lg:to-transparent" />
            <div className="relative z-10 w-full p-5 sm:p-6 bg-gradient-to-t from-[#0B1F3A]/95 via-[#0B1F3A]/75 to-transparent flex items-center justify-between gap-3">
              <div>
                <div className="text-sm sm:text-base font-bold text-white leading-tight">
                  {lang === 'bn' ? 'মাস্টার সৌরভ ভট্টাচার্য' : 'Master Sourav Bhattacharjee'}
                </div>
                <div className="text-xs text-amber-300 mt-0.5">
                  {lang === 'bn' ? 'প্রতিষ্ঠাতা ও প্রধান শিক্ষক · প্রগতির পাঠশালা' : 'Founder & Principal Educator'}
                </div>
              </div>
              <span className="w-11 h-11 rounded-full overflow-hidden bg-white border-2 border-amber-300/80 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/1000359931_e91baf5c.jpg"
                  alt="Pragatir Pathshala Seal"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center scale-[1.12]"
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Full-Width KPI Strip below Hero */}
      <section
        aria-label="Platform Overview Metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'সক্রিয় কোর্স' : 'Offline Courses'}
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {snapshot.courses.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? '৫টি একাডেমিক বিভাগ' : '5 Academic Categories'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'নোট ও ভিডিও ক্লাস' : 'Notes & Video Lessons'}
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {snapshot.materials.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'লগইন ছাড়াই উপলব্ধ' : 'No student login needed'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'অফলাইন পরীক্ষা' : 'Offline Examinations'}
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {snapshot.exams.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'MCQ ও লিখিত সেট' : 'MCQ & Written sets'}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'এই ডিভাইসে অগ্রগতি' : 'Local Study Progress'}
          </div>
          <div className="mt-1.5 font-display text-2xl font-bold text-[#1D4ED8] dark:text-amber-400 tabular-nums">
            {overallProgress}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {completedChapters} / {totalChapters} {t('chaptersLabel', lang)}
          </div>
        </div>
      </section>

      {/* Teacher Announcements Highlight */}
      {snapshot.announcements.length > 0 && (
        <section className="rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#1D4ED8] dark:text-amber-400" />
              <h2 className="font-display text-base sm:text-lg font-bold text-[#0B1F3A] dark:text-white">
                {t('teacherAnnouncements', lang)}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <img
                src="/assets/aistudio/Confident_Portrait_in_Black_Kurta_4d2dc915.png"
                alt="Master Sourav Bhattacharjee"
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover object-top border border-slate-200 dark:border-slate-700"
              />
              <span>Master Sourav Bhattacharjee</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {snapshot.announcements.slice(0, 2).map((ann) => (
              <div
                key={ann.id}
                className="rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>{ann.priority === 'important' ? (lang === 'bn' ? 'জরুরি বিজ্ঞপ্তি' : 'Important') : (lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notice')}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-tabular">{ann.publishedAt.slice(0, 10)}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                  {pickText(ann.titleEn, ann.titleBn, lang)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pickText(ann.bodyEn, ann.bodyBn, lang)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Course Catalog Section */}
      <section id="course-catalog" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1F3A] dark:text-white">
              {lang === 'bn' ? 'অ্যাকাডেমিক কোর্স ক্যাটালগ' : 'Academic Course Library'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'বোর্ড, শ্রেণি বা প্রতিযোগিতামূলক বিভাগ নির্বাচন করে অফলাইনে পড়া শুরু করুন।'
                : 'Select your board, diploma semester, or competitive exam track to study offline.'}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', lang)}
              aria-label={t('searchPlaceholder', lang)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0F1D32] border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-2 focus:outline-[#1D4ED8]"
            />
          </div>
        </div>

        {/* 5 Academic Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Academic Categories"
          className="flex items-center gap-2 overflow-x-auto pb-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white'
                : 'bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t('allCategories', lang)}
          </button>

          {ACADEMIC_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white'
                    : 'bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {pickText(cat.nameEn, cat.nameBn, lang)}
              </button>
            );
          })}
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-10 text-center">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'কোনো কোর্স পাওয়া যায়নি' : 'No matching courses found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'অন্য বিভাগ নির্বাচন করুন অথবা শিক্ষক ড্যাশবোর্ড থেকে নতুন কোর্স যোগ করুন।'
                : 'Try another filter or add courses from Master Sourav Bhattacharjee’s Teacher Studio.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course: Course, idx) => {
              const progress = calculateCourseProgress(
                course,
                snapshot.subjects,
                snapshot.chapters,
                snapshot.chapterProgress
              );
              const subjectCount = snapshot.subjects.filter(
                (s) => s.courseId === course.id
              ).length;

              return (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.03, 0.18) }}
                  className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#1D4ED8]/60 dark:hover:border-blue-500/60 transition-colors"
                >
                  <div>
                    <div className="relative h-40 overflow-hidden bg-slate-900">
                      <img
                        src={categoryImageFor(course.categoryId)}
                        alt={course.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/90 via-[#0B1F3A]/35 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 text-xs text-slate-200 font-medium">
                        <span>{course.boardName}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{course.classLevel}</span>
                        {course.isDemo && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="text-amber-300">{t('demoLabel', lang)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white leading-snug mb-2">
                        {pickText(course.titleEn, course.titleBn, lang)}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">
                        {pickText(course.descriptionEn, course.descriptionBn, lang)}
                      </p>

                      {/* Clean unboxed metadata */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span>{subjectCount} {lang === 'bn' ? 'টি বিষয়' : 'Subjects'}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">{progress.totalChapters} {t('chaptersLabel', lang)}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{course.instructor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400">
                          {lang === 'bn' ? 'অধ্যয়নের অগ্রগতি' : 'Course Progress'}
                        </span>
                        <span className="font-mono-tabular font-semibold text-[#1D4ED8] dark:text-amber-400">
                          {progress.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1D4ED8] dark:bg-amber-400 transition-all"
                          style={{ width: `${progress.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCourse(course.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] hover:bg-[#163663] dark:hover:bg-blue-600 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'কোর্স খুলুন' : 'Open Course'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
