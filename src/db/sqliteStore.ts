import initSqlJs, { Database } from 'sql.js';
import {
  Announcement,
  Assignment,
  AttendanceRecord,
  Bookmark,
  Chapter,
  ChapterProgress,
  Course,
  Exam,
  ExamAttempt,
  ExamQuestion,
  ExportPackagePayload,
  StudyMaterial,
  Subject,
} from '../types/education';
import {
  loadSqliteSnapshot,
  saveSqliteSnapshot,
} from './blobStore';
import {
  SEED_ANNOUNCEMENTS,
  SEED_ASSIGNMENTS,
  SEED_ATTEMPTS,
  SEED_ATTENDANCE,
  SEED_CHAPTERS,
  SEED_COURSES,
  SEED_EXAMS,
  SEED_MATERIALS,
  SEED_PROGRESS,
  SEED_QUESTIONS,
  SEED_SUBJECTS,
} from './seedData';

export interface AppSnapshot {
  courses: Course[];
  subjects: Subject[];
  chapters: Chapter[];
  materials: StudyMaterial[];
  exams: Exam[];
  questions: ExamQuestion[];
  examAttempts: ExamAttempt[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  bookmarks: Bookmark[];
  chapterProgress: ChapterProgress[];
  teacherPin: string;
  studentDisplayName: string;
}

const DEFAULT_TEACHER_PIN = '2026';

class SqliteEduDatabase {
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm',
        useOldExtensionFunctions: false,
      });
      const existingBytes = await loadSqliteSnapshot();
      if (existingBytes && existingBytes.length > 0) {
        try {
          this.db = new SQL.Database(existingBytes);
          this.ensureSchema();
          return;
        } catch {
          // Fall back to fresh DB if snapshot was corrupted
        }
      }
      this.db = new SQL.Database();
      this.ensureSchema();
      this.seedDemonstrationData();
      await this.persist();
    })();

    return this.initPromise;
  }

  private getDb(): Database {
    if (!this.db) throw new Error('SQLite database is not initialized.');
    return this.db;
  }

  private ensureSchema(): void {
    const db = this.getDb();
    db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        board_name TEXT NOT NULL,
        class_level TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        description_en TEXT NOT NULL,
        description_bn TEXT NOT NULL,
        instructor TEXT NOT NULL,
        accent_hex TEXT NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        code TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        subject_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        summary_en TEXT NOT NULL,
        summary_bn TEXT NOT NULL,
        estimated_minutes INTEGER NOT NULL DEFAULT 30
      );

      CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        duration_or_pages TEXT NOT NULL,
        blob_key TEXT,
        mime_type TEXT,
        file_name TEXT,
        file_size_bytes INTEGER,
        note_sections_json TEXT,
        video_slides_json TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        exam_type TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        passing_percentage INTEGER NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        question_text_en TEXT NOT NULL,
        question_text_bn TEXT NOT NULL,
        options_en_json TEXT NOT NULL,
        options_bn_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        marks INTEGER NOT NULL,
        explanation_en TEXT NOT NULL,
        explanation_bn TEXT NOT NULL,
        model_answer TEXT
      );

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_marks INTEGER NOT NULL,
        percentage REAL NOT NULL,
        passed INTEGER NOT NULL,
        time_spent_seconds INTEGER NOT NULL,
        answers_json TEXT NOT NULL,
        written_self_score INTEGER,
        submitted_at TEXT NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        instructions_en TEXT NOT NULL,
        instructions_bn TEXT NOT NULL,
        due_date TEXT NOT NULL,
        max_marks INTEGER NOT NULL,
        status TEXT NOT NULL,
        student_submission_text TEXT,
        submitted_at TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        course_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        status TEXT NOT NULL,
        remarks TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title_en TEXT NOT NULL,
        title_bn TEXT NOT NULL,
        body_en TEXT NOT NULL,
        body_bn TEXT NOT NULL,
        target_category TEXT NOT NULL,
        priority TEXT NOT NULL,
        published_at TEXT NOT NULL,
        author TEXT NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        material_id TEXT NOT NULL,
        chapter_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        note_tag TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chapter_progress (
        chapter_id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        completed INTEGER NOT NULL,
        last_accessed_at TEXT NOT NULL
      );
    `);
  }

  private async persist(): Promise<void> {
    const data = this.getDb().export();
    await saveSqliteSnapshot(data);
  }

  private queryAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
    const stmt = this.getDb().prepare(sql);
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return rows;
  }

  seedDemonstrationData(): void {
    const db = this.getDb();
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('teacher_pin', '${DEFAULT_TEACHER_PIN}')`);
    db.run(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('student_name', 'Device Student')`);

    for (const c of SEED_COURSES) this.upsertCourseSync(c);
    for (const s of SEED_SUBJECTS) this.upsertSubjectSync(s);
    for (const ch of SEED_CHAPTERS) this.upsertChapterSync(ch);
    for (const m of SEED_MATERIALS) this.upsertMaterialSync(m);
    for (const e of SEED_EXAMS) this.upsertExamSync(e);
    for (const q of SEED_QUESTIONS) this.upsertQuestionSync(q);
    for (const a of SEED_ATTEMPTS) this.insertAttemptSync(a);
    for (const asg of SEED_ASSIGNMENTS) this.upsertAssignmentSync(asg);
    for (const att of SEED_ATTENDANCE) this.upsertAttendanceSync(att);
    for (const ann of SEED_ANNOUNCEMENTS) this.upsertAnnouncementSync(ann);
    for (const p of SEED_PROGRESS) {
      db.run(
        `INSERT OR REPLACE INTO chapter_progress (chapter_id, course_id, completed, last_accessed_at) VALUES (?, ?, ?, ?)`,
        [p.chapterId, p.courseId, p.completed ? 1 : 0, p.lastAccessedAt]
      );
    }
    // Seed 1 default bookmark
    db.run(
      `INSERT OR IGNORE INTO bookmarks (id, material_id, chapter_id, course_id, note_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ['bm-demo-1', 'mat-light-pdf', 'ch-wbbse-light', 'course-wbbse-10', 'Prism Formula', '2026-11-21T16:22:00Z']
    );
  }

  private upsertCourseSync(c: Course): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO courses (id, category_id, board_name, class_level, title_en, title_bn, description_en, description_bn, instructor, accent_hex, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.categoryId, c.boardName, c.classLevel, c.titleEn, c.titleBn, c.descriptionEn, c.descriptionBn, c.instructor, c.accentHex, c.isDemo ? 1 : 0, c.createdAt]
    );
  }

  private upsertSubjectSync(s: Subject): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO subjects (id, course_id, title_en, title_bn, code, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [s.id, s.courseId, s.titleEn, s.titleBn, s.code, s.sortOrder]
    );
  }

  private upsertChapterSync(ch: Chapter): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO chapters (id, subject_id, chapter_number, title_en, title_bn, summary_en, summary_bn, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ch.id, ch.subjectId, ch.chapterNumber, ch.titleEn, ch.titleBn, ch.summaryEn, ch.summaryBn, ch.estimatedMinutes]
    );
  }

  private upsertMaterialSync(m: StudyMaterial): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO materials (id, chapter_id, type, title_en, title_bn, duration_or_pages, blob_key, mime_type, file_name, file_size_bytes, note_sections_json, video_slides_json, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.id,
        m.chapterId,
        m.type,
        m.titleEn,
        m.titleBn,
        m.durationOrPages,
        m.blobKey ?? null,
        m.mimeType ?? null,
        m.fileName ?? null,
        m.fileSizeBytes ?? null,
        m.noteSections ? JSON.stringify(m.noteSections) : null,
        m.videoSlides ? JSON.stringify(m.videoSlides) : null,
        m.isDemo ? 1 : 0,
        m.createdAt,
      ]
    );
  }

  private upsertExamSync(e: Exam): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO exams (id, course_id, subject_id, title_en, title_bn, exam_type, duration_minutes, total_marks, passing_percentage, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.courseId, e.subjectId, e.titleEn, e.titleBn, e.examType, e.durationMinutes, e.totalMarks, e.passingPercentage, e.isDemo ? 1 : 0, e.createdAt]
    );
  }

  private upsertQuestionSync(q: ExamQuestion): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO questions (id, exam_id, question_text_en, question_text_bn, options_en_json, options_bn_json, correct_index, marks, explanation_en, explanation_bn, model_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [q.id, q.examId, q.questionTextEn, q.questionTextBn, JSON.stringify(q.optionsEn), JSON.stringify(q.optionsBn), q.correctIndex, q.marks, q.explanationEn, q.explanationBn, q.modelAnswer ?? null]
    );
  }

  private insertAttemptSync(a: ExamAttempt): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO exam_attempts (id, exam_id, student_name, score, total_marks, percentage, passed, time_spent_seconds, answers_json, written_self_score, submitted_at, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.examId, a.studentName, a.score, a.totalMarks, a.percentage, a.passed ? 1 : 0, a.timeSpentSeconds, a.answersJson, a.writtenSelfScore ?? null, a.submittedAt, a.isDemo ? 1 : 0]
    );
  }

  private upsertAssignmentSync(a: Assignment): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO assignments (id, course_id, chapter_id, title_en, title_bn, instructions_en, instructions_bn, due_date, max_marks, status, student_submission_text, submitted_at, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.courseId, a.chapterId, a.titleEn, a.titleBn, a.instructionsEn, a.instructionsBn, a.dueDate, a.maxMarks, a.status, a.studentSubmissionText ?? null, a.submittedAt ?? null, a.isDemo ? 1 : 0]
    );
  }

  private upsertAttendanceSync(r: AttendanceRecord): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO attendance (id, date, course_id, student_name, status, remarks, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.date, r.courseId, r.studentName, r.status, r.remarks ?? null, r.isDemo ? 1 : 0]
    );
  }

  private upsertAnnouncementSync(ann: Announcement): void {
    this.getDb().run(
      `INSERT OR REPLACE INTO announcements (id, title_en, title_bn, body_en, body_bn, target_category, priority, published_at, author, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ann.id, ann.titleEn, ann.titleBn, ann.bodyEn, ann.bodyBn, ann.targetCategory, ann.priority, ann.publishedAt, ann.author, ann.isDemo ? 1 : 0]
    );
  }

  async getSnapshot(): Promise<AppSnapshot> {
    await this.init();

    const courses = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM courses ORDER BY created_at DESC'
    ).map((r) => ({
      id: String(r.id),
      categoryId: String(r.category_id) as Course['categoryId'],
      boardName: String(r.board_name),
      classLevel: String(r.class_level),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      descriptionEn: String(r.description_en),
      descriptionBn: String(r.description_bn),
      instructor: String(r.instructor),
      accentHex: String(r.accent_hex),
      isDemo: Number(r.is_demo) === 1,
      createdAt: String(r.created_at),
    }));

    const subjects = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM subjects ORDER BY sort_order ASC'
    ).map((r) => ({
      id: String(r.id),
      courseId: String(r.course_id),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      code: String(r.code),
      sortOrder: Number(r.sort_order),
    }));

    const chapters = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM chapters ORDER BY chapter_number ASC'
    ).map((r) => ({
      id: String(r.id),
      subjectId: String(r.subject_id),
      chapterNumber: Number(r.chapter_number),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      summaryEn: String(r.summary_en),
      summaryBn: String(r.summary_bn),
      estimatedMinutes: Number(r.estimated_minutes),
    }));

    const materials = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM materials ORDER BY created_at ASC'
    ).map((r) => ({
      id: String(r.id),
      chapterId: String(r.chapter_id),
      type: String(r.type) as StudyMaterial['type'],
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      durationOrPages: String(r.duration_or_pages),
      blobKey: r.blob_key ? String(r.blob_key) : undefined,
      mimeType: r.mime_type ? String(r.mime_type) : undefined,
      fileName: r.file_name ? String(r.file_name) : undefined,
      fileSizeBytes: r.file_size_bytes ? Number(r.file_size_bytes) : undefined,
      noteSections: r.note_sections_json ? JSON.parse(String(r.note_sections_json)) : undefined,
      videoSlides: r.video_slides_json ? JSON.parse(String(r.video_slides_json)) : undefined,
      isDemo: Number(r.is_demo) === 1,
      createdAt: String(r.created_at),
    }));

    const exams = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM exams ORDER BY created_at DESC'
    ).map((r) => ({
      id: String(r.id),
      courseId: String(r.course_id),
      subjectId: String(r.subject_id),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      examType: String(r.exam_type) as Exam['examType'],
      durationMinutes: Number(r.duration_minutes),
      totalMarks: Number(r.total_marks),
      passingPercentage: Number(r.passing_percentage),
      isDemo: Number(r.is_demo) === 1,
      createdAt: String(r.created_at),
    }));

    const questions = this.queryAll<Record<string, unknown>>('SELECT * FROM questions').map((r) => ({
      id: String(r.id),
      examId: String(r.exam_id),
      questionTextEn: String(r.question_text_en),
      questionTextBn: String(r.question_text_bn),
      optionsEn: JSON.parse(String(r.options_en_json || '[]')),
      optionsBn: JSON.parse(String(r.options_bn_json || '[]')),
      correctIndex: Number(r.correct_index),
      marks: Number(r.marks),
      explanationEn: String(r.explanation_en),
      explanationBn: String(r.explanation_bn),
      modelAnswer: r.model_answer ? String(r.model_answer) : undefined,
    }));

    const examAttempts = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM exam_attempts ORDER BY submitted_at DESC'
    ).map((r) => ({
      id: String(r.id),
      examId: String(r.exam_id),
      studentName: String(r.student_name),
      score: Number(r.score),
      totalMarks: Number(r.total_marks),
      percentage: Number(r.percentage),
      passed: Number(r.passed) === 1,
      timeSpentSeconds: Number(r.time_spent_seconds),
      answersJson: String(r.answers_json),
      writtenSelfScore: r.written_self_score !== null ? Number(r.written_self_score) : undefined,
      submittedAt: String(r.submitted_at),
      isDemo: Number(r.is_demo) === 1,
    }));

    const assignments = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM assignments ORDER BY due_date ASC'
    ).map((r) => ({
      id: String(r.id),
      courseId: String(r.course_id),
      chapterId: String(r.chapter_id),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      instructionsEn: String(r.instructions_en),
      instructionsBn: String(r.instructions_bn),
      dueDate: String(r.due_date),
      maxMarks: Number(r.max_marks),
      status: String(r.status) as Assignment['status'],
      studentSubmissionText: r.student_submission_text ? String(r.student_submission_text) : undefined,
      submittedAt: r.submitted_at ? String(r.submitted_at) : undefined,
      isDemo: Number(r.is_demo) === 1,
    }));

    const attendance = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM attendance ORDER BY date DESC'
    ).map((r) => ({
      id: String(r.id),
      date: String(r.date),
      courseId: String(r.course_id),
      studentName: String(r.student_name),
      status: String(r.status) as AttendanceRecord['status'],
      remarks: r.remarks ? String(r.remarks) : undefined,
      isDemo: Number(r.is_demo) === 1,
    }));

    const announcements = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM announcements ORDER BY published_at DESC'
    ).map((r) => ({
      id: String(r.id),
      titleEn: String(r.title_en),
      titleBn: String(r.title_bn),
      bodyEn: String(r.body_en),
      bodyBn: String(r.body_bn),
      targetCategory: String(r.target_category) as Announcement['targetCategory'],
      priority: String(r.priority) as Announcement['priority'],
      publishedAt: String(r.published_at),
      author: String(r.author),
      isDemo: Number(r.is_demo) === 1,
    }));

    const bookmarks = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM bookmarks ORDER BY created_at DESC'
    ).map((r) => ({
      id: String(r.id),
      materialId: String(r.material_id),
      chapterId: String(r.chapter_id),
      courseId: String(r.course_id),
      noteTag: r.note_tag ? String(r.note_tag) : undefined,
      createdAt: String(r.created_at),
    }));

    const chapterProgress = this.queryAll<Record<string, unknown>>(
      'SELECT * FROM chapter_progress'
    ).map((r) => ({
      chapterId: String(r.chapter_id),
      courseId: String(r.course_id),
      completed: Number(r.completed) === 1,
      lastAccessedAt: String(r.last_accessed_at),
    }));

    const settingsRows = this.queryAll<{ key: string; value: string }>(
      'SELECT key, value FROM app_settings'
    );
    const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));

    return {
      courses,
      subjects,
      chapters,
      materials,
      exams,
      questions,
      examAttempts,
      assignments,
      attendance,
      announcements,
      bookmarks,
      chapterProgress,
      teacherPin: settingsMap.get('teacher_pin') ?? DEFAULT_TEACHER_PIN,
      studentDisplayName: settingsMap.get('student_name') ?? 'Device Student',
    };
  }

  // --- Mutations ---
  async saveCourse(c: Course): Promise<void> {
    await this.init();
    this.upsertCourseSync(c);
    await this.persist();
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.init();
    const db = this.getDb();
    const subjRows = this.queryAll<{ id: string }>('SELECT id FROM subjects WHERE course_id = ?', [courseId]);
    for (const s of subjRows) {
      await this.deleteSubject(s.id, false);
    }
    db.run('DELETE FROM exams WHERE course_id = ?', [courseId]);
    db.run('DELETE FROM assignments WHERE course_id = ?', [courseId]);
    db.run('DELETE FROM attendance WHERE course_id = ?', [courseId]);
    db.run('DELETE FROM bookmarks WHERE course_id = ?', [courseId]);
    db.run('DELETE FROM chapter_progress WHERE course_id = ?', [courseId]);
    db.run('DELETE FROM courses WHERE id = ?', [courseId]);
    await this.persist();
  }

  async saveSubject(s: Subject): Promise<void> {
    await this.init();
    this.upsertSubjectSync(s);
    await this.persist();
  }

  async deleteSubject(subjectId: string, shouldPersist = true): Promise<void> {
    await this.init();
    const db = this.getDb();
    const chRows = this.queryAll<{ id: string }>('SELECT id FROM chapters WHERE subject_id = ?', [subjectId]);
    for (const ch of chRows) {
      db.run('DELETE FROM materials WHERE chapter_id = ?', [ch.id]);
      db.run('DELETE FROM bookmarks WHERE chapter_id = ?', [ch.id]);
      db.run('DELETE FROM chapter_progress WHERE chapter_id = ?', [ch.id]);
    }
    db.run('DELETE FROM chapters WHERE subject_id = ?', [subjectId]);
    db.run('DELETE FROM subjects WHERE id = ?', [subjectId]);
    if (shouldPersist) await this.persist();
  }

  async saveChapter(ch: Chapter): Promise<void> {
    await this.init();
    this.upsertChapterSync(ch);
    await this.persist();
  }

  async deleteChapter(chapterId: string): Promise<void> {
    await this.init();
    const db = this.getDb();
    db.run('DELETE FROM materials WHERE chapter_id = ?', [chapterId]);
    db.run('DELETE FROM bookmarks WHERE chapter_id = ?', [chapterId]);
    db.run('DELETE FROM chapter_progress WHERE chapter_id = ?', [chapterId]);
    db.run('DELETE FROM chapters WHERE id = ?', [chapterId]);
    await this.persist();
  }

  async saveMaterial(m: StudyMaterial): Promise<void> {
    await this.init();
    this.upsertMaterialSync(m);
    await this.persist();
  }

  async deleteMaterial(materialId: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM bookmarks WHERE material_id = ?', [materialId]);
    this.getDb().run('DELETE FROM materials WHERE id = ?', [materialId]);
    await this.persist();
  }

  async saveExam(e: Exam): Promise<void> {
    await this.init();
    this.upsertExamSync(e);
    await this.persist();
  }

  async deleteExam(examId: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM questions WHERE exam_id = ?', [examId]);
    this.getDb().run('DELETE FROM exam_attempts WHERE exam_id = ?', [examId]);
    this.getDb().run('DELETE FROM exams WHERE id = ?', [examId]);
    await this.persist();
  }

  async saveQuestion(q: ExamQuestion): Promise<void> {
    await this.init();
    this.upsertQuestionSync(q);
    await this.persist();
  }

  async deleteQuestion(questionId: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM questions WHERE id = ?', [questionId]);
    await this.persist();
  }

  async saveExamAttempt(a: ExamAttempt): Promise<void> {
    await this.init();
    this.insertAttemptSync(a);
    await this.persist();
  }

  async saveAssignment(a: Assignment): Promise<void> {
    await this.init();
    this.upsertAssignmentSync(a);
    await this.persist();
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM assignments WHERE id = ?', [assignmentId]);
    await this.persist();
  }

  async saveAttendance(r: AttendanceRecord): Promise<void> {
    await this.init();
    this.upsertAttendanceSync(r);
    await this.persist();
  }

  async deleteAttendance(id: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM attendance WHERE id = ?', [id]);
    await this.persist();
  }

  async saveAnnouncement(ann: Announcement): Promise<void> {
    await this.init();
    this.upsertAnnouncementSync(ann);
    await this.persist();
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.init();
    this.getDb().run('DELETE FROM announcements WHERE id = ?', [id]);
    await this.persist();
  }

  async toggleBookmark(b: Bookmark): Promise<boolean> {
    await this.init();
    const existing = this.queryAll<{ id: string }>(
      'SELECT id FROM bookmarks WHERE material_id = ?',
      [b.materialId]
    );
    if (existing.length > 0) {
      this.getDb().run('DELETE FROM bookmarks WHERE material_id = ?', [b.materialId]);
      await this.persist();
      return false;
    } else {
      this.getDb().run(
        `INSERT INTO bookmarks (id, material_id, chapter_id, course_id, note_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [b.id, b.materialId, b.chapterId, b.courseId, b.noteTag ?? null, b.createdAt]
      );
      await this.persist();
      return true;
    }
  }

  async toggleChapterProgress(chapterId: string, courseId: string, completed: boolean): Promise<void> {
    await this.init();
    this.getDb().run(
      `INSERT OR REPLACE INTO chapter_progress (chapter_id, course_id, completed, last_accessed_at) VALUES (?, ?, ?, ?)`,
      [chapterId, courseId, completed ? 1 : 0, new Date().toISOString()]
    );
    await this.persist();
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.init();
    this.getDb().run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
    await this.persist();
  }

  async clearDemoData(): Promise<void> {
    await this.init();
    const db = this.getDb();
    db.run('DELETE FROM courses WHERE is_demo = 1');
    db.run('DELETE FROM materials WHERE is_demo = 1');
    db.run('DELETE FROM exams WHERE is_demo = 1');
    db.run('DELETE FROM exam_attempts WHERE is_demo = 1');
    db.run('DELETE FROM assignments WHERE is_demo = 1');
    db.run('DELETE FROM attendance WHERE is_demo = 1');
    db.run('DELETE FROM announcements WHERE is_demo = 1');
    db.run('DELETE FROM subjects WHERE course_id NOT IN (SELECT id FROM courses)');
    db.run('DELETE FROM chapters WHERE subject_id NOT IN (SELECT id FROM subjects)');
    db.run('DELETE FROM questions WHERE exam_id NOT IN (SELECT id FROM exams)');
    db.run('DELETE FROM bookmarks WHERE material_id NOT IN (SELECT id FROM materials)');
    db.run('DELETE FROM chapter_progress WHERE chapter_id NOT IN (SELECT id FROM chapters)');
    await this.persist();
  }

  async restoreDemoData(): Promise<void> {
    await this.init();
    this.seedDemonstrationData();
    await this.persist();
  }

  async exportPackage(scope: 'full-backup' | 'course-content'): Promise<ExportPackagePayload> {
    const snap = await this.getSnapshot();
    const base: ExportPackagePayload = {
      format: 'pragatir-pathshala-package',
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Master Sourav Bhattacharjee',
      scope,
      courses: snap.courses,
      subjects: snap.subjects,
      chapters: snap.chapters,
      materials: snap.materials,
      exams: snap.exams,
      questions: snap.questions,
      assignments: snap.assignments,
      announcements: snap.announcements,
    };
    if (scope === 'full-backup') {
      base.attendance = snap.attendance;
      base.examAttempts = snap.examAttempts;
      base.bookmarks = snap.bookmarks;
      base.chapterProgress = snap.chapterProgress;
    }
    return base;
  }

  async importPackage(pkg: ExportPackagePayload, mode: 'merge' | 'replace'): Promise<void> {
    await this.init();
    const db = this.getDb();
    if (mode === 'replace') {
      db.run('DELETE FROM courses');
      db.run('DELETE FROM subjects');
      db.run('DELETE FROM chapters');
      db.run('DELETE FROM materials');
      db.run('DELETE FROM exams');
      db.run('DELETE FROM questions');
      db.run('DELETE FROM assignments');
      db.run('DELETE FROM announcements');
      if (pkg.scope === 'full-backup') {
        db.run('DELETE FROM attendance');
        db.run('DELETE FROM exam_attempts');
        db.run('DELETE FROM bookmarks');
        db.run('DELETE FROM chapter_progress');
      }
    }

    for (const c of pkg.courses) this.upsertCourseSync(c);
    for (const s of pkg.subjects) this.upsertSubjectSync(s);
    for (const ch of pkg.chapters) this.upsertChapterSync(ch);
    for (const m of pkg.materials) this.upsertMaterialSync(m);
    for (const e of pkg.exams) this.upsertExamSync(e);
    for (const q of pkg.questions) this.upsertQuestionSync(q);
    for (const a of pkg.assignments) this.upsertAssignmentSync(a);
    for (const ann of pkg.announcements) this.upsertAnnouncementSync(ann);

    if (pkg.attendance) {
      for (const att of pkg.attendance) this.upsertAttendanceSync(att);
    }
    if (pkg.examAttempts) {
      for (const at of pkg.examAttempts) this.insertAttemptSync(at);
    }
    if (pkg.bookmarks) {
      for (const bm of pkg.bookmarks) {
        db.run(
          'INSERT OR REPLACE INTO bookmarks (id, material_id, chapter_id, course_id, note_tag, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [bm.id, bm.materialId, bm.chapterId, bm.courseId, bm.noteTag ?? null, bm.createdAt]
        );
      }
    }
    if (pkg.chapterProgress) {
      for (const cp of pkg.chapterProgress) {
        db.run(
          'INSERT OR REPLACE INTO chapter_progress (chapter_id, course_id, completed, last_accessed_at) VALUES (?, ?, ?, ?)',
          [cp.chapterId, cp.courseId, cp.completed ? 1 : 0, cp.lastAccessedAt]
        );
      }
    }

    await this.persist();
  }
}

export const sqliteStore = new SqliteEduDatabase();
