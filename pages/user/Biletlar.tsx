import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, CheckCircle, Clock } from "lucide-react";
import { supabase } from "../../services/supabase";

interface Bilet {
  id: string;
  number: number;
  title: string;
  question_ids: string[];
  created_at: string;
}

interface BiletProgress {
  bilet_id: string;
  attempt_count: number;
  best_score: number;
  last_score: number;
  passed: boolean;
}

const Biletlar: React.FC = () => {
  const navigate = useNavigate();
  const [biletlar, setBiletlar] = useState<Bilet[]>([]);
  const [progress, setProgress] = useState<Record<string, BiletProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: bl } = await supabase
          .from("biletlar")
          .select("*")
          .order("number", { ascending: true });
        setBiletlar(bl || []);

        const uid = localStorage.getItem("user_id") || "";
        if (uid) {
          const { data: pr } = await supabase
            .from("bilet_progress")
            .select("*")
            .eq("user_id", uid);
          const map: Record<string, BiletProgress> = {};
          (pr || []).forEach((p: any) => { map[p.bilet_id] = p; });
          setProgress(map);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-4 pt-8 pb-6">
        <h1 className="text-2xl font-black text-white mb-1">🎫 Biletlar</h1>
        <p className="text-green-200 text-sm">GAI imtihon biletlari — 10 ta savol</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
            <span className="text-white text-xs font-bold">{biletlar.length} ta bilet</span>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5">
            <span className="text-white text-xs font-bold">
              {Object.values(progress).filter(p => p.passed).length} ta o'tildi
            </span>
          </div>
        </div>
      </div>

      {/* Biletlar grid */}
      <div className="p-4">
        {biletlar.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎫</div>
            <p className="text-slate-500 dark:text-slate-400 font-bold">Biletlar hali qo'shilmagan</p>
            <p className="text-slate-400 text-sm mt-1">Admin biletlarni qo'shishini kuting</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {biletlar.map(bilet => {
              const prog = progress[bilet.id];
              const passed = prog?.passed;
              const attempted = !!prog;
              const score = prog?.last_score || 0;

              return (
                <div
                  key={bilet.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-4 transition-all shadow-sm ${
                    passed
                      ? "border-green-400 dark:border-green-600"
                      : attempted
                      ? "border-orange-300 dark:border-orange-700"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {/* Top */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-mono">#{String(bilet.number).padStart(2, "0")}</span>
                    {passed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : attempted ? (
                      <Clock className="w-4 h-4 text-orange-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                    )}
                  </div>

                  {/* Title */}
                  <p className="font-black text-slate-800 dark:text-white text-base mb-1">
                    {bilet.title || "Bilet " + bilet.number}
                  </p>

                  {/* Boshlash */}
                  <button
                    onClick={() => navigate("/bilet-quiz/" + bilet.id)}
                    className="w-full mt-2 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" fill="white" />
                    Boshlash
                  </button>

                  {/* Footer info */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">SAVOL ({bilet.question_ids?.length || 10})</span>
                    {attempted && (
                      <span className={`text-xs font-bold ${passed ? "text-green-600" : "text-orange-500"}`}>
                        Urinish ({prog.attempt_count})
                      </span>
                    )}
                    {!attempted && (
                      <span className="text-xs text-slate-400">Urinish (0)</span>
                    )}
                  </div>
                  {bilet.created_at && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">
                        📅 {new Date(bilet.created_at).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Biletlar;
