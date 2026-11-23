import { Language } from '../types/education';

export const TRANSLATIONS = {
  appTitle: {
    en: 'Pragatir Pathshala',
    bn: 'প্রগতির পাঠশালা',
  },
  mentorLine: {
    en: 'Managed by Master Sourav Bhattacharjee',
    bn: 'পরিচালনায়: মাস্টার সৌরভ ভট্টাচার্য',
  },
  navExplore: {
    en: 'Courses',
    bn: 'কোর্সসমূহ',
  },
  navExams: {
    en: 'Exams',
    bn: 'পরীক্ষা',
  },
  navSaved: {
    en: 'Saved',
    bn: 'সংরক্ষিত',
  },
  navParent: {
    en: 'Parent',
    bn: 'অভিভাবক',
  },
  navTeacher: {
    en: 'Teacher',
    bn: 'শিক্ষক',
  },
  offlineReady: {
    en: 'Offline Ready · Device Local Storage',
    bn: 'অফলাইনে সম্পূর্ণ সচল · ডিভাইস লোকাল স্টোরেজ',
  },
  noAutoSyncNote: {
    en: 'Data stays strictly on this device (SQLite + Local Storage) and does not automatically sync across devices.',
    bn: 'সমস্ত তথ্য শুধুমাত্র এই ডিভাইসেই সংরক্ষিত থাকে (SQLite) এবং অন্য ডিভাইসে স্বয়ংক্রিয়ভাবে সিঙ্ক হয় না।',
  },
  heroTitle: {
    en: 'Focused offline learning for boards, engineering & competitive mastery.',
    bn: 'বোর্ড, ডিপ্লোমা ইঞ্জিনিয়ারিং এবং সরকারি চাকরির প্রস্তুতির সম্পূর্ণ অফলাইন পাঠশালা।',
  },
  heroSubtitle: {
    en: 'Study PDF notes, watch stored whiteboard video lessons, and take full offline examinations without internet or mandatory student login.',
    bn: 'কোনো লগইন বা ইন্টারনেট ছাড়াই পড়ুন অফলাইন PDF নোট, দেখুন ভিডিও ক্লাস এবং দিন মক ও লিখিত পরীক্ষা।',
  },
  startLearning: {
    en: 'Browse Courses',
    bn: 'কোর্স দেখুন',
  },
  takePracticeExam: {
    en: 'Offline Exams',
    bn: 'অফলাইন পরীক্ষা',
  },
  searchPlaceholder: {
    en: 'Search courses, subjects, chapters...',
    bn: 'কোর্স, বিষয় বা অধ্যায় খুঁজুন...',
  },
  allCategories: {
    en: 'All Tracks',
    bn: 'সকল বিভাগ',
  },
  demoLabel: {
    en: 'Demo Content',
    bn: 'নমুনা পাঠ্যসূচি',
  },
  chaptersLabel: {
    en: 'Chapters',
    bn: 'অধ্যায়',
  },
  notesLabel: {
    en: 'PDF Notes',
    bn: 'PDF নোট',
  },
  videosLabel: {
    en: 'Video Lessons',
    bn: 'ভিডিও ক্লাস',
  },
  assignmentsLabel: {
    en: 'Homework',
    bn: 'বাড়ির কাজ',
  },
  backToCourses: {
    en: 'All Courses',
    bn: 'সকল কোর্স',
  },
  markCompleted: {
    en: 'Mark Chapter Complete',
    bn: 'অধ্যায় সম্পন্ন করুন',
  },
  completedBadge: {
    en: 'Completed',
    bn: 'সম্পন্ন',
  },
  bookmarkNote: {
    en: 'Bookmark',
    bn: 'বুকমার্ক',
  },
  bookmarkedNote: {
    en: 'Bookmarked',
    bn: 'সংরক্ষিত',
  },
  openPdfReader: {
    en: 'Read PDF Offline',
    bn: 'অফলাইনে PDF পড়ুন',
  },
  watchVideoLesson: {
    en: 'Watch Lesson',
    bn: 'ভিডিও দেখুন',
  },
  downloadPdf: {
    en: 'Download PDF',
    bn: 'PDF ডাউনলোড',
  },
  parentPortalTitle: {
    en: 'Parent Academic Progress Portal',
    bn: 'অভিভাবক পর্যবেক্ষণ কেন্দ্র',
  },
  parentPortalSub: {
    en: 'Monitor local attendance, offline examination marks, subject progress, and announcements from Master Sourav Bhattacharjee.',
    bn: 'মাস্টার সৌরভ ভট্টাচার্যের তত্ত্বাবধানে শিক্ষার্থীর উপস্থিতি, পরীক্ষার ফলাফল, অগ্রগতি ও ঘোষণা দেখুন।',
  },
  attendanceRate: {
    en: 'Attendance Rate',
    bn: 'উপস্থিতির হার',
  },
  examAverage: {
    en: 'Exam Average',
    bn: 'গড় নম্বর',
  },
  chaptersFinished: {
    en: 'Chapters Completed',
    bn: 'সম্পন্ন অধ্যায়',
  },
  teacherAnnouncements: {
    en: 'Teacher Announcements',
    bn: 'শিক্ষকের ঘোষণা',
  },
  teacherPanelTitle: {
    en: 'Teacher Administration Studio',
    bn: 'শিক্ষক অ্যাডমিন ড্যাশবোর্ড',
  },
  teacherPinPrompt: {
    en: 'Enter Master Sourav Bhattacharjee PIN to unlock administrative controls.',
    bn: 'অ্যাডমিন প্যানেল খুলতে মাস্টার সৌরভ ভট্টাচার্যের PIN লিখুন।',
  },
  unlockDashboard: {
    en: 'Unlock Teacher Studio',
    bn: 'ড্যাশবোর্ড খুলুন',
  },
  installAndroidApp: {
    en: 'Install App',
    bn: 'অ্যাপ ইনস্টল',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

export function t(key: TranslationKey, lang: Language): string {
  return TRANSLATIONS[key][lang];
}

export function pickText(en: string, bn: string, lang: Language): string {
  if (lang === 'bn' && bn.trim().length > 0) return bn;
  return en;
}
