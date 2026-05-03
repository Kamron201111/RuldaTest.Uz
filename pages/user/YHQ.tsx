import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, ArrowLeft, ChevronDown, Lock, FileText, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase, isPremiumActive } from "../../services/supabase";

const DEFAULT_CHAPTERS = Array.from({ length: 29 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  title: `Bob ${i + 1}`,
  description: "",
  pdf_url: "",
  is_free: i < 2,
}));

const YHQ: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapters, setChapters] = useState(DEFAULT_CHAPTERS as any[]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from("yhq_chapters").select("*").order("number");
        if (data && data.length > 0) setChapters(data);
        if (user) {
          const prem = await isPremiumActive(user.id);
          setIsPremium(prem);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = chapters.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const canOpen = (ch: any) => ch.is_free || isPremium;

  // PDF ko'rish sahifasi
  if (viewingPdf) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
        <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button onClick={() => setViewingPdf(null)}
            className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">YHQ — Bob {viewingPdf.number}</p>
            <h2 className="font-black text-slate-800 dark:text-white text-sm truncate">{viewingPdf.title}</h2>
          </div>
        </div>

        <div className="flex-1 p-4">
          {viewingPdf.pdf_url ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg h-full" style={{ minHeight: "70vh" }}>
              <iframe
                src={`${viewingPdf.pdf_url}#toolbar=0`}
                className="w-full h-full"
                style={{ minHeight: "70vh" }}
                title={viewingPdf.title}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400">Hozircha fayl yuklanmagan</p>
              <p className="text-slate-400 text-sm mt-1">Admin tez orada qo'shadi</p>
            </div>
          )}
          {viewingPdf.description ? (
            <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-700 rounded-xl p-4">
              <p className="text-sky-800 dark:text-sky-200 text-sm">{viewingPdf.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/user")}
            className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">Yo'l harakati qoidalari</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish"
            className="w-full pl-9 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>
        ) : (
          <>
            {filtered.map((ch) => {
              const locked = !canOpen(ch);
              return (
                <div key={ch.id} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                  <button
                    onClick={() => { if (!locked) setViewingPdf(ch); }}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${locked ? "bg-slate-100 dark:bg-slate-800 text-slate-400" : "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400"}`}>
                        {ch.number}
                      </div>
                      <div>
                        <p className={`font-bold text-sm leading-tight ${locked ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-white"}`}>
                          {ch.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {locked ? "Premium kerak" : ch.is_free ? "Bepul" : "Premium"}
                          {ch.pdf_url && !locked ? " • PDF" : ""}
                        </p>
                      </div>
                    </div>
                    {locked ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-1.5 rounded-xl flex-shrink-0">
                        <Lock className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-bold">Premium</span>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                </div>
              );
            })}

            {!isPremium && (
              <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-4 text-white mt-2">
                <p className="font-black text-sm mb-1">⭐ Barcha boblarni ko'rish uchun</p>
                <p className="text-sky-200 text-xs mb-3">Premium obuna orqali barcha 29 ta bobni o'qing</p>
                <button onClick={() => navigate("/sozlamalar")}
                  className="bg-white text-sky-700 font-bold text-sm px-4 py-2 rounded-xl">
                  Premium olish →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default YHQ;
