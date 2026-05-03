import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Flag, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../../services/supabase";
import { Question } from "../../types";

interface Bilet {
  id: string;
  number: number;
  title: string;
  question_ids: string[];
}

const LABELS: Record<string, string> = { A: "F1", B: "F2", C: "F3", D: "F4", E: "F5" };

const mapQ = (d: any): Question => ({
  id: d.id,
  questionText: d.question_text,
  options: {
    A: d.option_a, B: d.option_b, C: d.option_c, D: d.option_d,
    ...(d.option_e ? { E: d.option_e } : {})
  },
  correctAnswer: d.correct_answer,
  image: d.image || "",
  category: d.category || "",
  description: d.description || "",
});

const BiletQuiz: React.FC = () => {
  const { biletId } = useParams<{ biletId: string }>();
  const navigate = useNavigate();

  const [bilet, setBilet] = useState<Bilet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!biletId) return;
      const { data: bl } = await supabase.from("biletlar").select("*").eq("id", biletId).single();
      if (!bl) { navigate("/biletlar"); return; }
      setBilet(bl);

      // Bilet savollarini yuklash
      const ids: string[] = bl.question_ids || [];
      if (ids.length === 0) { setLoading(false); return; }

      const { data: qs } = await supabase.from("questions").select("*").in("id", ids);
      // Bilet tartibida saralash
      const sorted = ids.map(id => (qs || []).find((q: any) => q.id === id)).filter(Boolean).map(mapQ);
      setQuestions(sorted);
      setLoading(false);
    };
    load();
  }, [biletId, navigate]);

  const handleAnswer = (optKey: string) => {
    const qid = questions[current]?.id;
    if (!qid || answers[qid]) return;
    setAnswers(prev => ({ ...prev, [qid]: optKey }));
  };

  const handleFinish = useCallback(async () => {
    if (finished) return;
    setFinished(true);

    // Natijani saqlash
    const uid = localStorage.getItem("user_id") || "";
    if (uid && biletId) {
      const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
      const score = Math.round(correctCount / questions.length * 100);
      const passed = correctCount >= 8; // 10 dan 8 ta to'g'ri = o'tdi

      // Progress yangilash
      const { data: existing } = await supabase
        .from("bilet_progress")
        .select("*")
        .eq("user_id", uid)
        .eq("bilet_id", biletId)
        .single();

      if (existing) {
        await supabase.from("bilet_progress").update({
          attempt_count: (existing.attempt_count || 0) + 1,
          last_score: score,
          best_score: Math.max(existing.best_score || 0, score),
          passed: existing.passed || passed,
        }).eq("user_id", uid).eq("bilet_id", biletId);
      } else {
        await supabase.from("bilet_progress").insert({
          user_id: uid,
          bilet_id: biletId,
          attempt_count: 1,
          last_score: score,
          best_score: score,
          passed,
        });
      }
    }
  }, [finished, biletId, questions, answers]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <div className="text-5xl mb-3">😕</div>
        <p className="font-bold text-slate-700 dark:text-white">Bu biletda savollar yo'q</p>
        <button onClick={() => navigate("/biletlar")} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-xl font-bold">
          Orqaga
        </button>
      </div>
    </div>
  );

  // ===== NATIJA EKRANI =====
  if (finished) {
    const correctCount = questions.filter(q => answers[q.id] === q.correctAnswer).length;
    const wrongCount = questions.length - correctCount;
    const passed = correctCount >= 8;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Natija */}
          <div className={`rounded-3xl p-6 text-center shadow-xl ${passed ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-rose-600"}`}>
            <div className="text-5xl mb-2">{passed ? "🎉" : "😔"}</div>
            <h1 className="text-2xl font-black text-white mb-1">
              {passed ? "Tabriklaymiz!" : "Siz o'tmadingiz"}
            </h1>
            <p className="text-white/80 text-sm">
              {bilet?.title || "Bilet " + bilet?.number}
            </p>
            <div className="mt-4 bg-white/20 rounded-2xl p-4">
              <div className="text-5xl font-black text-white">{correctCount}/{questions.length}</div>
              <p className="text-white/80 text-sm mt-1">
                {passed ? "O'tdingiz (8 va undan ko'p)" : "O'tish uchun kamida 8 ta to'g'ri kerak"}
              </p>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{correctCount}</div>
                <div className="text-white/70 text-xs">To'g'ri</div>
              </div>
              <div className="w-px bg-white/30" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">{wrongCount}</div>
                <div className="text-white/70 text-xs">Xato</div>
              </div>
            </div>
          </div>

          {/* Xatolar tahlili */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="text-base">📊</span>
              <h2 className="font-black text-slate-800 dark:text-white">Savollar tahlili</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {questions.map((q, idx) => {
                const userAns = answers[q.id] || "";
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div key={q.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xs ${
                        isCorrect ? "bg-green-100 dark:bg-green-900/40 text-green-600" : "bg-red-100 dark:bg-red-900/40 text-red-600"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug line-clamp-2">
                          {q.questionText}
                        </p>
                        {q.image && (
                          <img src={q.image} alt="" className="w-full max-h-32 object-contain rounded-lg mt-2 bg-slate-50" />
                        )}
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> To'g'ri: {LABELS[q.correctAnswer]}. {q.options[q.correctAnswer]}
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                Siz: {userAns ? LABELS[userAns] + ". " + q.options[userAns as keyof typeof q.options] : "javob berilmadi"}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-bold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                To'g'ri: {LABELS[q.correctAnswer]}. {q.options[q.correctAnswer]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tugmalar */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/biletlar")}
              className="py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
            >
              ← Biletlarga
            </button>
            <button
              onClick={() => {
                setAnswers({});
                setCurrent(0);
                setFinished(false);
              }}
              className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all"
            >
              🔄 Qayta urinish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== TEST EKRANI =====
  const q = questions[current];
  const userAns = answers[q.id];
  const isAnswered = !!userAns;
  const answeredCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">

      {/* Tepa: Chiqish + Progress */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (window.confirm("Biletdan chiqmoqchimisiz? Natija saqlanmaydi.")) {
              navigate("/biletlar");
            }
          }}
          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Chiqish
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{bilet?.title || "Bilet " + bilet?.number}</span>
            <span className="font-bold">{current + 1}/{questions.length}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
              style={{ width: ((current + 1) / questions.length * 100) + "%" }}
            />
          </div>
        </div>
      </div>

      {/* Savol raqamlari */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-2">
        <div className="flex gap-1.5 justify-center flex-wrap">
          {questions.map((qItem, idx) => {
            const ans = answers[qItem.id];
            let cls = "w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ";
            if (idx === current) cls += "bg-green-500 text-white scale-110 shadow";
            else if (ans === qItem.correctAnswer) cls += "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400";
            else if (ans) cls += "bg-red-100 dark:bg-red-900/40 text-red-600";
            else cls += "bg-slate-100 dark:bg-slate-800 text-slate-500";
            return (
              <button key={qItem.id} className={cls} onClick={() => setCurrent(idx)}>
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Savol */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">

          {/* Savol matni */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0 shadow">
                {current + 1}
              </div>
              <p className="flex-1 text-slate-800 dark:text-white font-semibold text-sm leading-relaxed pt-1">
                {q.questionText}
              </p>
            </div>
            {q.image && (
              <img src={q.image} alt="Savol" className="w-full max-h-48 object-contain rounded-xl mt-3 bg-slate-50 dark:bg-slate-800" />
            )}
          </div>

          {/* Variantlar */}
          <div className="space-y-2.5">
            {(["A", ...(q.options.B ? ["B"] : []), ...(q.options.C ? ["C"] : []), ...(q.options.D ? ["D"] : []), ...(q.options.E ? ["E"] : []), ...(q.options.F ? ["F"] : [])] as const).map(opt => {
              let cls = "w-full p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all text-left ";
              if (!isAnswered) {
                cls += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer";
              } else if (opt === q.correctAnswer) {
                cls += "border-green-500 bg-green-50 dark:bg-green-900/30 shadow";
              } else if (opt === userAns) {
                cls += "border-red-500 bg-red-50 dark:bg-red-900/30";
              } else {
                cls += "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-40";
              }
              return (
                <button key={opt} onClick={() => handleAnswer(opt)} disabled={isAnswered} className={cls}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    !isAnswered ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    : opt === q.correctAnswer ? "bg-green-500 text-white"
                    : opt === userAns ? "bg-red-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  }`}>
                    {LABELS[opt]}
                  </span>
                  <span className={`flex-1 text-sm font-medium ${
                    !isAnswered ? "text-slate-700 dark:text-slate-200"
                    : opt === q.correctAnswer ? "text-green-800 dark:text-green-200 font-bold"
                    : opt === userAns ? "text-red-700 dark:text-red-300 font-bold"
                    : "text-slate-400"
                  }`}>
                    {q.options[opt]}
                  </span>
                  {isAnswered && opt === q.correctAnswer && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  {isAnswered && opt === userAns && opt !== q.correctAnswer && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pastki navigatsiya */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrent(p => Math.max(0, p - 1))}
            disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Oldingi
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">
            {answeredCount}/{questions.length}
          </span>

          {isLast ? (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-black text-sm shadow-lg hover:opacity-90 transition-all active:scale-95"
            >
              <Flag className="w-4 h-4" /> Yakunlash
            </button>
          ) : (
            <button
              onClick={() => setCurrent(p => Math.min(questions.length - 1, p + 1))}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm shadow hover:opacity-90 transition-all"
            >
              Keyingi <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiletQuiz;
