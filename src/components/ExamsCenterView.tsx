import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  Play,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { AppSnapshot } from '../db/sqliteStore';
import { Exam, ExamAttempt, Language } from '../types/education';
import {
  evaluateMcqExam,
  ExamEvaluationResult,
  formatDurationSeconds,
} from '../utils/examEngine';
import { pickText } from '../utils/i18n';

interface ExamsCenterViewProps {
  snapshot: AppSnapshot;
  lang: Language;
  initialExamId?: string | null;
  onClearInitialExam?: () => void;
  onSaveAttempt: (attempt: ExamAttempt) => Promise<void>;
}

export const ExamsCenterView: React.FC<ExamsCenterViewProps> = ({
  snapshot,
  lang,
  initialExamId,
  onClearInitialExam,
  onSaveAttempt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'mcq' | 'written'>('all');
  const [activeExamId, setActiveExamId] = useState<string | null>(initialExamId ?? null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<string, string>>({});
  const [writtenSelfMarks, setWrittenSelfMarks] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submittedResult, setSubmittedResult] = useState<ExamEvaluationResult | null>(null);
  const [writtenSubmitted, setWrittenSubmitted] = useState(false);

  const activeExam: Exam | undefined = snapshot.exams.find((e) => e.id === activeExamId);
  const examQuestions = useMemo(
    () => snapshot.questions.filter((q) => q.examId === activeExamId),
    [snapshot.questions, activeExamId]
  );

  useEffect(() => {
    if (initialExamId) {
      startExamSession(initialExamId);
      onClearInitialExam?.();
    }
  }, [initialExamId]);

  const startExamSession = (examId: string) => {
    const ex = snapshot.exams.find((e) => e.id === examId);
    if (!ex) return;
    setActiveExamId(examId);
    setMcqAnswers({});
    setWrittenAnswers({});
    setWrittenSelfMarks({});
    setCurrentIdx(0);
    setSecondsLeft(ex.durationMinutes * 60);
    setElapsedSeconds(0);
    setSubmittedResult(null);
    setWrittenSubmitted(false);
  };

  // Countdown timer during active exam
  useEffect(() => {
    if (!activeExam || submittedResult || writtenSubmitted) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeExam, submittedResult, writtenSubmitted]);

  const handleSubmitMcq = async () => {
    if (!activeExam) return;
    const result = evaluateMcqExam(activeExam, examQuestions, mcqAnswers);
    setSubmittedResult(result);

    const attempt: ExamAttempt = {
      id: `att-${Date.now()}`,
      examId: activeExam.id,
      studentName: snapshot.studentDisplayName,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      passed: result.passed,
      timeSpentSeconds: elapsedSeconds,
      answersJson: JSON.stringify(mcqAnswers),
      submittedAt: new Date().toISOString(),
      isDemo: false,
    };
    await onSaveAttempt(attempt);
  };

  const handleSubmitWritten = async () => {
    if (!activeExam) return;
    setWrittenSubmitted(true);
    const totalMarks = examQuestions.reduce((acc, q) => acc + q.marks, 0) || activeExam.totalMarks;
    const earned = examQuestions.reduce(
      (acc, q) => acc + Math.min(q.marks, Math.max(0, writtenSelfMarks[q.id] ?? 0)),
      0
    );
    const pct = totalMarks > 0 ? Math.round((earned / totalMarks) * 1000) / 10 : 0;

    const attempt: ExamAttempt = {
      id: `att-${Date.now()}`,
      examId: activeExam.id,
      studentName: snapshot.studentDisplayName,
      score: earned,
      totalMarks,
      percentage: pct,
      passed: pct >= activeExam.passingPercentage,
      timeSpentSeconds: elapsedSeconds,
      answersJson: JSON.stringify(writtenAnswers),
      writtenSelfScore: earned,
      submittedAt: new Date().toISOString(),
      isDemo: false,
    };
    await onSaveAttempt(attempt);
  };

  const filteredExams = snapshot.exams.filter(
    (e) => filterType === 'all' || e.examType === filterType
  );

  // Active Exam Runner View
  if (activeExam) {
    const q = examQuestions[currentIdx];

    return (
      <div className="space-y-6 pb-12">
        {/* Top Exam Status Bar */}
        <div className="rounded-2xl bg-[#0B1F3A] text-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-amber-300 font-medium">
              {activeExam.examType === 'mcq'
                ? lang === 'bn' ? 'অফলাইন MCQ পরীক্ষা' : 'Offline MCQ Examination'
                : lang === 'bn' ? 'অফলাইন লিখিত পরীক্ষা' : 'Offline Written Examination'}
            </div>
            <h1 className="font-display text-lg sm:text-xl font-bold mt-0.5">
              {pickText(activeExam.titleEn, activeExam.titleBn, lang)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono-tabular text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatDurationSeconds(secondsLeft)}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveExamId(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
            >
              {lang === 'bn' ? 'তালিকায় ফিরুন' : 'Exit Exam'}
            </button>
          </div>
        </div>

        {/* Result Scorecard after MCQ Submission */}
        {submittedResult ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {submittedResult.passed
                        ? lang === 'bn' ? 'উত্তীর্ণ · ফলাফল সংরক্ষিত হয়েছে' : 'Passed · Saved to Device SQLite'
                        : lang === 'bn' ? 'পুনরায় অনুশীলন প্রয়োজন' : 'Needs Revision · Saved Locally'}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#0B1F3A] dark:text-white">
                      {submittedResult.score} / {submittedResult.totalMarks} ({submittedResult.percentage}%)
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{submittedResult.gradeLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">{submittedResult.correctCount} Correct</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">{submittedResult.incorrectCount} Wrong</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">Time {formatDurationSeconds(elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startExamSession(activeExam.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'আবার দিন' : 'Retake'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveExamId(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
                  </button>
                </div>
              </div>

              {/* Solution Review */}
              <div className="mt-6 space-y-4">
                <h3 className="font-display text-base font-bold text-[#0B1F3A] dark:text-white">
                  {lang === 'bn' ? 'উত্তর ও ব্যাখ্যা পর্যালোচনা' : 'Detailed Solution Review'}
                </h3>
                {examQuestions.map((ques, idx) => {
                  const chosen = mcqAnswers[ques.id];
                  const isCorrect = chosen === ques.correctIndex;
                  const opts = lang === 'bn' && ques.optionsBn.length ? ques.optionsBn : ques.optionsEn;
                  return (
                    <div
                      key={ques.id}
                      className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {idx + 1}. {pickText(ques.questionTextEn, ques.questionTextBn, lang)}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                            isCorrect
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {isCorrect ? `+${ques.marks}` : '0'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span>{lang === 'bn' ? 'আপনার উত্তর:' : 'Your answer:'} </span>
                        <span className="font-semibold">
                          {typeof chosen === 'number' ? opts[chosen] : (lang === 'bn' ? 'উত্তর দেওয়া হয়নি' : 'Unanswered')}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {lang === 'bn' ? 'সঠিক উত্তর:' : 'Correct:'} {opts[ques.correctIndex]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {pickText(ques.explanationEn, ques.explanationBn, lang)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeExam.examType === 'written' ? (
          /* Written / Descriptive Exam Runner */
          <div className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            {examQuestions.map((ques, idx) => (
              <div
                key={ques.id}
                className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Q{idx + 1}. {pickText(ques.questionTextEn, ques.questionTextBn, lang)}
                  </h3>
                  <span className="text-xs font-mono-tabular font-semibold text-[#1D4ED8] dark:text-amber-400 shrink-0">
                    {ques.marks} Marks
                  </span>
                </div>
                <textarea
                  rows={4}
                  disabled={writtenSubmitted}
                  value={writtenAnswers[ques.id] ?? ''}
                  onChange={(e) =>
                    setWrittenAnswers((prev) => ({ ...prev, [ques.id]: e.target.value }))
                  }
                  placeholder={
                    lang === 'bn'
                      ? 'এখানে ধাপে ধাপে উত্তর লিখুন...'
                      : 'Write your step-by-step descriptive solution here...'
                  }
                  className="w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-3 text-sm text-slate-900 dark:text-white"
                />

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`self-mark-${ques.id}`}
                      className="text-slate-600 dark:text-slate-300 font-medium"
                    >
                      {lang === 'bn' ? 'স্ব-মূল্যায়ন নম্বর:' : 'Self-Evaluation Marks:'}
                    </label>
                    <input
                      id={`self-mark-${ques.id}`}
                      type="number"
                      min={0}
                      max={ques.marks}
                      disabled={writtenSubmitted}
                      value={writtenSelfMarks[ques.id] ?? ques.marks}
                      onChange={(e) =>
                        setWrittenSelfMarks((prev) => ({
                          ...prev,
                          [ques.id]: Number(e.target.value),
                        }))
                      }
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-tabular"
                    />
                  </div>
                </div>

                {writtenSubmitted && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-xs text-emerald-900 dark:text-emerald-200">
                    <div className="font-bold mb-1">
                      {lang === 'bn' ? 'আদর্শ উত্তর (Model Answer):' : 'Model Answer:'}
                    </div>
                    <div>{ques.modelAnswer || pickText(ques.explanationEn, ques.explanationBn, lang)}</div>
                  </div>
                )}
              </div>
            ))}

            {!writtenSubmitted ? (
              <button
                type="button"
                onClick={() => void handleSubmitWritten()}
                className="px-6 py-3 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'লিখিত উত্তর জমা দিন ও আদর্শ উত্তর দেখুন' : 'Submit Written Paper & Reveal Model Answers'}
              </button>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {lang === 'bn' ? 'লিখিত পরীক্ষার ফলাফল এই ডিভাইসে সংরক্ষিত হয়েছে।' : 'Written exam attempt saved to local SQLite database.'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveExamId(null)}
                  className="px-4 py-2 rounded-xl bg-[#0B1F3A] text-white text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'সম্পন্ন' : 'Finish'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Interactive MCQ Runner */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              {q ? (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono-tabular font-semibold">
                      {lang === 'bn' ? `প্রশ্ন ${currentIdx + 1} / ${examQuestions.length}` : `Question ${currentIdx + 1} of ${examQuestions.length}`}
                    </span>
                    <span className="font-mono-tabular">{q.marks} Marks</span>
                  </div>

                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A] dark:text-white leading-snug">
                    {pickText(q.questionTextEn, q.questionTextBn, lang)}
                  </h2>

                  <div className="space-y-3">
                    {(lang === 'bn' && q.optionsBn.length ? q.optionsBn : q.optionsEn).map(
                      (opt, oIdx) => {
                        const selected = mcqAnswers[q.id] === oIdx;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() =>
                              setMcqAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                            }
                            className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer ${
                              selected
                                ? 'bg-[#1D4ED8]/10 dark:bg-blue-500/20 border-[#1D4ED8] dark:border-blue-400 text-[#0B1F3A] dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono-tabular font-bold shrink-0 ${
                                selected
                                  ? 'bg-[#1D4ED8] text-white'
                                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                    </button>

                    {currentIdx < examQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIdx((i) => Math.min(examQuestions.length - 1, i + 1))
                        }
                        className="px-5 py-2 rounded-xl bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'bn' ? 'পরবর্তী প্রশ্ন' : 'Next Question'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleSubmitMcq()}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'bn' ? 'পরীক্ষা জমা দিন' : 'Submit Examination'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  No questions added to this exam yet.
                </div>
              )}
            </div>

            {/* Question Palette */}
            <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 h-fit space-y-4">
              <h3 className="text-sm font-bold text-[#0B1F3A] dark:text-white">
                {lang === 'bn' ? 'প্রশ্ন প্যালেট' : 'Question Navigator'}
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {examQuestions.map((ques, idx) => {
                  const answered = typeof mcqAnswers[ques.id] === 'number';
                  const active = idx === currentIdx;
                  return (
                    <button
                      key={ques.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-10 rounded-lg font-mono-tabular text-xs font-bold border cursor-pointer ${
                        active
                          ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/30'
                          : 'border-slate-200 dark:border-slate-700'
                      } ${
                        answered
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void handleSubmitMcq()}
                className="w-full py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                {lang === 'bn' ? 'এখনই জমা দিন' : 'Finish & Grade Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Exam List & Past Attempts View
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'অফলাইন পরীক্ষা ও MCQ অনুশীলন কেন্দ্র' : 'Offline Examination & Practice Center'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ইন্টারনেট ছাড়াই সম্পূর্ণ MCQ এবং লিখিত পরীক্ষা দিন এবং তাৎক্ষণিক ফলাফল দেখুন।'
              : 'Take timed MCQ tests and descriptive written exams completely offline with instant grading.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-1 rounded-xl w-fit">
          {(['all', 'mcq', 'written'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterType(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                filterType === mode
                  ? 'bg-[#0B1F3A] dark:bg-[#1D4ED8] text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {mode === 'all' ? (lang === 'bn' ? 'সব' : 'All') : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExams.map((exam) => {
          const course = snapshot.courses.find((c) => c.id === exam.courseId);
          const qCount = snapshot.questions.filter((q) => q.examId === exam.id).length;
          return (
            <div
              key={exam.id}
              className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>{exam.examType === 'mcq' ? 'MCQ Test' : 'Written Paper'}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{qCount} Questions</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{exam.durationMinutes} min</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{exam.totalMarks} Marks</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
                  {pickText(exam.titleEn, exam.titleBn, lang)}
                </h2>
                {course && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {pickText(course.titleEn, course.titleBn, lang)}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={qCount === 0}
                onClick={() => startExamSession(exam.id)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পরীক্ষা শুরু করুন' : 'Start Offline Exam'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent Offline Results */}
      <section className="rounded-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-[#1D4ED8] dark:text-amber-400" />
          <h2 className="font-display text-lg font-bold text-[#0B1F3A] dark:text-white">
            {lang === 'bn' ? 'সাম্প্রতিক পরীক্ষার ফলাফল (এই ডিভাইসে)' : 'Recent Local Exam Attempts'}
          </h2>
        </div>

        {snapshot.examAttempts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'এখনো কোনো পরীক্ষা দেওয়া হয়নি।' : 'No exam attempts recorded yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">{lang === 'bn' ? 'পরীক্ষা' : 'Examination'}</th>
                  <th className="py-2.5 px-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                  <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'নম্বর' : 'Score'}</th>
                  <th className="py-2.5 pl-3 text-right">{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.examAttempts.map((att) => {
                  const ex = snapshot.exams.find((e) => e.id === att.examId);
                  return (
                    <tr key={att.id}>
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                        {ex ? pickText(ex.titleEn, ex.titleBn, lang) : att.examId}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                        {att.submittedAt.slice(0, 10)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-tabular font-semibold">
                        {att.score}/{att.totalMarks} ({att.percentage}%)
                      </td>
                      <td className="py-3 pl-3 text-right text-xs font-semibold">
                        <span
                          className={
                            att.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {att.passed ? (lang === 'bn' ? 'উত্তীর্ণ' : 'Passed') : (lang === 'bn' ? 'পুনঃচেষ্টা' : 'Revise')}
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
    </div>
  );
};
