import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  Pause,
  Play,
  RotateCcw,
  Video,
  X,
} from 'lucide-react';
import { Language, StudyMaterial, VideoSlide } from '../types/education';
import { pickText } from '../utils/i18n';
import { formatDurationSeconds } from '../utils/examEngine';
import { getMediaBlob } from '../db/blobStore';

interface OfflineVideoModalProps {
  material: StudyMaterial;
  courseTitle: string;
  lang: Language;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
}

export const OfflineVideoModal: React.FC<OfflineVideoModalProps> = ({
  material,
  courseTitle,
  lang,
  isBookmarked,
  onToggleBookmark,
  onClose,
}) => {
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSec, setCurrentSec] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const slides: VideoSlide[] = material.videoSlides ?? [
    {
      timestampSec: 0,
      heading: pickText(material.titleEn, material.titleBn, lang),
      bullets: [
        'Offline study lesson by Master Sourav Bhattacharjee.',
        'All diagrams and notes stay stored locally on your device.',
      ],
      diagramKind: 'prism',
    },
  ];

  const totalDurationSec = Math.max(
    180,
    (slides[slides.length - 1]?.timestampSec ?? 0) + 90
  );

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const loadVideo = async () => {
      if (!material.blobKey) return;
      const rec = await getMediaBlob(material.blobKey);
      if (rec && active) {
        url = URL.createObjectURL(rec.blob);
        setVideoBlobUrl(url);
      }
    };
    void loadVideo();

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [material.blobKey]);

  // Synchronize playbackRate on native HTML5 <video>
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, videoBlobUrl]);

  // Timer loop for structured offline blackboard video lessons
  useEffect(() => {
    if (videoBlobUrl || !isPlaying) return;
    const interval = window.setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + playbackRate;
        if (next >= totalDurationSec) {
          setIsPlaying(false);
          return totalDurationSec;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [videoBlobUrl, isPlaying, playbackRate, totalDurationSec]);

  // Determine active slide
  let activeSlideIndex = 0;
  for (let i = 0; i < slides.length; i++) {
    if (currentSec >= slides[i].timestampSec) activeSlideIndex = i;
  }
  const activeSlide = slides[activeSlideIndex];

  // Draw crisp synchronized educational diagram on blackboard canvas
  useEffect(() => {
    if (videoBlobUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep slate blackboard gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#091830');
    grad.addColorStop(1, '#10284B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Visual diagram on right side of blackboard
    const kind = activeSlide?.diagramKind ?? 'prism';
    const pulse = (currentSec % 12) / 12;

    ctx.save();
    if (kind === 'prism') {
      // Prism triangle
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w - 170, 80);
      ctx.lineTo(w - 250, 230);
      ctx.lineTo(w - 90, 230);
      ctx.closePath();
      ctx.stroke();
      // Incident ray
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w - 330, 175);
      ctx.lineTo(w - 210, 155);
      ctx.stroke();
      // Dispersed rays
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
      colors.forEach((c, idx) => {
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(w - 130, 162);
        ctx.lineTo(w - 30, 145 + idx * 14);
        ctx.stroke();
      });
    } else if (kind === 'quadratic') {
      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w - 300, 180);
      ctx.lineTo(w - 50, 180);
      ctx.moveTo(w - 175, 60);
      ctx.lineTo(w - 175, 250);
      ctx.stroke();
      // Parabola
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = -90; x <= 90; x += 4) {
        const px = w - 175 + x;
        const py = 215 - (x * x) / 65;
        if (x === -90) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      // Circuit loop
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w - 270, 90, 180, 120);
      ctx.fillStyle = '#FBBF24';
      const dotX = w - 270 + pulse * 180;
      ctx.beginPath();
      ctx.arc(dotX, 90, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, [videoBlobUrl, activeSlide, currentSec]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={pickText(material.titleEn, material.titleBn, lang)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-6"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0B1528] text-white border border-slate-800 shadow-2xl overflow-hidden">
        {/* Video Header */}
        <div className="px-4 py-3 bg-[#081120] border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Video className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate">
                {pickText(material.titleEn, material.titleBn, lang)}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {courseTitle} · {material.durationOrPages}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleBookmark}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                isBookmarked ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isBookmarked ? (lang === 'bn' ? 'সংরক্ষিত' : 'Saved') : (lang === 'bn' ? 'সংরক্ষণ' : 'Save')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Video Player"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {videoBlobUrl ? (
            <div className="space-y-3">
              <video
                ref={videoRef}
                src={videoBlobUrl}
                controls
                playsInline
                className="w-full max-h-[55vh] rounded-xl bg-black border border-slate-800"
              />
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{lang === 'bn' ? 'লোকাল স্টোরেজ থেকে অফলাইন প্লেব্যাক' : 'Playing offline from local device storage'}</span>
                <div className="flex items-center gap-1.5">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-2 py-1 rounded font-mono-tabular cursor-pointer ${
                        playbackRate === rate ? 'bg-[#1D4ED8] text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-[#091830]">
                <canvas
                  ref={canvasRef}
                  width={840}
                  height={320}
                  className="w-full h-56 sm:h-72 object-cover block"
                />
                {/* Synchronized Blackboard Text Overlay */}
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between pointer-events-none max-w-[65%]">
                  <div>
                    <div className="text-[11px] font-mono-tabular text-amber-400 mb-1">
                      Master Sourav Bhattacharjee · Slide {activeSlideIndex + 1}/{slides.length}
                    </div>
                    <h4 className="font-display text-base sm:text-xl font-bold text-white leading-snug mb-3">
                      {activeSlide?.heading}
                    </h4>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                      {activeSlide?.bullets.map((b, i) => (
                        <li key={i} className="leading-snug">
                          • {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activeSlide?.formula && (
                    <div className="inline-block bg-slate-950/75 border border-amber-400/40 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-mono-tabular text-amber-300 w-fit">
                      {activeSlide.formula}
                    </div>
                  )}
                </div>
              </div>

              {/* Scrubber & Playback Controls */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
                <input
                  type="range"
                  aria-label="Lesson timeline"
                  min={0}
                  max={totalDurationSec}
                  value={Math.min(currentSec, totalDurationSec)}
                  onChange={(e) => setCurrentSec(Number(e.target.value))}
                  className="w-full accent-[#3B82F6] cursor-pointer"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? (lang === 'bn' ? 'বিরতি' : 'Pause') : (lang === 'bn' ? 'চালান' : 'Play')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSec(0);
                        setIsPlaying(true);
                      }}
                      aria-label="Restart lesson"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="font-mono-tabular text-xs text-slate-300 ml-1">
                      {formatDurationSeconds(currentSec)} / {formatDurationSeconds(totalDurationSec)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular cursor-pointer ${
                          playbackRate === rate
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide Jump Chapters */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  {slides.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSec(s.timestampSec)}
                      className={`px-3 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                        idx === activeSlideIndex
                          ? 'bg-blue-600/30 border border-blue-500 text-blue-200'
                          : 'bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono-tabular text-amber-400 mr-1.5">
                        {formatDurationSeconds(s.timestampSec)}
                      </span>
                      {s.heading}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
