import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { supabase, isPremiumActive } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_LESSONS = [
  { id: 1, number: 1, title: "Kirish", description: "Yo'l harakati xavfsizligi asoslari bo'yicha kirish darsi.", video_url: "", is_free: true, watched_percent: 0 },
  { id: 2, number: 2, title: "2.1. Haydovchilarning umumiy majburiyatlari", description: "", video_url: "", is_free: true, watched_percent: 0 },
  ...Array.from({ length: 18 }, (_, i) => ({
    id: i + 3, number: i + 3,
    title: `${i + 3} - dars`, description: "",
    video_url: "", is_free: false, watched_percent: 0
  }))
];

const Kurslar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("kurs_lessons").select("*").order("number");
        if (data && data.length > 0) setLessons(data);
        else setLessons(DEFAULT_LESSONS);
        if (user) {
          const prem = await isPremiumActive(user.id);
          setIsPremium(prem);
        }
      } catch { setLessons(DEFAULT_LESSONS); }
      setLoading(false);
    };
    load();
  }, [user]);

  const canOpen = (lesson: any) => lesson.is_free || isPremium;

  // Dars ichida
  if (activeLesson) {
    const idx = lessons.findIndex(l => l.id === activeLesson.id);
    const prev = idx > 0 ? lessons[idx - 1] : null;
    const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;
    const progress = Math.round(((idx) / lessons.length) * 100);

    const getEmbedUrl = (url: string) => {
      if (!url) return "";
      const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
      if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
      return url;
    };

    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => setActiveLesson(null)}
            className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tomosha qilindi</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-auto">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1">
              <div className="bg-sky-500 h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1">
          {/* Video */}
          {getEmbedUrl(activeLesson.video_url) ? (
            <div className="relative bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe className="absolute inset-0 w-full h-full"
                src={getEmbedUrl(activeLesson.video_url)}
                title={activeLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          ) : (
            <div className="bg-black flex items-center justify-center" style={{ height: "220px" }}>
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white/60" />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-sky-500 text-white text-xs font-black px-2 py-0.5 rounded-lg">Dars {activeLesson.number}</span>
            </div>
            <h2 className="font-black text-slate-800 dark:text-white text-lg mb-2">{activeLesson.title}</h2>
            {activeLesson.description ? (
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{activeLesson.description}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">Matn admin tomonidan qo'shiladi</p>
            )}
          </div>
        </div>

        {/* Prev / Next */}
        <div className="px-4 py-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={() => prev && setActiveLesson(prev)} disabled={!prev}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-5 h-5" /> Oldingi dars
          </button>
          <button onClick={() => next && setActiveLesson(next)} disabled={!next}
            className="flex-1 py-3.5 bg-gradient-to-r from-sky-400 to-cyan-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 transition-all shadow-lg">
            Keyingi dars <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-slate-400 text-xs pb-4">@pddstartuz_bot</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <button onClick={() => navigate("/user")}
          className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-xl font-black text-slate-800 dark:text-white">Kurslar</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>
        ) : (
          lessons.map(lesson => {
            const locked = !canOpen(lesson);
            const pct = lesson.watched_percent || 0;
            return (
              <button key={lesson.id} onClick={() => { if (!locked) setActiveLesson(lesson); }}
                className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-4 text-left border shadow-sm transition-all ${locked ? "border-slate-100 dark:border-slate-800 opacity-90" : "border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-600 active:scale-[0.99]"}`}>
                {locked ? (
                  <div className="flex items-center justify-center py-1">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl px-4 py-2.5 w-full justify-center">
                      <Lock className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <span className="text-white text-xs font-bold">Bloklangan. Blokdan chiqarish uchun Premiumga yangilang</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 dark:text-white text-sm">{lesson.number}. {lesson.title}</span>
                      <span className="text-xs font-bold text-slate-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                      <div className="bg-sky-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Kurslar;
