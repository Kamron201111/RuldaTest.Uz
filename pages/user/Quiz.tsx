import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getQuestions,
  getQuestionsByCategory,
  saveResult,
  getDailyTestInfo,
  incrementDailyTest,
} from "../../services/supabase";
import { Question, TestResult, TestResultDetail } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import { Clock, ChevronRight, Timer, CheckCircle, Flag, ArrowLeft } from "lucide-react";

const Quiz: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();
  const { t } = useUI();

  const count = parseInt(searchParams.get("count") || "20");
  const topic = searchParams.get("topic");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [totalTime, setTotalTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [limitError, setLimitError] = useState("");

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      // Faqat limitni tekshirish — hali increment qilmaymiz
      const dailyInfo = await getDailyTestInfo(user.id);
      if (!dailyInfo.canTest) {
        setLimitError(`⛔ Kunlik ${dailyInfo.limit} ta bepul testingiz tugadi!\n\nPremium obuna bilan cheksiz test topshing!`);
        setLoading(false);
        return;
      }

      const allQ = topic ? await getQuestionsByCategory(topic) : await getQuestions();
      const shuffled = [...allQ].sort(() => 0.5 - Math.random()).slice(0, count);

      if (shuffled.length === 0) {
        alert(t("quiz_empty"));
        navigate("/user");
        return;
      }

      setQuestions(shuffled);
      setLoading(false);
    };
    init();
  }, [count, topic, navigate, t, user]);

  useEffect(() => {
    if (isFinished || loading) return;
    const timer = setInterval(() => setTotalTime(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, loading]);

  useEffect(() => {
    setQuestionTime(0);
    if (isFinished || loading) return;
    const qTimer = setInterval(() => setQuestionTime(p => p + 1), 1000);
    return () => clearInterval(qTimer);
  }, [currentIndex, isFinished, loading]);

  const handleFinish = useCallback(async () => {
    if (!user || isFinished) return;

    const unanswered = questions.length - Object.keys(answers).length;
    if (unanswered > 0 && !window.confirm(`Siz ${unanswered} ta savolga javob bermadingiz. Baribir yakunlashni xohlaysizmi?`)) return;

    setIsFinished(true);

    let correctCount = 0;
    const details: TestResultDetail[] = questions.map(q => {
      const userAnswer = answers[q.id] || "";
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return { questionId: q.id, userAnswer, correctAnswer: q.correctAnswer, isCorrect };
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const result: TestResult = {
      id: Date.now().toString(),
      userId: user.id,
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctCount,
      scorePercentage,
      timeSpentSeconds: totalTime,
      details,
    };

    // Tez navigate - background da saqlash
    navigate("/result", { state: { result, questions } });
    // Background da saqlash (navigatedan keyin)
    saveResult(result);
    incrementDailyTest(user.id);
    updateUserProfile({ ...user, totalPoints: (user.totalPoints || 0) + scorePercentage });
  }, [answers, questions, totalTime, user, isFinished, navigate, updateUserProfile]);

  const handleSelectAnswer = (optionKey: string) => {
    const currentQ = questions[currentIndex];
    if (answers[currentQ.id]) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: optionKey }));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-lg font-bold text-slate-600 dark:text-slate-400">Yuklanmoqda...</p>
      </div>
    </div>
  );

  if (limitError) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⛔</div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-3">Kunlik limit tugadi</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 whitespace-pre-line">{limitError}</p>
        <div className="space-y-3">
          <button onClick={() => { navigate("/user"); setTimeout(() => { const el = document.querySelector("[data-premium]"); if (el) (el as HTMLElement).click(); }, 300); }}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black shadow-lg hover:opacity-90 transition-all">
            ⭐ Premium Olish
          </button>
          <button onClick={() => navigate("/user")}
            className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
            Bosh sahifaga
          </button>
        </div>
      </div>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const userAnswer = answers[currentQuestion.id];
  const isAnswered = !!userAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 pb-24 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* Header */}
        <div className="sticky top-3 z-50 mb-4">
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => {
                    if (window.confirm("Testni tark etmoqchimisiz? Natijalar saqlanmaydi.")) {
                      navigate("/user");
                    }
                  }}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 transition-all active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span className="font-bold text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Chiqish</span>
                </button>
                <div className="flex items-center gap-2 bg-sky-100 dark:bg-sky-900/50 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-700">
                  <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="font-black text-sky-700 dark:text-sky-300 font-mono text-xs sm:text-sm">{formatTime(totalTime)}</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/50 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800">
                  <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-black text-orange-700 dark:text-orange-300 font-mono text-xs sm:text-sm">{formatTime(questionTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300">Savol</span>
                <span className="font-black text-base sm:text-lg text-purple-900 dark:text-purple-100">{currentIndex + 1} / {questions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm">Savol holati</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              let bg = "bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-500";
              if (ans) bg = ans === q.correctAnswer
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-2 border-emerald-600 text-white shadow-lg"
                : "bg-gradient-to-br from-red-500 to-rose-500 border-2 border-red-600 text-white shadow-lg";
              else if (idx === currentIndex) bg = "ring-4 ring-sky-400/50 bg-gradient-to-br from-sky-400 to-cyan-500 border-2 border-sky-500 text-white font-black shadow-xl scale-110";
              return (
                <button key={q.id}
                  onClick={() => { if (ans || idx <= currentIndex) setCurrentIndex(idx); }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 ${bg} rounded-xl flex items-center justify-center text-[10px] sm:text-xs transition-all transform hover:scale-110 font-bold ${ans || idx <= currentIndex ? "" : "opacity-40 cursor-not-allowed"}`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
          {currentQuestion.image && (
            <div className="relative h-40 sm:h-48 bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border-b-2 border-slate-200 dark:border-slate-700">
              <img src={currentQuestion.image} alt="Savol" className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-sm sm:text-base shadow-lg">
                {currentIndex + 1}
              </div>
              <h2 className="flex-1 text-sm sm:text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {(["A", "B", "C", "D", "E", "F"] as const).filter(optionKey => optionKey === "A" || currentQuestion.options[optionKey]).map(optionKey => {
                let btnClass = "w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex items-start gap-2 sm:gap-3";
                let badgeClass = "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-black shadow";
                let textClass = "flex-1 text-xs sm:text-sm lg:text-base leading-relaxed pt-0.5";
                if (!isAnswered) {
                  btnClass += " border-slate-200 dark:border-slate-700 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:shadow-lg cursor-pointer";
                  badgeClass += " bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400";
                  textClass += " text-slate-700 dark:text-slate-200 font-medium";
                } else if (optionKey === currentQuestion.correctAnswer) {
                  btnClass += " border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-xl";
                  badgeClass += " bg-gradient-to-br from-emerald-500 to-teal-500 text-white";
                  textClass += " text-emerald-900 dark:text-emerald-100 font-bold";
                } else if (optionKey === userAnswer) {
                  btnClass += " border-red-500 bg-red-50 dark:bg-red-900/30 shadow-xl";
                  badgeClass += " bg-gradient-to-br from-red-500 to-rose-500 text-white";
                  textClass += " text-red-900 dark:text-red-100 font-bold";
                } else {
                  btnClass += " border-slate-200 dark:border-slate-700 opacity-40";
                  textClass += " text-slate-500";
                }
                return (
                  <button key={optionKey} onClick={() => handleSelectAnswer(optionKey)} disabled={isAnswered} className={btnClass}>
                    <div className={badgeClass}>{{"A":"F1","B":"F2","C":"F3","D":"F4","E":"F5","F":"F6"}[optionKey] || optionKey}</div>
                    <span className={textClass}>{currentQuestion.options[optionKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-t-2 border-slate-200 dark:border-slate-700 p-4 sm:p-5 z-50 shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/50 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm sm:text-base">
              {Object.keys(answers).length}/{questions.length}
            </span>
          </div>
          {currentIndex === questions.length - 1 ? (
            <button onClick={handleFinish}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black shadow-2xl transition-all text-sm sm:text-base flex items-center gap-2">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5" /> {t("quiz_finish")}
            </button>
          ) : (
            <button onClick={() => setCurrentIndex(p => Math.min(questions.length - 1, p + 1))}
              className="bg-gradient-to-r from-sky-500 to-purple-600 hover:opacity-90 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black shadow-2xl transition-all text-sm sm:text-base flex items-center gap-2">
              {t("quiz_next")} <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
