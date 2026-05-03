import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TestResult, Question } from "../../types";
import { CheckCircle, XCircle, RotateCcw, Home, AlertTriangle, Lock, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/AuthContext";
import { isPremiumActive } from "../../services/supabase";

const CATEGORY_LABEL: Record<string, string> = {
  qoidalar: "Yo'l harakati qoidalari",
  belgilar: "Yo'l belgilari",
  jarimalar: "Jarimalar",
  xavfsizlik: "Xavfsizlik qoidalari",
  texnik: "Texnik bilim",
  "birinchi-yordam": "Birinchi tibbiy yordam",
  umumiy: "Umumiy qoidalar",
};

const DEFAULT_EXPLANATION: Record<string, string> = {
  qoidalar: "Yo'l harakati qoidalari bo'yicha: To'g'ri javob",
  belgilar: "Yo'l belgilari bo'yicha: To'g'ri javob",
  jarimalar: "Jarima miqdorlari bo'yicha: To'g'ri javob",
  xavfsizlik: "Xavfsizlik qoidalari bo'yicha: To'g'ri javob",
  texnik: "Transport vositasi texnik holati bo'yicha: To'g'ri javob",
  "birinchi-yordam": "Birinchi tibbiy yordam bo'yicha: To'g'ri javob",
  umumiy: "Umumiy qoidalar bo'yicha: To'g'ri javob",
};

const LEGAL_NOTE: Record<string, string> = {
  jarimalar: "O'zbekiston Respublikasi YHQ ga muvofiq.",
  belgilar: "Bu belgi yo'l harakati ishtirokchilarini xabardor qilish uchun o'rnatiladi.",
  qoidalar: "YHQ ning tegishli moddasi asosida amal qiladi.",
  xavfsizlik: "Xavfsizlik talablariga rioya qilish majburiydir.",
  texnik: "Transport vositasining texnik holati YHQ talablariga mos bo'lishi shart.",
  "birinchi-yordam": "Birinchi tibbiy yordam ko'rsatish qonuniy majburiyat hisoblanadi.",
  umumiy: "Ushbu qoida yo'l harakati xavfsizligini ta'minlash uchun zarur.",
};

const Result: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useUI();
  const { user } = useAuth();

  const result = location.state?.result as TestResult;
  const passedQuestions = location.state?.questions as Question[] | undefined;
  const [openErrorIdx, setOpenErrorIdx] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      isPremiumActive(user.id).then(setIsPremium);
    }
  }, [user]);

  if (!result) return <div className="p-10 text-center dark:text-white">Natija topilmadi.</div>;

  const passed = result.scorePercentage >= 85;
  const wrongDetails = result.details.filter(d => !d.isCorrect);

  const getQuestion = (questionId: string): Question | undefined => {
    if (passedQuestions) return passedQuestions.find(q => q.id === questionId);
    return undefined;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-8">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">

        {/* Natija header */}
        <div className="text-center space-y-4">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-xl ${passed ? "bg-green-100 dark:bg-green-900/40 text-green-600" : "bg-red-100 dark:bg-red-900/40 text-red-600"}`}>
            {passed ? <CheckCircle size={44} /> : <XCircle size={44} />}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {passed ? t("res_congrats") : t("res_fail")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t("res_score_text", { total: result.totalQuestions, correct: result.correctCount })}
            </p>
          </div>
          <div className={`text-5xl sm:text-6xl font-black ${passed ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {result.scorePercentage}%
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">⏱️ {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s</span>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">✅ {result.correctCount} to'g'ri</span>
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold">❌ {wrongDetails.length} xato</span>
          </div>
          {!passed && (
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              💡 O'tish uchun kamida <strong>85%</strong> to'plash kerak. Yana urinib ko'ring!
            </div>
          )}
        </div>

        {/* Xatolar tahlili */}
        {wrongDetails.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 flex items-center gap-2 border-b border-orange-100 dark:border-orange-900">
              <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
              <span className="font-bold text-orange-700 dark:text-orange-400 text-base">
                Xatolar tahlili ({wrongDetails.length} ta xato)
              </span>
              {!isPremium && (
                <span className="ml-auto flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-200 dark:border-amber-700">
                  <Star size={10} className="fill-current" /> Premium
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {wrongDetails.map((detail, idx) => {
                const q = getQuestion(detail.questionId);
                const isOpen = openErrorIdx === idx;
                const category = q?.category || "umumiy";

                return (
                  <div key={idx}>
                    <button
                      onClick={() => setOpenErrorIdx(isOpen ? null : idx)}
                      className="w-full p-3 sm:p-4 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                          {q ? q.questionText : `Savol #${idx + 1}`}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-red-500 dark:text-red-400">
                            Sizning: <strong>{detail.userAnswer || "javob berilmadi"}</strong>
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            To'g'ri: <strong>{detail.correctAnswer}</strong>
                          </span>
                          {q?.category && (
                            <span className="text-xs text-sky-500 dark:text-sky-400">
                              {CATEGORY_LABEL[q.category] || q.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0 mt-1" />}
                    </button>

                    {isOpen && q && (
                      <div className="px-4 pb-4 space-y-3 bg-slate-50 dark:bg-slate-700/30">
                        {/* Savol rasmi */}
                        {q.image && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                            <img src={q.image} alt="Savol rasmi" className="w-full max-h-48 object-contain bg-white" />
                          </div>
                        )}

                        {/* Barcha variantlar */}
                        <div className="grid gap-1.5">
                          {(["A", ...(q.options.B ? ["B"] : []), ...(q.options.C ? ["C"] : []), ...(q.options.D ? ["D"] : []), ...(q.options.E ? ["E"] : []), ...(q.options.F ? ["F"] : [])] as const).map(opt => (
                            <div key={opt} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                              opt === detail.correctAnswer
                                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                                : opt === detail.userAnswer
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600"
                            }`}>
                              <span className="font-black w-5 flex-shrink-0">{{"A":"F1","B":"F2","C":"F3","D":"F4","E":"F5","F":"F6"}[opt] || opt}.</span>
                              <span className="flex-1">{q.options[opt]}</span>
                              {opt === detail.correctAnswer && <CheckCircle size={13} className="flex-shrink-0" />}
                              {opt === detail.userAnswer && opt !== detail.correctAnswer && <XCircle size={13} className="flex-shrink-0" />}
                            </div>
                          ))}
                        </div>

                        {/* Premium tushuntirish */}
                        {isPremium ? (
                          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-xl p-3.5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Star size={13} className="text-sky-600 fill-current" />
                              <p className="text-xs font-bold text-sky-700 dark:text-sky-400">Tushuntirish:</p>
                            </div>
                            {q.description ? (
                              <p className="text-xs text-sky-600 dark:text-sky-300 leading-relaxed">{q.description}</p>
                            ) : (
                              <p className="text-xs text-sky-600 dark:text-sky-300 leading-relaxed">
                                {DEFAULT_EXPLANATION[category]} — <strong>"{q.options[detail.correctAnswer as keyof typeof q.options]}"</strong>.{" "}
                                {LEGAL_NOTE[category]}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3.5 cursor-pointer hover:opacity-90 transition-all"
                            onClick={() => navigate("/user")}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Lock size={13} className="text-amber-600" />
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Premium tushuntirish</p>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
                              ⭐ Premium obuna bilan har bir xatongizga batafsil tushuntirish, qonun moddasi va maslahatlar ko'rinadi. Bosing!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Premium taklifi - faqat premium bo'lmaganlar uchun */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="fill-current" />
              <p className="font-black text-base">Premium bilan yanada ko'proq!</p>
            </div>
            <p className="text-xs text-amber-100 mb-3">
              ♾️ Cheksiz test · 📖 Har xatoga izoh · 🎬 Video darslar · 📚 YHQ barcha boblari
            </p>
            <button onClick={() => navigate("/user")}
              className="w-full py-2.5 bg-white text-amber-600 rounded-xl font-black text-sm hover:bg-amber-50 transition-all">
              ⭐ Premium Olish
            </button>
          </div>
        )}

        {/* Tugmalar */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/user")}
            className="py-3 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-sm">
            <Home size={16} /> {t("res_home")}
          </button>
          <button onClick={() => navigate("/quiz?count=20")}
            className="py-3 px-4 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
            <RotateCcw size={16} /> {t("res_retry")}
          </button>
        </div>

        {/* History link */}
        <button onClick={() => navigate("/history")}
          className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
          <AlertTriangle size={14} /> Tarix va barcha natijalar
        </button>
      </div>
    </div>
  );
};

export default Result;
