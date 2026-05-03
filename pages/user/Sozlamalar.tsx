import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, Star, LogOut, ChevronRight, Moon, Sun,
  Shield, Check, AlertCircle, TrendingUp, FileText, ScrollText,
  Clock, CheckCircle, XCircle, Copy, Upload, Loader2, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import {
  getPremiumInfo, getDailyTestInfo, getResults,
  createPremiumRequest, getUserPremiumRequest,
  uploadScreenshot, getAllSettings, supabase,
} from "../../services/supabase";
import { TestResult } from "../../types";

const LANGUAGES: { code: "uz"|"kr"|"ru"|"en"; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbek", flag: "🇺🇿" },
  { code: "kr", label: "Кирилл", flag: "🇺🇿" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

type LegalPage = "shartnoma" | "maxfiylik" | "oferta" | null;

const Sozlamalar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage } = useUI();

  const [premiumInfo, setPremiumInfo] = useState<{ active: boolean; expiresAt?: string; plan?: string }>({ active: false });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [showLogout, setShowLogout] = useState(false);
  const [showLang, setShowLang] = useState(false);

  // Premium modal
  const [premiumStep, setPremiumStep] = useState<"closed" | "plans" | "payment" | "waiting">("closed");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [cardCopied, setCardCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Statistika
  const [showStats, setShowStats] = useState(false);

  // Legal
  const [legalPage, setLegalPage] = useState<LegalPage>(null);
  const [legalContent, setLegalContent] = useState("");
  const [legalLoading, setLegalLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [prem, hist, sett, pending] = await Promise.all([
        getPremiumInfo(user.id),
        getResults(user.id),
        getAllSettings(),
        getUserPremiumRequest(user.id),
      ]);
      setPremiumInfo(prem);
      setHistory(hist);
      setSettings(sett);
      setPendingRequest(pending);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const PLANS = [
    { label: "1 Hafta", price: parseInt(settings.price_1_hafta || "15000"), days: 7, popular: false, icon: "⚡" },
    { label: "1 Oy", price: parseInt(settings.price_1_oy || "49000"), days: 30, popular: true, icon: "🔥" },
    { label: "1 Yil", price: parseInt(settings.price_1_yil || "350000"), days: 365, popular: false, icon: "👑" },
  ];
  const CARD_NUMBER = settings.card_number || "9860 1266 7183 6719";
  const CARD_OWNER = settings.card_owner || "Valiyev Kamron";
  const CARD_TYPE = settings.card_type || "Humo / UzCard";

  const copyCard = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ""));
    setCardCopied(true);
    setTimeout(() => setCardCopied(false), 2000);
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const r = new FileReader();
    r.onload = () => setScreenshotPreview(r.result as string);
    r.readAsDataURL(file);
    setSubmitMsg(null);
  };

  const handleSubmit = async () => {
    if (!user || !selectedPlan || !screenshot) {
      setSubmitMsg({ type: "error", text: "Iltimos to'lov chekini yuklang" });
      return;
    }
    setSubmitting(true);
    try {
      const url = await uploadScreenshot(screenshot, user.id);
      const result = await createPremiumRequest(user.id, user.name, selectedPlan.label, selectedPlan.price, selectedPlan.days, url || "");
      if (result.success) { setPremiumStep("waiting"); await loadData(); }
      else setSubmitMsg({ type: "error", text: "Xatolik yuz berdi" });
    } finally { setSubmitting(false); }
  };

  const closePremium = () => {
    setPremiumStep("closed"); setSelectedPlan(null);
    setScreenshot(null); setScreenshotPreview(""); setSubmitMsg(null);
  };

  const openLegal = async (type: LegalPage) => {
    setLegalPage(type);
    setLegalLoading(true);
    const keyMap: Record<string, string> = {
      shartnoma: "legal_shartnoma", maxfiylik: "legal_maxfiylik", oferta: "legal_oferta"
    };
    if (type) {
      const { data } = await supabase.from("settings").select("value").eq("key", keyMap[type]).single();
      setLegalContent(data?.value || "");
    }
    setLegalLoading(false);
  };

  if (!user) return null;

  // Statistika sahifasi
  if (showStats) {
    const avgScore = history.length ? Math.round(history.reduce((s, r) => s + r.scorePercentage, 0) / history.length) : 0;
    const totalMinutes = Math.round(history.reduce((s, r) => s + (r.timeSpentSeconds || 0), 0) / 60);
    const passCount = history.filter(r => r.scorePercentage >= 85).length;

    const today = new Date();
    const dayLabels = ["Ср", "Чт", "Пт", "Сб", "Вс", "Пн", "Вт"];
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const count = history.filter(r => r.date.startsWith(dateStr)).length;
      return { day: dayLabels[i], count };
    });
    const maxCount = Math.max(...weekData.map(d => d.count), 1);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button onClick={() => setShowStats(false)}
            className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
          <h1 className="text-xl font-black text-slate-800 dark:text-white">Statistika</h1>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white mb-4">Faollik</h3>
            <div className="flex items-end justify-between gap-1.5 mb-2" style={{ height: "80px" }}>
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden" style={{ height: "60px", display: "flex", alignItems: "flex-end" }}>
                    <div className="w-full bg-sky-400 rounded-lg transition-all"
                      style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "6px" : "0" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white mb-4">Xulosa</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-500 rounded-2xl p-4">
                <p className="text-white font-black text-3xl">{history.reduce((s, r) => s + r.totalQuestions, 0)}</p>
                <p className="text-sky-200 text-xs mt-1">savollar yechildi</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-800 dark:text-white font-black text-3xl">{avgScore}%</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">to'g'ri javoblar</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-800 dark:text-white font-black text-3xl">{totalMinutes} <span className="text-base font-bold">МИН</span></p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">platformada vaqt</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4">
                <p className="text-slate-800 dark:text-white font-black text-3xl">{passCount}</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">biletlar yechildi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Huquqiy sahifa
  if (legalPage) {
    const legalTitles: Record<string, string> = {
      shartnoma: "Foydalanuvchi shartnomasi",
      maxfiylik: "Maxfiylik siyosati",
      oferta: "Ommaviy oferta",
    };
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button onClick={() => setLegalPage(null)}
            className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
          <h1 className="text-lg font-black text-slate-800 dark:text-white">{legalTitles[legalPage]}</h1>
        </div>
        <div className="px-4 py-4">
          {legalLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-sky-500 animate-spin" /></div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              {legalContent ? (
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{legalContent}</p>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">Hozircha mazmun mavjud emas</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header profil */}
      <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow">
              <span className="text-white font-black text-2xl">{user.name?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="text-slate-800 dark:text-white font-black text-xl">{user.name}</h1>
            <p className="text-slate-400 text-sm">ID {user.id?.replace("user_", "").slice(0, 10)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Premium */}
        {premiumInfo.active ? (
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-white" fill="white" />
              <div>
                <p className="text-white font-black">Premium obuna</p>
                <p className="text-white/70 text-xs">{premiumInfo.plan} • {new Date(premiumInfo.expiresAt!).toLocaleDateString("uz-UZ")} gacha</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>
        ) : pendingRequest ? (
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
            <Clock className="w-7 h-7 text-white animate-pulse" />
            <div>
              <p className="text-white font-black">Premium obuna</p>
              <p className="text-white/70 text-xs">⏳ So'rov kutilmoqda</p>
            </div>
          </div>
        ) : (
          <button onClick={() => setPremiumStep("plans")}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-white" fill="white" />
              <div className="text-left">
                <p className="text-white font-black">Premium obuna</p>
                <p className="text-white/70 text-xs">Cheksiz testlar va ko'proq</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/70" />
          </button>
        )}

        {/* Statistika */}
        <button onClick={() => setShowStats(true)}
          className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <p className="font-bold text-slate-800 dark:text-white">Statistika</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Til */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <button onClick={() => setShowLang(!showLang)}
            className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-bold text-slate-800 dark:text-white">Til</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase">{language}</span>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showLang ? "rotate-90" : ""}`} />
            </div>
          </button>
          {showLang && (
            <div className="border-t border-slate-100 dark:border-slate-800">
              {LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLang(false); }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{lang.label}</span>
                  </div>
                  {language === lang.code && <Check className="w-5 h-5 text-sky-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Huquqiy sahifalar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {[
            { key: "shartnoma" as LegalPage, icon: ScrollText, label: "Foydalanuvchi shartnomasi" },
            { key: "maxfiylik" as LegalPage, icon: Shield, label: "Maxfiylik siyosati" },
            { key: "oferta" as LegalPage, icon: FileText, label: "Ommaviy oferta" },
          ].map(({ key, icon: Icon, label }, i, arr) => (
            <button key={key} onClick={() => openLegal(key)}
              className={`w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${i < arr.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-white">{label}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Tema */}
        <button onClick={toggleTheme}
          className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              {theme === "light" ? <Moon className="w-5 h-5 text-violet-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <p className="font-bold text-slate-800 dark:text-white">
              {theme === "light" ? "Qorong'u rejim" : "Yorug' rejim"}
            </p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-sky-500" : "bg-slate-200"} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${theme === "dark" ? "left-7" : "left-1"}`} />
          </div>
        </button>

        {/* Chiqish */}
        <button onClick={() => setShowLogout(true)}
          className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-bold text-red-600 dark:text-red-400">Chiqish</p>
        </button>
      </div>

      {/* PREMIUM MODAL */}
      {premiumStep !== "closed" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl shadow-2xl"
               style={{height: "92vh", display: "flex", flexDirection: "column"}}>

            {premiumStep === "plans" && (
              <>
                <div className="bg-gradient-to-r from-sky-500 to-cyan-500 p-6 rounded-t-3xl relative flex-shrink-0">
                  <button onClick={closePremium} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                  <h2 className="text-white font-black text-2xl">⭐ Premium</h2>
                  <p className="text-sky-200 text-sm mt-1">Paket tanlang</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {PLANS.map(plan => (
                    <button key={plan.label} onClick={() => { setSelectedPlan(plan); setPremiumStep("payment"); }}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative hover:scale-[1.01] ${plan.popular ? "border-sky-400 bg-sky-50 dark:bg-sky-900/20" : "border-slate-200 dark:border-slate-700 hover:border-sky-200"}`}>
                      {plan.popular && <span className="absolute -top-2 right-4 bg-sky-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">MASHHUR</span>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{plan.icon}</span>
                          <div><p className="font-black text-slate-800 dark:text-white">{plan.label}</p><p className="text-slate-500 text-xs">{plan.days} kun • Cheksiz test</p></div>
                        </div>
                        <p className="font-black text-sky-600 text-lg">{plan.price.toLocaleString()} <span className="text-sm">so'm</span></p>
                      </div>
                    </button>
                  ))}
                  <p className="text-xs text-slate-400 text-center pt-2 pb-4">To'lov qilgach chekni yuklang — admin tasdiqlaydi</p>
                </div>
              </>
            )}

            {premiumStep === "payment" && selectedPlan && (
              <>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 rounded-t-3xl relative flex-shrink-0">
                  <button onClick={() => setPremiumStep("plans")} className="absolute top-4 left-4 text-white/80 hover:text-white text-sm font-bold">← Orqaga</button>
                  <button onClick={closePremium} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                  <div className="text-center pt-1">
                    <h2 className="text-white font-black text-xl">💳 To'lov</h2>
                    <p className="text-emerald-100 text-sm mt-0.5">{selectedPlan.label} — <strong>{selectedPlan.price.toLocaleString()} so'm</strong></p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
                    <p className="text-slate-400 text-xs mb-1">{CARD_TYPE}</p>
                    <p className="text-xl font-mono font-bold tracking-widest mb-3">{CARD_NUMBER}</p>
                    <div className="flex items-center justify-between">
                      <div><p className="text-slate-400 text-xs">Egasi</p><p className="font-bold">{CARD_OWNER}</p></div>
                      <button onClick={copyCard} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-sm font-bold transition-all">
                        {cardCopied ? <><Check className="w-4 h-4" />Nusxalandi!</> : <><Copy className="w-4 h-4" />Nusxalash</>}
                      </button>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">To'lovni amalga oshiring va chekni pastga yuklang</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">📸 To'lov chekini yuklang:</p>
                    {screenshotPreview ? (
                      <div className="relative">
                        <img src={screenshotPreview} alt="Chek" className="w-full rounded-xl max-h-56 object-cover border-2 border-emerald-400" />
                        <button onClick={() => { setScreenshot(null); setScreenshotPreview(""); }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Chek yuklandi</div>
                      </div>
                    ) : (
                      <label className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all">
                        <Upload className="w-10 h-10 text-slate-400" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Chekni yuklash uchun bosing</p>
                        <p className="text-xs text-slate-400">JPG, PNG (maks 10MB)</p>
                        <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                      </label>
                    )}
                  </div>
                  {submitMsg && (
                    <div className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${submitMsg.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"}`}>
                      {submitMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{submitMsg.text}
                    </div>
                  )}
                  <div className="pb-4">
                    <button onClick={handleSubmit} disabled={submitting || !screenshot}
                      className={`w-full py-4 rounded-2xl font-black text-white text-base shadow-xl flex items-center justify-center gap-2 transition-all
                        ${screenshot && !submitting
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 active:scale-95"
                          : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"}`}>
                      {submitting
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Yuborilmoqda...</>
                        : screenshot
                          ? "✅ To'lovni Tasdiqlash va Yuborish"
                          : "⬆️ Avval chekni yuklang"}
                    </button>
                    {!screenshot && (
                      <p className="text-center text-xs text-slate-400 mt-2">Chek yuklanmagan — yuborish mumkin emas</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {premiumStep === "waiting" && (
              <div>
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 rounded-t-3xl relative">
                  <button onClick={closePremium} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                  <h2 className="text-white font-black text-xl">⏳ So'rov Yuborildi!</h2>
                </div>
                <div className="p-6 text-center space-y-4">
                  <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-10 h-10 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-lg mb-2">Admin ko'rib chiqmoqda</h3>
                    <p className="text-slate-500 text-sm">To'lov tekshirilgach premium avtomatik faollashadi. Odatda 5-30 daqiqa.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-300">📦 Paket: <strong>{selectedPlan?.label}</strong></p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">💰 To'langan: <strong>{selectedPlan?.price.toLocaleString()} so'm</strong></p>
                  </div>
                  <button onClick={closePremium} className="w-full py-2 text-slate-400 text-sm">Yopish</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Chiqish</h3>
              <p className="text-slate-500 dark:text-slate-400">Siz saytdan rostdan chiqmoqchimisiz?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)}
                className="flex-1 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-2xl font-bold">
                Yo'q
              </button>
              <button onClick={() => { logout(); navigate("/"); }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg">
                Ha, chiqaman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sozlamalar;
