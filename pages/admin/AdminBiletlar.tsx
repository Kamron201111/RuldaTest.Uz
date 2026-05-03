import React, { useEffect, useState } from "react";
import { Plus, Trash2, Shuffle, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../services/supabase";
import { Question } from "../../types";

interface Bilet {
  id: string;
  number: number;
  title: string;
  question_ids: string[];
  created_at: string;
}

const mapQ = (d: any): Question => ({
  id: d.id,
  questionText: d.question_text,
  options: { A: d.option_a, B: d.option_b, C: d.option_c, D: d.option_d },
  correctAnswer: d.correct_answer,
  category: d.category || "",
});

const AdminBiletlar: React.FC = () => {
  const [biletlar, setBiletlar] = useState<Bilet[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Yangi bilet form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formNumber, setFormNumber] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [expandedBilet, setExpandedBilet] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data: bl } = await supabase.from("biletlar").select("*").order("number", { ascending: true });
    setBiletlar(bl || []);
    const { data: qs } = await supabase.from("questions").select("*").order("created_at", { ascending: true });
    setAllQuestions((qs || []).map(mapQ));
    setLoading(false);
  };

  const randomSelect = () => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setSelectedIds(shuffled.slice(0, 10).map(q => q.id));
    setMsg("10 ta savol tasodifiy tanlandi!");
    setTimeout(() => setMsg(""), 2000);
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev
    );
  };

  const saveBilet = async () => {
    if (!formTitle.trim()) { setMsg("Bilet nomini kiriting!"); return; }
    if (selectedIds.length !== 10) { setMsg("Aynan 10 ta savol tanlang! (" + selectedIds.length + "/10)"); return; }
    setSaving(true);
    const { error } = await supabase.from("biletlar").insert({
      number: formNumber,
      title: formTitle.trim(),
      question_ids: selectedIds,
    });
    if (error) {
      setMsg("Xato: " + error.message);
    } else {
      setMsg("✅ Bilet saqlandi!");
      setShowForm(false);
      setFormTitle("");
      setSelectedIds([]);
      await loadAll();
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const deleteBilet = async (id: string, num: number) => {
    if (!window.confirm("Bilet " + num + " ni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("biletlar").delete().eq("id", id);
    setBiletlar(prev => prev.filter(b => b.id !== id));
    setMsg("O'chirildi!");
    setTimeout(() => setMsg(""), 2000);
  };

  const nextNumber = biletlar.length > 0 ? Math.max(...biletlar.map(b => b.number)) + 1 : 1;

  const filteredQ = allQuestions.filter(q =>
    !searchQ || q.questionText.toLowerCase().includes(searchQ.toLowerCase()) || q.category?.includes(searchQ)
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🎫 Biletlar</h1>
            <p className="text-green-200 text-sm mt-0.5">
              {biletlar.length} ta bilet · {allQuestions.length} ta savol mavjud
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormNumber(nextNumber); setSelectedIds([]); setFormTitle("Bilet " + nextNumber); }}
            className="flex items-center gap-2 bg-white text-green-700 font-black px-4 py-2.5 rounded-xl shadow hover:bg-green-50 transition-all"
          >
            <Plus className="w-4 h-4" /> Yangi bilet
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mx-6 mt-4 p-3 rounded-xl text-sm font-bold text-center ${msg.startsWith("✅") ? "bg-green-100 text-green-700" : msg.startsWith("Xato") ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>
          {msg}
        </div>
      )}

      {/* Yangi bilet form */}
      {showForm && (
        <div className="mx-4 mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-black text-slate-800 dark:text-white">Yangi Bilet Yaratish</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Bilet raqami va nomi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Bilet raqami</label>
                <input
                  type="number"
                  value={formNumber}
                  onChange={e => setFormNumber(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Bilet nomi</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Bilet 1"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            {/* Tanlangan savollar soni */}
            <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${selectedIds.length === 10 ? "bg-green-50 dark:bg-green-900/20 border-green-400" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Tanlangan: <strong className={selectedIds.length === 10 ? "text-green-600" : "text-orange-500"}>{selectedIds.length}/10</strong>
              </span>
              <button
                onClick={randomSelect}
                className="flex items-center gap-1.5 bg-cyan-400 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                <Shuffle className="w-3.5 h-3.5" /> Random 10 ta
              </button>
            </div>

            {/* Savol qidirish */}
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Savol yoki kategoriya bo'yicha qidirish..."
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-green-400"
            />

            {/* Savollar ro'yxati */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
              {filteredQ.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">Savollar topilmadi</p>
              )}
              {filteredQ.map((q, idx) => {
                const selected = selectedIds.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all border ${
                      selected
                        ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black border-2 ${
                      selected ? "bg-green-500 border-green-500 text-white" : "border-slate-300 dark:border-slate-600 text-slate-400"
                    }`}>
                      {selected ? selectedIds.indexOf(q.id) + 1 : ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">{q.questionText}</p>
                      {q.category && (
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{q.category}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Saqlash */}
            <button
              onClick={saveBilet}
              disabled={saving || selectedIds.length !== 10}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-black shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saqlanmoqda...</>
              ) : (
                <><Save className="w-4 h-4" />Bilet Saqlash</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Biletlar ro'yxati */}
      <div className="px-4 mt-4 space-y-3">
        {biletlar.length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎫</div>
            <p className="text-slate-500 dark:text-slate-400 font-bold">Biletlar hali yo'q</p>
            <p className="text-slate-400 text-sm mt-1">Yuqoridagi "Yangi bilet" tugmasini bosing</p>
          </div>
        )}
        {biletlar.map(bilet => (
          <div key={bilet.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                {bilet.number}
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-800 dark:text-white">{bilet.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{bilet.question_ids?.length || 0} ta savol</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedBilet(expandedBilet === bilet.id ? null : bilet.id)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:bg-slate-200 transition-all"
                >
                  {expandedBilet === bilet.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteBilet(bilet.id, bilet.number)}
                  className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bilet savollarini ko'rish */}
            {expandedBilet === bilet.id && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Savollar:</p>
                {(bilet.question_ids || []).map((qid, idx) => {
                  const q = allQuestions.find(x => x.id === qid);
                  return (
                    <div key={qid} className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        {q ? q.questionText : "Savol o'chirilgan (ID: " + qid.slice(0, 8) + "...)"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBiletlar;
