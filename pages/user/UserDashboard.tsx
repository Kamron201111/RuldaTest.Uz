import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, History, Trophy, BookOpen, Star, TrendingUp,
  CheckCircle, XCircle, Upload, Clock, Loader2, Copy, Check, X,
  BarChart2, Shield, Bell, ChevronRight, Zap, Target, Award,
} from "lucide-react";
import {
  getResults, getDailyTestInfo, getPremiumInfo,
  createPremiumRequest, getUserPremiumRequest, uploadScreenshot, getAllSettings,
} from "../../services/supabase";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import { TestResult } from "../../types";

const ADMIN_TG = "https://t.me/kamron201";

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useUI();
  const [history, setHistory] = useState<TestResult[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [dailyInfo, setDailyInfo] = useState<{ used: number; limit: number; canTest: boolean }>({ used: 0, limit: 20, canTest: true });
  const [premiumInfo, setPremiumInfo] = useState<{ active: boolean; expiresAt?: string; plan?: string }>({ active: false });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [premiumStep, setPremiumStep] = useState<"closed"|"plans"|"payment"|"waiting">("closed");
  const [selectedPlan, setSelectedPlan] = useState<{ label: string; price: number; days: number } | null>(null);
  const [cardCopied, setCardCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: "success"|"error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [hist, daily, prem, sett, pending] = await Promise.all([
        getResults(user.id),
        getDailyTestInfo(user.id),
        getPremiumInfo(user.id),
        getAllSettings(),
        getUserPremiumRequest(user.id),
      ]);
      setHistory(hist);
      setDailyInfo(daily);
      setPremiumInfo(prem);
      setSettings(sett);
      setPendingRequest(pending);
    } finally {
      setLoading(false);
    }
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

  const startTest = async () => {
    if (!user) return;
    const info = await getDailyTestInfo(user.id);
    if (!info.canTest) { setPremiumStep("plans"); return; }
    navigate(`/quiz?count=${questionCount}`);
  };

  const copyCard = () => {
    navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ""));
    setCardCopied(true);
    setTimeout(() => setCardCopied(false), 2000);
  };

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
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
      if (result.success) {
        setPremiumStep("waiting");
        await loadData();
      } else {
        setSubmitMsg({ type: "error", text: "Xatolik yuz berdi" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closePremium = () => {
    setPremiumStep("closed");
    setSelectedPlan(null);
    setScreenshot(null);
    setScreenshotPreview("");
    setSubmitMsg(null);
  };

  const avgScore = history.length ? Math.round(history.reduce((s, r) => s + r.scorePercentage, 0) / history.length) : 0;
  const passCount = history.filter(r => r.scorePercentage >= 85).length;
  const remaining = dailyInfo.limit - dailyInfo.used;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-4 space-y-4">

        {/* SALOM HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate("/profile")}
              className="cursor-pointer relative"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md">
                  <span className="text-white font-black text-lg">{user?.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              {premiumInfo.active && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" fill="white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Xush kelibsiz 👋</p>
              <h1 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                Salom, {user?.name}!
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {premiumInfo.active ? (
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
                <Star className="w-3 h-3" fill="white" /> PRO
              </div>
            ) : (
              <button
                onClick={() => setPremiumStep("plans")}
                className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                ⭐ Premium
              </button>
            )}
          </div>
        </div>

        {/* PREMIUM / PENDING BANNER */}
        {premiumInfo.active ? (
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-white font-black">⭐ Premium Faol!</p>
              <p className="text-white/80 text-xs">{premiumInfo.plan} • {new Date(premiumInfo.expiresAt!).toLocaleDateString("uz-UZ")} gacha</p>
            </div>
            <div className="bg-white/20 px-3 py-2 rounded-xl text-center">
              <p className="text-white font-black text-sm">♾</p>
              <p className="text-white/80 text-xs">Cheksiz</p>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black text-sm">⏳ So'rov kutilmoqda</p>
              <p className="text-white/80 text-xs">Admin ko'rib chiqmoqda</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bugungi testlar</p>
                <p className="font-black text-slate-800 dark:text-white text-sm">{dailyInfo.used}/{dailyInfo.limit} ishlatildi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: Math.min(dailyInfo.limit, 10) }).map((_, i) => (
                  <div key={i} className={`w-2 h-4 rounded-full ${i < Math.min(dailyInfo.used, 10) ? "bg-sky-400" : "bg-slate-200 dark:bg-slate-600"}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">{remaining} qoldi</span>
            </div>
          </div>
        )}

        {/* STATISTIKA KARTALAR */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "material o'tildi", value: `${Math.min(avgScore, 100)}%`, color: "from-sky-400 to-blue-600", sub: history.length ? `${history.length} ta test` : "Hali yo'q" },
            { label: "platformada o'tkazildi", value: `${Math.round(history.reduce((s, r) => s + (r.timeSpentSeconds || 0), 0) / 3600 * 10) / 10} soat`, color: "from-cyan-400 to-purple-600", sub: "Umumiy vaqt" },
            { label: "noto'g'ri javoblar", value: `${history.length ? Math.round((history.reduce((s, r) => s + (r.totalQuestions - r.correctCount), 0) / history.reduce((s, r) => s + r.totalQuestions, 0)) * 100) : 0}%`, color: "from-red-400 to-rose-500", sub: "O'rtacha" },
            { label: "to'g'ri javoblar", value: `${avgScore}%`, color: "from-emerald-400 to-green-500", sub: "O'rtacha ball" },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
              <p className="text-3xl font-black mb-0.5">{value}</p>
              <p className="text-white/70 text-[10px] leading-tight">{label}</p>
              <p className="text-white/50 text-[9px] mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* SO'NGGI HARAKATLAR */}
        <div>
          <h2 className="font-black text-slate-800 dark:text-white text-base mb-3">So'nggi harakatlar</h2>
          {history.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <History className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-sm">So'nggi harakatlar yo'q</p>
              <p className="text-slate-400 text-xs mt-1">Birinchi testingizni boshlang!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${r.scorePercentage >= 85 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {r.scorePercentage >= 85 ? "✓" : "✗"}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{r.correctCount}/{r.totalQuestions} to'g'ri</p>
                    <p className="text-xs text-slate-400">{new Date(r.date).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <span className={`font-black text-xl ${r.scorePercentage >= 85 ? "text-green-500" : "text-red-500"}`}>{r.scorePercentage}%</span>
                </div>
              ))}
              {history.length > 3 && (
                <button onClick={() => navigate("/history")} className="w-full py-2.5 text-sky-600 text-sm font-bold text-center">
                  Hammasi ko'rish →
                </button>
              )}
            </div>
          )}
        </div>

        {/* PREMIUM CTA */}
        {!premiumInfo.active && !pendingRequest && (
          <div className="bg-gradient-to-br from-sky-500 via-cyan-500 to-purple-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="relative">
              <h3 className="text-xl font-black mb-1">⭐ Premium Obuna</h3>
              <p className="text-sky-200 text-xs mb-4">Barcha imkoniyatlarni oching</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["♾ Cheksiz test", "📊 Xatolar tahlili", "🏆 Real simulyator", "🔔 Bildirgilar"].map(item => (
                  <div key={item} className="bg-white/10 rounded-xl px-3 py-2 text-xs font-semibold border border-white/10">{item}</div>
                ))}
              </div>
              <button onClick={() => setPremiumStep("plans")} className="w-full py-3 bg-white text-sky-700 rounded-2xl font-black shadow-lg hover:bg-sky-50 transition-all">
                ⭐ Premium Olish — {parseInt(settings.price_1_hafta || "15000").toLocaleString()} so'mdan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PREMIUM MODAL */}
      {premiumStep !== "closed" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl shadow-2xl"
               style={{height: "92vh", display: "flex", flexDirection: "column"}}>

            {premiumStep === "plans" && (
              <>
                {/* Header - qimirlamaydi */}
                <div className="bg-gradient-to-r from-sky-500 to-cyan-500 p-6 rounded-t-3xl relative flex-shrink-0">
                  <button onClick={closePremium} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                  <h2 className="text-white font-black text-2xl">⭐ Premium</h2>
                  <p className="text-sky-200 text-sm mt-1">Paket tanlang</p>
                </div>
                {/* Scroll qism */}
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
                {/* Header - qimirlamaydi */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 rounded-t-3xl relative flex-shrink-0">
                  <button onClick={() => setPremiumStep("plans")} className="absolute top-4 left-4 text-white/80 hover:text-white text-sm font-bold">← Orqaga</button>
                  <button onClick={closePremium} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                  <div className="text-center pt-1">
                    <h2 className="text-white font-black text-xl">💳 To'lov</h2>
                    <p className="text-emerald-100 text-sm mt-0.5">{selectedPlan.label} — <strong>{selectedPlan.price.toLocaleString()} so'm</strong></p>
                  </div>
                </div>

                {/* Scroll qism - karta + chek */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Karta */}
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

                  {/* Ogohlantirish */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">To'lovni amalga oshiring va chekni pastga yuklang</p>
                  </div>

                  {/* Chek yuklash */}
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

                  {/* Yuborish tugmasi - pastda, doim ko'rinadi */}
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
                  <a href={ADMIN_TG} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-sky-400 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                    ✈️ Adminga yozish
                  </a>
                  <button onClick={closePremium} className="w-full py-2 text-slate-400 text-sm">Yopish</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
