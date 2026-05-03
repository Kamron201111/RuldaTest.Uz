import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { loginUser, registerUser, resetPasswordByPhone } from "../services/supabase";
import {
  UserPlus, LogIn, Moon, Sun, Car, Shield, Users, Award,
  Loader2, Eye, EyeOff, Phone, User, Lock, KeyRound, CheckCircle2,
} from "lucide-react";
import { languages } from "../services/translations";

const ADMIN_NAME = "ValiyevKamron";
const ADMIN_PASS = "128787$Kam";

// Parol kuchlilik tekshiruvi
const checkPassword = (pass: string) => ({
  minLength: pass.length >= 6,
  hasUppercase: /[A-Z]/.test(pass),
  hasNumber: /[0-9]/.test(pass),
});
const isPasswordValid = (pass: string) => {
  const c = checkPassword(pass);
  return c.minLength && c.hasUppercase && c.hasNumber;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, toggleTheme, theme, language, setLanguage } = useUI();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showLang, setShowLang] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Login fields
  const [loginName, setLoginName] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register fields
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regPass, setRegPass] = useState("");

  // Forgot password fields
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotDone, setForgotDone] = useState(false);

  const passCheck = checkPassword(regPass);
  const allPassOk = isPasswordValid(regPass);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginName.trim() || !loginPass.trim()) { setError("Barcha maydonlarni to'ldiring!"); return; }
    setLoading(true);
    try {
      if (loginName === ADMIN_NAME && loginPass === ADMIN_PASS) {
        login({ id: "admin_main", name: "Admin", role: "ADMIN" as any, password: "", avatar: "", totalPoints: 0, createdAt: new Date().toISOString() });
        navigate("/admin");
        return;
      }
      const user = await loginUser(loginName, loginPass);
      if (!user) { setError("Login yoki parol noto'g'ri!"); return; }
      login(user);
      navigate("/user");
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regFullName.trim()) { setError("Ism va Familyangizni kiriting!"); return; }
    if (!regPhone.trim()) { setError("Telefon raqamingizni kiriting!"); return; }
    if (!regLogin.trim()) { setError("Login (username) kiriting!"); return; }
    if (regLogin.length < 4) { setError("Login kamida 4 ta belgi bo'lishi kerak!"); return; }
    if (!/^\+?[0-9]{9,13}$/.test(regPhone.replace(/\s/g, ""))) { setError("Telefon raqam noto'g'ri formatda! (+998901234567)"); return; }
    if (!isPasswordValid(regPass)) { setError("Parol talablariga mos emas!"); return; }
    setLoading(true);
    try {
      const result = await registerUser(regLogin.trim(), regPass, regFullName.trim(), regPhone.trim());
      if (!result.success || !result.user) { setError(result.message || "Xatolik yuz berdi!"); return; }
      login(result.user);
      navigate("/user");
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!forgotPhone.trim()) { setError("Telefon raqamingizni kiriting!"); return; }
    if (!isPasswordValid(forgotNewPass)) { setError("Yangi parol talablariga mos emas!"); return; }
    setLoading(true);
    try {
      const result = await resetPasswordByPhone(forgotPhone.trim(), forgotNewPass);
      if (!result.success) { setError(result.message); return; }
      setForgotDone(true);
      setSuccess(result.message);
    } catch {
      setError("Xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex transition-colors">

      {/* Top Controls */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={toggleTheme}
          className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 rounded-full shadow-lg hover:shadow-xl transition-all">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)}
            className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 rounded-full shadow-lg hover:shadow-xl transition-all uppercase text-xs font-bold w-10 h-10 flex items-center justify-center">
            {language}
          </button>
          {showLang && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-20 py-2 overflow-hidden">
              {languages.map(l => (
                <button key={l.code} onClick={() => { setLanguage(l.code); setShowLang(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors">
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left side - info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-blue-700 to-cyan-700 dark:from-sky-900 dark:via-cyan-900 dark:to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl"></div>
        <div className="z-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Car size={36} className="text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">RuldaTest<span className="text-sky-300">.uz</span></h1>
            </div>
            <p className="text-sky-100 text-lg leading-relaxed max-w-md">
              Haydovchilik guvohnomasini olish uchun eng yaxshi tayyorgarlik platformasi
            </p>
          </div>
          <div className="space-y-4 max-w-md">
            {[
              { icon: Shield, title: "Professional Savollar", desc: "Rasmiy imtihon savollariga asoslangan test tizimi" },
              { icon: Users, title: "Osongina O'rganish", desc: "Qulay interfeys va tushunarliligi bilan ajralib turadi" },
              { icon: Award, title: "Natijalarni Kuzatish", desc: "O'z yutuqlaringizni kuzatib boring va takomillashing" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                <div className="p-2 bg-sky-400/20 rounded-lg"><Icon size={24} className="text-sky-200" /></div>
                <div><h3 className="text-white font-semibold mb-1">{title}</h3><p className="text-sky-200 text-sm">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="z-10 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white shadow-lg">K</div>
            <div>
              
              <p className="text-white font-semibold text-lg"></p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Car size={28} className="text-sky-600 dark:text-sky-400" />
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">RuldaTest<span className="text-sky-600">.uz</span></h1>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:border dark:border-slate-700 p-7 transition-colors">

            {/* ===================== LOGIN ===================== */}
            {mode === "login" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Kirish</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Loginiz va parolingizni kiriting</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Login</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={loginName} onChange={e => setLoginName(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
                        placeholder="" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Parol</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPass ? "text" : "password"} value={loginPass} onChange={e => setLoginPass(e.target.value)}
                        className="w-full pl-9 pr-10 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-800">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                    Kirish
                  </button>
                </form>
                <div className="mt-4 flex flex-col gap-2 text-center">
                  <button onClick={() => { setMode("register"); setError(""); }}
                    className="text-sm text-sky-600 dark:text-sky-400 hover:underline font-medium">
                    Hisob yo'qmi? Ro'yxatdan o'tish
                  </button>
                  <button onClick={() => { setMode("forgot"); setError(""); }}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
                    Parolni unutdingizmi?
                  </button>
                </div>
              </>
            )}

            {/* ===================== REGISTER ===================== */}
            {mode === "register" && (
              <>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Ro'yxatdan o'tish</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Barcha maydonlarni to'ldiring</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Ism Familya */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ism va Familya</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all text-sm"
                        placeholder="" />
                    </div>
                  </div>
                  {/* Telefon */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefon raqam</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all text-sm"
                        placeholder="+998901234567" />
                    </div>
                  </div>
                  {/* Login */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Login</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={regLogin} onChange={e => setRegLogin(e.target.value.replace(/\s/g, ""))}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all text-sm"
                        placeholder="" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">Kirish uchun ishlatiladigan noyob ism (bo'sh joy yo'q)</p>
                  </div>
                  {/* Parol */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Parol</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPass ? "text" : "password"} value={regPass} onChange={e => setRegPass(e.target.value)}
                        className={`w-full pl-9 pr-10 py-2.5 border-2 rounded-xl focus:ring-2 outline-none transition-all text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${allPassOk ? "border-green-400 focus:ring-green-300" : "border-slate-200 dark:border-slate-600 focus:ring-sky-400 focus:border-sky-400"}`}
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Parol talablari */}
                    {regPass.length > 0 && (
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs space-y-1 ${allPassOk ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"}`}>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Parol talablari:</p>
                        <div className={`flex items-center gap-1.5 ${passCheck.minLength ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          <CheckCircle2 size={12} /> Kamida 6 ta belgi
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasUppercase ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          <CheckCircle2 size={12} /> Kamida 1 ta katta harf (A-Z)
                        </div>
                        <div className={`flex items-center gap-1.5 ${passCheck.hasNumber ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                          <CheckCircle2 size={12} /> Kamida 1 ta raqam (0-9)
                        </div>
                        {allPassOk && (
                          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold">
                            <CheckCircle2 size={12} className="text-green-500" /> Parol talabga mos ✓
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-800">{error}</div>}
                  <button type="submit" disabled={loading || !allPassOk}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    Ro'yxatdan o'tish
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => { setMode("login"); setError(""); }}
                    className="text-sm text-sky-600 dark:text-sky-400 hover:underline font-medium">
                    Hisobingiz bormi? Kirish
                  </button>
                </div>
              </>
            )}

            {/* ===================== FORGOT PASSWORD ===================== */}
            {mode === "forgot" && (
              <>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Parolni tiklash</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Telefon raqamingiz bilan parolni yangilang</p>
                </div>
                {forgotDone ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-bold text-lg mb-2">{success}</p>
                    <button onClick={() => { setMode("login"); setForgotDone(false); setForgotPhone(""); setForgotNewPass(""); }}
                      className="mt-4 px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-all">
                      Kirish sahifasiga
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Telefon raqam</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" value={forgotPhone} onChange={e => setForgotPhone(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-400 outline-none transition-all"
                          placeholder="+998901234567" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Yangi parol</label>
                      <div className="relative">
                        <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPass ? "text" : "password"} value={forgotNewPass} onChange={e => setForgotNewPass(e.target.value)}
                          className={`w-full pl-9 pr-10 py-3 border-2 rounded-xl focus:ring-2 outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${isPasswordValid(forgotNewPass) ? "border-green-400" : "border-slate-200 dark:border-slate-600 focus:ring-sky-400 focus:border-sky-400"}`}
                          placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {forgotNewPass.length > 0 && (
                        <div className={`mt-2 p-2.5 rounded-lg border text-xs space-y-1 ${isPasswordValid(forgotNewPass) ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-slate-50 dark:bg-slate-700/50 border-slate-200"}`}>
                          {[
                            { ok: checkPassword(forgotNewPass).minLength, text: "Kamida 6 ta belgi" },
                            { ok: checkPassword(forgotNewPass).hasUppercase, text: "Katta harf (A-Z)" },
                            { ok: checkPassword(forgotNewPass).hasNumber, text: "Raqam (0-9)" },
                          ].map(({ ok, text }) => (
                            <div key={text} className={`flex items-center gap-1.5 ${ok ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                              <CheckCircle2 size={12} /> {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100">{error}</div>}
                    <button type="submit" disabled={loading || !isPasswordValid(forgotNewPass)}
                      className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                      Parolni yangilash
                    </button>
                  </form>
                )}
                <div className="mt-4 text-center">
                  <button onClick={() => { setMode("login"); setError(""); }}
                    className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
                    ← Kirish sahifasiga qaytish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
