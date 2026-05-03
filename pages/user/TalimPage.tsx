import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, BookOpen, AlertTriangle, Heart, Wrench, Car, DollarSign, Shield, Ticket } from "lucide-react";
import { getQuestions } from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
  { id: "umumiy",        nameUz: "Umumiy",                icon: BookOpen,      color: "from-sky-400 to-blue-600",    emoji: "📚" },
  { id: "belgilar",      nameUz: "Yo'l Belgilari",        icon: AlertTriangle, color: "from-red-500 to-rose-600",     emoji: "🚦" },
  { id: "qoidalar",      nameUz: "Harakatlanish Qoidalari", icon: Shield,      color: "from-cyan-400 to-violet-600", emoji: "📖" },
  { id: "xavfsizlik",    nameUz: "Xavfsizlik",            icon: Car,           color: "from-green-500 to-emerald-600", emoji: "🛡️" },
  { id: "texnik",        nameUz: "Texnik Bilim",          icon: Wrench,        color: "from-slate-500 to-slate-600",   emoji: "🔧" },
  { id: "birinchi-yordam", nameUz: "Birinchi Yordam",     icon: Heart,         color: "from-pink-500 to-rose-500",     emoji: "❤️" },
  { id: "jarimalar",     nameUz: "Jarimalar",             icon: DollarSign,    color: "from-orange-500 to-amber-500",  emoji: "⚠️" },
];

const TalimPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalQ, setTotalQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getQuestions();
        setTotalQ(all.length);
        const c: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
          if (cat.id === "umumiy") {
            c[cat.id] = all.filter(q => !q.category || q.category === "umumiy").length;
          } else {
            c[cat.id] = all.filter(q => q.category === cat.id).length;
          }
        });
        setCounts(c);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startTest = () => navigate(`/quiz?count=${questionCount}`);
  const startByCategory = (catId: string) => {
    if ((counts[catId] || 0) === 0) return;
    navigate(`/quiz?topic=${catId}&count=20`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-sky-500 via-cyan-500 to-purple-700 px-4 pt-8 pb-6">
        <h1 className="text-2xl font-black text-white mb-1">🚗 Ta'lim</h1>
        <p className="text-sky-200 text-sm">Test topshirish va kategoriyalar</p>

        {/* Ikki ramka yonma-yon */}
        <div className="mt-4 grid grid-cols-2 gap-3">

          {/* 1 — Testni boshlash */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col">
            <p className="text-white font-bold text-sm mb-3">📝 Testni boshlash</p>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[10, 20, 30, 40].map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`py-1.5 rounded-xl font-bold text-sm transition-all ${questionCount === n ? "bg-white text-sky-700 shadow" : "bg-white/20 text-white"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={startTest}
              disabled={totalQ === 0}
              className="mt-auto w-full py-3 bg-white text-sky-700 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg hover:bg-sky-50 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              Boshlash
            </button>
          </div>

          {/* 2 — Biletlar */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col">
            <p className="text-white font-bold text-sm mb-3">🎫 Biletlar</p>
            <p className="text-white/70 text-xs mb-3 flex-1">
              GAI imtihon biletlari — har birida 10 ta savol
            </p>
            <button
              onClick={() => navigate("/biletlar")}
              className="mt-auto w-full py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg hover:opacity-90 transition-all"
            >
              🎫 Kirish
            </button>
          </div>

        </div>
      </div>

      {/* Kategoriyalar */}
      <div className="px-4 py-5">
        <h2 className="font-black text-slate-800 dark:text-white text-base mb-3">
          Kategoriyalar bo'yicha
        </h2>

        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.id] || 0;
            const Icon = cat.icon;
            const hasQ = count > 0;

            return (
              <button
                key={cat.id}
                onClick={() => startByCategory(cat.id)}
                disabled={!hasQ}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  hasQ
                    ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-sky-200 hover:shadow-md active:scale-[0.99] cursor-pointer"
                    : "bg-slate-100 dark:bg-slate-800/50 border-transparent opacity-60 cursor-not-allowed"
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                  {cat.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className={`font-bold text-sm ${hasQ ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                    {cat.nameUz}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {hasQ ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{count} ta savol bor</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>
                        <span className="text-xs text-slate-400">Savol yo'q</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow or count badge */}
                {hasQ ? (
                  <div className="flex items-center gap-1.5">
                    <div className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${cat.color} bg-opacity-10`}>
                      <span className="text-xs font-black text-white">{count}</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-400 text-xs">—</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {totalQ > 0 && (
          <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-xl p-3">
            <p className="text-xs text-sky-700 dark:text-sky-300 text-center">
              💡 Jami <strong>{totalQ}</strong> ta savol mavjud. Kategoriya tanlang yoki umumiy test boshlang!
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TalimPage;
