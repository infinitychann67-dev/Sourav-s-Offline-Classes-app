import {
  AttendanceRecord,
  Chapter,
  ChapterProgress,
  Course,
  Exam,
  ExamAttempt,
  ExamQuestion,
  Subject,
} from '../types/education';

export interface GradedQuestionDetail {
  questionId: string;
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  marksEarned: number;
  maxMarks: number;
}

export interface ExamEvaluationResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  gradeLabel: 'Distinction' | 'First Class' | 'Pass' | 'Needs Revision';
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  details: GradedQuestionDetail[];
}

export function evaluateMcqExam(
  exam: Pick<Exam, 'passingPercentage' | 'totalMarks'>,
  questions: ExamQuestion[],
  answers: Record<string, number>
): ExamEvaluationResult {
  let score = 0;
  let computedTotal = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const details: GradedQuestionDetail[] = questions.map((q) => {
    computedTotal += q.marks;
    const selected = typeof answers[q.id] === 'number' ? answers[q.id] : null;
    if (selected === null || selected < 0) {
      unansweredCount += 1;
      return {
        questionId: q.id,
        selectedIndex: null,
        correctIndex: q.correctIndex,
        isCorrect: false,
        marksEarned: 0,
        maxMarks: q.marks,
      };
    }
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) {
      correctCount += 1;
      score += q.marks;
    } else {
      incorrectCount += 1;
    }
    return {
      questionId: q.id,
      selectedIndex: selected,
      correctIndex: q.correctIndex,
      isCorrect,
      marksEarned: isCorrect ? q.marks : 0,
      maxMarks: q.marks,
    };
  });

  const totalMarks = computedTotal > 0 ? computedTotal : exam.totalMarks || 1;
  const percentage = Math.round((score / totalMarks) * 1000) / 10;
  const passed = percentage >= exam.passingPercentage;

  let gradeLabel: ExamEvaluationResult['gradeLabel'] = 'Needs Revision';
  if (percentage >= 85) gradeLabel = 'Distinction';
  else if (percentage >= 65) gradeLabel = 'First Class';
  else if (passed) gradeLabel = 'Pass';

  return {
    score,
    totalMarks,
    percentage,
    passed,
    gradeLabel,
    correctCount,
    incorrectCount,
    unansweredCount,
    details,
  };
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendancePercentage: number;
}

export function summarizeAttendance(records: AttendanceRecord[]): AttendanceSummary {
  if (records.length === 0) {
    return {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      attendancePercentage: 0,
    };
  }
  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;

  for (const r of records) {
    if (r.status === 'present') presentDays += 1;
    else if (r.status === 'late') lateDays += 1;
    else absentDays += 1;
  }

  // Late counts as 0.75 attendance weight for realistic academic tracking, or present+late / total
  const attendedCount = presentDays + lateDays;
  const attendancePercentage = Math.round((attendedCount / records.length) * 100);

  return {
    totalDays: records.length,
    presentDays,
    lateDays,
    absentDays,
    attendancePercentage,
  };
}

export interface CourseProgressSummary {
  courseId: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
}

export function calculateCourseProgress(
  course: Course,
  subjects: Subject[],
  chapters: Chapter[],
  progressRows: ChapterProgress[]
): CourseProgressSummary {
  const courseSubjectIds = new Set(
    subjects.filter((s) => s.courseId === course.id).map((s) => s.id)
  );
  const courseChapters = chapters.filter((c) => courseSubjectIds.has(c.subjectId));
  const completedIds = new Set(
    progressRows.filter((p) => p.completed).map((p) => p.chapterId)
  );
  const completedChapters = courseChapters.filter((c) => completedIds.has(c.id)).length;
  const totalChapters = courseChapters.length;
  const progressPercentage =
    totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return {
    courseId: course.id,
    totalChapters,
    completedChapters,
    progressPercentage,
  };
}

export function calculateOverallExamAverage(attempts: ExamAttempt[]): number {
  if (attempts.length === 0) return 0;
  const sum = attempts.reduce((acc, a) => acc + a.percentage, 0);
  return Math.round((sum / attempts.length) * 10) / 10;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
