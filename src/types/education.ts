export type Language = 'bn' | 'en';
export type ThemeMode = 'light' | 'dark';
export type AppTab = 'explore' | 'exams' | 'saved' | 'parent' | 'teacher';

export type CategoryId =
  | 'wbbse'
  | 'cbse'
  | 'icse'
  | 'diploma'
  | 'govt_jobs';

export interface AcademicCategory {
  id: CategoryId;
  nameEn: string;
  nameBn: string;
  subtitleEn: string;
  subtitleBn: string;
  imageUrl: string;
  sortOrder: number;
}

export interface Course {
  id: string;
  categoryId: CategoryId;
  boardName: string;
  classLevel: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  instructor: string;
  accentHex: string;
  isDemo: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  courseId: string;
  titleEn: string;
  titleBn: string;
  code: string;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  estimatedMinutes: number;
}

export type MaterialType = 'pdf' | 'video';

export interface VideoSlide {
  timestampSec: number;
  heading: string;
  bullets: string[];
  formula?: string;
  diagramKind?: 'prism' | 'quadratic' | 'circuit' | 'mechanics' | 'ratio';
}

export interface StudyMaterial {
  id: string;
  chapterId: string;
  type: MaterialType;
  titleEn: string;
  titleBn: string;
  durationOrPages: string;
  /** Key in IndexedDB binary blob store if teacher uploaded a real file or generated PDF */
  blobKey?: string;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  /** Structured offline content for built-in PDF reader & whiteboard video player */
  noteSections?: {
    heading: string;
    body: string;
    formula?: string;
  }[];
  videoSlides?: VideoSlide[];
  isDemo: boolean;
  createdAt: string;
}

export type ExamType = 'mcq' | 'written';

export interface Exam {
  id: string;
  courseId: string;
  subjectId: string;
  titleEn: string;
  titleBn: string;
  examType: ExamType;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  isDemo: boolean;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionTextEn: string;
  questionTextBn: string;
  optionsEn: string[];
  optionsBn: string[];
  correctIndex: number;
  marks: number;
  explanationEn: string;
  explanationBn: string;
  modelAnswer?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  answersJson: string; // Record<questionId, number | string>
  writtenSelfScore?: number;
  submittedAt: string;
  isDemo: boolean;
}

export interface Assignment {
  id: string;
  courseId: string;
  chapterId: string;
  titleEn: string;
  titleBn: string;
  instructionsEn: string;
  instructionsBn: string;
  dueDate: string;
  maxMarks: number;
  status: 'pending' | 'submitted' | 'reviewed';
  studentSubmissionText?: string;
  submittedAt?: string;
  isDemo: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  courseId: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
  isDemo: boolean;
}

export interface Announcement {
  id: string;
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
  targetCategory: CategoryId | 'all';
  priority: 'normal' | 'important';
  publishedAt: string;
  author: string;
  isDemo: boolean;
}

export interface Bookmark {
  id: string;
  materialId: string;
  chapterId: string;
  courseId: string;
  noteTag?: string;
  createdAt: string;
}

export interface ChapterProgress {
  chapterId: string;
  courseId: string;
  completed: boolean;
  lastAccessedAt: string;
}

export interface ExportPackagePayload {
  format: 'pragatir-pathshala-package';
  version: 1;
  exportedAt: string;
  exportedBy: string;
  scope: 'full-backup' | 'course-content';
  courses: Course[];
  subjects: Subject[];
  chapters: Chapter[];
  materials: StudyMaterial[];
  exams: Exam[];
  questions: ExamQuestion[];
  assignments: Assignment[];
  announcements: Announcement[];
  attendance?: AttendanceRecord[];
  examAttempts?: ExamAttempt[];
  bookmarks?: Bookmark[];
  chapterProgress?: ChapterProgress[];
}
