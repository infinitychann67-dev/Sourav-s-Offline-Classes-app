import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Download,
  FileText,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Language, StudyMaterial } from '../types/education';
import { pickText } from '../utils/i18n';
import { buildPdfBytes } from '../utils/pdfGenerator';
import { getMediaBlob } from '../db/blobStore';

interface OfflinePdfModalProps {
  material: StudyMaterial;
  courseTitle: string;
  lang: Language;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
}

export const OfflinePdfModal: React.FC<OfflinePdfModalProps> = ({
  material,
  courseTitle,
  lang,
  isBookmarked,
  onToggleBookmark,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pageIndex, setPageIndex] = useState(0);

  const sections = material.noteSections ?? [];

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const loadBlob = async () => {
      if (material.blobKey) {
        const stored = await getMediaBlob(material.blobKey);
        if (stored && active) {
          createdUrl = URL.createObjectURL(stored.blob);
          setBlobUrl(createdUrl);
          return;
        }
      }
      // Build real downloadable PDF bytes from noteSections
      if (sections.length > 0 && active) {
        const bytes = buildPdfBytes({
          title: material.titleEn,
          subtitle: courseTitle,
          instructor: 'Master Sourav Bhattacharjee',
          sections,
        });
        const arrayBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        const pdfBlob = new Blob([arrayBuf], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(pdfBlob);
        setBlobUrl(createdUrl);
      }
    };

    void loadBlob();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [material, courseTitle]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = material.fileName || `${material.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasUploadedPdf = Boolean(material.blobKey && blobUrl);
  const totalPages = Math.max(1, sections.length);
  const currentSection = sections[pageIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={pickText(material.titleEn, material.titleBn, lang)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-6"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#0D1A2F] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Reader Toolbar */}
        <div className="px-4 py-3 bg-[#0B1F3A] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate">
                {pickText(material.titleEn, material.titleBn, lang)}
              </h3>
              <p className="text-xs text-slate-300 truncate">
                {courseTitle} · {material.durationOrPages}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!hasUploadedPdf && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-900/60 rounded-lg px-2 py-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(85, z - 10))}
                  aria-label="Zoom out"
                  className="p-1 hover:text-amber-300 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono-tabular px-1">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(145, z + 10))}
                  aria-label="Zoom in"
                  className="p-1 hover:text-amber-300 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark note'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isBookmarked ? (lang === 'bn' ? 'সংরক্ষিত' : 'Saved') : (lang === 'bn' ? 'সংরক্ষণ' : 'Save')}</span>
            </button>

            {blobUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF Reader"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-[#071020] p-4 sm:p-8">
          {hasUploadedPdf && blobUrl ? (
            <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white">
              <iframe
                src={blobUrl}
                title={material.titleEn}
                className="w-full h-full"
              />
            </div>
          ) : currentSection ? (
            <div
              className="mx-auto max-w-2xl bg-white dark:bg-[#0F1D32] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-10 transition-transform origin-top"
              style={{ fontSize: `${zoom}%` }}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-6 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#0B1F3A] dark:text-amber-400">
                  {lang === 'bn' ? 'প্রগতির পাঠশালা · অফলাইন নোট' : 'Pragatir Pathshala · Offline Study Sheet'}
                </span>
                <span className="font-mono-tabular">
                  {lang === 'bn' ? `পৃষ্ঠা ${pageIndex + 1} / ${totalPages}` : `Page ${pageIndex + 1} of ${totalPages}`}
                </span>
              </div>

              <h4 className="font-display text-xl font-bold text-[#0B1F3A] dark:text-white mb-4">
                {currentSection.heading}
              </h4>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-[1em] mb-6">
                {currentSection.body}
              </p>

              {currentSection.formula && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 p-4 mb-6">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'মূল সূত্র / নিয়ম' : 'Key Formula / Rule'}
                  </div>
                  <div className="font-mono-tabular text-base sm:text-lg font-semibold text-[#1D4ED8] dark:text-amber-300">
                    {currentSection.formula}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Master Sourav Bhattacharjee</span>
                <span>{material.isDemo ? 'Demo Material' : 'Official Material'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'কোনো নোট পাওয়া যায়নি।' : 'No PDF pages found for this material.'}
            </div>
          )}
        </div>

        {/* Footer Page Navigation for Structured Notes */}
        {!hasUploadedPdf && totalPages > 1 && (
          <div className="px-4 py-3 bg-white dark:bg-[#0B1528] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পূর্ববর্তী পৃষ্ঠা' : 'Previous'}</span>
            </button>
            <div className="flex items-center gap-1.5">
              {sections.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPageIndex(idx)}
                  aria-label={`Go to page ${idx + 1}`}
                  className={`w-7 h-7 rounded-md text-xs font-mono-tabular font-semibold cursor-pointer ${
                    idx === pageIndex
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'পরবর্তী পৃষ্ঠা' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
