import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getQuestions,
  saveQuestion,
  deleteQuestion,
  deleteAllQuestions,
  bulkSaveQuestions,
} from "../../services/supabase";
import { Question } from "../../types";
import {
  Trash2, Edit, ArrowLeft, Save, Plus, Search, ImageIcon,
  Upload, X, CheckCircle, FileText, Loader2, AlertCircle,
} from "lucide-react";
import { useUI } from "../../context/UIContext";
import ConfirmModal from "../../components/ConfirmModal";

// ===================== BULK IMPORT MODAL =====================
const BulkImportModal: React.FC<{
  onClose: () => void;
  onImportDone: () => void;
}> = ({ onClose, onImportDone }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Question[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ saved: number; errors: number } | null>(null);

  const EXAMPLE = `[
  {
    "questionText": "Aholi punktlarida ruxsat etilgan tezlik?",
    "options": {"A": "60 km/soat", "B": "80 km/soat", "C": "50 km/soat", "D": "100 km/soat"},
    "correctAnswer": "A",
    "category": "qoidalar",
    "description": "Aholi punktlari ichida harakatlanishda YHQ 63-moddasiga ko'ra tezlik 60 km/soatdan oshmasligi kerak."
  },
  {
    "questionText": "Bu qaysi belgi?",
    "options": {"A": "To'xtash", "B": "Yo'l bering", "C": "Taqiq", "D": "Xavf"},
    "correctAnswer": "B",
    "category": "belgilar",
    "description": "Uchburchak shaklidagi sariq belgi — 'Yo'l bering' belgisi. Kesishma oldida to'xtatmasdan o'tishga ruxsat yo'q."
  }
]`;

  const handleParse = async () => {
    setError("");
    setPreview([]);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON massiv bo'lishi kerak: [...]");

      const questions: Question[] = parsed.map((item: any, i: number) => {
        if (!item.questionText) throw new Error(`${i + 1}-savol: "questionText" yo'q`);
        if (!item.options?.A || !item.options?.B || !item.options?.C || !item.options?.D)
          throw new Error(`${i + 1}-savol: options ichida A, B, C, D bo'lishi kerak`);
        if (!["A", "B", "C", "D", "E"].includes(item.correctAnswer))
          throw new Error(`${i + 1}-savol: "correctAnswer" faqat A, B, C yoki D bo'lishi kerak`);
        return {
          id: "q_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2, 6),
          questionText: item.questionText,
          options: { A: item.options.A, B: item.options.B, C: item.options.C, D: item.options.D },
          correctAnswer: item.correctAnswer,
          category: item.category || "umumiy",
          image: item.image || "",
          description: item.description || "",
        };
      });
      setPreview(questions);
    } catch (e: any) {
      setError(e.message || "JSON xato — formatni tekshiring");
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const result = await bulkSaveQuestions(preview);
      setImportResult(result);
      if (result.errors === 0) {
        onImportDone();
        setTimeout(() => onClose(), 2000);
      }
    } catch {
      setError("Saqlashda xatolik yuz berdi!");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">📥 Ko'p savolni bittada yuklash</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-xl p-4">
            <p className="text-sm font-medium text-sky-700 dark:text-sky-400 mb-2">📋 JSON format (namuna):</p>
            <pre className="text-xs text-sky-600 dark:text-sky-300 overflow-x-auto whitespace-pre-wrap font-mono">{EXAMPLE}</pre>
            <button onClick={() => { setText(EXAMPLE); setPreview([]); setError(""); }}
              className="mt-3 text-xs bg-sky-500 text-white px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors">
              Namunani yuklash
            </button>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              💡 <strong>"description"</strong> maydoni premium foydalanuvchilar uchun tushuntirish. Ixtiyoriy maydon.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">JSON ni bu yerga joylashtiring:</label>
            <textarea value={text}
              onChange={e => { setText(e.target.value); setPreview([]); setError(""); setImportResult(null); }}
              rows={10}
              placeholder='[{"questionText": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "..."}, "correctAnswer": "A", "category": "qoidalar", "description": "..."}]'
              className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 outline-none font-mono text-sm" />
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {importResult && (
            <div className={`rounded-xl p-3 border ${importResult.errors === 0 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200"}`}>
              <p className="text-sm font-bold text-green-700 dark:text-green-400">
                ✅ {importResult.saved} ta savol saqlandi!
                {importResult.errors > 0 && ` ⚠️ ${importResult.errors} ta xatolik`}
              </p>
            </div>
          )}
          {preview.length > 0 && !importResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{preview.length} ta savol tayyor!</p>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {preview.map((q, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-slate-700 rounded-lg p-2 border border-green-100 dark:border-green-900 flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-5 flex-shrink-0">{i + 1}.</span>
                    <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{q.questionText}</span>
                    <span className="text-green-600 font-bold flex-shrink-0">{q.correctAnswer}</span>
                    {q.description && <span className="text-sky-400 flex-shrink-0">📖</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            {!importResult && (preview.length === 0 ? (
              <button onClick={handleParse} disabled={!text.trim()}
                className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Tekshirish
              </button>
            ) : (
              <button onClick={handleImport} disabled={importing}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {importing ? "Saqlanmoqda..." : `${preview.length} ta savolni saqlash`}
              </button>
            ))}
            <button onClick={onClose}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
              Bekor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================== PDF IMPORT MODAL =====================
const PdfImportModal: React.FC<{
  onClose: () => void;
  onImportDone: () => void;
}> = ({ onClose, onImportDone }) => {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setMessage("PDF o'qilmoqda...");

    try {
      // PDF.js CDN orqali yuklash
      const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) {
        // Dinamik yuklaymiz
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('PDF.js yuklanmadi'));
          document.head.appendChild(script);
        });
      }

      const pdfjs = (window as any)['pdfjs-dist/build/pdf'] || (window as any).pdfjsLib;
      if (pdfjs) pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      const imgDataList: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Matnni olish
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';

        // Rasmlarni olish
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        imgDataList.push(canvas.toDataURL('image/jpeg', 0.7));
      }

      setMessage("Savollar aniqlanmoqda...");

      // Matndan savollarni parse qilish
      const questions = parsePdfText(fullText, imgDataList);

      if (questions.length === 0) {
        setStatus("error");
        setMessage("PDF dan savollar topilmadi. JSON formatida yuklashga urinib ko'ring.");
        return;
      }

      setMessage(`${questions.length} ta savol topildi. Saqlanmoqda...`);
      const result = await bulkSaveQuestions(questions);
      setSaved(result.saved);
      setStatus("done");
      setMessage(`✅ ${result.saved} ta savol muvaffaqiyatli saqlandi!`);
      onImportDone();
    } catch (err: any) {
      setStatus("error");
      setMessage("Xatolik: " + (err.message || "PDF o'qib bo'lmadi. Faqat matnli PDF qo'llab-quvvatlanadi."));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">📄 PDF dan savollar yuklash</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-xl p-4 text-sm text-sky-700 dark:text-sky-300">
            <p className="font-bold mb-2">📌 PDF format qoidalari:</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Har bir savol yangi qatordan boshlanishi kerak</li>
              <li>Savol raqami: "1.", "2." yoki "1)" ko'rinishida</li>
              <li>Variantlar: "A)", "B)", "C)", "D)" yoki "A.", "B." ko'rinishida</li>
              <li>To'g'ri javob: "Javob: A" yoki "Answer: B" ko'rinishida</li>
              <li>PDFdagi har bir sahifadagi rasm savol rasmi sifatida qo'shiladi</li>
            </ul>
          </div>
          {status === "idle" && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 cursor-pointer hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all">
              <FileText size={48} className="text-slate-400 mb-3" />
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">PDF faylni tanlang</p>
              <p className="text-sm text-slate-500">Yoki bu yerga tashlang</p>
              <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
            </label>
          )}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 size={40} className="text-sky-600 animate-spin" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">{message}</p>
            </div>
          )}
          {status === "done" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <p className="text-green-600 dark:text-green-400 font-bold text-lg">{saved} ta savol saqlandi!</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold">
                Yopish
              </button>
            </div>
          )}
          {status === "error" && (
            <div className="text-center py-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{message}</p>
              </div>
              <label className="cursor-pointer px-6 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-all font-medium inline-block">
                Boshqa PDF tanlash
                <input type="file" accept=".pdf" onChange={handleFile} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PDF matnidan savollarni parse qilish
function parsePdfText(text: string, images: string[]): Question[] {
  const questions: Question[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let currentQ: Partial<Question> | null = null;
  let imgIndex = 0;

  const questionRegex = /^(\d+)[.)]\s+(.+)/;
  const optionRegex = /^([A-D])[.)]\s+(.+)/i;
  const answerRegex = /(?:javob|answer|to['']g['']ri|correct)[:\s]+([A-D])/i;

  for (const line of lines) {
    const qMatch = line.match(questionRegex);
    const optMatch = line.match(optionRegex);
    const ansMatch = line.match(answerRegex);

    if (qMatch) {
      if (currentQ?.questionText && currentQ.correctAnswer && currentQ.options?.A) {
        questions.push({
          id: "pdf_" + Date.now() + "_" + questions.length + "_" + Math.random().toString(36).slice(2, 5),
          questionText: currentQ.questionText,
          options: currentQ.options as any,
          correctAnswer: currentQ.correctAnswer as any,
          category: "umumiy",
          image: images[imgIndex] && imgIndex < images.length ? images[imgIndex++] : "",
          description: "",
        });
      }
      currentQ = {
        questionText: qMatch[2],
        options: { A: "", B: "", C: "", D: "" },
      };
    } else if (optMatch && currentQ) {
      const key = optMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
      if (currentQ.options) currentQ.options[key] = optMatch[2];
    } else if (ansMatch && currentQ) {
      currentQ.correctAnswer = ansMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
    }
  }

  // Oxirgi savolni qo'shish
  if (currentQ?.questionText && currentQ.correctAnswer && currentQ.options?.A) {
    questions.push({
      id: "pdf_" + Date.now() + "_" + questions.length,
      questionText: currentQ.questionText,
      options: currentQ.options as any,
      correctAnswer: currentQ.correctAnswer as any,
      category: "umumiy",
      image: "",
      description: "",
    });
  }

  return questions;
}

// ===================== QUESTION LIST =====================
export const QuestionList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useUI();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showPdfImport, setShowPdfImport] = useState(false);
  const [toast, setToast] = useState("");

  const categories = [
    { id: "all", name: "Barchasi" },
    { id: "umumiy", name: "Umumiy" },
    { id: "jarimalar", name: "Jarimalar" },
    { id: "belgilar", name: "Yo'l belgilari" },
    { id: "qoidalar", name: "Harakatlanish qoidalari" },
    { id: "xavfsizlik", name: "Xavfsizlik" },
    { id: "texnik", name: "Texnik bilim" },
    { id: "birinchi-yordam", name: "Birinchi yordam" },
  ];

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const data = await getQuestions();
    setQuestions(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteQuestion(deleteId);
      setQuestions(prev => prev.filter(q => q.id !== deleteId));
      setDeleteId(null);
      showToast("Savol o'chirildi!");
    }
  };

  const handleConfirmDeleteAll = async () => {
    await deleteAllQuestions();
    setQuestions([]);
    setIsDeleteAll(false);
    showToast("Barcha savollar o'chirildi!");
  };

  const filtered = useMemo(() => {
    let result = questions;
    if (selectedCategory !== "all") {
      result = result.filter(q => (q.category || "umumiy") === selectedCategory);
    }
    if (search) {
      result = result.filter(q => q.questionText.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [questions, search, selectedCategory]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-screen flex flex-col">
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} onImportDone={() => { loadQuestions(); showToast("Savollar qo'shildi!"); }} />}
      {showPdfImport && <PdfImportModal onClose={() => setShowPdfImport(false)} onImportDone={() => { loadQuestions(); }} />}

      {toast && (
        <div className="fixed top-4 right-4 z-40 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={() => navigate("/admin")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-300">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t("q_list_title")}</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <button onClick={() => setIsDeleteAll(true)}
            className="flex-1 sm:flex-none bg-red-100 text-red-600 px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-bold hover:bg-red-200 transition-all">
            <Trash2 size={15} /> Tozalash
          </button>
          <button onClick={() => setShowPdfImport(true)}
            className="flex-1 sm:flex-none bg-orange-500 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium hover:bg-orange-600 transition-all">
            <FileText size={15} /> PDF
          </button>
          <button onClick={() => setShowBulkImport(true)}
            className="flex-1 sm:flex-none bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium hover:bg-purple-700 transition-all">
            <Upload size={15} /> JSON
          </button>
          <button onClick={() => navigate("/admin/questions/new")}
            className="flex-1 sm:flex-none bg-sky-500 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium hover:bg-sky-600 transition-all">
            <Plus size={15} /> {t("q_new")}
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 flex-shrink-0">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${selectedCategory === cat.id ? "bg-sky-500 text-white shadow-md" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
            {cat.name}
            {cat.id !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">({questions.filter(q => (q.category || "umumiy") === cat.id).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input type="text" placeholder={t("q_search")} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-slate-800 dark:text-white shadow-sm" />
      </div>

      {/* List */}
      <div className="flex-1 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-sky-600 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(q => (
            <div key={q.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-3 items-center shadow-sm hover:shadow-md transition-all">
              {q.image ? (
                <img src={q.image} alt="" className="w-14 h-14 object-cover rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                  <ImageIcon size={18} />
                </div>
              )}
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="font-medium text-slate-800 dark:text-white line-clamp-2 mb-1 text-sm">{q.questionText}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded border border-sky-100 dark:border-sky-800">
                    {categories.find(c => c.id === q.category)?.name || q.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded border border-green-100 dark:border-green-900">
                    Javob: {q.correctAnswer}
                  </span>
                  {q.description && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded border border-purple-100 dark:border-purple-900">
                      📖 Tavsif bor
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => navigate(`/admin/questions/${q.id}`)}
                  className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => setDeleteId(q.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <ImageIcon size={56} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {selectedCategory !== "all" ? `"${categories.find(c => c.id === selectedCategory)?.name}" bo'limida savollar yo'q` : "Savollar topilmadi"}
            </p>
            <p className="text-sm text-center">
              {search ? "Boshqa kalit so'z bilan qidiring" : "Yangi savol qo'shing"}
            </p>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 mt-3 py-2">
        Jami: {questions.length} ta savol | Ko'rsatilmoqda: {filtered.length} ta
      </div>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleConfirmDelete}
        title="Savolni o'chirish" message="Siz rostdan ham ushbu savolni o'chirib tashlamoqchimisiz?" />
      <ConfirmModal isOpen={isDeleteAll} onClose={() => setIsDeleteAll(false)} onConfirm={handleConfirmDeleteAll}
        title="Barchasini tozalash" message="DIQQAT! Barcha savollar o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi." />
    </div>
  );
};

// ===================== QUESTION FORM =====================
export const QuestionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useUI();
  const isEdit = id && id !== "new";
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Question>({
    id: "", questionText: "", options: { A: "", B: "", C: "", D: "", E: "" },
    correctAnswer: "A", image: "", category: "umumiy", description: "",
  });

  useEffect(() => {
    if (isEdit) {
      getQuestions().then(all => {
        const found = all.find(q => q.id === id);
        if (found) setFormData(found);
      });
    }
  }, [id, isEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...formData, id: isEdit ? formData.id : ("q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7)) };
    const ok = await saveQuestion(payload);
    setSaving(false);
    if (ok) {
      navigate("/admin/questions");
    } else {
      const errMsg = (window as any).__lastSaveError;
      if (errMsg) {
        alert("❌ Saqlashda xatolik:\n\n" + errMsg);
        delete (window as any).__lastSaveError;
      } else {
        alert("❌ Saqlashda xatolik yuz berdi!\n\nBrowser Console (F12) da xatolikni ko'ring.\n\nEng ko'p uchraydigan sabab: Supabase RLS policy.\nYechim: Supabase Dashboard > SQL Editor:\nALTER TABLE questions DISABLE ROW LEVEL SECURITY;");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("Rasm hajmi 3MB dan katta bo'lmasin!"); return; }
    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX = 600;
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        // Sifatni kamaytirish - DB limit uchun
        let quality = 0.6;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        // Agar hali ham katta bo'lsa yanada kichraytir
        while (dataUrl.length > 500_000 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        setFormData(prev => ({ ...prev, image: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin/questions")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-slate-300">
          <ArrowLeft />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{isEdit ? t("q_form_edit") : t("q_form_new")}</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-5 transition-colors">
        {/* Kategoriya */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Savol Kategoriyasi</label>
          <select value={formData.category || "umumiy"} onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-400 outline-none">
            <option value="umumiy">Umumiy</option>
            <option value="jarimalar">Jarimalar</option>
            <option value="belgilar">Yo'l belgilari</option>
            <option value="qoidalar">Harakatlanish qoidalari</option>
            <option value="xavfsizlik">Xavfsizlik</option>
            <option value="texnik">Texnik bilim</option>
            <option value="birinchi-yordam">Birinchi yordam</option>
          </select>
        </div>

        {/* Rasm */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("q_form_img")}</label>
          <div className="flex items-center gap-4">
            {formData.image ? (
              <div className="relative">
                <img src={formData.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border dark:border-slate-600" />
                <button type="button" onClick={() => setFormData(p => ({ ...p, image: "" }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-600">
                <ImageIcon className="text-slate-400" />
              </div>
            )}
            <label className="cursor-pointer bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-100 transition-colors">
              Rasm Tanlash
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Savol matni */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("q_form_text")}</label>
          <textarea required rows={3} value={formData.questionText}
            onChange={e => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-400 outline-none" />
        </div>

        {/* Variantlar */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("q_form_opts")}
            <span className="ml-2 text-xs text-slate-400 font-normal">F1 majburiy, qolganlar ixtiyoriy</span>
          </label>
          {(["A", "B", "C", "D", "E", "F"] as const).map(opt => {
            const LABELS: Record<string, string> = {"A":"F1","B":"F2","C":"F3","D":"F4","E":"F5","F":"F6"};
            const isRequired = opt === "A";
            const val = (formData.options as any)[opt] || "";
            // F2-F6: faqat oldingi yozilgan bo'lsa ko'rsat
            const prevOpts: Record<string, string> = {"B":"A","C":"B","D":"C","E":"D","F":"E"};
            const prevKey = prevOpts[opt];
            const prevVal = prevKey ? ((formData.options as any)[prevKey] || "") : "filled";
            const show = isRequired || prevVal.trim() !== "";
            if (!show) return null;
            return (
              <div key={opt} className="flex gap-3 items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded font-bold flex-shrink-0 text-sm ${
                  isRequired
                    ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                }`}>
                  {LABELS[opt]}
                </span>
                <input
                  required={isRequired}
                  type="text"
                  placeholder={isRequired ? "F1 varianti (majburiy)" : LABELS[opt] + " varianti (ixtiyoriy)"}
                  value={val}
                  onChange={e => setFormData({ ...formData, options: { ...formData.options, [opt]: e.target.value } })}
                  className={`flex-1 p-2 border rounded-lg focus:ring-2 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm ${
                    isRequired
                      ? "border-sky-200 dark:border-sky-600 focus:ring-sky-400"
                      : "border-slate-200 dark:border-slate-600 focus:ring-slate-400"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* To'g'ri javob */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t("q_form_correct")}</label>
          <select value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value as any })}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none">
            <option value="A">F1 varianti (majburiy)</option>
            {(formData.options as any).B && <option value="B">F2 varianti</option>}
            {(formData.options as any).C && <option value="C">F3 varianti</option>}
            {(formData.options as any).D && <option value="D">F4 varianti</option>}
            {(formData.options as any).E && <option value="E">F5 varianti</option>}
            {(formData.options as any).F && <option value="F">F6 varianti</option>}
          </select>
        </div>

        {/* Tavsif (premium tushuntirish) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            📖 Tavsif / Tushuntirish
            <span className="ml-2 text-xs text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">Premium foydalanuvchilar uchun</span>
          </label>
          <textarea rows={3} value={formData.description || ""}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Bu savolga tushuntirish yozing (masalan: YHQ 63-moddasi bo'yicha aholi punktlarida tezlik 60 km/soatdan oshmasligi kerak...)"
            className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-sm" />
          <p className="text-xs text-slate-400 mt-1">Bu maydon ixtiyoriy. Xatolar tahlilida premium foydalanuvchilarga ko'rinadi.</p>
          <p className="text-xs text-amber-500 mt-1">💡 F2-F6 ixtiyoriy — yozilsa qo'shiladi, yozilmasa ko'rinmaydi.</p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-sky-500 text-white rounded-xl font-bold shadow-lg hover:bg-sky-600 transition-all flex justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? "Saqlanmoqda..." : t("q_form_save")}
        </button>
      </form>
    </div>
  );
};
