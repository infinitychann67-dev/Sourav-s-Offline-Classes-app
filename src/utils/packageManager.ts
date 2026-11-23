import { ExportPackagePayload } from '../types/education';

export interface PackageValidationResult {
  valid: boolean;
  error?: string;
  payload?: ExportPackagePayload;
  counts?: {
    courses: number;
    subjects: number;
    chapters: number;
    materials: number;
    exams: number;
    questions: number;
    assignments: number;
    announcements: number;
  };
}

export function serializeExportPackage(payload: ExportPackagePayload): string {
  return JSON.stringify(payload, null, 2);
}

export function validateAndParsePackage(rawJson: string): PackageValidationResult {
  try {
    const parsed = JSON.parse(rawJson) as Partial<ExportPackagePayload>;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON file format.' };
    }
    if (parsed.format !== 'pragatir-pathshala-package') {
      return {
        valid: false,
        error: 'Unrecognized file format. Expected a Pragatir Pathshala (.pragatir.json) package.',
      };
    }
    if (parsed.version !== 1) {
      return { valid: false, error: `Unsupported package version: ${String(parsed.version)}` };
    }
    if (!Array.isArray(parsed.courses) || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.chapters)) {
      return { valid: false, error: 'Package is missing required course, subject, or chapter arrays.' };
    }

    const normalized: ExportPackagePayload = {
      format: 'pragatir-pathshala-package',
      version: 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      exportedBy: parsed.exportedBy || 'Master Sourav Bhattacharjee',
      scope: parsed.scope === 'full-backup' ? 'full-backup' : 'course-content',
      courses: parsed.courses,
      subjects: parsed.subjects,
      chapters: parsed.chapters,
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : undefined,
      examAttempts: Array.isArray(parsed.examAttempts) ? parsed.examAttempts : undefined,
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : undefined,
      chapterProgress: Array.isArray(parsed.chapterProgress) ? parsed.chapterProgress : undefined,
    };

    return {
      valid: true,
      payload: normalized,
      counts: {
        courses: normalized.courses.length,
        subjects: normalized.subjects.length,
        chapters: normalized.chapters.length,
        materials: normalized.materials.length,
        exams: normalized.exams.length,
        questions: normalized.questions.length,
        assignments: normalized.assignments.length,
        announcements: normalized.announcements.length,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Unable to parse package JSON.',
    };
  }
}
