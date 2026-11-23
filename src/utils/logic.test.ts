import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCourseProgress,
  calculateOverallExamAverage,
  evaluateMcqExam,
  formatDurationSeconds,
  summarizeAttendance,
} from './examEngine';
import { buildPdfBytes } from './pdfGenerator';
import { serializeExportPackage, validateAndParsePackage } from './packageManager';
import { pickText, t } from './i18n';
import type {
  AttendanceRecord,
  Chapter,
  ChapterProgress,
  Course,
  ExamQuestion,
  Subject,
} from '../types/education';

test('evaluateMcqExam grades answers, handles unanswered, and assigns distinction', () => {
  const questions: ExamQuestion[] = [
    {
      id: 'q1',
      examId: 'e1',
      questionTextEn: 'Q1',
      questionTextBn: 'Q1',
      optionsEn: ['A', 'B', 'C', 'D'],
      optionsBn: ['A', 'B', 'C', 'D'],
      correctIndex: 1,
      marks: 5,
      explanationEn: 'Exp',
      explanationBn: 'Exp',
    },
    {
      id: 'q2',
      examId: 'e1',
      questionTextEn: 'Q2',
      questionTextBn: 'Q2',
      optionsEn: ['A', 'B', 'C', 'D'],
      optionsBn: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      marks: 5,
      explanationEn: 'Exp',
      explanationBn: 'Exp',
    },
  ];

  const full = evaluateMcqExam({ passingPercentage: 40, totalMarks: 10 }, questions, {
    q1: 1,
    q2: 2,
  });
  assert.equal(full.score, 10);
  assert.equal(full.percentage, 100);
  assert.equal(full.passed, true);
  assert.equal(full.gradeLabel, 'Distinction');
  assert.equal(full.correctCount, 2);

  const partial = evaluateMcqExam({ passingPercentage: 60, totalMarks: 10 }, questions, {
    q1: 1,
  });
  assert.equal(partial.score, 5);
  assert.equal(partial.percentage, 50);
  assert.equal(partial.passed, false);
  assert.equal(partial.unansweredCount, 1);
  assert.equal(partial.gradeLabel, 'Needs Revision');
});

test('summarizeAttendance computes present, late, absent and percentage', () => {
  const records: AttendanceRecord[] = [
    { id: '1', date: '2026-11-01', courseId: 'c1', studentName: 'Student', status: 'present', isDemo: true },
    { id: '2', date: '2026-11-02', courseId: 'c1', studentName: 'Student', status: 'late', isDemo: true },
    { id: '3', date: '2026-11-03', courseId: 'c1', studentName: 'Student', status: 'absent', isDemo: true },
    { id: '4', date: '2026-11-04', courseId: 'c1', studentName: 'Student', status: 'present', isDemo: true },
  ];
  const summary = summarizeAttendance(records);
  assert.equal(summary.totalDays, 4);
  assert.equal(summary.presentDays, 2);
  assert.equal(summary.lateDays, 1);
  assert.equal(summary.absentDays, 1);
  assert.equal(summary.attendancePercentage, 75);
});

test('calculateCourseProgress counts completed chapters only within that course', () => {
  const course: Course = {
    id: 'c1',
    categoryId: 'wbbse',
    boardName: 'WBBSE',
    classLevel: 'Class 10',
    titleEn: 'Math',
    titleBn: 'গণিত',
    descriptionEn: '',
    descriptionBn: '',
    instructor: 'Master Sourav Bhattacharjee',
    accentHex: '#1D4ED8',
    isDemo: true,
    createdAt: '',
  };
  const subjects: Subject[] = [
    { id: 's1', courseId: 'c1', titleEn: 'Algebra', titleBn: 'বীজগণিত', code: 'M1', sortOrder: 1 },
    { id: 's2', courseId: 'c2', titleEn: 'Other', titleBn: 'অন্য', code: 'O1', sortOrder: 1 },
  ];
  const chapters: Chapter[] = [
    { id: 'ch1', subjectId: 's1', chapterNumber: 1, titleEn: 'Ch1', titleBn: '১', summaryEn: '', summaryBn: '', estimatedMinutes: 20 },
    { id: 'ch2', subjectId: 's1', chapterNumber: 2, titleEn: 'Ch2', titleBn: '২', summaryEn: '', summaryBn: '', estimatedMinutes: 20 },
    { id: 'ch3', subjectId: 's2', chapterNumber: 1, titleEn: 'OtherCh', titleBn: '৩', summaryEn: '', summaryBn: '', estimatedMinutes: 20 },
  ];
  const progress: ChapterProgress[] = [
    { chapterId: 'ch1', courseId: 'c1', completed: true, lastAccessedAt: '' },
    { chapterId: 'ch3', courseId: 'c2', completed: true, lastAccessedAt: '' },
  ];
  const res = calculateCourseProgress(course, subjects, chapters, progress);
  assert.equal(res.totalChapters, 2);
  assert.equal(res.completedChapters, 1);
  assert.equal(res.progressPercentage, 50);
});

test('buildPdfBytes generates valid PDF 1.4 header and EOF trailer', () => {
  const bytes = buildPdfBytes({
    title: 'Refraction of Light',
    subtitle: 'WBBSE Class 10 Physical Science',
    instructor: 'Master Sourav Bhattacharjee',
    sections: [
      {
        heading: 'Snell Law',
        body: 'The ratio of sine of angle of incidence to sine of angle of refraction is constant.',
        formula: 'sin(i) / sin(r) = n2 / n1',
      },
    ],
  });
  const text = new TextDecoder().decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.includes('%%EOF'));
  assert.ok(text.includes('Refraction of Light'));
});

test('packageManager serializes and validates Pragatir Pathshala packages', () => {
  const json = serializeExportPackage({
    format: 'pragatir-pathshala-package',
    version: 1,
    exportedAt: '2026-11-23T00:00:00Z',
    exportedBy: 'Master Sourav Bhattacharjee',
    scope: 'course-content',
    courses: [],
    subjects: [],
    chapters: [],
    materials: [],
    exams: [],
    questions: [],
    assignments: [],
    announcements: [],
  });
  const valid = validateAndParsePackage(json);
  assert.equal(valid.valid, true);
  assert.equal(valid.payload?.exportedBy, 'Master Sourav Bhattacharjee');

  const invalid = validateAndParsePackage('{"format":"wrong"}');
  assert.equal(invalid.valid, false);
});

test('i18n and formatting utilities return Bengali and English strings accurately', () => {
  assert.equal(t('appTitle', 'bn'), 'প্রগতির পাঠশালা');
  assert.equal(t('appTitle', 'en'), 'Pragatir Pathshala');
  assert.equal(pickText('Math', 'গণিত', 'bn'), 'গণিত');
  assert.equal(formatDurationSeconds(125), '02:05');
  assert.equal(calculateOverallExamAverage([]), 0);
});
