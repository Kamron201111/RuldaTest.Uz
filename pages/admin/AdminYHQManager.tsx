import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Save, X, Upload, Loader2, FileText, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabase";

interface Chapter {
  id: number;
  number: number;
  title: string;
  description: string;
  pdf_url: string;
  is_free: boolean;
}

const DEFAULT_CHAPTERS: Chapter[] = Array.from({ length: 29 }, (_, i) => ({
  id: i + 1,
  number: i + 1,
  title: `Bob ${i + 1}`,
  description: "",
  pdf_url: "",
  is_free: i < 2,
}));

const AdminYHQManager: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Chapter>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { loadChapters(); }, []);

  const loadChapters = async () => {
    setLoading(true);
    const { data } = await supabase.from("yhq_chapters").select("*").order("number");
    if (data && data.length > 0) {
      setChapters(data);
    } else {
      // Agar bo'sh bo'lsa, default 29 ta bobni yuklaymiz
      const { error } = await supabase.from("yhq_chapters").insert(DEFAULT_CHAPTERS);
      if (!error) setChapters(DEFAULT_CHAPTERS);
      else setChapters(DEFAULT_CHAPTERS);
    }
    setLoading(false);
  };

  const startEdit = (ch: Chapter) => {
    setEditingId(ch.id);
    setForm({ ...ch });
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const uploadPdf = async (file: File, chapterId: number) => {
    setUploading(true);
    try {
      const path = `yhq/${chapterId}_${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("yhq-pdfs").upload(path, file, { upsert: true });
      if (error) { setMsg({ type: "err", text: "PDF yuklashda xatolik: " + error.message }); return; }
      const { data } = supabase.storage.from("yhq-pdfs").getPublicUrl(path);
      setForm(prev => ({ ...prev, pdf_url: data.publicUrl }));
      setMsg({ type: "ok", text: "PDF muvaffaqiyatli yuklandi!" });
    } finally {
      setUploading(false);
    }
  };

  const saveChapter = async () => {
    if (!form.title?.trim()) { setMsg({ type: "err", text: "Bob nomini kiriting" }); return; }
    setSaving(true);
    const { error } = await supabase.from("yhq_chapters").upsert({
      id: form.id,
      number: form.number,
      title: form.title,
      description: form.description || "",
      pdf_url: form.pdf_url || "",
      is_free: form.is_free,
    }, { onConflict: "id" });
    setSaving(false);
    if (error) { setMsg({ type: "err", text: "Saqlashda xatolik" }); return; }
    setMsg({ type: "ok", text: "Saqlandi!" });
    setChapters(prev => prev.map(c => c.id === form.id ? { ...c, ...form } as Chapter : c));
    setTimeout(() => { setEditingId(null); setForm({}); setMsg(null); }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/admin")}
            className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Admin Panel</p>
            <h1 className="font-black text-slate-800 dark:text-white">YHQ Boblar (29 ta)</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-sky-500 animate-spin" /></div>
        ) : (
          chapters.map(ch => (
            <div key={ch.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {editingId === ch.id ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-700 dark:text-slate-200 text-sm">Bob {ch.number} — Tahrirlash</span>
                    <button onClick={cancelEdit} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
                  </div>

                  {/* Bob nomi */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Bob nomi *</label>
                    <input value={form.title || ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Masalan: Bob 1: Umumiy qoidalar" />
                  </div>

                  {/* Tavsif */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">Tavsif (ixtiyoriy)</label>
                    <textarea value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                      placeholder="Bob haqida qisqacha..." />
                  </div>

                  {/* PDF yuklash */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">PDF Fayl</label>
                    {form.pdf_url && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 dark:text-green-400 flex-1 truncate">PDF yuklangan ✓</span>
                        <button onClick={() => setForm(p => ({ ...p, pdf_url: "" }))} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? "border-sky-200 bg-sky-50" : "border-slate-300 dark:border-slate-600 hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/10"}`}>
                      {uploading ? <Loader2 className="w-5 h-5 text-sky-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400" />}
                      <span className="text-sm text-slate-500">{uploading ? "Yuklanmoqda..." : "PDF fayl yuklash"}</span>
                      <input type="file" accept=".pdf" className="hidden" disabled={uploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f, ch.id); }} />
                    </label>
                  </div>

                  {/* Bepul/Premium */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Holat:</label>
                    <button onClick={() => setForm(p => ({ ...p, is_free: true }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${form.is_free ? "bg-green-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                      Bepul
                    </button>
                    <button onClick={() => setForm(p => ({ ...p, is_free: false }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!form.is_free ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                      Premium
                    </button>
                  </div>

                  {/* Msg */}
                  {msg && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${msg.type === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {msg.type === "ok" ? "✅" : "❌"} {msg.text}
                    </div>
                  )}

                  {/* Save */}
                  <button onClick={saveChapter} disabled={saving}
                    className="w-full py-3 bg-sky-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-sky-600 transition-all disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</> : <><Save className="w-4 h-4" /> Saqlash</>}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${ch.is_free ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                    {ch.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{ch.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${ch.is_free ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}>
                        {ch.is_free ? "Bepul" : "Premium"}
                      </span>
                      {ch.pdf_url && <span className="text-xs text-sky-500 flex items-center gap-1"><FileText className="w-3 h-3" />PDF</span>}
                    </div>
                  </div>
                  <button onClick={() => startEdit(ch)}
                    className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all">
                    <Edit2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminYHQManager;
