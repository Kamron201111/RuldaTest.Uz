import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Save, X, Upload, Loader2, Video, Link } from "lucide-react";
import { supabase } from "../../services/supabase";

const DEFAULT = [
  { id: 1, number: 1, title: "Kirish", description: "Yo'l harakati xavfsizligi asoslari bo'yicha kirish darsi.", video_url: "", is_free: true },
  { id: 2, number: 2, title: "2.1. Haydovchilarning umumiy majburiyatlari", description: "", video_url: "", is_free: true },
  ...Array.from({ length: 18 }, (_, i) => ({ id: i+3, number: i+3, title: `${i+3} - dars`, description: "", video_url: "", is_free: false }))
];

const AdminKurslar: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("kurs_lessons").select("*").order("number");
      if (data && data.length > 0) setLessons(data);
      else {
        await supabase.from("kurs_lessons").upsert(DEFAULT, { onConflict: "id" });
        setLessons(DEFAULT);
      }
      setLoading(false);
    })();
  }, []);

  const startEdit = (l: any) => { setEditId(l.id); setForm({ ...l }); setMsg(null); };
  const cancel = () => { setEditId(null); setForm({}); };

  const uploadVideo = async (file: File, id: number) => {
    setUploading(true);
    const path = `kurs/${id}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("kurs-videos").upload(path, file, { upsert: true });
    if (error) { setMsg({ ok: false, text: "Video yuklashda xatolik" }); setUploading(false); return; }
    const { data } = supabase.storage.from("kurs-videos").getPublicUrl(path);
    setForm((p: any) => ({ ...p, video_url: data.publicUrl }));
    setMsg({ ok: true, text: "Video yuklandi!" });
    setUploading(false);
  };

  const save = async () => {
    if (!form.title?.trim()) { setMsg({ ok: false, text: "Dars nomini kiriting" }); return; }
    setSaving(true);
    const { error } = await supabase.from("kurs_lessons").upsert({
      id: form.id, number: form.number, title: form.title,
      description: form.description || "", video_url: form.video_url || "",
      is_free: form.is_free ?? false,
    }, { onConflict: "id" });
    setSaving(false);
    if (error) { setMsg({ ok: false, text: "Saqlashda xatolik" }); return; }
    setMsg({ ok: true, text: "Saqlandi!" });
    setLessons(p => p.map(l => l.id === form.id ? { ...l, ...form } : l));
    setTimeout(() => { setEditId(null); setForm({}); setMsg(null); }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 px-4 py-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate("/admin")}
          className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <p className="text-xs text-slate-500">Admin Panel</p>
          <h1 className="font-black text-slate-800 dark:text-white">Kurslar (20 dars)</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-sky-500 animate-spin" /></div> : (
          lessons.map(lesson => (
            <div key={lesson.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              {editId === lesson.id ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-700 dark:text-slate-200 text-sm">Dars {lesson.number}</span>
                    <button onClick={cancel}><X className="w-4 h-4 text-slate-500" /></button>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Dars nomi *</label>
                    <input value={form.title || ""} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-400"
                      placeholder="Dars nomi..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Dars matni / tavsifi</label>
                    <textarea value={form.description || ""} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={3}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                      placeholder="Dars haqida matn..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">YouTube URL</label>
                    <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5">
                      <Link className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input value={form.video_url || ""} onChange={e => setForm((p: any) => ({ ...p, video_url: e.target.value }))}
                        className="flex-1 text-sm bg-transparent text-slate-800 dark:text-white outline-none"
                        placeholder="https://youtube.com/watch?v=..." />
                    </div>
                  </div>
                  <label className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? "border-sky-200 bg-sky-50" : "border-slate-300 dark:border-slate-600 hover:border-sky-300"}`}>
                    {uploading ? <Loader2 className="w-5 h-5 text-sky-500 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400" />}
                    <span className="text-sm text-slate-500">{uploading ? "Yuklanmoqda..." : "Video fayl yuklash (MP4)"}</span>
                    <input type="file" accept="video/*" className="hidden" disabled={uploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadVideo(f, lesson.id); }} />
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Holat:</span>
                    {["Bepul", "Premium"].map(lbl => (
                      <button key={lbl} onClick={() => setForm((p: any) => ({ ...p, is_free: lbl === "Bepul" }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(lbl === "Bepul") === form.is_free ? (lbl === "Bepul" ? "bg-green-600 text-white" : "bg-amber-500 text-white") : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {msg && <div className={`p-2 rounded-xl text-xs font-semibold ${msg.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msg.ok ? "✅" : "❌"} {msg.text}</div>}
                  <button onClick={save} disabled={saving}
                    className="w-full py-3 bg-sky-500 text-white rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</> : <><Save className="w-4 h-4" />Saqlash</>}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow">{lesson.number}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lesson.video_url ? <span className="text-xs text-sky-500 flex items-center gap-1"><Video className="w-3 h-3" />Video bor</span> : <span className="text-xs text-slate-400">Video yo'q</span>}
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${lesson.is_free ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{lesson.is_free ? "Bepul" : "Premium"}</span>
                    </div>
                  </div>
                  <button onClick={() => startEdit(lesson)}
                    className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
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
export default AdminKurslar;
