import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Users, BarChart2, Key, PlusCircle, List,
  Eye, EyeOff, Trash2, MessageSquare, Star, Clock,
  CheckCircle, XCircle, CreditCard, Settings, RefreshCw,
  AlertTriangle, ExternalLink, Video, BookOpen, Ticket,
} from 'lucide-react';
import {
  getAdminStats, getUsers, deleteUser, updateAdminPassword,
  getPremiumRequests, approvePremiumRequest, rejectPremiumRequest,
  getAllPremiumUsers, getAllSettings, setSetting,
} from '../../services/supabase';
import { User, Role } from '../../types';
import { useUI } from '../../context/UIContext';
import ConfirmModal from '../../components/ConfirmModal';

type Tab = 'stats' | 'premium' | 'users' | 'settings';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useUI();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState({ totalUsers: 0, totalQuestions: 0, totalTests: 0, activePremium: 0, pendingRequests: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<any[]>([]);
  const [allPremiumUsers, setAllPremiumUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [showUserPass, setShowUserPass] = useState<Record<string, boolean>>({});
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [st, us, reqs, prem, sett] = await Promise.all([
        getAdminStats(), getUsers(), getPremiumRequests(), getAllPremiumUsers(), getAllSettings(),
      ]);
      setStats(st);
      setUsers(us.filter(u => u.role !== Role.ADMIN));
      setPremiumRequests(reqs);
      setAllPremiumUsers(prem);
      setLocalSettings(sett);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const iv = setInterval(async () => {
      const [reqs, st] = await Promise.all([getPremiumRequests(), getAdminStats()]);
      setPremiumRequests(reqs); setStats(st);
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    await approvePremiumRequest(id);
    await loadData();
    setProcessing(null);
  };
  const handleReject = async (id: string) => {
    setProcessing(id);
    await rejectPremiumRequest(id);
    setPremiumRequests(p => p.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setProcessing(null);
  };
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    await deleteUser(deleteUserId);
    setUsers(p => p.filter(u => u.id !== deleteUserId));
    setDeleteUserId(null);
  };
  const handlePasswordChange = async () => {
    if (newPass.length < 4) return alert('Parol juda qisqa');
    await updateAdminPassword(newPass);
    setShowPassModal(false); setNewPass('');
    alert("Parol o'zgartirildi");
  };
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const keys = ['card_number','card_owner','card_type','price_1_hafta','price_1_oy','price_1_yil','legal_shartnoma','legal_maxfiylik','legal_oferta'];
    await Promise.all(keys.map(k => setSetting(k, localSettings[k] || '')));
    setSettingsMsg('✅ Saqlandi!');
    setTimeout(() => setSettingsMsg(''), 3000);
    setSavingSettings(false);
  };

  const pendingReqs = premiumRequests.filter(r => r.status === 'pending');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'stats',    label: 'Statistika',      icon: BarChart2 },
    { id: 'premium',  label: "Premium so'rovlar", icon: Star, badge: pendingReqs.length },
    { id: 'users',    label: 'Foydalanuvchilar', icon: Users },
    { id: 'settings', label: 'Sozlamalar',       icon: Settings },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* ── YUQORI: Statistika kartalar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jami savollar',    value: stats.totalQuestions, icon: FileText,  color: 'blue',   onClick: () => navigate('/admin/questions') },
          { label: 'Jami testlar',     value: stats.totalTests,     icon: BarChart2, color: 'green',  onClick: undefined },
          { label: 'Foydalanuvchilar', value: stats.totalUsers,     icon: Users,     color: 'purple', onClick: () => setTab('users') },
          { label: 'Premium faol',     value: stats.activePremium,  icon: Star,      color: 'amber',  onClick: () => setTab('premium') },
        ].map(({ label, value, icon: Icon, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={!onClick}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left transition-all ${onClick ? 'hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`w-8 h-8 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
          </button>
        ))}
      </div>

      {/* Kutilayotgan so'rovlar banneri */}
      {pendingReqs.length > 0 && (
        <button
          onClick={() => setTab('premium')}
          className="w-full flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-amber-800 dark:text-amber-200">{pendingReqs.length} ta premium so'rov kutilmoqda</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Ko'rish uchun bosing</p>
            </div>
          </div>
          <span className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-sm">{pendingReqs.length}</span>
        </button>
      )}

      {/* ── TABS ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">

        {/* Tab navigatsiya */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all relative flex-shrink-0 ${
                tab === id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-900/10'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge && badge > 0 ? (
                <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{badge}</span>
              ) : null}
            </button>
          ))}

          {/* Yangilash tugmasi o'ng tomonda */}
          <div className="ml-auto flex items-center px-3">
            <button
              onClick={loadData}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══ STATISTIKA TABI ══ */}
        {tab === 'stats' && (
          <div className="p-5 space-y-5">

            {/* Tezkor havolalar — 3 ustun */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sahifalarga o'tish</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { path: '/admin/questions/new', icon: PlusCircle,    label: "Savol qo'shish",  desc: 'Yangi savol yaratish',    primary: true  },
                  { path: '/admin/questions',     icon: List,           label: 'Savollar',         desc: `${stats.totalQuestions} ta savol` },
                  { path: '/admin/messages',      icon: MessageSquare,  label: 'Xabarlar',         desc: 'Foydalanuvchi xabarlari' },
                  { path: '/admin/biletlar',      icon: Ticket,         label: 'Biletlar',         desc: 'GAI imtihon biletlari'   },
                  { path: '/admin/yhq',           icon: BookOpen,       label: 'YHQ Boblar',       desc: '29 ta bob'               },
                  { path: '/admin/kurslar',       icon: Video,          label: 'Video Kurslar',    desc: 'Darslar boshqaruvi'      },
                ].map(({ path, icon: Icon, label, desc, primary }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm active:scale-[0.98] ${
                      primary
                        ? 'bg-sky-500 border-sky-500 hover:bg-sky-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${primary ? 'text-sky-100' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate ${primary ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{label}</p>
                      <p className={`text-xs truncate ${primary ? 'text-sky-200' : 'text-slate-400'}`}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parol o'zgartirish */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => setShowPassModal(true)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 px-4 py-2.5 rounded-xl transition-all"
              >
                <Key className="w-4 h-4" /> Admin parolini o'zgartirish
              </button>
            </div>
          </div>
        )}

        {/* ══ PREMIUM TABI ══ */}
        {tab === 'premium' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">

            {/* Kutilayotganlar */}
            <div>
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Kutilayotgan so'rovlar
                  {pendingReqs.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{pendingReqs.length}</span>
                  )}
                </h3>
              </div>

              {pendingReqs.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-400 text-sm">Hozircha so'rovlar yo'q</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingReqs.map(req => (
                    <div key={req.id} className="p-5 space-y-4">
                      {/* Foydalanuvchi + tugmalar */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black flex-shrink-0">
                            {req.user_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">{req.user_name}</p>
                            <p className="text-sm text-slate-500 mt-0.5">📦 {req.plan} · 💰 {parseInt(req.price).toLocaleString()} so'm</p>
                            <p className="text-xs text-slate-400 mt-0.5">{new Date(req.created_at).toLocaleString('uz-UZ')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processing === req.id}
                            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" /> Tasdiqlash
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={processing === req.id}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Rad
                          </button>
                        </div>
                      </div>

                      {/* Chek rasmi */}
                      {req.screenshot_url && (
                        <div className="ml-13">
                          <img
                            src={req.screenshot_url}
                            alt="To'lov cheki"
                            className="w-full max-h-56 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                          <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-500 hover:text-sky-600 mt-2">
                            <ExternalLink className="w-3 h-3" /> To'liq ko'rish
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Faol premium foydalanuvchilar */}
            <div>
              <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
                <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Premium foydalanuvchilar ({stats.activePremium} faol)</h3>
              </div>
              {allPremiumUsers.length === 0 ? (
                <p className="py-8 text-center text-slate-400 text-sm">Premium foydalanuvchilar yo'q</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {allPremiumUsers.map((pu: any) => {
                    const isActive = new Date(pu.expires_at) > new Date();
                    return (
                      <div key={pu.user_id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{pu.users?.name || pu.user_id}</p>
                            <p className="text-xs text-slate-400">{pu.plan} · {new Date(pu.expires_at).toLocaleDateString('uz-UZ')} gacha</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {isActive ? 'Faol' : 'Tugagan'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tarix */}
            <div>
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">📋 Barcha so'rovlar tarixi</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {premiumRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{req.user_name}</p>
                      <p className="text-xs text-slate-400">{req.plan} · {new Date(req.created_at).toLocaleDateString('uz-UZ')}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      req.status === 'rejected' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {req.status === 'approved' ? '✅ Tasdiqlangan' : req.status === 'rejected' ? '❌ Rad etilgan' : '⏳ Kutilmoqda'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ FOYDALANUVCHILAR TABI ══ */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Barcha foydalanuvchilar ({users.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[65vh] overflow-y-auto">
              {users.map((u, idx) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                  <span className="text-xs text-slate-300 dark:text-slate-600 w-5 text-right flex-shrink-0">{idx + 1}</span>
                  {u.avatar ? (
                    <img src={u.avatar} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: `hsl(${u.name.charCodeAt(0) * 47 % 360}, 60%, 45%)` }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('uz-UZ')} · {u.totalPoints} ball</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {showUserPass[u.id] ? u.password : '••••••'}
                      </span>
                      <button
                        onClick={() => setShowUserPass(p => ({ ...p, [u.id]: !p[u.id] }))}
                        className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showUserPass[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    <button
                      onClick={() => setDeleteUserId(u.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="py-12 text-center text-slate-400 text-sm">Foydalanuvchilar yo'q</p>
              )}
            </div>
          </div>
        )}

        {/* ══ SOZLAMALAR TABI ══ */}
        {tab === 'settings' && (
          <div className="p-5 space-y-5">

            {/* Karta */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" /> Karta ma'lumotlari
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'card_number', label: 'Karta raqami', placeholder: '9860 1234 5678 9012', mono: true, full: true },
                  { key: 'card_owner',  label: 'Karta egasi',  placeholder: 'Ism Familiya',        mono: false },
                  { key: 'card_type',   label: 'Karta turi',   placeholder: 'Humo / UzCard',       mono: false },
                ].map(({ key, label, placeholder, mono, full }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
                    <input
                      type="text"
                      value={localSettings[key] || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all text-sm ${mono ? 'font-mono' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Narxlar */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">💰 Premium narxlar (so'm)</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'price_1_hafta', label: '1 Hafta' },
                  { key: 'price_1_oy',    label: '1 Oy'    },
                  { key: 'price_1_yil',   label: '1 Yil'   },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
                    <input
                      type="number"
                      value={localSettings[key] || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">📄 Huquqiy sahifalar</h3>
              <div className="space-y-3">
                {[
                  { key: 'legal_shartnoma', label: 'Foydalanuvchi shartnomasi' },
                  { key: 'legal_maxfiylik', label: 'Maxfiylik siyosati' },
                  { key: 'legal_oferta',    label: 'Ommaviy oferta' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
                    <textarea
                      rows={4}
                      value={localSettings[key] || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={`${label} matni...`}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all text-sm resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {settingsMsg && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 rounded-xl text-sm font-semibold">
                {settingsMsg}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-100 dark:shadow-blue-900/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {savingSettings
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saqlanmoqda...</>
                  : '💾 Saqlash'
                }
              </button>
              <button
                onClick={() => setShowPassModal(true)}
                className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold transition-all"
              >
                <Key className="w-4 h-4" /> Parol
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PAROL MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">Yangi Admin Parol</h3>
            <input
              type="password"
              className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 text-slate-900 dark:text-white outline-none focus:border-sky-400 font-mono"
              placeholder="Yangi parol"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowPassModal(false)} className="flex-1 py-2.5 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Bekor</button>
              <button onClick={handlePasswordChange} className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-all">Saqlash</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="Foydalanuvchini o'chirish"
        message="Siz rostdan ham ushbu foydalanuvchini o'chirib tashlamoqchimisiz?"
      />
    </div>
  );
};

export default AdminDashboard;
