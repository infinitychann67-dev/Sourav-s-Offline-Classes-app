import React, { useState } from 'react';
import {
  Bookmark,
  BookOpen,
  ClipboardCheck,
  Download,
  GraduationCap,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  WifiOff,
  HardDrive,
} from 'lucide-react';
import { AppTab, Language, ThemeMode } from '../types/education';
import { t } from '../utils/i18n';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarAndNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  teacherUnlocked: boolean;
}

export const TopBarAndNav: React.FC<TopBarAndNavProps> = ({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  teacherUnlocked,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'explore', label: t('navExplore', lang), icon: <BookOpen className="w-5 h-5" /> },
    { id: 'exams', label: t('navExams', lang), icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'saved', label: t('navSaved', lang), icon: <Bookmark className="w-5 h-5" /> },
    { id: 'parent', label: t('navParent', lang), icon: <Users className="w-5 h-5" /> },
    { id: 'teacher', label: t('navTeacher', lang), icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  const renderPrimaryCta = () => {
    if (!isInstalled && isInstallable) {
      return (
        <button
          type="button"
          onClick={() => void install()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t('installAndroidApp', lang)}</span>
        </button>
      );
    }

    if (!isInstalled && isIOS) {
      return (
        <button
          type="button"
          onClick={() => setShowIosGuide(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t('installAndroidApp', lang)}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onSelectTab('teacher')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B1F3A] dark:bg-[#1D4ED8] hover:bg-[#15315B] dark:hover:bg-[#2563EB] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4 text-amber-400" />
        <span>{teacherUnlocked ? (lang === 'bn' ? 'শিক্ষক স্টুডিও' : 'Teacher Studio') : t('navTeacher', lang)}</span>
      </button>
    );
  };

  return (
    <>
      {/* 3-Zone Top Bar Contract: Brand Wordmark | 5 Single-Line Nav Links | 1 Primary Action */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('explore')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-md"
          >
            <span className="w-9 h-9 rounded-full overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/1000359931_e91baf5c.jpg"
                alt="Pragatir Pathshala Official Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center scale-[1.12]"
              />
            </span>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap shrink-0">
              {t('appTitle', lang)}
            </span>
          </button>

          {/* Zone 2: Desktop Single-line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-[#1D4ED8] text-[#1D4ED8] dark:border-amber-400 dark:text-amber-300 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-[#0B1F3A] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">{renderPrimaryCta()}</div>
        </div>
      </header>

      {/* Workspace Utility Bar (Placed below header per Top Bar Contract) */}
      <div className="bg-slate-100/80 dark:bg-[#091222] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 min-w-0">
            {isOnline ? (
              <HardDrive className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-amber-400 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span className="truncate font-medium">
              {isOnline
                ? t('offlineReady', lang)
                : lang === 'bn'
                ? 'অফলাইন মোড সক্রিয় · স্থানীয় SQLite ডাটাবেস ব্যবহৃত হচ্ছে'
                : 'Airplane / Offline Mode Active · Running on Local SQLite'}
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-400">
              ·
            </span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
              {t('mentorLine', lang)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleLang}
              aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
              className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {lang === 'bn' ? 'বাংলা / EN' : 'EN / বাংলা'}
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'bn' ? 'লাইট' : 'Light'}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>{lang === 'bn' ? 'ডার্ক' : 'Dark'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Android Thumb-Zone Bottom Navigation Bar (5 evenly distributed destinations) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1528]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#1D4ED8] dark:text-amber-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.icon}
                <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* iOS / Safari manual install guide modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="w-6 h-6 text-[#1D4ED8] dark:text-amber-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'হোম স্ক্রিনে ইনস্টল করুন' : 'Install Pragatir Pathshala'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার ব্রাউজারের Share অথবা মেনু বাটনে ট্যাপ করে "Add to Home Screen" বা "Install App" নির্বাচন করুন। ইনস্টলের পর সম্পূর্ণ অফলাইনে চলবে।'
                : 'Tap Share or browser menu and choose "Add to Home Screen" / "Install App". Once installed, all lessons run offline.'}
            </p>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#1D4ED8] text-white text-sm font-semibold cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
